import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, type UserTicket } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusClasses: Record<string, string> = {
  upcoming: "bg-green-100 text-green-800",
  ongoing: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.getUserTickets(user.id);
      setTickets(data);
    } catch {
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (ticketId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.cancelTicket(ticketId);
      setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));
    } catch {
      setError("Failed to cancel ticket.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading your tickets...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Tickets</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500 mb-2">No tickets yet</p>
          <p className="text-gray-400 mb-4">
            Browse events and book your first ticket!
          </p>
          <Link
            to="/"
            className="inline-block rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.ticketId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/events/${ticket.eventId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {ticket.eventTitle}
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[ticket.eventStatus] || "bg-gray-100 text-gray-800"}`}
                    >
                      {ticket.eventStatus}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{formatDate(ticket.eventStartTime)}</div>
                    <div>{ticket.eventLocation}</div>
                  </div>

                  {/* Confirmation Code */}
                  <div className="mt-3">
                    <span className="text-xs text-gray-500">
                      Confirmation Code
                    </span>
                    <div className="font-mono text-lg font-semibold text-indigo-600">
                      {ticket.confirmationCode}
                    </div>
                  </div>

                  {/* Check-in Status */}
                  <div className="mt-2 flex items-center gap-1.5 text-sm">
                    {ticket.checkedIn ? (
                      <>
                        <svg
                          className="w-4 h-4 text-green-600"
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
                        <span className="text-green-600 font-medium">
                          Checked In
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 text-yellow-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-yellow-600 font-medium">
                          Not Checked In
                        </span>
                      </>
                    )}
                  </div>

                  {/* Categories */}
                  {ticket.categories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ticket.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-medium"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {parseFloat(ticket.ticketPrice) === 0
                      ? "Free"
                      : `$${parseFloat(ticket.ticketPrice).toFixed(2)}`}
                  </span>
                  {ticket.eventStatus !== "cancelled" &&
                    ticket.eventStatus !== "completed" && (
                      <button
                        onClick={() => handleCancel(ticket.ticketId)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Cancel Booking
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
