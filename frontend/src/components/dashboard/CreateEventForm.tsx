/**
 * CreateEventForm renders a modal overlay with a glassmorphism form for creating
 * a new event. Includes fields for banner image upload (with auto-crop preview),
 * title, dates, capacity, price, location (with map picker), description,
 * and category selection.
 *
 * @module dashboard/CreateEventForm
 */

import {
  useRef,
  type FormEvent,
  type ChangeEvent,
} from "react";
import type { Category } from "../../lib/api";
import EventLocationPicker from "../EventLocationPicker";

/** Props for the {@link CreateEventForm} component. */
export interface CreateEventFormProps {
  /** Current form error message, if any */
  formError: string;
  /** Whether the form is currently submitting */
  submitting: boolean;
  /** Form field values */
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: string;
  ticketPrice: string;
  selectedCategoryIds: number[];
  pinLat: number | null;
  pinLng: number | null;
  bannerPreview: string | null;
  /** Available categories to choose from */
  categories: Category[];
  /** State setters for each form field */
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
  onCapacityChange: (v: string) => void;
  onTicketPriceChange: (v: string) => void;
  onSelectedCategoryIdsChange: React.Dispatch<React.SetStateAction<number[]>>;
  onPinLatChange: (v: number | null) => void;
  onPinLngChange: (v: number | null) => void;
  /** Called when a banner file is selected */
  onBannerSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Called to remove the banner */
  onBannerRemove: () => void;
  /** Called when the form is submitted */
  onSubmit: (e: FormEvent) => void;
  /** Called to close/dismiss the modal */
  onClose: () => void;
}

/** Aspect ratio constant for banner auto-crop (3:1). */
const BANNER_ASPECT = 3;
/** Maximum width for cropped banner images. */
const BANNER_MAX_W = 1200;

/**
 * Auto-crops an image file to 3:1 aspect ratio and converts to WebP.
 * @param file - The original image file
 * @returns A Promise resolving to the cropped File in WebP format
 */
export function cropBannerImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;
      const srcAspect = srcW / srcH;

      let sx = 0, sy = 0, sw = srcW, sh = srcH;
      if (srcAspect > BANNER_ASPECT) {
        sw = srcH * BANNER_ASPECT;
        sx = (srcW - sw) / 2;
      } else {
        sh = srcW / BANNER_ASPECT;
        sy = (srcH - sh) / 2;
      }

      const outW = Math.min(sw, BANNER_MAX_W);
      const outH = outW / BANNER_ASPECT;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Crop failed"));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
        },
        "image/webp",
        0.85,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Renders the create-event modal with backdrop, close button, banner upload,
 * and all form fields.
 * @param props - {@link CreateEventFormProps}
 */
export default function CreateEventForm({
  formError,
  submitting,
  title,
  description,
  location,
  startTime,
  endTime,
  capacity,
  ticketPrice,
  selectedCategoryIds,
  pinLat,
  pinLng,
  bannerPreview,
  categories,
  onTitleChange,
  onDescriptionChange,
  onLocationChange,
  onStartTimeChange,
  onEndTimeChange,
  onCapacityChange,
  onTicketPriceChange,
  onSelectedCategoryIdsChange,
  onPinLatChange,
  onPinLngChange,
  onBannerSelect,
  onBannerRemove,
  onSubmit,
  onClose,
}: CreateEventFormProps) {
  const bannerInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-2xl mx-4 glass-heavy rounded-3xl p-8 animate-fade-in shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full glass-subtle flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-6">New Event</h2>

        {formError && (
          <div role="alert" className="glass-subtle border-l-4 border-l-red-400 text-red-600 dark:text-red-400 rounded-xl p-3 mb-5 text-sm font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Banner upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Banner Image
            </label>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onBannerSelect}
              className="hidden"
            />
            {bannerPreview ? (
              <div className="relative group">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full aspect-[3/1] object-cover rounded-xl border border-white/20 dark:border-white/10"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="cursor-pointer bg-white/90 text-slate-700 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={onBannerRemove}
                      className="cursor-pointer bg-red-500/90 text-white rounded-full px-3 py-1.5 text-xs font-medium hover:bg-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="cursor-pointer w-full aspect-[3/1] rounded-xl border-2 border-dashed border-slate-300/50 dark:border-white/10 hover:border-[#1a4f3b]/30 dark:hover:border-emerald-400/20 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-xs font-medium">Click to upload banner (auto-cropped to 3:1)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="ev-title" className="block text-sm font-medium text-slate-700 mb-1.5">
                Title
              </label>
              <input
                id="ev-title"
                type="text"
                required
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ev-start" className="block text-sm font-medium text-slate-700 mb-1.5">
                Start
              </label>
              <input
                id="ev-start"
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ev-end" className="block text-sm font-medium text-slate-700 mb-1.5">
                End
              </label>
              <input
                id="ev-end"
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ev-cap" className="block text-sm font-medium text-slate-700 mb-1.5">
                Capacity
              </label>
              <input
                id="ev-cap"
                type="number"
                required
                min="1"
                value={capacity}
                onChange={(e) => onCapacityChange(e.target.value)}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ev-price" className="block text-sm font-medium text-slate-700 mb-1.5">
                Ticket Price
              </label>
              <input
                id="ev-price"
                type="number"
                step="0.01"
                min="0"
                value={ticketPrice}
                onChange={(e) => onTicketPriceChange(e.target.value)}
                placeholder="0.00 (Free)"
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Location
            </label>
            <EventLocationPicker
              locationText={location}
              onLocationTextChange={onLocationChange}
              pinLat={pinLat}
              pinLng={pinLng}
              onPinChange={(lat, lng) => { onPinLatChange(lat); onPinLngChange(lng); }}
            />
          </div>

          <div>
            <label htmlFor="ev-desc" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      onSelectedCategoryIdsChange((prev) =>
                        prev.includes(cat.id)
                          ? prev.filter((id) => id !== cat.id)
                          : [...prev, cat.id],
                      )
                    }
                    className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium border transition-all duration-150 ${
                      selectedCategoryIds.includes(cat.id)
                        ? "bg-[#1a4f3b] text-white border-[#1a4f3b] dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                        : "glass-subtle text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer btn-primary rounded-full px-8 py-3 font-bold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Event"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer btn-secondary rounded-full px-6 py-3 font-bold text-sm transition-all duration-150"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
