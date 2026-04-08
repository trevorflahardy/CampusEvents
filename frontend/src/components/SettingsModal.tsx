import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveGenRef = useRef(0);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Sync form fields when user data changes (e.g. auth finishes loading)
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const saveProfile = useCallback(
    async (fields: { name?: string; email?: string }) => {
      if (!user) return;
      const gen = ++saveGenRef.current;
      setSaving(true);
      try {
        const updated = await api.updateProfile(user.id, fields);
        if (gen === saveGenRef.current) {
          updateUser(updated);
          toast.success("Profile updated");
        }
      } catch (err) {
        if (gen === saveGenRef.current) {
          const msg =
            err instanceof Error ? err.message : "Failed to update profile";
          toast.error(msg);
        }
      } finally {
        if (gen === saveGenRef.current) {
          setSaving(false);
        }
      }
    },
    [user, updateUser],
  );

  // Debounced auto-save for text fields
  const debounceSave = useCallback(
    (fields: { name?: string; email?: string }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveProfile(fields), 800);
    },
    [saveProfile],
  );

  const cancelPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim().length > 0) {
      debounceSave({ name: value });
      return;
    }

    cancelPendingSave();
    toast.error("Name cannot be empty");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Basic email format check before saving
    if (value.includes("@") && value.includes(".")) {
      debounceSave({ email: value });
      return;
    }

    cancelPendingSave();
    toast.error("Enter a valid email address");
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const updated = await api.uploadProfilePhoto(user.id, file);
      updateUser(updated);
      toast.success("Photo updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo";
      toast.error(msg);
    } finally {
      setUploadingPhoto(false);
      // Reset input so the same file can be re-selected
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  if (!user) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg glass-heavy rounded-3xl p-8 animate-fade-in shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass-subtle hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg
            className="w-5 h-5 text-gray-500 dark:text-[#94a3b8]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Account Settings
        </h2>

        {/* Profile photo section */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative group">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/60 dark:border-emerald-500/40 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#1a4f3b] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white/60 dark:border-emerald-500/40">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
            >
              <svg
                className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Profile Photo
            </p>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="text-sm text-[#1a4f3b] dark:text-emerald-400 hover:underline cursor-pointer mt-0.5"
            >
              {uploadingPhoto ? "Uploading..." : "Upload new photo"}
            </button>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-white/30 dark:border-white/10 mb-6" />

        {/* Form fields */}
        <div className="space-y-5">
          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="glass-subtle w-full px-4 py-3 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a4f3b]/50 dark:focus:ring-emerald-500/50 placeholder-gray-400 transition-shadow"
              placeholder="Your name"
            />
          </div>

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="glass-subtle w-full px-4 py-3 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a4f3b]/50 dark:focus:ring-emerald-500/50 placeholder-gray-400 transition-shadow"
              placeholder="you@example.com"
            />
          </div>

          {/* Read-only fields */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              NetID
            </label>
            <div className="glass-subtle w-full px-4 py-3 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none">
              {user.netId}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Role
            </label>
            <div className="glass-subtle w-full px-4 py-3 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none capitalize">
              {user.role}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Member Since
            </label>
            <div className="glass-subtle w-full px-4 py-3 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {saving ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-slate-300/50 border-t-slate-500 rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Changes are saved automatically"
            )}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
