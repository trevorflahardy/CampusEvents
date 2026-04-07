import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  api,
  ApiError,
  type Event,
  type Category,
  type Attendee,
  type User,
} from "../lib/api";
import { useAuth } from "../context/useAuth";
import DashboardHeader from "../components/DashboardHeader";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const statusBadge: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
};

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Inline-editable field                                             */
/* ------------------------------------------------------------------ */

function PencilIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover/field:opacity-100 transition-opacity shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4L16.862 4.487z"
      />
    </svg>
  );
}

interface InlineFieldProps {
  value: string;
  field: string;
  eventId: number;
  onSave: (eventId: number, patch: Record<string, unknown>) => Promise<void>;
  multiline?: boolean;
  prefix?: string;
  className?: string;
  inputClassName?: string;
  type?: string;
}

function InlineField({
  value,
  field,
  eventId,
  onSave,
  multiline = false,
  prefix = "",
  className = "",
  inputClassName = "",
  type = "text",
}: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current instanceof HTMLInputElement) ref.current.select();
    }
  }, [editing]);

  const commit = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const patchValue = type === "number" ? Number(trimmed) : trimmed;
      await onSave(eventId, { [field]: patchValue });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setDraft(value); // revert
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }, [draft, value, eventId, field, type, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  };

  if (editing) {
    const shared =
      "w-full input-glass rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-[#1a4f3b]/30 " +
      inputClassName;
    return multiline ? (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        rows={2}
        className={shared}
      />
    ) : (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={shared}
        step={type === "number" ? "0.01" : undefined}
        min={type === "number" ? "0" : undefined}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`group/field inline-flex items-center gap-1.5 cursor-pointer rounded-md px-1 -mx-1 hover:bg-white/50 transition-colors ${className}`}
    >
      <span className={saving ? "opacity-50" : ""}>
        {prefix}
        {value || <span className="text-slate-300 italic">empty</span>}
      </span>
      {saved ? (
        <span className="text-emerald-600 text-xs font-medium whitespace-nowrap">
          Saved
        </span>
      ) : (
        <PencilIcon />
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                         */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="glass rounded-3xl p-6 flex justify-between items-center animate-fade-in">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {label}
        </p>
        <p className="text-4xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-brand-glow flex items-center justify-center text-[#1a4f3b]">
        {icon}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                    */
/* ------------------------------------------------------------------ */

export default function OrganizerDashboard() {
  const { user, isOrganizer, isAdmin } = useAuth();
  const isManager = isOrganizer || isAdmin;
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // create-event form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // per-event categories
  const [eventCategoriesMap, setEventCategoriesMap] = useState<
    Record<number, Category[]>
  >({});
  const [editingCategoriesFor, setEditingCategoriesFor] = useState<
    number | null
  >(null);
  const [draftCategoryIds, setDraftCategoryIds] = useState<number[]>([]);

  // organizers (for admin reassignment)
  const [organizers, setOrganizers] = useState<User[]>([]);

  // attendees
  const [attendeesMap, setAttendeesMap] = useState<Record<number, Attendee[]>>(
    {},
  );
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<number | null>(null);
  const [checkingInTicketId, setCheckingInTicketId] = useState<number | null>(null);

  /* ---------- data fetching ---------- */

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      // Admins see all, organizers see their own, students see all
      const filtered = isAdmin
        ? data
        : isOrganizer
          ? data.filter((e) => e.organizerId === user?.id)
          : data;
      setEvents(filtered);
      const catMap: Record<number, Category[]> = {};
      for (const ev of filtered) {
        catMap[ev.id] = ev.categories ?? [];
      }
      setEventCategoriesMap(catMap);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isOrganizer]);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch(() => {});
    fetchEvents();
    if (user?.role === "admin") {
      api
        .getUsers()
        .then((users) =>
          setOrganizers(
            users.filter((u) => u.role === "organizer" || u.role === "admin"),
          ),
        )
        .catch(() => {});
    }
  }, [fetchEvents, user]);

  /* ---------- inline save ---------- */

  const handleInlineSave = useCallback(
    async (eventId: number, patch: Record<string, unknown>) => {
      await api.updateEvent(eventId, patch as Partial<Event>);
      await fetchEvents();
    },
    [fetchEvents],
  );

  /* ---------- create event ---------- */

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError("");
    setSubmitting(true);
    try {
      const newEvent = await api.createEvent({
        title,
        description: description || undefined,
        location,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity: Number(capacity),
        ticketPrice: ticketPrice || undefined,
        organizerId: user.id,
      });
      if (selectedCategoryIds.length > 0) {
        await api.setEventCategories(newEvent.id, selectedCategoryIds);
      }
      setTitle("");
      setDescription("");
      setLocation("");
      setStartTime("");
      setEndTime("");
      setCapacity("");
      setTicketPrice("");
      setSelectedCategoryIds([]);
      setShowForm(false);
      await fetchEvents();
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- attendees ---------- */

  const toggleAttendees = async (eventId: number) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
      return;
    }
    setExpandedEvent(eventId);
    if (!attendeesMap[eventId]) {
      try {
        const data = await api.getEventTickets(eventId);
        setAttendeesMap((prev) => ({ ...prev, [eventId]: data }));
      } catch {
        setError("Failed to load attendees.");
      }
    }
  };

  const handleCheckin = async (ticketId: number, eventId: number) => {
    setCheckingInTicketId(ticketId);
    try {
      await api.checkinTicket(ticketId);
      const data = await api.getEventTickets(eventId);
      setAttendeesMap((prev) => ({ ...prev, [eventId]: data }));
    } catch {
      setError("Failed to check in attendee.");
    } finally {
      setCheckingInTicketId(null);
    }
  };

  /* ---------- derived stats ---------- */

  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => e.status === "upcoming").length;
  const totalAttendees = Object.values(attendeesMap).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  /* ---------- search filter ---------- */

  const filteredEvents = searchQuery.trim()
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : events;

  /* ---------- loading skeleton ---------- */

  if (loading) {
    return (
      <div className="flex flex-col h-screen overflow-hidden animate-fade-in">
        <div className="glass px-6 py-4 shrink-0">
          <div className="skeleton h-12 w-full max-w-2xl rounded-full" />
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-heavy rounded-3xl p-6">
                <div className="skeleton h-4 w-24 mb-3 rounded-lg" />
                <div className="skeleton h-10 w-16 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="glass-heavy rounded-2xl overflow-hidden">
                <div className="skeleton h-32 w-full" />
                <div className="p-4">
                  <div className="skeleton h-5 w-2/3 mb-3 rounded-lg" />
                  <div className="skeleton h-4 w-1/2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          isManager ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`cursor-pointer rounded-full px-5 py-2.5 font-semibold text-sm transition-all duration-200 ${
              showForm
                ? "btn-secondary"
                : "bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-[0_6px_24px_rgba(26,79,59,0.4)] hover:-translate-y-px active:translate-y-0"
            }`}
          >
            {showForm ? "Close" : "+ Create Event"}
          </button>
          ) : undefined
        }
      />

      {/* ---- Scrollable content area ---- */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-8 p-8">
          {/* ---- Left: main content ---- */}
          <div className="flex-1 min-w-0">

      {/* ---- error banner ---- */}
      {error && (
        <div role="alert" className="glass rounded-2xl p-4 border-l-4 border-l-red-400 mb-6 animate-fade-in">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ---- Stats grid ---- */}
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

      {/* ---- create event form (managers only) ---- */}
      {isManager && showForm && (
        <div className="glass rounded-2xl p-8 mb-8 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-900 mb-6">New Event</h2>

          {formError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ev-title" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title
                </label>
                <input
                  id="ev-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ev-loc" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Location
                </label>
                <input
                  id="ev-loc"
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ev-start" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start
                </label>
                <input
                  id="ev-start"
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ev-end" className="block text-sm font-medium text-slate-700 mb-1.5">
                  End
                </label>
                <input
                  id="ev-end"
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ev-cap" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Capacity
                </label>
                <input
                  id="ev-cap"
                  type="number"
                  required
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ev-price" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ticket Price
                </label>
                <input
                  id="ev-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="0.00 (Free)"
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ev-desc" className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                id="ev-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm"
              />
            </div>

            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategoryIds((prev) =>
                          prev.includes(cat.id)
                            ? prev.filter((id) => id !== cat.id)
                            : [...prev, cat.id],
                        )
                      }
                      className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium border transition-all duration-150 ${
                        selectedCategoryIds.includes(cat.id)
                          ? "bg-[#1a4f3b] text-white border-[#1a4f3b]"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer btn-primary rounded-full px-8 py-3 font-bold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Event"
              )}
            </button>
          </form>
        </div>
      )}

      {/* ---- Section heading ---- */}
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-wide">
          {isAdmin ? "All Events" : isOrganizer ? "My Events" : "Upcoming Events"}
        </h2>
        <a
          href="/events"
          className="text-sm font-medium text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      {/* ---- events grid ---- */}
      {filteredEvents.length === 0 ? (
        <div className="glass-heavy rounded-2xl text-center py-16 px-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-glow flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#1a4f3b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          {searchQuery.trim() ? (
            <>
              <p className="text-lg font-semibold text-slate-700 mb-1">No events match your search</p>
              <p className="text-slate-500 text-sm">Try a different search term.</p>
            </>
          ) : isManager ? (
            <>
              <p className="text-lg font-semibold text-slate-700 mb-1">No events yet</p>
              <p className="text-slate-500 text-sm mb-5">Create your first event to get started.</p>
              <button
                onClick={() => setShowForm(true)}
                className="cursor-pointer btn-primary rounded-full px-6 py-2.5 text-sm font-bold inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Event
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-700 mb-1">No events available</p>
              <p className="text-slate-500 text-sm">Check back later for upcoming events.</p>
            </>
          )}
        </div>
      ) : !isManager ? (
        /* ---- Student view: simple browsable event cards ---- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className={`cursor-pointer block glass-heavy rounded-2xl overflow-hidden hover-lift animate-fade-in ${index < 4 ? `stagger-${index + 1}` : ''}`}
            >
              {/* Card image area */}
              <div className="relative h-32 w-full bg-linear-to-br from-slate-100 to-slate-50">
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                  {(eventCategoriesMap[event.id] || []).map((cat) => (
                    <span
                      key={cat.id}
                      className="bg-[#c8e6c9] text-[#2e7d32] text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`badge ${statusBadge[event.status]}`}>{event.status}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 line-clamp-2">{event.title}</h3>
                <div className="flex text-sm text-gray-600 mb-3 space-x-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatShortDate(event.startTime)}
                  </span>
                  <span className="flex items-center gap-1 truncate">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100/60">
                  <span className="text-xs text-slate-500 font-medium">by {event.organizerName}</span>
                  <span className="bg-accent text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm cursor-pointer transition-all duration-150 hover:bg-accent-dark">
                    {parseFloat(event.ticketPrice) === 0 ? "Free" : `$${parseFloat(event.ticketPrice).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event, idx) => (
            <article
              key={event.id}
              className={`glass-heavy rounded-2xl overflow-hidden flex flex-col shadow-md hover-lift animate-fade-in ${
                idx < 4 ? `stagger-${idx + 1}` : ""
              }`}
            >
              {/* Card image area with category tag */}
              <div className="relative h-32 w-full bg-linear-to-br from-slate-100 to-slate-50">
                {/* Category tags overlay */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                  {(eventCategoriesMap[event.id] || []).map((cat) => (
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

              {/* Card content */}
              <div className="p-4 flex-1 flex flex-col">
                {/* Title (editable) */}
                <InlineField
                  value={event.title}
                  field="title"
                  eventId={event.id}
                  onSave={handleInlineSave}
                  className="font-bold text-lg text-gray-900 leading-tight mb-1"
                />

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
                    <InlineField
                      value={event.location}
                      field="location"
                      eventId={event.id}
                      onSave={handleInlineSave}
                      className="text-gray-600"
                    />
                  </span>
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mb-3">
                    <InlineField
                      value={event.description}
                      field="description"
                      eventId={event.id}
                      onSave={handleInlineSave}
                      multiline
                      className="text-sm text-slate-400 line-clamp-2"
                    />
                  </div>
                )}

                {/* Capacity + price row */}
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <InlineField
                      value={String(event.capacity)}
                      field="capacity"
                      eventId={event.id}
                      onSave={handleInlineSave}
                      type="number"
                      className="text-slate-600"
                    />
                    <span className="text-slate-400">cap.</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <InlineField
                      value={event.ticketPrice ?? "0.00"}
                      field="ticketPrice"
                      eventId={event.id}
                      onSave={handleInlineSave}
                      prefix="$"
                      type="number"
                      className="text-slate-600"
                    />
                  </span>
                </div>

                {/* Organizer (admin can reassign) */}
                {user?.role === "admin" && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <span className="text-slate-400">Organizer:</span>
                    <select
                      value={event.organizerId}
                      onChange={async (e) => {
                        const nextOrganizerId = Number(e.target.value);
                        try {
                          await handleInlineSave(event.id, {
                            organizerId: nextOrganizerId,
                          });
                        } catch {
                          setError("Failed to reassign organizer.");
                          e.target.value = String(event.organizerId);
                        }
                      }}
                      className="cursor-pointer input-glass rounded-lg px-2 py-1 text-sm"
                    >
                      {organizers.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category editing */}
                {editingCategoriesFor !== event.id && (
                  <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoriesFor(event.id);
                        setDraftCategoryIds(
                          (eventCategoriesMap[event.id] || []).map((c) => c.id),
                        );
                      }}
                      className="cursor-pointer rounded-full bg-white/60 text-slate-400 border border-slate-200 px-2.5 py-0.5 text-xs font-medium hover:bg-white/80 transition-colors"
                    >
                      + Edit Tags
                    </button>
                  </div>
                )}
                {editingCategoriesFor === event.id && (
                  <div className="flex flex-wrap gap-2 mb-2 items-center">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setDraftCategoryIds((prev) =>
                            prev.includes(cat.id)
                              ? prev.filter((id) => id !== cat.id)
                              : [...prev, cat.id],
                          )
                        }
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium border transition-all duration-150 ${
                          draftCategoryIds.includes(cat.id)
                            ? "bg-[#1a4f3b] text-white border-[#1a4f3b]"
                            : "bg-white text-slate-500 border-slate-200"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.setEventCategories(
                            event.id,
                            draftCategoryIds,
                          );
                          setEditingCategoriesFor(null);
                          await fetchEvents();
                        } catch {
                          setError("Failed to save categories.");
                        }
                      }}
                      className="cursor-pointer rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-dark transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategoriesFor(null)}
                      className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Footer: attendee avatar stack + action buttons */}
                <div className="flex justify-between items-center mt-auto pt-2">
                  {/* Attendee avatar stack */}
                  <div className="flex -space-x-2">
                    {(attendeesMap[event.id] || []).slice(0, 3).map((att) => (
                      <div
                        key={att.ticketId}
                        className="w-8 h-8 rounded-full border-2 border-white bg-brand-light text-[#1a4f3b] flex items-center justify-center text-xs font-bold"
                        title={att.userName}
                      >
                        {att.userName?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(attendeesMap[event.id] || []).length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-[#1a4f3b] text-white flex items-center justify-center text-xs font-bold z-10">
                        +{(attendeesMap[event.id] || []).length - 3}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAttendees(event.id)}
                      className="cursor-pointer bg-white/70 rounded-full border border-slate-200 shadow-sm px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-all duration-150"
                    >
                      {expandedEvent === event.id ? "Hide" : "Attendees"}
                    </button>
                    {event.status !== "cancelled" && (
                      <button
                        disabled={cancellingEventId === event.id}
                        onClick={async () => {
                          if (
                            !confirm(
                              "Are you sure you want to cancel this event?",
                            )
                          ) {
                            return;
                          }
                          setCancellingEventId(event.id);
                          try {
                            await api.updateEvent(event.id, {
                              status: "cancelled",
                            });
                            await fetchEvents();
                          } catch {
                            setError("Failed to cancel event.");
                          } finally {
                            setCancellingEventId(null);
                          }
                        }}
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
              </div>

              {/* Attendees table (expandable) */}
              {expandedEvent === event.id && (
                <div className="border-t border-slate-200/60 p-4 animate-fade-in">
                  {!attendeesMap[event.id] ? (
                    <div className="text-slate-400 text-sm">
                      Loading attendees...
                    </div>
                  ) : attendeesMap[event.id].length === 0 ? (
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
                          {attendeesMap[event.id].map((att) => (
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
                                      handleCheckin(att.ticketId, event.id)
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
          ))}
        </div>
      )}

          </div>{/* end left column */}

          {/* ---- Right sidebar: Upcoming This Week + Quick Actions ---- */}
          <aside className="hidden xl:flex flex-col gap-6 w-80 shrink-0">
            {/* Upcoming This Week */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Upcoming This Week
              </h3>
              <div className="space-y-3">
                {events
                  .filter((e) => {
                    const start = new Date(e.startTime);
                    const now = new Date();
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return e.status === "upcoming" && start >= now && start <= weekFromNow;
                  })
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
                {events.filter((e) => {
                  const start = new Date(e.startTime);
                  const now = new Date();
                  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                  return e.status === "upcoming" && start >= now && start <= weekFromNow;
                }).length === 0 && (
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
                  onClick={() => setShowForm(true)}
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

        </div>{/* end flex row */}
      </div>{/* end scrollable area */}
    </div>
  );
}
