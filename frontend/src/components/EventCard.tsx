import { Link } from "react-router-dom";
import type { Event } from "../lib/api";

const statusColors: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
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
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="cursor-pointer block glass-heavy rounded-2xl overflow-hidden hover-lift"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2">
            {event.title}
          </h3>
          <span
            className={`badge shrink-0 ${statusColors[event.status] || "badge-neutral"}`}
          >
            {event.status}
          </span>
        </div>

        <div className="flex text-sm text-gray-600 mb-3 space-x-3">
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-accent shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(event.startTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-accent shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
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

        <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-100/60">
          <span className="text-xs text-slate-500 font-medium">
            by {event.organizerName}
          </span>
          <span className="bg-accent text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm cursor-pointer transition-all duration-150 hover:bg-accent-dark">
            {formatPrice(event.ticketPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
