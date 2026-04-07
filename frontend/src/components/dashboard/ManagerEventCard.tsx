/**
 * ManagerEventCard renders a single event card in the organizer/admin view.
 * Includes event banner, categories, status, meta info, attendee avatars,
 * action buttons (attendees toggle, cancel), and an expandable attendees table
 * with check-in functionality.
 *
 * @module dashboard/ManagerEventCard
 */

import { Link } from "react-router-dom";
import type { Event, Category, Attendee, User } from "../../lib/api";
import { statusBadge, formatShortDate } from "./constants";

/** Props for the {@link ManagerEventCard} component. */
export interface ManagerEventCardProps {
  /** The event to display */
  event: Event;
  /** Zero-based index for stagger animation */
  index: number;
  /** Categories associated with this event */
  eventCategories: Category[];
  /** Attendees for this event (may be undefined if not yet loaded) */
  attendees: Attendee[] | undefined;
  /** Whether the attendees panel is expanded for this event */
  isExpanded: boolean;
  /** ID of the event currently being cancelled (for loading state) */
  cancellingEventId: number | null;
  /** ID of the ticket currently being checked in (for loading state) */
  checkingInTicketId: number | null;
  /** Current user (used to check admin role) */
  user: User | null;
  /** List of organizers (used for admin reassignment display) */
  organizers: User[];
  /** Toggle attendees panel for a given event */
  onToggleAttendees: (eventId: number) => void;
  /** Cancel an event */
  onCancelEvent: (eventId: number) => void;
  /** Check in a ticket */
  onCheckin: (ticketId: number, eventId: number) => void;
}

/**
 * Renders a manager-view event card with banner, metadata, action buttons,
 * and an expandable attendees table.
 * @param props - {@link ManagerEventCardProps}
 */
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
    <article
      className={`glass-heavy rounded-2xl overflow-hidden flex flex-col shadow-md hover-lift animate-fade-in ${
        index < 4 ? `stagger-${index + 1}` : ""
      }`}
    >
      {/* Card image area with category tag */}
      <div className={`relative h-32 w-full ${event.bannerUrl ? '' : 'bg-slate-100 dark:bg-slate-800'}`}>
        {event.bannerUrl && (
          <img src={event.bannerUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        {/* Category tags overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {eventCategories.map((cat) => (
            <span
              key={cat.id}
              className="bg-[#c8e6c9] text-[#2e7d32] text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider"
            >
              {cat.name}
            </span>
          ))}
        </div>
        {/* Status badge top-right */}
        <div className="absolute top-2 right-2">
          <span className={`badge ${statusBadge[event.status]}`}>
            {event.status}
          </span>
        </div>
      </div>

      {/* Card content -- clickable link to event detail */}
      <Link to={`/events/${event.id}`} className="p-4 flex-1 flex flex-col hover:bg-white/30 transition-colors">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
          {event.title}
        </h3>

        {/* Meta row: date + location */}
        <div className="flex items-center text-sm text-gray-600 mb-3 space-x-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatShortDate(event.startTime)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-slate-400 line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {/* Capacity + price row */}
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.capacity} <span className="text-slate-400">cap.</span>
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            ${event.ticketPrice ?? "0.00"}
          </span>
        </div>

        {/* Organizer (display only for admin) */}
        {user?.role === "admin" && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
            <span className="text-slate-400">Organizer:</span>
            <span>{organizers.find((o) => o.id === event.organizerId)?.name ?? "Unknown"}</span>
          </div>
        )}
      </Link>

      {/* Footer: attendee avatar stack + action buttons */}
      <div className="flex justify-between items-center px-4 pb-4 pt-2">
        {/* Attendee avatar stack */}
        <div className="flex -space-x-2">
          {(attendees || []).slice(0, 3).map((att) => (
            <div
              key={att.ticketId}
              className="w-8 h-8 rounded-full border-2 border-white bg-brand-light text-[#1a4f3b] flex items-center justify-center text-xs font-bold"
              title={att.userName}
            >
              {att.userName?.charAt(0).toUpperCase()}
            </div>
          ))}
          {(attendees || []).length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-[#1a4f3b] text-white flex items-center justify-center text-xs font-bold z-10">
              +{(attendees || []).length - 3}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleAttendees(event.id)}
            className="cursor-pointer bg-white/70 rounded-full border border-slate-200 shadow-sm px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-all duration-150"
          >
            {isExpanded ? "Hide" : "Attendees"}
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
                  Cancelling...
                </span>
              ) : (
                "Cancel"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Attendees table (expandable) */}
      {isExpanded && (
        <div className="border-t border-slate-200/60 p-4 animate-fade-in">
          {!attendees ? (
            <div className="text-slate-400 text-sm">
              Loading attendees...
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-slate-400 text-sm">
              No attendees yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-glow/50 text-left">
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-slate-500 rounded-tl-lg">
                      Name
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-slate-500">
                      Code
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-slate-500">
                      Checked In
                    </th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-slate-500 rounded-tr-lg">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {attendees.map((att) => (
                    <tr
                      key={att.ticketId}
                      className="hover:bg-white/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {att.userName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {att.userEmail}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#1a4f3b] font-bold">
                        {att.confirmationCode}
                      </td>
                      <td className="px-4 py-3">
                        {att.checkedIn ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!att.checkedIn && (
                          <button
                            disabled={checkingInTicketId === att.ticketId}
                            onClick={() =>
                              onCheckin(att.ticketId, event.id)
                            }
                            className="cursor-pointer rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkingInTicketId === att.ticketId ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Checking in...
                              </span>
                            ) : (
                              "Check In"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
