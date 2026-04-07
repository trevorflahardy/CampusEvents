/**
 * StudentEventCard renders a single event card in the student (non-manager) view.
 * Displays event banner, categories, status badge, price, description, meta info,
 * and a "View Details" link.
 *
 * @module dashboard/StudentEventCard
 */

import { Link } from "react-router-dom";
import type { Event, Category } from "../../lib/api";
import { statusBadge, formatShortDate } from "./constants";

/** Props for the {@link StudentEventCard} component. */
export interface StudentEventCardProps {
  /** The event to display */
  event: Event;
  /** Zero-based index for stagger animation */
  index: number;
  /** Categories associated with this event */
  eventCategories: Category[];
}

/**
 * Renders a wide event card for the student dashboard view with banner image,
 * category tags, status badge, price pill, and meta information.
 * @param props - {@link StudentEventCardProps}
 */
export default function StudentEventCard({
  event,
  index,
  eventCategories,
}: StudentEventCardProps) {
  return (
    <Link
      key={event.id}
      to={`/events/${event.id}`}
      state={{ from: "dashboard" }}
      className={`cursor-pointer block glass-heavy rounded-2xl overflow-hidden hover-lift animate-fade-in ${index < 4 ? `stagger-${index + 1}` : ""}`}
    >
      {/* Card image area */}
      <div
        className={`relative h-44 w-full ${event.bannerUrl ? "" : "bg-slate-100 dark:bg-slate-800"}`}
      >
        {event.bannerUrl && (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Category tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {eventCategories.map((cat) => (
            <span
              key={cat.id}
              className="bg-[#c8e6c9] text-[#2e7d32] text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider"
            >
              {cat.name}
            </span>
          ))}
        </div>
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`badge ${statusBadge[event.status]}`}>
            {event.status}
          </span>
        </div>
        {/* Price pill -- bottom right of image */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-[#1a4f3b] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            {parseFloat(event.ticketPrice) === 0
              ? "Free"
              : `$${parseFloat(event.ticketPrice).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5">
        <h3 className="font-bold text-base text-gray-900 leading-snug mb-2 line-clamp-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        )}

        <div className="flex flex-wrap text-xs text-gray-600 gap-3 mb-4">
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-[#2b5c50] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatShortDate(event.startTime)}
          </span>
          <span className="flex items-center gap-1 truncate">
            <svg
              className="w-3.5 h-3.5 text-[#2b5c50] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {event.location}
          </span>
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-[#2b5c50] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {event.capacity} spots
          </span>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100/60 dark:border-white/5">
          <span className="text-xs text-slate-400 font-medium">
            by {event.organizerName}
          </span>
          <span className="bg-[#2b5c50] text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:bg-[#1a4f3b] transition-colors duration-150">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
