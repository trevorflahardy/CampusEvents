import { useState, useEffect, useCallback } from "react";
import { api, type Event, type Category } from "../lib/api";
import EventCard from "../components/EventCard";

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

  const fetchEvents = useCallback(async () => {
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
      setEvents(data);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [search, categoryId, from, to, status]);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setFrom("");
    setTo("");
    setStatus("");
  };

  const hasFilters = search || categoryId || from || to || status;

  return (
    <div className="bg-mesh min-h-full animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Events
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {events.length} event{events.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-heavy rounded-2xl p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full input-glass rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="cursor-pointer w-full input-glass rounded-full px-4 py-2.5 text-sm text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full input-glass rounded-full px-4 py-2.5 text-sm text-slate-700"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full input-glass rounded-full px-4 py-2.5 text-sm text-slate-700"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="cursor-pointer w-full input-glass rounded-full px-4 py-2.5 text-sm text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
            <div
              key={i}
              className="glass-heavy rounded-2xl p-6"
            >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div key={event.id} className={`animate-fade-in ${index < 4 ? `stagger-${index + 1}` : ''}`}>
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
