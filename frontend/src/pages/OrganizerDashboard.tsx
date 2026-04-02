import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { api, ApiError, type Event, type Category, type Attendee } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const statusBadge: Record<string, string> = {
  upcoming: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ongoing: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-slate-100 text-slate-500 border border-slate-200",
  cancelled: "bg-red-50 text-red-600 border border-red-200",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
      const patchValue =
        type === "number" ? Number(trimmed) : trimmed;
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
      "w-full input-glass rounded-lg px-2.5 py-1 text-sm focus:ring-2 focus:ring-indigo-500/40 " +
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
      className={`group/field inline-flex items-center gap-1.5 cursor-pointer rounded-md px-1 -mx-1 hover:bg-slate-100 transition-colors ${className}`}
    >
      <span className={saving ? "opacity-50" : ""}>
        {prefix}
        {value || <span className="text-slate-300 italic">empty</span>}
      </span>
      {saved ? (
        <span className="text-emerald-600 text-xs font-medium whitespace-nowrap">Saved</span>
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                    */
/* ------------------------------------------------------------------ */

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // create-event form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");

  // attendees
  const [attendeesMap, setAttendeesMap] = useState<Record<number, Attendee[]>>({});
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  /* ---------- data fetching ---------- */

  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      setEvents(data.filter((e) => e.organizerId === user?.id));
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    fetchEvents();
  }, [fetchEvents]);

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
      await api.createEvent({
        title,
        description: description || undefined,
        location,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity: Number(capacity),
        ticketPrice: ticketPrice || undefined,
        organizerId: user.id,
      });
      setTitle("");
      setDescription("");
      setLocation("");
      setStartTime("");
      setEndTime("");
      setCapacity("");
      setTicketPrice("");
      setShowForm(false);
      await fetchEvents();
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- cancel event ---------- */

  const handleCancelEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to cancel this event?")) return;
    try {
      await api.updateEvent(eventId, { status: "cancelled" });
      await fetchEvents();
    } catch {
      setError("Failed to cancel event.");
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
    try {
      await api.checkinTicket(ticketId);
      const data = await api.getEventTickets(eventId);
      setAttendeesMap((prev) => ({ ...prev, [eventId]: data }));
    } catch {
      setError("Failed to check in attendee.");
    }
  };

  /* ---------- derived stats ---------- */

  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => e.status === "upcoming").length;
  const totalAttendees = Object.values(attendeesMap).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  /* ---------- loading skeleton ---------- */

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="skeleton h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="skeleton h-6 w-12 mb-2" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="skeleton h-5 w-1/3 mb-3" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  /* ---------- render ---------- */

  return (
    <div className="animate-fade-in space-y-8">
      {/* ---- header ---- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`cursor-pointer rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-200 ${
            showForm
              ? "bg-white rounded-xl border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50"
              : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
          }`}
        >
          {showForm ? "Close" : "+ Create Event"}
        </button>
      </div>

      {/* ---- error banner ---- */}
      {error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 border-l-4 !border-l-red-400">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ---- stats ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Events"
          value={totalEvents}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Upcoming"
          value={upcomingCount}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Tracked Attendees"
          value={totalAttendees}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* ---- create event form ---- */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-900 mb-6">New Event</h2>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-5 text-sm font-medium">
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
              <p className="text-xs text-slate-400">Categories can be managed from the Admin panel.</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      )}

      {/* ---- events list ---- */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
          My Events
        </h2>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-16 text-slate-400">
            You haven't created any events yet.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* card body */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* left: editable fields */}
                    <div className="space-y-2 min-w-0 flex-1">
                      {/* title + badge */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <InlineField
                          value={event.title}
                          field="title"
                          eventId={event.id}
                          onSave={handleInlineSave}
                          className="text-lg font-semibold text-slate-900"
                        />
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[event.status]}`}
                        >
                          {event.status}
                        </span>
                      </div>

                      {/* location + dates */}
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <InlineField
                          value={event.location}
                          field="location"
                          eventId={event.id}
                          onSave={handleInlineSave}
                          className="text-slate-500"
                        />
                      </div>

                      <div className="text-sm text-slate-400">
                        {formatDate(event.startTime)} &ndash; {formatDate(event.endTime)}
                      </div>

                      {/* capacity + price row */}
                      <div className="flex items-center gap-4 text-sm pt-1">
                        <span className="flex items-center gap-1.5 text-slate-500">
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

                      {/* description (editable) */}
                      {event.description && (
                        <div className="pt-1">
                          <InlineField
                            value={event.description}
                            field="description"
                            eventId={event.id}
                            onSave={handleInlineSave}
                            multiline
                            className="text-sm text-slate-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* right: action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleAttendees(event.id)}
                        className="cursor-pointer bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {expandedEvent === event.id ? "Hide Attendees" : "Attendees"}
                      </button>
                      {event.status !== "cancelled" && (
                        <button
                          onClick={() => handleCancelEvent(event.id)}
                          className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* attendees table */}
                {expandedEvent === event.id && (
                  <div className="border-t border-slate-200 p-6 animate-fade-in">
                    {!attendeesMap[event.id] ? (
                      <div className="text-slate-400 text-sm">Loading attendees...</div>
                    ) : attendeesMap[event.id].length === 0 ? (
                      <div className="text-slate-400 text-sm">No attendees yet.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-left">
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
                          <tbody className="divide-y divide-slate-200">
                            {attendeesMap[event.id].map((att) => (
                              <tr key={att.ticketId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-slate-900 font-medium">{att.userName}</td>
                                <td className="px-4 py-3 text-slate-500">{att.userEmail}</td>
                                <td className="px-4 py-3 font-mono text-indigo-600 font-bold">
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
                                      onClick={() => handleCheckin(att.ticketId, event.id)}
                                      className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                    >
                                      Check In
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
