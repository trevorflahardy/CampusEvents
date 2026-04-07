import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError, type EventDetail as EventDetailType } from "../lib/api";
import { useAuth } from "../context/useAuth";

const statusColors: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
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

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return num === 0 ? "Free" : `$${num.toFixed(2)}`;
}

function toDatetimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// --- EditableField Component ---

interface EditableFieldProps {
  value: string;
  fieldName: string;
  eventId: number;
  canEdit: boolean;
  onSaved: () => void;
  type?: "text" | "textarea" | "number" | "datetime-local";
  displayValue?: string;
  className?: string;
  inputClassName?: string;
}

function EditableField({
  value,
  fieldName,
  eventId,
  canEdit,
  onSaved,
  type = "text",
  displayValue,
  className = "",
  inputClassName = "",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (type !== "datetime-local" && "select" in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  const save = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      let payload: Record<string, unknown>;
      if (type === "number") {
        payload = { [fieldName]: parseFloat(trimmed) };
      } else if (type === "datetime-local") {
        payload = { [fieldName]: new Date(trimmed).toISOString() };
      } else {
        payload = { [fieldName]: trimmed };
      }
      await api.updateEvent(eventId, payload);
      onSaved();
      setEditing(false);
    } catch {
      // revert on failure
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [draft, value, fieldName, eventId, type, onSaved]);

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      save();
    }
    if (e.key === "Escape") {
      cancel();
    }
  };

  if (!canEdit) {
    return <span className={className}>{displayValue ?? value}</span>;
  }

  if (editing) {
    const baseInput =
      "w-full rounded-lg border border-[#2b5c50]/30 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none ring-2 ring-accent/20 focus:ring-[#1a4f3b]/40 transition-shadow " +
      inputClassName;

    if (type === "textarea") {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          rows={4}
          disabled={saving}
          className={baseInput + " resize-y"}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={type === "datetime-local" ? toDatetimeLocal(draft) : draft}
        onChange={(e) =>
          setDraft(
            type === "datetime-local"
              ? new Date(e.target.value).toISOString()
              : e.target.value,
          )
        }
        onBlur={save}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={baseInput}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`group/edit cursor-pointer inline-flex items-center gap-1.5 rounded-md transition-colors hover:bg-brand-glow px-1 -mx-1 ${className}`}
      title="Click to edit"
    >
      {displayValue ?? value}
      <svg
        className="w-3.5 h-3.5 text-accent opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </span>
  );
}

