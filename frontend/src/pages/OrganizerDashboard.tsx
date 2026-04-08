/**
 * OrganizerDashboard is the main dashboard page for organizers, admins, and students.
 * It composes sub-components for stats, event creation, event cards, and sidebar.
 *
 * @module pages/OrganizerDashboard
 */

import {
  useState,
  useEffect,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from "react";
import {
  api,
  ApiError,
  type Event,
  type Category,
  type Attendee,
  type User,
  type UserTicket,
} from "../lib/api";
import { useAuth } from "../context/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import DashboardHeader from "../components/DashboardHeader";
import {
  StatsGrid,
  CreateEventForm,
  DashboardSidebar,
  EventsGrid,
  LoadingSkeleton,
} from "../components/dashboard";
import { cropBannerImage } from "../components/dashboard/CreateEventForm";

/**
 * Main dashboard page component. Manages all state for events, categories,
 * attendees, and form fields, delegating rendering to sub-components.
 */
export default function OrganizerDashboard() {
  const { user, isOrganizer, isAdmin } = useAuth();
  const isManager = isOrganizer || isAdmin;
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // create-event form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // per-event categories
  const [eventCategoriesMap, setEventCategoriesMap] = useState<
    Record<number, Category[]>
  >({});
  // organizers (for admin reassignment)
  const [organizers, setOrganizers] = useState<User[]>([]);

  // attendees
  const [attendeesMap, setAttendeesMap] = useState<Record<number, Attendee[]>>(
    {},
  );
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<number | null>(
    null,
  );
  const [checkingInTicketId, setCheckingInTicketId] = useState<number | null>(
    null,
  );
  const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);

  // user's registered events (for "My Registered Events" section)
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);

  // tab state: which event view is active
  const [activeTab, setActiveTab] = useState<"my-events" | "registered" | "all">(
    isManager ? "my-events" : "all"
  );

  /* ---------- data fetching ---------- */

  /** Fetches all events from the API (filtering is done client-side by tab). */
  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
      const catMap: Record<number, Category[]> = {};
      for (const ev of data) {
        catMap[ev.id] = ev.categories ?? [];
      }
      setEventCategoriesMap(catMap);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Lock body scroll when modal is open. */
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [showForm]);

  useEffect(() => {
    api
      .getCategories()
      .then(setCategories)
      .catch(() => {});
    fetchEvents();
    if (user?.role === "admin") {
      api
        .getUsers()
        .then((users) =>
          setOrganizers(
            users.filter((u) => u.role === "organizer" || u.role === "admin"),
          ),
        )
        .catch(() => {});
    }
    if (user) {
      api
        .getUserTickets(user.id)
        .then(setUserTickets)
        .catch(() => {});
    }
  }, [fetchEvents, user]);

  /* ---------- banner handling ---------- */

  /** Handles banner file selection and auto-crops to 3:1 aspect ratio. */
  const handleBannerSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cropped = await cropBannerImage(file);
      setBannerFile(cropped);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBannerPreview(URL.createObjectURL(cropped));
    } catch {
      setFormError("Failed to process image.");
      toast.error("Failed to process image.");
    }
  };

  /** Resets all form fields to their initial values. */
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartTime("");
    setEndTime("");
    setCapacity("");
    setTicketPrice("");
    setSelectedCategoryIds([]);
    setPinLat(null);
    setPinLng(null);
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
    setFormError("");
  };

  /* ---------- create event ---------- */

  /** Handles the create-event form submission. */
  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError("");
    setSubmitting(true);

    if (!title.trim()) { setFormError("Title is required."); setSubmitting(false); return; }
    if (!location.trim()) { setFormError("Location is required."); setSubmitting(false); return; }
    if (!startTime) { setFormError("Start time is required."); setSubmitting(false); return; }
    if (!endTime) { setFormError("End time is required."); setSubmitting(false); return; }
    if (new Date(endTime) <= new Date(startTime)) { setFormError("End time must be after start time."); setSubmitting(false); return; }
    if (!capacity || Number(capacity) <= 0) { setFormError("Capacity must be a positive number."); setSubmitting(false); return; }
    if (ticketPrice && Number(ticketPrice) < 0) { setFormError("Price cannot be negative."); setSubmitting(false); return; }

    try {
      const newEvent = await api.createEvent({
        title,
        description: description || undefined,
        location,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        capacity: Number(capacity),
        ticketPrice: ticketPrice || undefined,
        organizerId: user.id,
        latitude: pinLat ?? undefined,
        longitude: pinLng ?? undefined,
      });
      if (selectedCategoryIds.length > 0) {
        await api.setEventCategories(newEvent.id, selectedCategoryIds);
      }
      if (bannerFile) {
        await api.uploadEventBanner(newEvent.id, bannerFile);
      }
      resetForm();
      setShowForm(false);
      await fetchEvents();
      toast.success("Event created successfully!");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create event.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- attendees ---------- */

  /** Toggles the attendees panel for a given event, loading data if needed. */
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

  /** Checks in an attendee by ticket ID and refreshes the attendee list. */
  const handleCheckin = async (ticketId: number, eventId: number) => {
    setCheckingInTicketId(ticketId);
    try {
      await api.checkinTicket(ticketId);
      const data = await api.getEventTickets(eventId);
      setAttendeesMap((prev) => ({ ...prev, [eventId]: data }));
      toast.success("Attendee checked in");
    } catch {
      setError("Failed to check in attendee.");
      toast.error("Failed to check in attendee.");
    } finally {
      setCheckingInTicketId(null);
    }
  };

  /** Cancels an event (called after confirmation dialog). */
  const handleCancelEvent = async (eventId: number) => {
    setCancellingEventId(eventId);
    try {
      await api.updateEvent(eventId, { status: "cancelled" });
      await fetchEvents();
      toast.success("Event cancelled");
    } catch {
      setError("Failed to cancel event.");
      toast.error("Failed to cancel event.");
    } finally {
      setCancellingEventId(null);
      setShowCancelConfirm(null);
    }
  };

  /** Wrapper that opens the cancel confirmation dialog instead of cancelling directly. */
  const requestCancelEvent = (eventId: number) => {
    setShowCancelConfirm(eventId);
  };

  /* ---------- derived stats ---------- */

  const myOwnEvents = events.filter((e) => e.organizerId === user?.id);
  const totalEvents = isManager ? myOwnEvents.length : events.length;
  const upcomingCount = (isManager ? myOwnEvents : events).filter((e) => e.status === "upcoming").length;
  const totalAttendees = Object.values(attendeesMap).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  /* ---------- tab-based filtering ---------- */

  // Filter out past events (completed/cancelled) for the main grid
  const activeEvents = events.filter(
    (e) => e.status === "upcoming" || e.status === "ongoing",
  );

  // Events the current user is registered for
  const registeredEventIds = new Set(userTickets.map((t) => t.eventId));

  // Determine base events based on the active tab
  let baseEvents: Event[];
  if (activeTab === "my-events" && isManager) {
    baseEvents = activeEvents.filter((e) => e.organizerId === user?.id);
  } else if (activeTab === "registered") {
    baseEvents = activeEvents.filter((e) => registeredEventIds.has(e.id));
  } else {
    // "all" tab — show everything
    baseEvents = activeEvents;
  }

  const filteredEvents = searchQuery.trim()
    ? baseEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : baseEvents;

  // Tab definitions
  const tabs = isManager
    ? [
        { key: "my-events" as const, label: "My Events", count: activeEvents.filter((e) => e.organizerId === user?.id).length },
        { key: "registered" as const, label: "Registered", count: activeEvents.filter((e) => registeredEventIds.has(e.id)).length },
        { key: "all" as const, label: "All Events", count: activeEvents.length },
      ]
    : [
        { key: "registered" as const, label: "Registered", count: activeEvents.filter((e) => registeredEventIds.has(e.id)).length },
        { key: "all" as const, label: "All Events", count: activeEvents.length },
      ];

  // Tickets eligible for self-check-in (30min before start → end, not checked in)
  const now = new Date();
  const checkinReadyTickets = userTickets.filter((t) => {
    if (t.checkedIn) return false;
    const start = new Date(t.eventStartTime);
    const end = new Date(t.eventEndTime);
    const windowStart = new Date(start.getTime() - 30 * 60 * 1000);
    return now >= windowStart && now <= end;
  });

  /* ---------- loading skeleton ---------- */

  if (loading) return <LoadingSkeleton />;

  /** Closes the form modal and resets fields. */
  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  /* ---------- render ---------- */

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          isManager ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`cursor-pointer rounded-full px-5 py-2.5 font-semibold text-sm transition-all duration-200 ${
                showForm
                  ? "btn-secondary"
                  : "bg-accent text-white shadow-sm hover:bg-accent-dark hover:shadow-[0_6px_24px_rgba(26,79,59,0.4)] hover:-translate-y-px active:translate-y-0"
              }`}
            >
              {showForm ? "Close" : "+ Create Event"}
            </button>
          ) : undefined
        }
      />

      {/* ---- Scrollable content area ---- */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-8 p-8">
          {/* ---- Left: main content ---- */}
          <div className="flex-1 min-w-0">
            {/* ---- error banner ---- */}
            {error && (
              <div
                role="alert"
                className="glass rounded-2xl p-4 border-l-4 border-l-red-400 mb-6 animate-fade-in"
              >
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* ---- Check-in banners ---- */}
            {checkinReadyTickets.length > 0 && (
              <div className="space-y-3 mb-6 animate-fade-in">
                {checkinReadyTickets.map((ticket) => (
                  <Link
                    key={ticket.ticketId}
                    to={`/events/${ticket.eventId}`}
                    state={{ from: "dashboard" }}
                    className="flex items-center gap-4 glass-heavy rounded-2xl p-4 border-l-4 border-l-emerald-500 hover-lift cursor-pointer transition-all"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
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
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {ticket.eventTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Check-in is open — tap to check in now
                      </p>
                    </div>
                    <span className="shrink-0 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full">
                      Check In
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* ---- Stats grid ---- */}
            <StatsGrid
              isManager={isManager}
              totalEvents={totalEvents}
              upcomingCount={upcomingCount}
              totalAttendees={totalAttendees}
              events={events}
            />

            {/* ---- create event modal (managers only) ---- */}
            {isManager && showForm && (
              <CreateEventForm
                formError={formError}
                submitting={submitting}
                title={title}
                description={description}
                location={location}
                startTime={startTime}
                endTime={endTime}
                capacity={capacity}
                ticketPrice={ticketPrice}
                selectedCategoryIds={selectedCategoryIds}
                pinLat={pinLat}
                pinLng={pinLng}
                bannerPreview={bannerPreview}
                categories={categories}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onLocationChange={setLocation}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onCapacityChange={setCapacity}
                onTicketPriceChange={setTicketPrice}
                onSelectedCategoryIdsChange={setSelectedCategoryIds}
                onPinLatChange={setPinLat}
                onPinLngChange={setPinLng}
                onBannerSelect={handleBannerSelect}
                onBannerRemove={() => {
                  setBannerFile(null);
                  if (bannerPreview) URL.revokeObjectURL(bannerPreview);
                  setBannerPreview(null);
                }}
                onSubmit={handleCreateEvent}
                onClose={closeForm}
              />
            )}

            {/* ---- Tab navigation ---- */}
            <div className="mb-6">
              <div className="flex items-center gap-1 glass-subtle rounded-full p-1 w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                      activeTab === tab.key
                        ? "bg-[#1a4f3b] text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                        activeTab === tab.key
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ---- Section heading + events grid ---- */}
            <EventsGrid
              filteredEvents={filteredEvents}
              isManager={isManager}
              isAdmin={isAdmin}
              isOrganizer={isOrganizer}
              searchQuery={searchQuery}
              activeTab={activeTab}
              eventCategoriesMap={eventCategoriesMap}
              attendeesMap={attendeesMap}
              expandedEvent={expandedEvent}
              cancellingEventId={cancellingEventId}
              checkingInTicketId={checkingInTicketId}
              user={user}
              organizers={organizers}
              onToggleAttendees={toggleAttendees}
              onCancelEvent={requestCancelEvent}
              onCheckin={handleCheckin}
              onCreateEvent={() => setShowForm(true)}
            />
          </div>
          {/* end left column */}

          {/* ---- Right sidebar ---- */}
          <DashboardSidebar
            events={events}
            isManager={isManager}
            onCreateEvent={() => setShowForm(true)}
          />
        </div>
        {/* end flex row */}
      </div>
      {/* end scrollable area */}

      <ConfirmDialog
        open={showCancelConfirm !== null}
        title="Cancel this event?"
        message="All attendees will be notified. This action cannot be undone."
        confirmText="Cancel Event"
        isDangerous={true}
        loading={cancellingEventId !== null}
        onConfirm={() => { if (showCancelConfirm !== null) handleCancelEvent(showCancelConfirm); }}
        onCancel={() => setShowCancelConfirm(null)}
      />
    </div>
  );
}
