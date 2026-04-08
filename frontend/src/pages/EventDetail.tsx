/**
 * EventDetail - Main page component for viewing a single event.
 *
 * Fetches and displays full event details including banner/hero, booking controls,
 * description, highlight cards, organizer info, timing, and map preview.
 * Supports inline editing for organizers and admins.
 *
 * Composed from sub-components in `components/event/`.
 */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
} from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  api,
  ApiError,
  type EventDetail as EventDetailType,
  type UserTicket,
} from "../lib/api";
import { useAuth } from "../context/useAuth";
import {
  EventDetailLoading,
  EventDetailError,
  EventHeroSection,
  EventActionBar,
  EventAboutSection,
  EventSidebar,
} from "../components/event";

/**
 * Page component that fetches an event by URL param `:id` and renders
 * the full detail view with booking, editing, and cancellation support.
 */
export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const cameFromEvents = (location.state as { from?: string } | null)?.from === "events";
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [userTicket, setUserTicket] = useState<UserTicket | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  /** Refetches the current event from the API (used after inline edits). */
  const fetchEvent = useCallback(() => {
    if (!id) return;
    api
      .getEvent(Number(id))
      .then(setEvent)
      .catch(() => setError("Failed to load event."));
  }, [id]);

  /** Initial event fetch on mount. */
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getEvent(Number(id))
      .then(setEvent)
      .catch(() => setError("Failed to load event."))
      .finally(() => setLoading(false));
  }, [id]);

  /** Check if the current user already has a ticket for this event. */
  useEffect(() => {
    if (!user || !event) return;
    api
      .getUserTickets(user.id)
      .then((tickets) => {
        const ticket = tickets.find((t) => t.eventId === event.id);
        setHasRegistered(!!ticket);
        setUserTicket(ticket ?? null);
      })
      .catch(() => {});
  }, [user, event]);

  /** Handles uploading a new banner image for the event. */
  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;
    setUploadingBanner(true);
    try {
      await api.uploadEventBanner(event.id, file);
      const updated = await api.getEvent(event.id);
      setEvent(updated);
    } catch (err) {
      if (err instanceof ApiError) setBookingError(err.message);
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  /** Books a ticket for the current user. */
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
      setHasRegistered(true);
      const updated = await api.getEvent(event.id);
      setEvent(updated);
    } catch (err) {
      if (err instanceof ApiError) setBookingError(err.message);
      else setBookingError("Failed to book ticket.");
    } finally {
      setBooking(false);
    }
  };

  /** Self-check-in for the current user's ticket. */
  const handleCheckin = async () => {
    if (!userTicket || !event) return;
    setCheckingIn(true);
    setBookingError("");
    try {
      await api.checkinTicket(userTicket.ticketId);
      setUserTicket({ ...userTicket, checkedIn: true });
      setBookingSuccess("You're checked in! Enjoy the event.");
    } catch (err) {
      if (err instanceof ApiError) setBookingError(err.message);
      else setBookingError("Failed to check in.");
    } finally {
      setCheckingIn(false);
    }
  };

  /** Cancels the event after user confirmation. */
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
    return <EventDetailLoading />;
  }

  // --- Error State ---
  if (error || !event) {
    return <EventDetailError error={error} />;
  }

  const spotsUsed = event.capacity - event.spotsRemaining;
  const capacityPercent = Math.round((spotsUsed / event.capacity) * 100);
  const soldOut = event.spotsRemaining <= 0;
  const isOwner = user?.id === event.organizerId;
  const isAdmin = user?.role === "admin";
  const canEdit = isOwner || isAdmin;
  const canBook =
    isAuthenticated &&
    !soldOut &&
    !hasRegistered &&
    event.status !== "cancelled" &&
    event.status !== "completed";

  return (
    <div className="bg-mesh min-h-full animate-fade-in">
      {/* Hero Section */}
      <EventHeroSection
        backTo={cameFromEvents ? "/events" : "/dashboard"}
        backLabel={cameFromEvents ? "Back to events" : "Back to dashboard"}
        event={event}
        canEdit={canEdit}
        editMode={editMode}
        fetchEvent={fetchEvent}
        uploadingBanner={uploadingBanner}
        onBannerUpload={handleBannerUpload}
        bannerInputRef={bannerInputRef}
      />

      {/* Two-Column Content Grid */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            <EventActionBar
              event={event}
              spotsUsed={spotsUsed}
              capacityPercent={capacityPercent}
              soldOut={soldOut}
              canBook={canBook}
              hasRegistered={hasRegistered}
              booking={booking}
              onBook={handleBookTicket}
              userRole={user?.role}
              canEdit={canEdit}
              editMode={editMode}
              onEnterEditMode={() => setEditMode(true)}
              onExitEditMode={() => setEditMode(false)}
              fetchEvent={fetchEvent}
              bookingSuccess={bookingSuccess}
              bookingError={bookingError}
            />

            <EventAboutSection
              event={event}
              editMode={editMode}
              fetchEvent={fetchEvent}
              spotsUsed={spotsUsed}
            />
          </div>

          {/* Sidebar Column (1/3) */}
          <EventSidebar
            event={event}
            editMode={editMode}
            fetchEvent={fetchEvent}
            isOwner={isOwner}
            cancelling={cancelling}
            onCancelEvent={handleCancelEvent}
          />
        </div>
      </section>
    </div>
  );
}
