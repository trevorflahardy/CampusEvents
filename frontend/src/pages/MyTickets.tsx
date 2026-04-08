import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, type UserTicket } from "../lib/api";
import { useAuth } from "../context/useAuth";
import ConfirmDialog from "../components/ConfirmDialog";

const statusColors: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRelativeTime(dateStr: string, endDateStr: string, status: string): { label: string; color: string } {
  const now = Date.now();
  const start = new Date(dateStr).getTime();
  const end = new Date(endDateStr).getTime();
  const diff = start - now;

  if (status === "cancelled") return { label: "Cancelled", color: "text-red-500" };
  if (status === "completed" || now > end) return { label: "Event ended", color: "text-slate-400" };
  if (status === "ongoing" || (now >= start && now <= end)) return { label: "Happening now", color: "text-emerald-600" };

  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return { label: `Starts in ${minutes}m`, color: "text-amber-600" };
  if (hours < 24) return { label: `Starts in ${hours}h ${minutes % 60}m`, color: "text-blue-600" };
  if (days === 1) return { label: "Starts tomorrow", color: "text-blue-500" };
  if (days < 7) return { label: `Starts in ${days} days`, color: "text-slate-600" };
  return { label: `Starts in ${days} days`, color: "text-slate-500" };
}

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingTicketId, setCancellingTicketId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);

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

  const handleCheckin = async (ticketId: number) => {
    setCheckingInId(ticketId);
    try {
      await api.checkinTicket(ticketId);
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === ticketId ? { ...t, checkedIn: true } : t
        )
      );
      toast.success("Checked in successfully!");
    } catch {
      toast.error("Check-in failed. Make sure the event is currently ongoing.");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleCancel = async (ticketId: number) => {
    setCancelling(true);
    try {
      await api.cancelTicket(ticketId);
      setTickets((prev) => prev.filter((t) => t.ticketId !== ticketId));
      toast.success("Booking cancelled");
    } catch {
      setError("Failed to cancel ticket.");
      toast.error("Failed to cancel ticket.");
    } finally {
      setCancelling(false);
      setCancellingTicketId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-10 w-48 mb-3 rounded-xl" />
        <div className="skeleton h-5 w-80 mb-10 rounded-lg" />
        <div className="flex flex-col gap-6 max-w-5xl">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col lg:flex-row w-full">
              <div className="glass-heavy ticket-notch rounded-l-3xl p-8 flex-grow">
                <div className="skeleton h-6 w-1/3 mb-3" />
                <div className="skeleton h-5 w-1/2 mb-6" />
                <div className="flex gap-8">
                  <div className="skeleton h-10 w-24" />
                  <div className="skeleton h-10 w-24" />
                  <div className="skeleton h-10 w-24" />
                </div>
              </div>
              <div className="glass-heavy stub-notch rounded-r-3xl lg:w-64 p-8 border-l-0">
                <div className="skeleton h-5 w-20 mb-4" />
                <div className="skeleton h-16 w-full mb-6 rounded-xl" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-gradient">My Tickets</span>
        </h1>
        <p className="text-slate-500 max-w-xl">
          View and manage your upcoming campus experiences. Your digital entry
          passes for the season.
        </p>
      </header>

      {error && (
        <div className="glass-heavy rounded-2xl p-4 mb-6 border-l-4 border-red-400">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="glass-heavy rounded-3xl text-center py-20 px-8 max-w-5xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-glow flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#1a4f3b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-slate-700 mb-1">
            No tickets yet
          </p>
          <p className="text-slate-400 text-sm mb-6">
            Browse events and book your first ticket!
          </p>
          <Link
            to="/dashboard"
            className="cursor-pointer inline-flex items-center gap-2 btn-primary text-white font-bold px-6 py-2.5 rounded-full transition-all duration-200"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-5xl">
          {tickets.map((ticket, index) => {
            const now = Date.now();
            const start = new Date(ticket.eventStartTime).getTime();
            const end = new Date(ticket.eventEndTime).getTime();
            const isHappeningNow = now >= start && now <= end;
            const isPast =
              ticket.eventStatus === "completed" ||
              ticket.eventStatus === "cancelled" ||
              now > end;
            const effectiveStatus = isPast
              ? ticket.eventStatus === "cancelled" ? "cancelled" : "completed"
              : isHappeningNow ? "ongoing" : ticket.eventStatus;
            const relative = getRelativeTime(ticket.eventStartTime, ticket.eventEndTime, effectiveStatus);
            const canCheckin = isHappeningNow && !ticket.checkedIn && !isPast;

            return (
              <div
                key={ticket.ticketId}
                className={`animate-fade-in stagger-${Math.min(index + 1, 4)} flex flex-col lg:flex-row w-full group ${isPast ? "opacity-75 hover:opacity-100 transition-opacity" : ""}`}
              >
                {/* Main ticket body */}
                <div className="glass-heavy ticket-notch rounded-t-3xl lg:rounded-l-3xl lg:rounded-tr-none p-6 md:p-8 flex-grow relative overflow-hidden">
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      {/* Category + Status row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`w-2 h-2 rounded-full ${isPast ? "bg-slate-400" : "bg-[#1a4f3b]"}`} />
                        {ticket.categories.length > 0 ? (
                          ticket.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="text-[10px] font-bold tracking-widest text-slate-500 uppercase"
                            >
                              {cat.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            Campus Event
                          </span>
                        )}
                        <span
                          className={`ml-auto badge ${statusColors[effectiveStatus] || "badge-neutral"}`}
                        >
                          {effectiveStatus}
                        </span>
                      </div>

                      {/* Title */}
                      <Link
                        to={`/events/${ticket.eventId}`}
                        state={{ from: "dashboard" }}
                        className="cursor-pointer"
                      >
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight hover:text-[#2f6d56] transition-colors">
                          {ticket.eventTitle}
                        </h3>
                      </Link>

                      {/* Location */}
                      <p className="text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ticket.eventLocation}
                      </p>
                    </div>

                    {/* Relative time indicator */}
                    <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${relative.color}`}>
                      {isHappeningNow && !isPast && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                      )}
                      {relative.label}
                    </div>

                    {/* Date / Time / Price / Check-in row */}
                    <div className="flex flex-wrap gap-6 md:gap-8 mt-4">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                          Date
                        </span>
                        <span className="text-lg font-semibold">
                          {formatDate(ticket.eventStartTime)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                          Time
                        </span>
                        <span className="text-lg font-semibold">
                          {formatTime(ticket.eventStartTime)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                          Price
                        </span>
                        <span className="text-lg font-semibold">
                          {parseFloat(ticket.ticketPrice) === 0
                            ? "Free"
                            : `$${parseFloat(ticket.ticketPrice).toFixed(2)}`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                          Check-in
                        </span>
                        <span className="text-lg font-semibold flex items-center gap-1.5">
                          {ticket.checkedIn ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              Yes
                            </>
                          ) : (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              No
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stub (perforation + confirmation) */}
                <div
                  className="relative w-full lg:w-64 glass-heavy stub-notch rounded-b-3xl lg:rounded-r-3xl lg:rounded-bl-none border-t-0 lg:border-t lg:border-l-0 p-6 md:p-8 flex flex-col justify-between
                    before:content-[''] before:absolute
                    before:left-4 before:right-4 before:top-[-0.5px] before:h-0 before:border-t before:border-dashed before:border-slate-300/40
                    lg:before:left-[-0.5px] lg:before:right-auto lg:before:top-4 lg:before:bottom-4 lg:before:h-auto lg:before:w-0 lg:before:border-t-0 lg:before:border-l lg:before:border-dashed lg:before:border-slate-300/40"
                >
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                      Verification
                    </span>
                    <div className="glass-subtle p-4 rounded-xl">
                      <span className="block text-[10px] text-slate-400 uppercase tracking-tighter mb-1">
                        Conf. Number
                      </span>
                      <span className="text-xl font-mono tracking-widest font-bold text-[#1a4f3b]">
                        {ticket.confirmationCode}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2">
                    {/* Check-in button for ongoing events */}
                    {canCheckin ? (
                      <button
                        onClick={() => handleCheckin(ticket.ticketId)}
                        disabled={checkingInId === ticket.ticketId}
                        className="cursor-pointer w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {checkingInId === ticket.ticketId ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Checking in...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Check In Now
                          </>
                        )}
                      </button>
                    ) : ticket.checkedIn && isHappeningNow ? (
                      <div className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-emerald-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Checked In
                      </div>
                    ) : (
                      <Link
                        to={`/events/${ticket.eventId}`}
                        state={{ from: "dashboard" }}
                        className="cursor-pointer w-full bg-[#1a4f3b] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 hover:bg-[#2b5c50] active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Event
                      </Link>
                    )}
                    {effectiveStatus !== "cancelled" &&
                      effectiveStatus !== "completed" && (
                        <button
                          onClick={() => setCancellingTicketId(ticket.ticketId)}
                          className="cursor-pointer w-full border border-red-200/60 hover:bg-red-50/60 py-2 rounded-xl text-xs font-bold text-red-500 transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {tickets.length > 0 && (
        <footer className="mt-12 border-t border-slate-200/40 pt-6 flex justify-between items-center text-slate-500 max-w-5xl">
          <p className="text-sm">
            Showing {tickets.length} active ticket{tickets.length !== 1 ? "s" : ""}
          </p>
        </footer>
      )}

      <ConfirmDialog
        open={cancellingTicketId !== null}
        title="Cancel this booking?"
        message="Your ticket will be cancelled and the spot will be released."
        confirmText="Cancel Booking"
        isDangerous={true}
        loading={cancelling}
        onConfirm={() => { if (cancellingTicketId) handleCancel(cancellingTicketId); }}
        onCancel={() => setCancellingTicketId(null)}
      />
    </div>
  );
}
