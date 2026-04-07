/**
 * StatsGrid renders the top row of 3 stat cards on the dashboard.
 * Shows different metrics depending on whether the viewer is a manager or student.
 *
 * @module dashboard/StatsGrid
 */

import type { Event } from "../../lib/api";
import StatCard from "./StatCard";

/** Props for the {@link StatsGrid} component. */
export interface StatsGridProps {
  /** Whether the current user is an organizer or admin */
  isManager: boolean;
  /** Total number of events */
  totalEvents: number;
  /** Count of events with status "upcoming" */
  upcomingCount: number;
  /** Total tracked attendees across all expanded events */
  totalAttendees: number;
  /** Full list of events (used to compute "Events This Week" for students) */
  events: Event[];
}

/**
 * Renders the stats grid with 3 stat cards. Manager view shows total events,
 * upcoming count, and tracked attendees. Student view shows available events,
 * events this week, and total events.
 * @param props - {@link StatsGridProps}
 */
export default function StatsGrid({
  isManager,
  totalEvents,
  upcomingCount,
  totalAttendees,
  events,
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
      {isManager ? (
        <>
          <StatCard
            label="Total Events"
            value={totalEvents}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Upcoming"
            value={upcomingCount}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Tracked Attendees"
            value={totalAttendees}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </>
      ) : (
        <>
          <StatCard
            label="Available Events"
            value={upcomingCount}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
          />
          <StatCard
            label="Events This Week"
            value={events.filter((e) => {
              const start = new Date(e.startTime);
              const now = new Date();
              const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              return e.status === "upcoming" && start >= now && start <= weekFromNow;
            }).length}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Events"
            value={totalEvents}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </>
      )}
    </div>
  );
}
