/**
 * EventActionBar - Capacity progress bar, booking controls, edit-mode toggle, and feedback messages.
 *
 * Combines the ticket-booking area (capacity bar, book/registered/sold-out button),
 * the organizer edit-mode banner, and success/error alert banners into one cohesive
 * action strip at the top of the main content column.
 */
import type { EventDetail } from "../../lib/api";
import EditableField from "./EditableField";

/** Props for EventActionBar. */
export interface EventActionBarProps {
  /** The full event detail object. */
  event: EventDetail;
  /** Number of spots already sold. */
  spotsUsed: number;
  /** Percentage of capacity filled (0-100). */
  capacityPercent: number;
  /** Whether the event is sold out. */
  soldOut: boolean;
  /** Whether the current user can book a ticket. */
  canBook: boolean;
  /** Whether the user has already registered. */
  hasRegistered: boolean;
  /** Whether a booking request is in progress. */
  booking: boolean;
  /** Handler for the "Book Ticket" button click. */
  onBook: () => void;
  /** The current user's role, if authenticated. */
  userRole?: string;
  /** Whether the current user can edit this event (organizer or admin). */
  canEdit: boolean;
  /** Whether inline editing mode is active. */
  editMode: boolean;
  /** Toggles edit mode on. */
  onEnterEditMode: () => void;
  /** Toggles edit mode off. */
  onExitEditMode: () => void;
  /** Callback to refetch the event after an inline edit. */
  fetchEvent: () => void;
  /** Success message to display (e.g. after booking). */
  bookingSuccess: string;
  /** Error message to display (e.g. after a failed booking). */
  bookingError: string;
}

/**
 * Renders the action bar containing capacity info, booking controls,
 * edit-mode toggle, and feedback messages.
 */
export default function EventActionBar({
  event,
  spotsUsed,
  capacityPercent,
  soldOut,
  canBook,
  hasRegistered,
  booking,
  onBook,
  userRole,
  canEdit,
  editMode,
  onEnterEditMode,
  onExitEditMode,
  fetchEvent,
  bookingSuccess,
  bookingError,
}: EventActionBarProps) {
  return (
    <>
      {/* Capacity + Book Button */}
      <div className="glass-heavy rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 animate-fade-in stagger-1">
        {/* Left: capacity info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 font-medium">
              <EditableField
                value={String(event.capacity)}
                fieldName="capacity"
                eventId={event.id}
                canEdit={editMode}
                onSaved={fetchEvent}
                type="number"
                displayValue={`${event.capacity} total spots`}
                className="text-sm text-slate-500 font-medium"
                inputClassName="text-xs w-20"
              />
            </span>
            <span
              className={`text-sm font-semibold ${soldOut ? "text-red-500" : "text-emerald-600"}`}
            >
              {soldOut
                ? "Sold Out"
                : `${event.spotsRemaining} remaining`}
            </span>
          </div>
          <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent >= 90
                  ? "bg-gradient-to-r from-red-400 to-red-500"
                  : capacityPercent >= 70
                    ? "bg-gradient-to-r from-amber-400 to-amber-500"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-500"
              }`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1.5">
            {spotsUsed} / {event.capacity} spots filled
          </div>
        </div>

        {/* Right: book button or status */}
        <div className="shrink-0 flex items-center gap-3">
          {canBook && (
            <button
              onClick={onBook}
              disabled={booking}
              className="cursor-pointer btn-primary font-bold px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {booking ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Booking...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                  Book Ticket
                </span>
              )}
            </button>
          )}
          {hasRegistered && userRole === "student" && event.status !== "cancelled" && (
            <button
              disabled
              className="btn-primary font-bold px-8 py-3 rounded-full opacity-50 cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Already Registered
              </span>
            </button>
          )}
          {soldOut && !hasRegistered && event.status !== "cancelled" && (
            <span className="badge badge-danger font-semibold text-sm px-4 py-2">
              Sold Out
            </span>
          )}
          {event.status === "cancelled" && (
            <span className="badge badge-danger font-semibold text-sm px-4 py-2">
              Cancelled
            </span>
          )}
        </div>
      </div>

      {/* Edit Mode Toggle (organizer/admin only) */}
      {canEdit && !editMode && (
        <button
          onClick={onEnterEditMode}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-brand-light bg-brand-glow px-4 py-2.5 text-sm text-[#1a4f3b] font-medium hover:bg-[#1a4f3b]/10 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Event
        </button>
      )}
      {editMode && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-amber-700">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="font-medium">Editing mode — click any field to edit it.</span>
          </div>
          <button
            onClick={onExitEditMode}
            className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-amber-700 transition-colors"
          >
            Done Editing
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {bookingSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-sm">
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">{bookingSuccess}</span>
        </div>
      )}
      {bookingError && (
        <div
          role="alert"
          className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm"
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">{bookingError}</span>
        </div>
      )}
    </>
  );
}
