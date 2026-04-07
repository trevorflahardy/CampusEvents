import { Link } from "react-router-dom";
import type { Event } from "../lib/api";

const statusColors: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
};

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return num === 0 ? "Free" : `$${num.toFixed(2)}`;
}

interface EventCardProps {
  event: Event;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  return (
    <Link
      to={`/events/${event.id}`}
      state={{ from: "events" }}
      className={`cursor-pointer block glass-heavy rounded-2xl overflow-hidden hover-lift animate-fade-in ${
        index < 4 ? `stagger-${index + 1}` : ""
      }`}
    >
      {/* Banner image area */}
      <div
        className={`relative h-40 w-full ${event.bannerUrl ? "" : "bg-slate-100 dark:bg-slate-800"}`}
      >
        {event.bannerUrl && (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Category tags */}
        {event.categories && event.categories.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/80 text-[#1a4f3b] backdrop-blur-sm dark:bg-black/40 dark:text-emerald-300"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`badge ${statusColors[event.status] || "badge-neutral"}`}
          >
            {event.status}
          </span>
        </div>
        {/* Price pill */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-[#1a4f3b] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            {formatPrice(event.ticketPrice)}
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

        <div className="space-y-1.5 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 shrink-0">
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
            <span className="flex items-center gap-1 shrink-0">
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
          <div className="flex items-center gap-1 min-w-0">
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
            <span className="truncate">{event.location}</span>
          </div>
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
