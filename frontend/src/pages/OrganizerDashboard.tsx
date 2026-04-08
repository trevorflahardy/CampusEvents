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
import { Link } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import {
  StatsGrid,
  CreateEventForm,
  DashboardSidebar,
  EventsGrid,
  LoadingSkeleton,
  StudentEventCard,
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

  // user's registered events (for "My Registered Events" section)
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);

  /* ---------- data fetching ---------- */

  /** Fetches events from the API and filters based on user role. */
  const fetchEvents = useCallback(async () => {
    try {
      const data = await api.getEvents();
      const filtered = isAdmin
        ? data
        : isOrganizer
          ? data.filter((e) => e.organizerId === user?.id)
          : data;
      setEvents(filtered);
      const catMap: Record<number, Category[]> = {};
      for (const ev of filtered) {
        catMap[ev.id] = ev.categories ?? [];
      }
      setEventCategoriesMap(catMap);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isOrganizer]);

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
      setBannerPreview(URL.createObjectURL(cropped));
    } catch {
      setFormError("Failed to process image.");
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
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError("Failed to create event.");
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
    } catch {
      setError("Failed to check in attendee.");
    } finally {
      setCheckingInTicketId(null);
    }
  };

  /** Cancels an event after user confirmation. */
  const handleCancelEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to cancel this event?")) return;
    setCancellingEventId(eventId);
    try {
      await api.updateEvent(eventId, { status: "cancelled" });
      await fetchEvents();
    } catch {
      setError("Failed to cancel event.");
    } finally {
      setCancellingEventId(null);
    }
  };

  /* ---------- derived stats ---------- */

  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => e.status === "upcoming").length;
  const totalAttendees = Object.values(attendeesMap).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  /* ---------- search filter ---------- */

  // Filter out past events (completed/cancelled) for the main grid
  const activeEvents = events.filter(
    (e) => e.status === "upcoming" || e.status === "ongoing",
  );

  const filteredEvents = searchQuery.trim()
    ? activeEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : activeEvents;

  // Events the current user is registered for
  const registeredEventIds = new Set(userTickets.map((t) => t.eventId));
  const myRegisteredEvents = activeEvents.filter((e) =>
    registeredEventIds.has(e.id),
  );

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
                  setBannerPreview(null);
                }}
                onSubmit={handleCreateEvent}
                onClose={closeForm}
              />
            )}

            {/* ---- My Registered Events (all users) ---- */}
            {myRegisteredEvents.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
                    My Registered Events
                  </h2>
                  <a
                    href="/my-tickets"
                    className="text-sm font-medium text-slate-800 dark:text-slate-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    View Tickets
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {myRegisteredEvents.map((event, index) => (
                    <StudentEventCard
                      key={event.id}
                      event={event}
                      index={index}
                      eventCategories={eventCategoriesMap[event.id] || []}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ---- Section heading + events grid ---- */}
            <EventsGrid
              filteredEvents={filteredEvents}
              isManager={isManager}
              isAdmin={isAdmin}
              isOrganizer={isOrganizer}
              searchQuery={searchQuery}
              eventCategoriesMap={eventCategoriesMap}
              attendeesMap={attendeesMap}
              expandedEvent={expandedEvent}
              cancellingEventId={cancellingEventId}
              checkingInTicketId={checkingInTicketId}
              user={user}
              organizers={organizers}
              onToggleAttendees={toggleAttendees}
              onCancelEvent={handleCancelEvent}
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
    </div>
  );
}
