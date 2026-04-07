/**
 * DashboardSidebar renders the right-side panel with "Upcoming This Week",
 * "Quick Actions", and an "At a Glance" stats summary for managers.
 *
 * @module dashboard/DashboardSidebar
 */

import type { Event } from "../../lib/api";

/** Props for the {@link DashboardSidebar} component. */
export interface DashboardSidebarProps {
  /** Full list of events */
  events: Event[];
  /** Whether the current user is a manager (organizer or admin) */
  isManager: boolean;
  /** Callback to open the create-event form */
  onCreateEvent: () => void;
}

/**
 * Filters events happening within the next 7 days.
 * @param events - Array of events to filter
 * @returns Events with status "upcoming" starting within one week
 */
function getUpcomingThisWeek(events: Event[]): Event[] {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return events.filter((e) => {
    const start = new Date(e.startTime);
    return e.status === "upcoming" && start >= now && start <= weekFromNow;
  });
}

/**
 * Renders the dashboard sidebar with upcoming events, quick actions,
 * and an at-a-glance stats summary.
 * @param props - {@link DashboardSidebarProps}
 */
export default function DashboardSidebar({
  events,
  isManager,
  onCreateEvent,
}: DashboardSidebarProps) {
  const upcomingThisWeek = getUpcomingThisWeek(events);

  return (
    <aside className="hidden xl:flex flex-col gap-6 w-80 shrink-0">
      {/* Upcoming This Week */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Upcoming This Week
        </h3>
        <div className="space-y-3">
          {upcomingThisWeek
            .slice(0, 5)
            .map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-brand-glow flex items-center justify-center text-[#1a4f3b] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(e.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {" "}
                    {new Date(e.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{e.location}</p>
                </div>
              </div>
            ))}
          {upcomingThisWeek.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No events this week</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {isManager && (
          <button
            onClick={onCreateEvent}
            className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-white/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-glow flex items-center justify-center text-[#1a4f3b]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Create New Event
          </button>
          )}
          <a
            href="/events"
            className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-white/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-glow flex items-center justify-center text-[#1a4f3b]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            Browse All Events
          </a>
          <a
            href="/my-tickets"
            className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-white/50 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-glow flex items-center justify-center text-[#1a4f3b]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            View Tickets
          </a>
        </div>
      </div>

      {/* Event Stats Summary (managers only) */}
      {isManager && <div className="glass-heavy rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          At a Glance
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Active Events</span>
            <span className="text-sm font-bold text-slate-900">{events.filter(e => e.status === "upcoming" || e.status === "ongoing").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Completed</span>
            <span className="text-sm font-bold text-slate-900">{events.filter(e => e.status === "completed").length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Cancelled</span>
            <span className="text-sm font-bold text-slate-900">{events.filter(e => e.status === "cancelled").length}</span>
          </div>
          <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Total</span>
            <span className="text-sm font-bold text-[#1a4f3b]">{events.length}</span>
          </div>
        </div>
      </div>}
    </aside>
  );
}
