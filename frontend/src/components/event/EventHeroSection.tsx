/**
 * EventHeroSection - Banner/header area of the event detail page.
 *
 * Renders two variants:
 * - **With banner**: Full-width hero image with gradient overlay, category badges,
 *   status pill, title (editable), date/time/location meta, and a banner upload button.
 * - **Without banner**: Compact inline header with the same information styled for
 *   a no-image layout, plus an "Add Banner Image" upload button.
 */
import { useState, useEffect, type ChangeEvent, type RefObject } from "react";
import { Link } from "react-router-dom";
import type { EventDetail } from "../../lib/api";
import EditableField from "./EditableField";
import { statusColors, formatDate, formatTime } from "./utils";

/** Props for EventHeroSection. */
export interface EventHeroSectionProps {
  /** The full event detail object. */
  event: EventDetail;
  /** Whether the current user can edit this event. */
  canEdit: boolean;
  /** Whether inline editing mode is active. */
  editMode: boolean;
  /** Callback to refetch the event after an inline edit. */
  fetchEvent: () => void;
  /** Whether a banner image is currently being uploaded. */
  uploadingBanner: boolean;
  /** Handler for the banner file input change event. */
  onBannerUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Ref for the hidden banner file input (to reset its value after upload). */
  bannerInputRef: RefObject<HTMLInputElement | null>;
  /** Where the back button navigates to. */
  backTo: string;
  /** Label for the back button. */
  backLabel: string;
}

/**
 * Renders the hero section at the top of the event detail page.
 */
export default function EventHeroSection({
  event,
  canEdit,
  editMode,
  fetchEvent,
  uploadingBanner,
  onBannerUpload,
  bannerInputRef,
  backTo,
  backLabel,
}: EventHeroSectionProps) {
  const [isLightImage, setIsLightImage] = useState(false);

  // Detect average brightness of the top-left area of the banner image
  useEffect(() => {
    if (!event.bannerUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const sampleW = Math.min(300, img.width);
        const sampleH = Math.min(80, img.height);
        canvas.width = sampleW;
        canvas.height = sampleH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
        let totalLuminance = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        setIsLightImage(totalLuminance / pixelCount > 140);
      } catch {
        // CORS or other error — default to light text (dark assumed)
        setIsLightImage(false);
      }
    };
    img.src = event.bannerUrl;
  }, [event.bannerUrl]);

  if (event.bannerUrl) {
    return (
      <section className="relative w-full h-72 md:h-[500px] overflow-hidden">
        {/* Banner image */}
        <img
          src={event.bannerUrl}
          alt={`${event.title} banner`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button overlaid on image */}
        <Link
          to={backTo}
          className={`cursor-pointer absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl backdrop-blur-sm transition-colors ${
            isLightImage
              ? "text-slate-900 bg-white/30 hover:bg-white/50 border border-black/10"
              : "text-white bg-black/30 hover:bg-black/50 border border-white/15"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        {/* Upload button for organizers/admins */}
        {canEdit && (
          <label className="absolute top-4 right-4 cursor-pointer z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/90 text-sm font-medium border border-white/20 hover:bg-black/60 transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {uploadingBanner ? "Uploading..." : "Change Banner"}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onBannerUpload}
              className="hidden"
              disabled={uploadingBanner}
            />
          </label>
        )}
        {/* Hero content overlay at bottom */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 max-w-6xl mx-auto inset-x-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="px-3 py-1 rounded-md bg-white/15 backdrop-blur-sm text-white/90 text-xs font-bold uppercase tracking-wider border border-white/10"
              >
                {cat.name}
              </span>
            ))}
            <span
              className={`badge uppercase tracking-wide ${statusColors[event.status] || "badge-neutral"}`}
            >
              {event.status}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 tracking-tight drop-shadow-lg">
            <EditableField
              value={event.title}
              fieldName="title"
              eventId={event.id}
              canEdit={editMode}
              onSaved={fetchEvent}
              className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight"
              inputClassName="text-xl font-bold"
            />
          </h1>
          <HeroMeta
            event={event}
            iconColor="text-emerald-300"
            textColor="text-white/80"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden">
      {/* No banner -- compact header with category/title/meta inline */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-2 pb-6">
        <Link
          to={backTo}
          className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1a4f3b] font-semibold transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {event.categories.map((cat) => (
            <span
              key={cat.id}
              className="rounded-md bg-brand-glow text-[#1a4f3b] border border-brand-light px-3 py-1 text-xs font-bold uppercase tracking-wider"
            >
              {cat.name}
            </span>
          ))}
          <span
            className={`badge uppercase tracking-wide ${statusColors[event.status] || "badge-neutral"}`}
          >
            {event.status}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 leading-tight mb-4 tracking-tight">
          <EditableField
            value={event.title}
            fieldName="title"
            eventId={event.id}
            canEdit={editMode}
            onSaved={fetchEvent}
            className="text-3xl md:text-5xl font-bold text-slate-800 leading-tight tracking-tight"
            inputClassName="text-xl font-bold"
          />
        </h1>
        <HeroMeta
          event={event}
          iconColor="text-[#1a4f3b]"
          textColor="text-slate-500"
        />
        {/* Upload banner button for organizers/admins when no banner exists */}
        {canEdit && (
          <label className="mt-4 cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-glow text-[#1a4f3b] text-sm font-medium border border-brand-light hover:bg-[#1a4f3b]/10 transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {uploadingBanner ? "Uploading..." : "Add Banner Image"}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onBannerUpload}
              className="hidden"
              disabled={uploadingBanner}
            />
          </label>
        )}
      </div>
    </section>
  );
}

// --- Internal sub-component ---

/** Props for HeroMeta. */
interface HeroMetaProps {
  event: EventDetail;
  iconColor: string;
  textColor: string;
}

/**
 * Renders the date, time, and location meta line used in both hero variants.
 */
function HeroMeta({ event, iconColor, textColor }: HeroMetaProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-5 ${textColor} text-sm font-medium`}
    >
      <div className="flex items-center gap-2">
        <svg
          className={`w-5 h-5 ${iconColor}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>{formatDate(event.startTime)}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg
          className={`w-5 h-5 ${iconColor}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <svg
          className={`w-5 h-5 ${iconColor}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>{event.location}</span>
      </div>
    </div>
  );
}
