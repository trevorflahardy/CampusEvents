import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError, type EventDetail as EventDetailType } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusClasses: Record<string, string> = {
  upcoming: "bg-green-100 text-green-800",
  ongoing: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
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
      setBookingSuccess(
        `Ticket booked! Confirmation code: ${ticket.confirmationCode}`,
      );
      // Refresh event for updated spots
      const updated = await api.getEvent(event.id);
      setEvent(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
      } else {
        setBookingError("Failed to book ticket.");
      }
    } finally {
      setBooking(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event || !confirm("Are you sure you want to cancel this event?"))
      return;
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
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading event...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 inline-block">
          {error || "Event not found."}
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
    <div>
      <Link
        to="/"
        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to events
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${statusClasses[event.status] || "bg-gray-100 text-gray-800"}`}
          >
            {event.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <div className="text-sm text-gray-500">Start</div>
              <div>{formatDateTime(event.startTime)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5 text-gray-400"
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
            <div>
              <div className="text-sm text-gray-500">End</div>
              <div>{formatDateTime(event.endTime)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div>
              <div className="text-sm text-gray-500">Location</div>
              <div>{event.location}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <div>
              <div className="text-sm text-gray-500">Organizer</div>
              <div>{event.organizerName}</div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <span className="text-2xl font-bold text-indigo-600">
            {formatPrice(event.ticketPrice)}
          </span>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Categories */}
        {event.categories.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-sm font-medium"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Capacity Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">
              {spotsUsed} / {event.capacity} spots filled
            </span>
            <span
              className={`font-medium ${soldOut ? "text-red-600" : "text-green-600"}`}
            >
              {soldOut
                ? "Sold Out"
                : `${event.spotsRemaining} spots remaining`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
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
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {booking ? "Booking..." : "Book Ticket"}
            </button>
          )}
          {isOwner && event.status !== "cancelled" && (
            <button
              onClick={handleCancelEvent}
              disabled={cancelling}
              className="rounded-lg bg-red-600 px-6 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Event"}
            </button>
          )}
        </div>

        {/* Booking Success */}
        {bookingSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
            {bookingSuccess}
          </div>
        )}

        {/* Booking Error */}
        {bookingError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {bookingError}
          </div>
        )}
      </div>
    </div>
  );
}
