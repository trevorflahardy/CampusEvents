import { Link } from "react-router-dom";
import type { Event } from "../lib/api";

const statusColors: Record<string, string> = {
  upcoming: "bg-emerald-500/10 text-emerald-600",
  ongoing: "bg-blue-500/10 text-blue-600",
  completed: "bg-slate-500/10 text-slate-500",
  cancelled: "bg-red-500/10 text-red-500",
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
      className="cursor-pointer block bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 leading-snug">
            {event.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[event.status] || "bg-slate-500/10 text-slate-500"}`}
          >
            {event.status}
          </span>
        </div>

        <div className="space-y-2.5 text-sm text-slate-500">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-slate-400 shrink-0"
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
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <svg
              className="w-4 h-4 text-slate-400 shrink-0"
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
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            by {event.organizerName}
          </span>
          <span className="text-sm text-indigo-600 font-bold">
            {formatPrice(event.ticketPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
