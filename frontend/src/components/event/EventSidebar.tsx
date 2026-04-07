/**
 * EventSidebar - Right sidebar column on the event detail page.
 *
 * Contains the map preview (when coordinates are available), organizer info card,
 * event timing card with editable start/end/location fields, and the cancel-event
 * button visible only to the event owner.
 */
import type { EventDetail } from "../../lib/api";
import EventMapPreview from "../EventMapPreview";
import EditableField from "./EditableField";
import { formatDateTime } from "./utils";

/** Props for EventSidebar. */
export interface EventSidebarProps {
  /** The full event detail object. */
  event: EventDetail;
  /** Whether inline editing mode is active. */
  editMode: boolean;
  /** Callback to refetch the event after an inline edit. */
  fetchEvent: () => void;
  /** Whether the current user is the event owner (organizer). */
  isOwner: boolean;
  /** Whether a cancel request is in progress. */
  cancelling: boolean;
  /** Handler for the "Cancel Event" button click. */
  onCancelEvent: () => void;
}

/**
 * Renders the sidebar with map, organizer card, timing card, and cancel button.
 */
export default function EventSidebar({
  event,
  editMode,
  fetchEvent,
  isOwner,
  cancelling,
  onCancelEvent,
}: EventSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Map Preview */}
      {event.latitude != null && event.longitude != null && (
        <EventMapPreview latitude={event.latitude} longitude={event.longitude} />
      )}

      {/* Organizer Card */}
      <div className="glass-heavy rounded-2xl p-6 animate-fade-in stagger-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Event Organizer
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-glow flex items-center justify-center shrink-0">
            <svg
              className="w-6 h-6 text-[#1a4f3b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <div className="font-bold text-lg text-slate-800 leading-tight">
              {event.organizerName}
            </div>
            <div className="text-sm text-slate-500">Event Organizer</div>
          </div>
        </div>
        <button
          type="button"
          className="cursor-pointer w-full py-2.5 rounded-xl btn-secondary text-sm font-semibold transition-all"
        >
          View Profile
        </button>
      </div>

      {/* Event Timing Card */}
      <div className="glass-heavy rounded-2xl p-6 animate-fade-in stagger-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Event Timing
        </h3>
        <div className="space-y-4">
          {/* Start */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-glow flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-4.5 h-4.5 text-[#1a4f3b]"
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
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium mb-0.5">
                Starts
              </div>
              <EditableField
                value={event.startTime}
                fieldName="startTime"
                eventId={event.id}
                canEdit={editMode}
                onSaved={fetchEvent}
                type="datetime-local"
                displayValue={formatDateTime(event.startTime)}
                className="text-sm text-slate-700 font-medium"
              />
            </div>
          </div>
          {/* End */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-glow flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-4.5 h-4.5 text-[#1a4f3b]"
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
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium mb-0.5">
                Ends
              </div>
              <EditableField
                value={event.endTime}
                fieldName="endTime"
                eventId={event.id}
                canEdit={editMode}
                onSaved={fetchEvent}
                type="datetime-local"
                displayValue={formatDateTime(event.endTime)}
                className="text-sm text-slate-700 font-medium"
              />
            </div>
          </div>
          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-glow flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-4.5 h-4.5 text-[#1a4f3b]"
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
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium mb-0.5">
                Location
              </div>
              <EditableField
                value={event.location}
                fieldName="location"
                eventId={event.id}
                canEdit={editMode}
                onSaved={fetchEvent}
                className="text-sm text-slate-700 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Event Button (owner only, not already cancelled) */}
      {isOwner && event.status !== "cancelled" && (
        <button
          onClick={onCancelEvent}
          disabled={cancelling}
          className="cursor-pointer btn-danger rounded-xl w-full px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in stagger-4"
        >
          {cancelling ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              Cancelling...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel Event
            </span>
          )}
        </button>
      )}
    </div>
  );
}
