import { useState, useEffect, type FormEvent } from "react";
import {
  api,
  ApiError,
  type Event,
  type Category,
  type Attendee,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusClasses: Record<string, string> = {
  upcoming: "bg-green-100 text-green-800",
  ongoing: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
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

  // Create event form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");

  // Attendees
  const [attendeesMap, setAttendeesMap] = useState<
    Record<number, Attendee[]>
  >({});
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
      // Reset form
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
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Failed to create event.");
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Organizer Dashboard
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Close Form" : "Create Event"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Create Event Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            New Event
          </h2>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date/Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date/Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="0.00 (Free)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Category info */}
            {categories.length > 0 && (
              <div className="text-xs text-gray-400">
                Categories can be managed from the Admin panel.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>
      )}

      {/* My Events */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Events</h2>

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          You haven't created any events yet.
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[event.status]}`}
                      >
                        {event.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(event.startTime)} - {event.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAttendees(event.id)}
                      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                    >
                      {expandedEvent === event.id
                        ? "Hide Attendees"
                        : "View Attendees"}
                    </button>
                    {event.status !== "cancelled" && (
                      <button
                        onClick={() => handleCancelEvent(event.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendees Table */}
              {expandedEvent === event.id && (
                <div className="border-t border-gray-200 p-5">
                  {!attendeesMap[event.id] ? (
                    <div className="text-gray-500 text-sm">
                      Loading attendees...
                    </div>
                  ) : attendeesMap[event.id].length === 0 ? (
                    <div className="text-gray-500 text-sm">
                      No attendees yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 border-b border-gray-200">
                            <th className="pb-2 pr-4 font-medium">Name</th>
                            <th className="pb-2 pr-4 font-medium">Email</th>
                            <th className="pb-2 pr-4 font-medium">
                              Confirmation
                            </th>
                            <th className="pb-2 pr-4 font-medium">
                              Check-In
                            </th>
                            <th className="pb-2 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {attendeesMap[event.id].map((att) => (
                            <tr key={att.ticketId}>
                              <td className="py-2 pr-4 text-gray-900">
                                {att.userName}
                              </td>
                              <td className="py-2 pr-4 text-gray-600">
                                {att.userEmail}
                              </td>
                              <td className="py-2 pr-4 font-mono text-indigo-600">
                                {att.confirmationCode}
                              </td>
                              <td className="py-2 pr-4">
                                {att.checkedIn ? (
                                  <span className="text-green-600 font-medium">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </td>
                              <td className="py-2">
                                {!att.checkedIn && (
                                  <button
                                    onClick={() =>
                                      handleCheckin(att.ticketId, event.id)
                                    }
                                    className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
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
