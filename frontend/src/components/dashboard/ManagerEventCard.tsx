/**
 * ManagerEventCard renders a single event card in the organizer/admin view.
 * Includes event banner, categories, status, meta info, attendee avatars,
 * action buttons (attendees toggle, cancel), and a searchable attendees panel.
 *
 * @module dashboard/ManagerEventCard
 */

import { Link } from "react-router-dom";
import type { Event, Category, Attendee, User } from "../../lib/api";
import { statusBadge, formatShortDate } from "./constants";
import AttendeesPanel from "./AttendeesPanel";

/** Props for the {@link ManagerEventCard} component. */
export interface ManagerEventCardProps {
  event: Event;
  index: number;
  eventCategories: Category[];
  attendees: Attendee[] | undefined;
  isExpanded: boolean;
  cancellingEventId: number | null;
  checkingInTicketId: number | null;
  user: User | null;
  organizers: User[];
  onToggleAttendees: (eventId: number) => void;
  onCancelEvent: (eventId: number) => void;
  onCheckin: (ticketId: number, eventId: number) => void;
}

export default function ManagerEventCard({
  event,
  index,
  eventCategories,
  attendees,
  isExpanded,
  cancellingEventId,
  checkingInTicketId,
  user,
  organizers,
  onToggleAttendees,
  onCancelEvent,
  onCheckin,
}: ManagerEventCardProps) {
  return (
    <>
      <article
        className={`glass-heavy rounded-2xl overflow-hidden flex flex-col shadow-md hover-lift animate-fade-in ${
          index < 4 ? `stagger-${index + 1}` : ""
        }`}
      >
        {/* Card image area with category tag */}
        <div
          className={`relative h-32 w-full ${event.bannerUrl ? "" : "bg-slate-100 dark:bg-slate-800"}`}
        >
          {event.bannerUrl && (
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {eventCategories.map((cat) => (
              <span
                key={cat.id}
                className="px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/80 text-[#1a4f3b] backdrop-blur-sm dark:bg-black/40 dark:text-emerald-300"
              >
                {cat.name}
              </span>
            ))}
          </div>
          <div className="absolute top-2 right-2">
            <span className={`badge ${statusBadge[event.status]}`}>
              {event.status}
            </span>
          </div>
        </div>

        {/* Card content -- clickable link to event detail */}
        <Link
          to={`/events/${event.id}`}
          state={{ from: "dashboard" }}
          className="p-4 flex-1 flex flex-col hover:bg-white/30 dark:hover:bg-white/3 transition-colors"
        >
          <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
            {event.title}
          </h3>

          <div className="space-y-1.5 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 shrink-0">
                <svg
                  className="w-4 h-4"
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
              <span className="flex items-center gap-1.5 text-slate-500">
                <svg
                  className="w-4 h-4 text-slate-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {event.capacity} cap. &middot; ${event.ticketPrice ?? "0.00"}
              </span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <svg
                className="w-4 h-4 shrink-0"
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

          {event.description && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-3">
              {event.description}
            </p>
          )}

          {user?.role === "admin" && (
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <span className="text-slate-400">Organizer:</span>
              <span>
                {organizers.find((o) => o.id === event.organizerId)?.name ??
                  "Unknown"}
              </span>
            </div>
          )}
        </Link>

        {/* Footer: attendee avatar stack + action buttons */}
        <div className="flex justify-between items-center px-4 pb-4 pt-2">
          <div className="flex -space-x-2">
            {(attendees || []).slice(0, 3).map((att) => (
              <div
                key={att.ticketId}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-brand-light text-[#1a4f3b] flex items-center justify-center text-xs font-bold"
                title={att.userName}
              >
                {att.userName?.charAt(0).toUpperCase()}
              </div>
            ))}
            {(attendees || []).length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-[#1a4f3b] text-white flex items-center justify-center text-xs font-bold z-10">
                +{(attendees || []).length - 3}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleAttendees(event.id)}
              className="cursor-pointer rounded-full border shadow-sm px-4 py-2 text-sm font-medium transition-all duration-150 bg-white/70 border-slate-200 text-slate-600 hover:bg-white dark:bg-white/8 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/12"
            >
              Attendees
            </button>
            {event.status !== "cancelled" && (
              <button
                disabled={cancellingEventId === event.id}
                onClick={() => onCancelEvent(event.id)}
                className="cursor-pointer btn-danger rounded-full px-3 py-2 text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingEventId === event.id ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ...
                  </span>
                ) : (
                  "Cancel"
                )}
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Attendees Panel Modal */}
      {isExpanded && (
        <AttendeesPanel
          attendees={attendees}
          eventTitle={event.title}
          checkingInTicketId={checkingInTicketId}
          onCheckin={onCheckin}
          eventId={event.id}
          onClose={() => onToggleAttendees(event.id)}
        />
      )}
    </>
  );
}
