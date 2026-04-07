/**
 * EventDetailError - Error/not-found state for the event detail page.
 *
 * Shows an alert icon, the error message (or a generic "Event not found"),
 * and a link back to the events listing.
 */
import { Link } from "react-router-dom";

/** Props for EventDetailError. */
export interface EventDetailErrorProps {
  /** The error message to display. Falls back to "Event not found." if empty. */
  error: string;
}

/**
 * Renders a centered error card with a back-to-events link.
 */
export default function EventDetailError({ error }: EventDetailErrorProps) {
  return (
    <div className="bg-mesh min-h-full text-center py-20">
      <div className="glass-heavy rounded-2xl p-10 inline-block">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <p className="text-slate-600 font-medium mb-4">
          {error || "Event not found."}
        </p>
        <Link
          to="/events"
          className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-[#1a4f3b] hover:text-[#2b5c50] font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to events
        </Link>
      </div>
    </div>
  );
}