// --- Main Component ---

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

  const fetchEvent = useCallback(() => {
    if (!id) return;
    api
      .getEvent(Number(id))
      .then(setEvent)
      .catch(() => setError("Failed to load event."));
  }, [id]);

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
        `Ticket booked! Confirmation: ${ticket.confirmationCode}`,
      );
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

  // --- Loading State ---
  if (loading) {
    return (
      <div className="bg-mesh min-h-full animate-fade-in">
        {/* Back link skeleton */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
          <div className="skeleton h-5 w-32 mb-6 rounded-lg" />
        </div>
        {/* Hero skeleton */}
        <div className="relative w-full h-72 md:h-[500px] skeleton rounded-none" />
        {/* Content skeleton */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="skeleton h-24 rounded-2xl" />
              <div className="skeleton h-48 rounded-2xl" />
            </div>
            <div className="space-y-6">
              <div className="skeleton h-44 rounded-2xl" />
              <div className="skeleton h-36 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error || !event) {
    return (
      <div className="bg-mesh min-h-full text-center py-20">
        <div className="glass-heavy rounded-2xl p-10 inline-block">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-slate-600 font-medium mb-4">
            {error || "Event not found."}
          </p>
          <Link
            to="/events"
            className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-[#1a4f3b] hover:text-[#2b5c50] font-medium transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const spotsUsed = event.capacity - event.spotsRemaining;
  const capacityPercent = Math.round((spotsUsed / event.capacity) * 100);
  const soldOut = event.spotsRemaining <= 0;
  const isOwner = user?.id === event.organizerId;
  const isAdmin = user?.role === "admin";
  const canEdit = isOwner || isAdmin;
  const canBook =
    isAuthenticated &&
    user?.role === "student" &&
    !soldOut &&
    event.status !== "cancelled" &&
    event.status !== "completed";

  return (
    <div className="bg-mesh min-h-full animate-fade-in">
      {/* Back Link */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-4">
        <Link
          to="/events"
          className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1a4f3b] font-medium transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to events
        </Link>
      </div>

      {/* ========== HERO SECTION ========== */}
      <section className="relative w-full h-72 md:h-[500px] overflow-hidden">
        {/* Gradient background (decorative hero) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0f2b22 0%, #1a4f3b 30%, #2b5c50 60%, #163028 100%)",
          }}
        />
        {/* Decorative radial overlays */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 40%, rgba(47, 109, 86, 0.5), transparent 55%), radial-gradient(circle at 75% 60%, rgba(26, 79, 59, 0.4), transparent 50%)",
          }}
        />
        {/* Bottom fade to page background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 40%, rgba(238, 243, 247, 0.3) 75%, #eef3f7 100%)",
          }}
        />
        {/* Hero content overlay at bottom */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 max-w-6xl mx-auto inset-x-0">
          {/* Category badges + status */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="px-3 py-1 rounded-md bg-white/15 backdrop-blur-sm text-white/90 text-xs font-bold uppercase tracking-wider border border-white/10"
              >
                {cat.name}
              </span>
            ))}
            <span
              className={`badge uppercase tracking-wide ${statusColors[event.status] || "badge-neutral"}`}
            >
              {event.status}
            </span>
          </div>
          {/* Event Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 tracking-tight drop-shadow-lg">
            <EditableField
              value={event.title}
              fieldName="title"
              eventId={event.id}
              canEdit={canEdit}
              onSaved={fetchEvent}
              className="text-3xl md:text-5xl font-bold text-white leading-tight tracking-tight"
              inputClassName="text-xl font-bold"
            />
          </h1>
          {/* Meta row: date, time, location */}
          <div className="flex flex-wrap items-center gap-5 text-white/80 text-sm font-medium">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>{formatDate(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TWO-COLUMN CONTENT GRID ========== */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ---- MAIN COLUMN (2/3) ---- */}
          <div className="lg:col-span-2 space-y-8">
            {/* Action Bar */}
            <div className="glass-heavy rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 animate-fade-in stagger-1">
              {/* Left: capacity info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500 font-medium">
                    <EditableField
                      value={String(event.capacity)}
                      fieldName="capacity"
                      eventId={event.id}
                      canEdit={canEdit}
                      onSaved={fetchEvent}
                      type="number"
                      displayValue={`${event.capacity} total spots`}
                      className="text-sm text-slate-500 font-medium"
                      inputClassName="text-xs w-20"
                    />
                  </span>
                  <span
                    className={`text-sm font-semibold ${soldOut ? "text-red-500" : "text-emerald-600"}`}
                  >
                    {soldOut
                      ? "Sold Out"
                      : `${event.spotsRemaining} remaining`}
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacityPercent >= 90
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : capacityPercent >= 70
                          ? "bg-gradient-to-r from-amber-400 to-amber-500"
                          : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    }`}
                    style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1.5">
                  {spotsUsed} / {event.capacity} spots filled
                </div>
              </div>

              {/* Right: book button or status */}
              <div className="shrink-0 flex items-center gap-3">
                {canBook && (
                  <button
                    onClick={handleBookTicket}
                    disabled={booking}
                    className="cursor-pointer btn-primary font-bold px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {booking ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Booking...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                          />
                        </svg>
                        Book Ticket
                      </span>
                    )}
                  </button>
                )}
                {soldOut && event.status !== "cancelled" && (
                  <span className="badge badge-danger font-semibold text-sm px-4 py-2">
                    Sold Out
                  </span>
                )}
                {event.status === "cancelled" && (
                  <span className="badge badge-danger font-semibold text-sm px-4 py-2">
                    Cancelled
                  </span>
                )}
              </div>
            </div>

            {/* Editor Banner (inside main column, below action bar) */}
            {canEdit && (
              <div className="flex items-center gap-2.5 rounded-xl border border-brand-light bg-brand-glow px-4 py-2.5 text-sm text-[#1a4f3b]">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span className="font-medium">
                  You can edit this event by clicking on any highlighted field.
                </span>
              </div>
            )}

            {/* Feedback Messages */}
            {bookingSuccess && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-sm">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{bookingSuccess}</span>
              </div>
            )}
            {bookingError && (
              <div
                role="alert"
                className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm"
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{bookingError}</span>
              </div>
            )}

            {/* About the Event — bare, no glass block */}
            <div className="px-1 animate-fade-in stagger-2">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">
                About the Event
              </h2>
              {event.description ? (
                <EditableField
                  value={event.description}
                  fieldName="description"
                  eventId={event.id}
                  canEdit={canEdit}
                  onSaved={fetchEvent}
                  type="textarea"
                  className="text-slate-500 leading-relaxed whitespace-pre-wrap text-base"
                />
              ) : canEdit ? (
                <EditableField
                  value=""
                  fieldName="description"
                  eventId={event.id}
                  canEdit={canEdit}
                  onSaved={fetchEvent}
                  type="textarea"
                  displayValue="Click to add a description..."
                  className="text-slate-300 italic"
                />
              ) : (
                <p className="text-slate-400 italic">No description provided.</p>
              )}
            </div>

            {/* Highlight cards: Price + Capacity — standalone below description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in stagger-3">
              {/* Price Card */}
              <div className="glass-subtle rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-glow flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-[#1a4f3b]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    Ticket Price
                  </div>
                  <EditableField
                    value={event.ticketPrice}
                    fieldName="ticketPrice"
                    eventId={event.id}
                    canEdit={canEdit}
                    onSaved={fetchEvent}
                    type="number"
                    displayValue={formatPrice(event.ticketPrice)}
                    className="text-xl font-extrabold text-[#1a4f3b]"
                    inputClassName="text-lg font-bold"
                  />
                </div>
              </div>

              {/* Capacity Card */}
              <div className="glass-subtle rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-glow flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-[#1a4f3b]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    Capacity
                  </div>
                  <div className="text-xl font-extrabold text-slate-800">
                    {spotsUsed}{" "}
                    <span className="text-sm font-medium text-slate-400">
                      / {event.capacity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Section */}
            {event.categories.length > 0 && (
              <div className="glass-heavy rounded-2xl p-6 animate-fade-in stagger-3">
                <h2 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">
                  Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="rounded-md bg-brand-glow text-[#1a4f3b] border border-brand-light px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---- SIDEBAR COLUMN (1/3) ---- */}
          <div className="space-y-6">
            {/* Organizer Card */}
            <div className="glass-heavy rounded-2xl p-6 animate-fade-in stagger-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Event Organizer
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-glow flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-[#1a4f3b]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-lg text-slate-800 leading-tight">
                    {event.organizerName}
                  </div>
                  <div className="text-sm text-slate-500">Event Organizer</div>
                </div>
              </div>
              <button
                type="button"
                className="cursor-pointer w-full py-2.5 rounded-xl btn-secondary text-sm font-semibold transition-all"
              >
                View Profile
              </button>
            </div>

            {/* Event Timing Card */}
            <div className="glass-heavy rounded-2xl p-6 animate-fade-in stagger-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Event Timing
              </h3>
              <div className="space-y-4">
                {/* Start */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-glow flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-4.5 h-4.5 text-[#1a4f3b]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium mb-0.5">
                      Starts
                    </div>
                    <EditableField
                      value={event.startTime}
                      fieldName="startTime"
                      eventId={event.id}
                      canEdit={canEdit}
                      onSaved={fetchEvent}
                      type="datetime-local"
                      displayValue={formatDateTime(event.startTime)}
                      className="text-sm text-slate-700 font-medium"
                    />
                  </div>
                </div>
                {/* End */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-glow flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-4.5 h-4.5 text-[#1a4f3b]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium mb-0.5">
                      Ends
                    </div>
                    <EditableField
                      value={event.endTime}
                      fieldName="endTime"
                      eventId={event.id}
                      canEdit={canEdit}
                      onSaved={fetchEvent}
                      type="datetime-local"
                      displayValue={formatDateTime(event.endTime)}
                      className="text-sm text-slate-700 font-medium"
                    />
                  </div>
                </div>
                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-glow flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-4.5 h-4.5 text-[#1a4f3b]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium mb-0.5">
                      Location
                    </div>
                    <EditableField
                      value={event.location}
                      fieldName="location"
                      eventId={event.id}
                      canEdit={canEdit}
                      onSaved={fetchEvent}
                      className="text-sm text-slate-700 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel Event Button (owner only, not already cancelled) */}
            {isOwner && event.status !== "cancelled" && (
              <button
                onClick={handleCancelEvent}
                disabled={cancelling}
                className="cursor-pointer btn-danger rounded-xl w-full px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in stagger-4"
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    Cancelling...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel Event
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
