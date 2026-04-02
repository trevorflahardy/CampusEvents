import { useState, useEffect, type FormEvent } from "react";
import { api, ApiError, type Event, type Category, type Attendee } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  upcoming: "bg-emerald-500/10 text-emerald-600",
  ongoing: "bg-blue-500/10 text-blue-600",
  completed: "bg-slate-500/10 text-slate-500",
  cancelled: "bg-red-500/10 text-red-500",
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

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");

  const [attendeesMap, setAttendeesMap] = useState<Record<number, Attendee[]>>({});
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data.filter((e) => e.organizerId === user?.id));
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
      setTitle(""); setDescription(""); setLocation("");
      setStartTime(""); setEndTime(""); setCapacity(""); setTicketPrice("");
      setShowForm(false);
      await fetchEvents();
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Failed to create event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to cancel this event?")) return;
    try {
      await api.updateEvent(eventId, { status: "cancelled" });
      await fetchEvents();
    } catch {
      setError("Failed to cancel event.");
    }
  };

  const toggleAttendees = async (eventId: number) => {
    if (expandedEvent === eventId) { setExpandedEvent(null); return; }
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

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-56 mb-8" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="skeleton h-5 w-1/3 mb-3" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`cursor-pointer rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-200 ${
            showForm
              ? "glass text-slate-600 hover:bg-white/80"
              : "btn-primary text-white"
          }`}
        >
          {showForm ? "Close" : "Create Event"}
        </button>
      </div>

      {error && (
        <div className="glass rounded-2xl p-4 mb-6 border-l-4 border-red-400">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="glass-heavy rounded-3xl p-8 mb-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] animate-fade-in">
          <h2 className="text-xl font-bold text-slate-900 mb-6">New Event</h2>

          {formError && (
            <div className="bg-red-50/80 border border-red-200/60 text-red-600 rounded-xl p-3 mb-5 text-sm font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ev-title" className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input id="ev-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label htmlFor="ev-loc" className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
                <input id="ev-loc" type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label htmlFor="ev-start" className="block text-sm font-medium text-slate-700 mb-1.5">Start</label>
                <input id="ev-start" type="datetime-local" required value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label htmlFor="ev-end" className="block text-sm font-medium text-slate-700 mb-1.5">End</label>
                <input id="ev-end" type="datetime-local" required value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label htmlFor="ev-cap" className="block text-sm font-medium text-slate-700 mb-1.5">Capacity</label>
                <input id="ev-cap" type="number" required min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)}
                  className="w-full input-glass rounded-xl px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label htmlFor="ev-price" className="block text-sm font-medium text-slate-700 mb-1.5">Ticket Price</label>
                <input id="ev-price" type="number" step="0.01" min="0" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="0.00 (Free)" className="w-full input-glass rounded-xl px-4 py-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="ev-desc" className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea id="ev-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full input-glass rounded-xl px-4 py-2.5 text-sm" />
            </div>
            {categories.length > 0 && (
              <p className="text-xs text-slate-400">Categories can be managed from the Admin panel.</p>
            )}
            <button type="submit" disabled={submitting}
              className="cursor-pointer btn-primary text-white font-bold px-8 py-3 rounded-xl">
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">My Events</h2>

      {events.length === 0 ? (
        <div className="glass rounded-3xl text-center py-16 text-slate-400">
          You haven't created any events yet.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="glass rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[event.status]}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {formatDate(event.startTime)} &middot; {event.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAttendees(event.id)}
                      className="cursor-pointer glass rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white/80 transition-all"
                    >
                      {expandedEvent === event.id ? "Hide" : "Attendees"}
                    </button>
                    {event.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancelEvent(event.id)}
                        className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/15 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {expandedEvent === event.id && (
                <div className="border-t border-slate-200/60 p-6 animate-fade-in">
                  {!attendeesMap[event.id] ? (
                    <div className="text-slate-400 text-sm">Loading attendees...</div>
                  ) : attendeesMap[event.id].length === 0 ? (
                    <div className="text-slate-400 text-sm">No attendees yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-400">
                            <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Name</th>
                            <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Email</th>
                            <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Code</th>
                            <th className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider">Status</th>
                            <th className="pb-3 font-medium text-xs uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                          {attendeesMap[event.id].map((att) => (
                            <tr key={att.ticketId}>
                              <td className="py-3 pr-4 text-slate-900 font-medium">{att.userName}</td>
                              <td className="py-3 pr-4 text-slate-500">{att.userEmail}</td>
                              <td className="py-3 pr-4 font-mono text-indigo-500 font-bold">{att.confirmationCode}</td>
                              <td className="py-3 pr-4">
                                {att.checkedIn ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No</span>
                                )}
                              </td>
                              <td className="py-3">
                                {!att.checkedIn && (
                                  <button
                                    onClick={() => handleCheckin(att.ticketId, event.id)}
                                    className="cursor-pointer rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 shadow-sm transition-colors"
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
  );
}
