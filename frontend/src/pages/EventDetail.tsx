import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError, type EventDetail as EventDetailType } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusColors: Record<string, string> = {
  upcoming: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ongoing: "bg-blue-50 text-blue-700 border border-blue-200",
  completed: "bg-slate-100 text-slate-500 border border-slate-200",
  cancelled: "bg-red-50 text-red-600 border border-red-200",
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
      "w-full rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none ring-2 ring-indigo-200 focus:ring-indigo-400 transition-shadow " +
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
      className={`group/edit cursor-pointer inline-flex items-center gap-1.5 rounded-md transition-colors hover:bg-indigo-50 px-1 -mx-1 ${className}`}
      title="Click to edit"
    >
      {displayValue ?? value}
      <svg
        className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0"
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="skeleton h-8 w-2/3 mb-6" />
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 inline-block">
          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
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
          <p className="text-slate-600 font-medium">
            {error || "Event not found."}
          </p>
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
    <div className="max-w-3xl mx-auto animate-fade-in">
      <Link
        to="/events"
        className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 font-medium mb-6 transition-colors"
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

      {/* Editor Banner */}
      {canEdit && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-700">
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 md:p-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            <EditableField
              value={event.title}
              fieldName="title"
              eventId={event.id}
              canEdit={canEdit}
              onSaved={fetchEvent}
              className="text-3xl font-bold text-slate-900 tracking-tight"
              inputClassName="text-xl font-bold"
            />
          </h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusColors[event.status] || "bg-slate-100 text-slate-500 border border-slate-200"}`}
          >
            {event.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {/* Start Time */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-indigo-500"
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
                Start
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

          {/* End Time */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-blue-500"
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
                End
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
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-emerald-500"
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

          {/* Organizer (read-only always) */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-amber-500"
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
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-medium mb-0.5">
                Organizer
              </div>
              <div className="text-sm text-slate-700 font-medium truncate">
                {event.organizerName}
              </div>
            </div>
          </div>
        </div>

        {/* Price & Capacity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 p-5 rounded-xl bg-slate-50 border border-slate-100">
          {/* Price */}
          <div className="shrink-0">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
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
              className="text-2xl font-extrabold text-indigo-600"
              inputClassName="text-lg font-bold"
            />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-12 bg-slate-200" />

          {/* Capacity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Capacity{" "}
                <EditableField
                  value={String(event.capacity)}
                  fieldName="capacity"
                  eventId={event.id}
                  canEdit={canEdit}
                  onSaved={fetchEvent}
                  type="number"
                  displayValue={`(${event.capacity} total)`}
                  className="text-xs text-slate-400 font-medium"
                  inputClassName="text-xs w-20"
                />
              </div>
              <span
                className={`text-sm font-semibold ${soldOut ? "text-red-500" : "text-emerald-600"}`}
              >
                {soldOut ? "Sold Out" : `${event.spotsRemaining} remaining`}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden">
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
            <div className="text-xs text-slate-400 mt-1">
              {spotsUsed} / {event.capacity} spots filled
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
            Description
          </h2>
          {event.description ? (
            <EditableField
              value={event.description}
              fieldName="description"
              eventId={event.id}
              canEdit={canEdit}
              onSaved={fetchEvent}
              type="textarea"
              className="text-slate-500 leading-relaxed whitespace-pre-wrap"
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

        {/* Categories */}
        {event.categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 text-sm font-medium"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-100 my-6" />

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {canBook && (
            <button
              onClick={handleBookTicket}
              disabled={booking}
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-sm disabled:opacity-50"
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
          {isOwner && event.status !== "cancelled" && (
            <button
              onClick={handleCancelEvent}
              disabled={cancelling}
              className="cursor-pointer rounded-xl px-6 py-3 font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {cancelling ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  Cancelling...
                </span>
              ) : (
                <span className="flex items-center gap-2">
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

        {/* Feedback Messages */}
        {bookingSuccess && (
          <div className="mt-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-4 text-sm">
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
          <div className="mt-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
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
      </div>
    </div>
  );
}
