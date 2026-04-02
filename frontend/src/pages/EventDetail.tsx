import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError, type EventDetail as EventDetailType } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  upcoming: "bg-emerald-500/10 text-emerald-600",
  ongoing: "bg-blue-500/10 text-blue-600",
  completed: "bg-slate-500/10 text-slate-500",
  cancelled: "bg-red-500/10 text-red-500",
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return num === 0 ? "Free" : `$${num.toFixed(2)}`;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getEvent(Number(id))
      .then(setEvent)
      .catch(() => setError("Failed to load event."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBookTicket = async () => {
    if (!user || !event) return;
    setBooking(true);
    setBookingError("");
    setBookingSuccess("");
    try {
      const ticket = await api.purchaseTicket(user.id, event.id);
      setBookingSuccess(`Ticket booked! Confirmation: ${ticket.confirmationCode}`);
      const updated = await api.getEvent(event.id);
      setEvent(updated);
    } catch (err) {
      if (err instanceof ApiError) setBookingError(err.message);
      else setBookingError("Failed to book ticket.");
    } finally {
      setBooking(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event || !confirm("Are you sure you want to cancel this event?")) return;
    setCancelling(true);
    try {
      await api.updateEvent(event.id, { status: "cancelled" });
      const updated = await api.getEvent(event.id);
      setEvent(updated);
    } catch {
      setError("Failed to cancel event.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="glass rounded-3xl p-8">
          <div className="skeleton h-8 w-2/3 mb-6" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
          </div>
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-20">
        <div className="glass rounded-3xl p-10 inline-block">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-slate-600 font-medium">{error || "Event not found."}</p>
        </div>
      </div>
    );
  }

  const spotsUsed = event.capacity - event.spotsRemaining;
  const capacityPercent = Math.round((spotsUsed / event.capacity) * 100);
  const soldOut = event.spotsRemaining <= 0;
  const isOwner = user?.id === event.organizerId;
  const canBook =
    isAuthenticated &&
    user?.role === "student" &&
    !soldOut &&
    event.status !== "cancelled" &&
    event.status !== "completed";

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Link
        to="/events"
        className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 font-medium mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to events
      </Link>

      <div className="glass-heavy rounded-3xl p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{event.title}</h1>
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${statusColors[event.status] || "bg-slate-500/10 text-slate-500"}`}>
            {event.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
              label: "Start",
              value: formatDateTime(event.startTime),
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
              label: "End",
              value: formatDateTime(event.endTime),
            },
            {
              icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>,
              label: "Location",
              value: event.location,
            },
            {
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
              label: "Organizer",
              value: event.organizerName,
            },
          ].map((item, i) => (
            <div key={i} className="glass-subtle rounded-2xl p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 font-medium">{item.label}</div>
                <div className="text-sm text-slate-700 font-medium truncate">{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="mb-8">
          <span className="text-3xl font-extrabold text-gradient">
            {formatPrice(event.ticketPrice)}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Description</h2>
            <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Categories */}
        {event.categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Categories</h2>
            <div className="flex flex-wrap gap-2">
              {event.categories.map((cat) => (
                <span key={cat.id} className="rounded-full bg-indigo-500/8 text-indigo-600 border border-indigo-500/15 px-3 py-1 text-sm font-medium">
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Capacity */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-500">{spotsUsed} / {event.capacity} spots filled</span>
            <span className={`font-semibold ${soldOut ? "text-red-500" : "text-emerald-500"}`}>
              {soldOut ? "Sold Out" : `${event.spotsRemaining} remaining`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent >= 90 ? "bg-gradient-to-r from-red-400 to-red-500" :
                capacityPercent >= 70 ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                "bg-gradient-to-r from-emerald-400 to-emerald-500"
              }`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {canBook && (
            <button
              onClick={handleBookTicket}
              disabled={booking}
              className="cursor-pointer btn-primary text-white font-bold px-8 py-3 rounded-xl"
            >
              {booking ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Booking...
                </span>
              ) : "Book Ticket"}
            </button>
          )}
          {isOwner && event.status !== "cancelled" && (
            <button
              onClick={handleCancelEvent}
              disabled={cancelling}
              className="cursor-pointer rounded-xl px-6 py-3 font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/15 transition-colors disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Event"}
            </button>
          )}
        </div>

        {bookingSuccess && (
          <div className="mt-6 bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 rounded-2xl p-4 font-medium text-sm">
            {bookingSuccess}
          </div>
        )}
        {bookingError && (
          <div className="mt-6 bg-red-50/80 border border-red-200/60 text-red-600 rounded-2xl p-4 font-medium text-sm">
            {bookingError}
          </div>
        )}
      </div>
    </div>
  );
}
