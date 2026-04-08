import { useState, useEffect } from "react";
import { api, type Event, type Category } from "../lib/api";
import EventCard from "../components/EventCard";
import DashboardHeader from "../components/DashboardHeader";
import GlassDateTimePicker from "../components/GlassDateTimePicker";

const EVENTS_PER_PAGE = 12;

export default function BrowseEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("date-desc");
  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (categoryId) params.categoryId = categoryId;
        if (from) params.from = from;
        if (to) params.to = to;
        if (status) params.status = status;
        const data = await api.getEvents(
          Object.keys(params).length > 0 ? params : undefined,
        );
        if (!cancelled) setEvents(data);
      } catch {
        if (!cancelled) setError("Failed to load events.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, categoryId, from, to, status]);

  useEffect(() => {
    setVisibleCount(EVENTS_PER_PAGE);
  }, [search, categoryId, from, to, status, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setFrom("");
    setTo("");
    setStatus("");
    setSort("date-desc");
  };

  const hasFilters = search || categoryId || from || to || status || sort !== "date-desc";

  const sortedEvents = [...events].sort((a, b) => {
    switch (sort) {
      case "date-asc": return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      case "date-desc": return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      case "title-asc": return a.title.localeCompare(b.title);
      case "title-desc": return b.title.localeCompare(a.title);
      default: return 0;
    }
  });

  const visibleEvents = sortedEvents.slice(0, visibleCount);
  const hasMore = sortedEvents.length > visibleCount;

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in">
      <DashboardHeader
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search events..."
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-16">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Events
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                {sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="cursor-pointer w-full input-glass rounded-full px-4 py-2.5 text-sm text-slate-700"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <GlassDateTimePicker
                value={from}
                onChange={setFrom}
                showTime={false}
                pill
              />
              <GlassDateTimePicker
                value={to}
                onChange={setTo}
                showTime={false}
                pill
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="cursor-pointer w-full input-glass rounded-full px-4 py-2.5 text-sm text-slate-700"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer w-full input-glass rounded-full px-4 py-2.5 text-sm text-slate-700"
                aria-label="Sort events"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="cursor-pointer mt-3 text-sm text-accent hover:text-[#1a4f3b] font-medium transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>

          {error && (
            <div className="glass-heavy rounded-2xl p-4 mb-6 border-l-4 border-red-400">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-heavy rounded-2xl p-6">
                  <div className="skeleton h-5 w-3/4 mb-4" />
                  <div className="skeleton h-4 w-1/2 mb-2" />
                  <div className="skeleton h-4 w-2/3 mb-6" />
                  <div className="skeleton h-4 w-full" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="glass-heavy rounded-2xl text-center py-20 px-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-glow flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-1">
                No events found
              </p>
              <p className="text-slate-500 text-sm">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleEvents.map((event, index) => (
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisibleCount(v => v + EVENTS_PER_PAGE)}
                    className="cursor-pointer glass-heavy rounded-full px-8 py-3 text-sm font-semibold text-slate-700 hover:bg-white/80 dark:hover:bg-white/10 transition-all hover-lift"
                  >
                    Load More ({sortedEvents.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        {/* end max-w-7xl */}
      </div>
      {/* end overflow-y-auto */}
    </div>
  );
}
