import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../../lib/api";
import EventLocationPicker from "../EventLocationPicker";

interface Props {
  eventId: number;
  currentLocation: string;
  currentLat: number | null | undefined;
  currentLng: number | null | undefined;
  onSaved: () => void;
  onClose: () => void;
}

export default function LocationEditModal({
  eventId,
  currentLocation,
  currentLat,
  currentLng,
  onSaved,
  onClose,
}: Props) {
  const [location, setLocation] = useState(currentLocation);
  const [pinLat, setPinLat] = useState<number | null>(currentLat ?? null);
  const [pinLng, setPinLng] = useState<number | null>(currentLng ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSave = async () => {
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.updateEvent(eventId, {
        location: location.trim(),
        latitude: pinLat,
        longitude: pinLng,
      } as Record<string, unknown>);
      onSaved();
      onClose();
    } catch {
      setError("Failed to update location.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl glass-heavy rounded-3xl p-6 animate-fade-in shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full glass-subtle flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-lg font-bold text-slate-900 mb-5">Edit Location</h2>

        {error && (
          <div className="glass-subtle border-l-4 border-l-red-400 text-red-600 dark:text-red-400 rounded-xl p-3 mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <EventLocationPicker
          locationText={location}
          onLocationTextChange={setLocation}
          pinLat={pinLat}
          pinLng={pinLng}
          onPinChange={(lat, lng) => {
            setPinLat(lat);
            setPinLng(lng);
          }}
        />

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer btn-primary rounded-full px-6 py-2.5 font-bold text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Location"}
          </button>
          <button
            onClick={onClose}
            className="cursor-pointer btn-secondary rounded-full px-6 py-2.5 font-bold text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
