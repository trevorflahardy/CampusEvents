import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, type UserTicket } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  upcoming: "bg-emerald-500/10 text-emerald-600",
  ongoing: "bg-blue-500/10 text-blue-600",
  completed: "bg-slate-500/10 text-slate-500",
  cancelled: "bg-red-500/10 text-red-500",
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
      <div className="animate-fade-in">
        <div className="skeleton h-8 w-40 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="skeleton h-5 w-1/3 mb-3" />
              <div className="skeleton h-4 w-1/2 mb-2" />
              <div className="skeleton h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-8">My Tickets</h1>

      {error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6 border-l-4 border-red-400">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm text-center py-20 px-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-700 mb-1">No tickets yet</p>
          <p className="text-slate-400 text-sm mb-6">Browse events and book your first ticket!</p>
          <Link
            to="/events"
            className="cursor-pointer inline-flex items-center gap-2 btn-primary text-white font-bold px-6 py-2.5 rounded-xl transition-all duration-200"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.ticketId} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-slate-300 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Link
                      to={`/events/${ticket.eventId}`}
                      className="cursor-pointer text-lg font-semibold text-slate-900 hover:text-indigo-500 transition-colors truncate"
                    >
                      {ticket.eventTitle}
                    </Link>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[ticket.eventStatus] || "bg-slate-500/10 text-slate-500"}`}>
                      {ticket.eventStatus}
                    </span>
                  </div>

                  <div className="text-sm text-slate-500 space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(ticket.eventStartTime)}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ticket.eventLocation}
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 inline-flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Confirmation</span>
                    <span className="font-mono text-lg font-bold text-indigo-600">{ticket.confirmationCode}</span>
                  </div>

                  {/* Check-in */}
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    {ticket.checkedIn ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-emerald-600 font-medium">Checked In</span>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-amber-600 font-medium">Not Checked In</span>
                      </>
                    )}
                  </div>

                  {/* Categories */}
                  {ticket.categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ticket.categories.map((cat) => (
                        <span key={cat.id} className="rounded-full bg-indigo-500/8 text-indigo-600 border border-indigo-500/15 px-2.5 py-0.5 text-xs font-medium">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className="text-lg font-bold text-slate-900">
                    {parseFloat(ticket.ticketPrice) === 0 ? "Free" : `$${parseFloat(ticket.ticketPrice).toFixed(2)}`}
                  </span>
                  {ticket.eventStatus !== "cancelled" && ticket.eventStatus !== "completed" && (
                    <button
                      onClick={() => handleCancel(ticket.ticketId)}
                      className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-500/15 transition-colors"
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
