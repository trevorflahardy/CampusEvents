/**
 * EventsGrid renders the main events listing area including the section heading,
 * empty state, and either student or manager event cards in a responsive grid.
 *
 * @module dashboard/EventsGrid
 */

import type { Event, Category, Attendee, User } from "../../lib/api";
import StudentEventCard from "./StudentEventCard";
import ManagerEventCard from "./ManagerEventCard";
import EmptyEventsState from "./EmptyEventsState";

/** Props for the {@link EventsGrid} component. */
export interface EventsGridProps {
  /** Filtered list of events to display */
  filteredEvents: Event[];
  /** Whether the current user is a manager (organizer or admin) */
  isManager: boolean;
  /** Whether the current user is an admin */
  isAdmin: boolean;
  /** Whether the current user is an organizer */
  isOrganizer: boolean;
  /** Current search query */
  searchQuery: string;
  /** Map of event ID to categories */
  eventCategoriesMap: Record<number, Category[]>;
  /** Map of event ID to attendees */
  attendeesMap: Record<number, Attendee[]>;
  /** ID of the currently expanded event (attendees panel) */
  expandedEvent: number | null;
  /** ID of the event currently being cancelled */
  cancellingEventId: number | null;
  /** ID of the ticket currently being checked in */
  checkingInTicketId: number | null;
  /** Current user */
  user: User | null;
  /** List of organizers (for admin display) */
  organizers: User[];
  /** Toggle attendees panel for a given event */
  onToggleAttendees: (eventId: number) => void;
  /** Cancel an event */
  onCancelEvent: (eventId: number) => void;
  /** Check in a ticket */
  onCheckin: (ticketId: number, eventId: number) => void;
  /** Open the create-event form */
  onCreateEvent: () => void;
}

/**
 * Renders the events section: heading, empty state, or a grid of event cards.
 * @param props - {@link EventsGridProps}
 */
export default function EventsGrid({
  filteredEvents,
  isManager,
  isAdmin,
  isOrganizer,
  searchQuery,
  eventCategoriesMap,
  attendeesMap,
  expandedEvent,
  cancellingEventId,
  checkingInTicketId,
  user,
  organizers,
  onToggleAttendees,
  onCancelEvent,
  onCheckin,
  onCreateEvent,
}: EventsGridProps) {
  return (
    <>
      {/* ---- Section heading ---- */}
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-wide">
          {isAdmin
            ? "All Events"
            : isOrganizer
              ? "My Events"
              : "Upcoming Events"}
        </h2>
        <a
          href="/events"
          className="text-sm font-medium text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
        >
          View All
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      </div>

      {/* ---- events grid ---- */}
      {filteredEvents.length === 0 ? (
        <EmptyEventsState
          searchQuery={searchQuery}
          isManager={isManager}
          onCreateEvent={onCreateEvent}
        />
      ) : !isManager ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event, index) => (
            <StudentEventCard
              key={event.id}
              event={event}
              index={index}
              eventCategories={eventCategoriesMap[event.id] || []}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event, idx) => (
            <ManagerEventCard
              key={event.id}
              event={event}
              index={idx}
              eventCategories={eventCategoriesMap[event.id] || []}
              attendees={attendeesMap[event.id]}
              isExpanded={expandedEvent === event.id}
              cancellingEventId={cancellingEventId}
              checkingInTicketId={checkingInTicketId}
              user={user}
              organizers={organizers}
              onToggleAttendees={onToggleAttendees}
              onCancelEvent={onCancelEvent}
              onCheckin={onCheckin}
            />
          ))}
        </div>
      )}
    </>
  );
}
