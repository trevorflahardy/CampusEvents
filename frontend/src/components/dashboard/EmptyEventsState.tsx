/**
 * EmptyEventsState renders the empty state when no events are found.
 * Shows different messages based on whether there is an active search query
 * and whether the user is a manager or student.
 *
 * @module dashboard/EmptyEventsState
 */

/** Props for the {@link EmptyEventsState} component. */
export interface EmptyEventsStateProps {
  /** Current search query (empty string if none) */
  searchQuery: string;
  /** Whether the current user is a manager (organizer or admin) */
  isManager: boolean;
  /** Callback to open the create-event form */
  onCreateEvent: () => void;
}

/**
 * Renders the empty state placeholder with contextual messaging and
 * an optional "Create Your First Event" button for managers.
 * @param props - {@link EmptyEventsStateProps}
 */
export default function EmptyEventsState({
  searchQuery,
  isManager,
  onCreateEvent,
}: EmptyEventsStateProps) {
  return (
    <div className="glass-heavy rounded-2xl text-center py-16 px-8">
      <div className="w-14 h-14 rounded-2xl bg-brand-glow flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-[#1a4f3b]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      {searchQuery.trim() ? (
        <>
          <p className="text-lg font-semibold text-slate-700 mb-1">
            No events match your search
          </p>
          <p className="text-slate-500 text-sm">Try a different search term.</p>
        </>
      ) : isManager ? (
        <>
          <p className="text-lg font-semibold text-slate-700 mb-1">
            No events yet
          </p>
          <p className="text-slate-500 text-sm mb-5">
            Create your first event to get started.
          </p>
          <button
            onClick={onCreateEvent}
            className="cursor-pointer btn-primary rounded-full px-6 py-2.5 text-sm font-bold inline-flex items-center gap-2"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Event
          </button>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-slate-700 mb-1">
            No events available
          </p>
          <p className="text-slate-500 text-sm">
            Check back later for upcoming events.
          </p>
        </>
      )}
    </div>
  );
}
