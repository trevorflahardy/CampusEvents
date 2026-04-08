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
import { toast } from "sonner";
import {
  api,
  ApiError,
  type EventDetail as EventDetailType,
  type UserTicket,
} from "../lib/api";
import { useAuth } from "../context/useAuth";
import ConfirmDialog from "../components/ConfirmDialog";
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
  const cameFromEvents =
    (location.state as { from?: string } | null)?.from === "events";
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUnregisterConfirm, setShowUnregisterConfirm] = useState(false);
  const [unregistering, setUnregistering] = useState(false);
  const [, setTick] = useState(0);
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
    let cancelled = false;
    setLoading(true);
    api
      .getEvent(Number(id))
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load event.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  /** Re-render every 60s so check-in window calculation stays fresh. */
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

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
      toast.success("Banner updated");
    } catch (err) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
        toast.error(err.message);
      }
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
      toast.success(
        "Ticket booked! Confirmation: " + ticket.confirmationCode,
      );
      setHasRegistered(true);
      const updated = await api.getEvent(event.id);
      setEvent(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
        toast.error(err.message);
      } else {
        setBookingError("Failed to book ticket.");
        toast.error("Failed to book ticket.");
      }
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
      toast.success("You're checked in! Enjoy the event.");
    } catch (err) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
        toast.error(err.message);
      } else {
        setBookingError("Failed to check in.");
        toast.error("Failed to check in.");
      }
    } finally {
      setCheckingIn(false);
    }
  };

  /** Unregisters the current user from this event. */
  const handleUnregister = async () => {
    if (!userTicket || !event) return;
    setUnregistering(true);
    try {
      await api.cancelTicket(userTicket.ticketId);
      setHasRegistered(false);
      setUserTicket(null);
      setShowUnregisterConfirm(false);
      const updated = await api.getEvent(event.id);
      setEvent(updated);
      toast.success("Registration cancelled");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to cancel registration.");
    } finally {
      setUnregistering(false);
    }
  };

  /** Opens the cancel-event confirmation dialog. */
  const requestCancelEvent = () => {
    setShowCancelConfirm(true);
  };

  /** Cancels the event (called from the ConfirmDialog onConfirm). */
  const handleCancelEvent = async () => {
    if (!event) return;
    setCancelling(true);
    try {
      await api.updateEvent(event.id, { status: "cancelled" });
      const updated = await api.getEvent(event.id);
      setEvent(updated);
      setShowCancelConfirm(false);
      toast.success("Event cancelled");
    } catch {
      setError("Failed to cancel event.");
      toast.error("Failed to cancel event.");
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
              userTicket={userTicket}
              checkingIn={checkingIn}
              onCheckin={handleCheckin}
              onUnregister={() => setShowUnregisterConfirm(true)}
              unregistering={unregistering}
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
            onCancelEvent={requestCancelEvent}
          />
        </div>
      </section>

      <ConfirmDialog
        open={showCancelConfirm}
        title="Cancel this event?"
        message="All attendees will be notified. This action cannot be undone."
        confirmText="Cancel Event"
        isDangerous={true}
        loading={cancelling}
        onConfirm={handleCancelEvent}
        onCancel={() => setShowCancelConfirm(false)}
      />

      <ConfirmDialog
        open={showUnregisterConfirm}
        title="Cancel your registration?"
        message="Your ticket will be cancelled and the spot will be released."
        confirmText="Unregister"
        isDangerous={true}
        loading={unregistering}
        onConfirm={handleUnregister}
        onCancel={() => setShowUnregisterConfirm(false)}
      />
    </div>
  );
}
