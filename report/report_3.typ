// ============================================================
// CampusEvents --- Final Report
// COP 4710 Spring 2026 --- Due May 1, 2026
// ============================================================

// ── Page Setup ───────────────────────────────────────────────
#set page(
  paper: "us-letter",
  margin: (top: 1in, bottom: 1in, left: 1.1in, right: 1.1in),
  header: context {
    set text(size: 8pt, fill: luma(120))
    smallcaps[CampusEvents --- Campus Event & Ticket Booking System]
    h(1fr)
    [COP 4710 · Spring 2026]
    v(-0.55em)
    line(length: 100%, stroke: 0.4pt + luma(180))
  },
  footer: context {
    line(length: 100%, stroke: 0.4pt + luma(180))
    v(-0.5em)
    set text(size: 8pt, fill: luma(130))
    [Flahardy, Cobo]
    h(1fr)
    [Page #counter(page).display("1 of 1", both: true)]
  },
)

// ── Fletcher (architecture diagram) ─────────────────────────
#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node

// ── Global Typography ────────────────────────────────────────
#set text(font: "Linux Libertine", size: 11pt, fill: luma(20))
#set par(justify: true, leading: 0.7em, spacing: 1.2em)
#set heading(numbering: "1.")

#show heading.where(level: 1): it => {
  v(1.4em)
  text(size: 13pt, weight: "bold")[#it]
  v(-0.3em)
  line(length: 100%, stroke: 0.5pt + luma(180))
  v(0.4em)
}
#show heading.where(level: 2): it => {
  v(0.8em)
  text(size: 11pt, weight: "bold", style: "italic")[#it]
  v(0.15em)
}

// Inline code
#show raw.where(block: false): it => box(
  fill: luma(240),
  inset: (x: 3pt, y: 1pt),
  radius: 2pt,
  text(font: "Liberation Mono", size: 9.5pt)[#it],
)

// Code blocks
#show raw.where(block: true): it => {
  v(0.5em)
  block(
    width: 100%,
    fill: luma(248),
    stroke: (left: 2pt + luma(160)),
    inset: (left: 12pt, right: 10pt, top: 8pt, bottom: 8pt),
    radius: (right: 3pt),
    text(font: "Liberation Mono", size: 9pt)[#it],
  )
  v(0.5em)
}

// ── Table Defaults ───────────────────────────────────────────
#set table(
  stroke: 0.4pt + luma(180),
  inset: (x: 8pt, y: 6pt),
)
#show table.cell.where(y: 0): set text(weight: "bold", size: 10pt)
#show table.cell.where(y: 0): set table.cell(fill: luma(230))

// ── Helpers ──────────────────────────────────────────────────
#let note(body) = block(
  width: 100%,
  fill: luma(250),
  stroke: (left: 2pt + luma(170)),
  inset: (left: 10pt, right: 8pt, top: 5pt, bottom: 5pt),
  text(size: 9.5pt, fill: luma(60), style: "italic")[#body],
)

#let status-ok = text(fill: rgb("#0a7a3b"), weight: "bold")[#sym.checkmark]

// ============================================================
// TITLE BLOCK
// ============================================================

#v(1em)
#align(center)[
  #text(size: 26pt, weight: "bold")[CampusEvents]
  #linebreak()
  #v(0.1em)
  #text(size: 13pt, style: "italic", fill: luma(60))[Campus Event & Ticket Booking System]
  #v(0.6em)
  #text(size: 10pt, fill: luma(80))[
    COP 4710 --- Database Systems #sym.space.quad
    University of South Florida #sym.space.quad
    Spring 2026
  ]
  #v(0.4em)
  #line(length: 60%, stroke: 0.6pt + luma(160))
  #v(0.2em)
  #text(size: 10pt)[*Final Report* #sym.dash.em Due May 1, 2026]
]
#v(1.5em)

#outline()
#pagebreak()

// ============================================================
// 1. TEAM ROSTER
// ============================================================

= Team Roster

This report is the final submission for the CampusEvents term project. It is submitted by the two-person team listed below. Per Dr. Tu's course guidelines, two-person groups carry the same deliverable expectations as a three-person group, and the scope of CampusEvents reflects that.

#v(0.5em)
#table(
  columns: (1.5fr, 2fr, 1fr),
  align: left,
  table.header[Name][Email][Role],
  [Trevor Flahardy], [trevorflahardy\@usf.edu], [Developer],
  [Sofia Cobo Navas], [scobonavas\@usf.edu], [Developer],
)

// ============================================================
// 2. SYSTEM OVERVIEW
// ============================================================

= System Overview

CampusEvents is a web-based enterprise information system for managing campus events at a university. The platform serves three distinct user roles: *students*, who browse events and register for them; *organizers*, who create and manage them; and *administrators*, who control the entire system --- users, events, and categories. The core design goal is a centralized, queryable system that replaces ad-hoc flyers and scattered email announcements.

The system follows a standard three-tier architecture. The *interface tier* is a React 19 single-page application built with Vite, styled with Tailwind CSS v4. The *application tier* is a TypeScript REST API running on the Bun runtime via the Hono framework. The *data tier* is a PostgreSQL 16 relational database, accessed through the `postgres.js` driver using raw parameterized SQL --- no ORM is used at any layer, per course requirements.

#v(0.4em)
#table(
  columns: (auto, 1.9fr, 1fr, 2fr),
  align: left,
  table.header[Tier][Technology][Port][Responsibility],
  [Interface], [React 19 + Vite + Tailwind CSS v4], [`:5173`], [Rendering, routing, client-side state],
  [Application], [Bun + Hono (TypeScript REST API)], [`:3000`], [Validation, auth, SQL via `postgres.js`],
  [Data], [PostgreSQL 16 (Docker)], [`:5432`], [Storage, constraints, referential integrity],
)

#v(0.6em)
#figure(
  diagram(
    spacing: (30mm, 11mm),
    node-stroke: 0.6pt,
    node-fill: luma(248),
    node-corner-radius: 3pt,
    node(
      (0, 0),
      [*Browser*\ #text(size: 8pt, fill: luma(100))[React 19 SPA\ `localhost:5173`]],
      width: 38mm,
      height: 16mm,
    ),
    node(
      (1, 0),
      [*REST API*\ #text(size: 8pt, fill: luma(100))[Bun + Hono\ `localhost:3000`]],
      width: 38mm,
      height: 16mm,
    ),
    node(
      (2, 0),
      [*Database*\ #text(size: 8pt, fill: luma(100))[PostgreSQL 16\ `localhost:5432`]],
      width: 38mm,
      height: 16mm,
    ),
    edge((0, 0), (1, 0), "->", [`fetch` / JSON], label-pos: 0.5, label-side: center),
    edge((1, 0), (2, 0), "->", [`postgres.js` / SQL], label-pos: 0.5, label-side: center),
    edge((1, 0), (0, 0), "->", [JSON], label-pos: 0.5, label-side: center, bend: 30deg),
    edge((2, 0), (1, 0), "->", [rows], label-pos: 0.5, label-side: center, bend: 30deg),
  ),
  caption: [Three-tier architecture --- the React SPA issues `fetch` calls to the Hono REST API, which sends parameterized SQL to PostgreSQL via the `postgres.js` driver.],
)

#note[
  `postgres.js` serves as the JDBC/ODBC equivalent in this stack: a lightweight PostgreSQL client for JavaScript that sends parameterized SQL directly to the database using tagged template literals (e.g., `` sql`SELECT * FROM users WHERE id = ${id}` ``). All user-supplied values are automatically escaped, preventing SQL injection at the driver level.
]

// ============================================================
// 3. DATABASE DESIGN
// ============================================================

= Database Design

== ER Diagram

The entity-relationship diagram below represents the conceptual data model for CampusEvents. The physical schema implements five of the six entities directly; the sixth (`images`) is a supporting table for uploaded media storage.

#figure(
  image("schema_diagram.png", alt: "ER Diagram for CampusEvents"),
  caption: [ER diagram for CampusEvents --- entity sets, attributes, and cardinality annotations. The `images` table is omitted from the ER diagram as it is a supporting storage relation with no direct business-logic relationships.],
)

== Tables & Attributes

*USERS* --- Represents every account in the system. The `role` enum determines what the account can do: `student` accounts browse and register; `organizer` accounts create and manage events; `admin` accounts have full system access including role assignment and category management. Passwords are stored exclusively as bcrypt hashes; plaintext is never persisted.

#table(
  columns: (1.1fr, 1.3fr, 1.4fr, 1.7fr),
  align: left,
  table.header[Attribute][Type][Constraint][Notes],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`], [Auto-incremented surrogate key],
  [`net_id`], [`VARCHAR(50)`], [`NOT NULL, UNIQUE`], [University NetID (e.g., `jsmith22`)],
  [`name`], [`VARCHAR(100)`], [`NOT NULL`], [Full display name],
  [`email`], [`VARCHAR(150)`], [`NOT NULL, UNIQUE`], [University email address],
  [`password_hash`], [`TEXT`], [`NOT NULL`], [bcrypt hash; plaintext never stored],
  [`role`], [`user_role`], [`DEFAULT 'student'`], [`admin` | `organizer` | `student`],
  [`profile_photo`], [`TEXT`], [nullable], [URL path to uploaded avatar],
  [`created_at`], [`TIMESTAMP`], [`DEFAULT NOW()`], [Account creation timestamp],
)

#v(0.8em)
*EVENTS* --- The central entity of the system. Every event has a designated organizer (FK to USERS), a time range, a physical venue, and a capacity ceiling. The `status` enum drives filtering across the UI; its value is computed at query time from the event's dates rather than stored statically, so completed events update automatically without a background job. Two additional fields, `latitude` and `longitude`, store GPS coordinates for the Mapbox map preview.

#table(
  columns: (1.2fr, 1.4fr, 1.4fr, 1.5fr),
  align: left,
  table.header[Attribute][Type][Constraint][Notes],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`], [Auto-incremented surrogate key],
  [`title`], [`VARCHAR(200)`], [`NOT NULL`], [Event display name],
  [`description`], [`TEXT`], [nullable], [Optional long-form description],
  [`location`], [`VARCHAR(200)`], [`NOT NULL`], [Venue name or address string],
  [`start_time`], [`TIMESTAMP`], [`NOT NULL`], [Event start date and time],
  [`end_time`], [`TIMESTAMP`], [`NOT NULL`], [`CHECK` enforces `end_time > start_time`],
  [`capacity`], [`INTEGER`], [`CHECK > 0`], [Maximum attendee count],
  [`ticket_price`], [`NUMERIC(10,2)`], [`DEFAULT 0.00, CHECK >= 0`], [`0.00` denotes a free event],
  [`status`], [`event_status`], [`DEFAULT 'upcoming'`], [`upcoming` | `ongoing` | `completed` | `cancelled`],
  [`organizer_id`], [`INTEGER`], [`FK → USERS.id`], [References the event creator],
  [`banner_url`], [`TEXT`], [nullable], [URL path to uploaded banner image],
  [`latitude`], [`DOUBLE PRECISION`], [nullable], [GPS latitude for map pin],
  [`longitude`], [`DOUBLE PRECISION`], [nullable], [GPS longitude for map pin],
  [`created_at`], [`TIMESTAMP`], [`DEFAULT NOW()`], [Record insertion timestamp],
)

#v(0.8em)
*TICKETS* --- A ticket represents a confirmed booking between a user and an event. The composite `UNIQUE(user_id, event_id)` constraint enforces the one-ticket-per-user-per-event business rule at the schema level --- if a student tries to purchase a second ticket for the same event, PostgreSQL raises error `23505` and the API returns `409 Conflict`. Each ticket carries a short alphanumeric `confirmation_code` displayed to the user and used for check-in.

#table(
  columns: (1.5fr, 1.1fr, 1.6fr, 1.4fr),
  align: left,
  table.header[Attribute][Type][Constraint][Notes],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`], [Auto-incremented surrogate key],
  [`user_id`], [`INTEGER`], [`FK → USERS.id`], [References the ticket holder],
  [`event_id`], [`INTEGER`], [`FK → EVENTS.id`], [References the booked event],
  [`purchased_at`], [`TIMESTAMP`], [`DEFAULT NOW()`], [Booking timestamp],
  [`checked_in`], [`BOOLEAN`], [`DEFAULT FALSE`], [Toggled `TRUE` on event entry],
  [`confirmation_code`], [`VARCHAR(20)`], [`UNIQUE`], [Short alphanumeric booking code],
  [(`user_id`, `event_id`)], [---], [`UNIQUE` composite], [Prevents duplicate bookings],
)

#v(0.8em)
*CATEGORIES* --- A lookup table of event tags. The schema seeds seven default categories (Academic, Music, Sports, Career, Social, Arts, Technology) using `ON CONFLICT DO NOTHING`, making the file idempotent across restarts. Admins may add categories at runtime.

*EVENT\_CATEGORIES* --- Resolves the many-to-many relationship between EVENTS and CATEGORIES. The composite primary key `(event_id, category_id)` ensures each pairing is unique, and `ON DELETE CASCADE` on both foreign keys keeps the join table clean automatically.

*IMAGES* --- Stores uploaded event banners and user profile photos as base-64 data directly in the database rather than on the file system. This design choice means media survives container restarts, branch switches, and fresh clones without any external file-server configuration.

#table(
  columns: (1fr, 1fr, 1.2fr, 1.5fr),
  align: left,
  table.header[Attribute][Type][Constraint][Notes],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`], [],
  [`filename`], [`TEXT`], [`NOT NULL, UNIQUE`], [Generated name used as the URL key],
  [`mime_type`], [`TEXT`], [`NOT NULL`], [`image/jpeg`, `image/png`, etc.],
  [`data`], [`TEXT`], [`NOT NULL`], [Base-64-encoded binary data],
  [`created_at`], [`TIMESTAMP`], [`DEFAULT NOW()`], [],
)

== Relationship Sets

#table(
  columns: (1fr, 1.15fr, 1.1fr, 0.8fr, 2.6fr),
  align: left,
  table.header[Entity A][Entity B][Name][Cardinality][Description],
  [USERS],
  [EVENTS],
  [_organizes_],
  [1 : N],
  [An organizer may create many events; each event has exactly one organizer],

  [USERS], [TICKETS], [_books_], [1 : N], [A student may hold tickets to many events; each ticket belongs to one user],
  [EVENTS], [TICKETS], [_has_], [1 : N], [An event may have many tickets; each ticket corresponds to exactly one event],
  [EVENTS],
  [CATEGORIES],
  [_tagged with_],
  [M : N],
  [Resolved via EVENT\_CATEGORIES; an event may belong to multiple categories],
)

== Constraints & Indexes

The following business rules are enforced at the schema level, independent of application behavior:

- `CHECK (end_time > start_time)` --- Prevents events from being inserted with an inverted time range.
- `CHECK (capacity > 0)` --- Every event must allow at least one attendee.
- `CHECK (ticket_price >= 0)` --- Prevents negative ticket prices.
- `UNIQUE (user_id, event_id)` on TICKETS --- One ticket per user per event; violation raises SQL state `23505`.
- `UNIQUE (organizer_id, title, start_time)` on EVENTS --- Prevents duplicate events from the same organizer at the same time; also the target of seed data's `ON CONFLICT` clause.
- `ON DELETE CASCADE` on TICKETS and EVENT\_CATEGORIES --- Deleting a user or event automatically removes all dependent ticket and category-link rows.

Five indexes support the most common query patterns:

#table(
  columns: (1.8fr, 1.5fr, 2.5fr),
  align: left,
  table.header[Index][Column(s)][Query it accelerates],
  [`idx_events_status`], [`events(status)`], [Filter upcoming / ongoing events on every page load],
  [`idx_events_organizer`], [`events(organizer_id)`], [Organizer dashboard event list],
  [`idx_events_start_time`], [`events(start_time)`], [Date-range filtering (Q10 `BETWEEN`)],
  [`idx_tickets_user`], [`tickets(user_id)`], [My Tickets page --- Q4 multi-JOIN],
  [`idx_tickets_event`], [`tickets(event_id)`], [Attendee list per event, capacity subquery],
)

== Views

Two SQL views are defined in `schema.sql` using `CREATE OR REPLACE VIEW`, making them idempotent across every backend restart. They provide role-scoped projections of the underlying tables --- a public-facing browse surface and an organizer-facing aggregation.

*`v_upcoming_events`* --- Joins EVENTS with USERS and pre-filters to `status = 'upcoming'`. Exposes organizer name and email alongside event fields while hiding internal columns such as `organizer_id` and `created_at` that are irrelevant to a browsing student.

*`v_event_stats`* --- Aggregates ticket counts per event using `GROUP BY` and `COUNT(*)` over the EVENTS-TICKETS join. This view is queried directly by `GET /api/events/stats`, which powers the organizer dashboard's stat cards.

```sql
-- v_upcoming_events: public browse projection (student-facing)
CREATE OR REPLACE VIEW v_upcoming_events AS
    SELECT e.id, e.title, e.description, e.location,
           e.start_time, e.end_time, e.capacity, e.ticket_price,
           e.status, e.banner_url, e.latitude, e.longitude,
           u.name  AS organizer_name,
           u.email AS organizer_email
    FROM events e
    INNER JOIN users u ON e.organizer_id = u.id
    WHERE e.status = 'upcoming'
    ORDER BY e.start_time;

-- v_event_stats: organizer ticket-sales summary (organizer-facing)
CREATE OR REPLACE VIEW v_event_stats AS
    SELECT e.id           AS event_id,
           e.title,       e.status,    e.capacity,
           e.ticket_price, e.end_time, e.organizer_id,
           u.name         AS organizer_name,
           COUNT(t.id)::int               AS tickets_sold,
           (e.capacity - COUNT(t.id)::int) AS spots_remaining
    FROM events e
    INNER JOIN users u ON e.organizer_id = u.id
    LEFT  JOIN tickets t ON e.id = t.event_id
    GROUP BY e.id, e.title, e.status, e.capacity,
             e.ticket_price, e.end_time, e.organizer_id, u.name;
```

The `GET /api/events/stats` route queries `v_event_stats` directly:

```ts
// routes/events.ts --- stats endpoint backed by the view
const rows = await sql`
  SELECT event_id, title, status, capacity, tickets_sold, spots_remaining
  FROM v_event_stats
  WHERE status != 'cancelled' AND end_time >= ${now}
`;
```

== Stored Function

`check_event_capacity(p_event_id INTEGER)` is a PL/pgSQL function that returns a single row containing the event's capacity, current ticket count, spots remaining, and an `is_available` boolean. It is declared `STABLE` because it reads but does not modify data. The function is called inside the ticket purchase transaction --- after the `SELECT ... FOR UPDATE` row lock is acquired --- to atomically determine whether the event can still accept a registration.

```sql
CREATE OR REPLACE FUNCTION check_event_capacity(p_event_id INTEGER)
RETURNS TABLE (
    event_id        INTEGER,
    title           VARCHAR,
    capacity        INTEGER,
    tickets_sold    BIGINT,
    spots_remaining BIGINT,
    is_available    BOOLEAN
) LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
        SELECT e.id, e.title, e.capacity,
               COUNT(t.id),
               (e.capacity - COUNT(t.id)),
               (e.capacity - COUNT(t.id)) > 0
        FROM events e
        LEFT JOIN tickets t ON e.id = t.event_id
        WHERE e.id = p_event_id
        GROUP BY e.id, e.title, e.capacity;
END;
$$;
```

// ============================================================
// 4. MAIN FUNCTIONALITIES
// ============================================================

= Main Functionalities

== Student

Students are the primary users of the platform. After registering with a university email and NetID, a student can:

- *Browse events* --- Search by keyword (case-insensitive `ILIKE`), filter by category, filter by date range, and sort by date or title. All event statuses are visible.
- *View event detail* --- See the full event description, venue, time range, ticket price, and real-time remaining capacity computed by `check_event_capacity`.
- *Book a ticket* --- Click "Book Ticket" on any upcoming event with capacity remaining. The backend issues a `SELECT ... FOR UPDATE` + `INSERT` transaction and returns a unique confirmation code.
- *Manage bookings* --- The My Tickets page lists all bookings with confirmation codes and check-in status. Students can cancel a ticket or self-check-in during the 30-minute window before the event starts through its end time.
- *Edit profile* --- Update display name, email, and upload a profile photo stored in the `images` table.

== Organizer

Organizers create and manage events. The Organizer Dashboard provides:

- *Stats overview* --- Stat cards show total events created, upcoming event count, and total attendees checked in, drawn from `v_event_stats`.
- *Create an event* --- A full creation form collects title, description, location, time range, capacity, ticket price, and one or more categories. An optional Mapbox GL JS map picker lets the organizer drop a GPS pin, which renders as an interactive map preview on the event detail page. A banner image can be uploaded.
- *Edit events* --- Any field of an owned event can be updated; changes issue a dynamic `UPDATE` with only the changed fields.
- *Cancel an event* --- Sets `status = 'cancelled'` via a targeted `UPDATE`.
- *View attendees* --- The attendee panel lists all ticket holders with name, email, check-in status, and confirmation code.

== Administrator

Admins have unrestricted access via the Admin Panel:

- *User management* --- View all registered accounts. Promote or demote any user's role in real time via an inline dropdown (issues `PATCH /api/users/:id/role`).
- *Event management* --- Full CRUD over all events in the system, regardless of organizer ownership.
- *Category management* --- Create and delete event categories.
- *All organizer capabilities* --- Admins can create and manage events on behalf of any organizer.

// ============================================================
// 5. INTERFACE PAGES
// ============================================================

= Interface Pages

The frontend ships eight routed pages, well above the three-page minimum. Routing is managed by `react-router-dom` v7; protected routes redirect unauthenticated users to `/login`. The UI uses a glassmorphism design system with a deep-green brand color, and supports full light and dark mode.

#table(
  columns: (1.6fr, 1fr, 2.7fr),
  align: left,
  table.header[Page (in `frontend/src/pages/`)][Route][Purpose],
  [`Landing.tsx`], [`/`], [Public landing page with live event count and feature summary],
  [`Login.tsx`], [`/login`], [JWT-based sign-in form],
  [`Register.tsx`], [`/register`], [Account creation; role defaults to `student`],
  [`BrowseEvents.tsx`], [`/events`], [Event discovery: keyword search, category filter, date range, status filter],
  [`EventDetail.tsx`], [`/events/:id`], [Full event info, real-time remaining capacity, Book Ticket action],
  [`MyTickets.tsx`], [`/my-tickets`], [Student's active bookings with confirmation codes and check-in control],
  [`OrganizerDashboard.tsx`], [`/dashboard`], [Create, edit, and cancel events; attendee list; ticket stats],
  [`AdminPanel.tsx`], [`/admin`], [System management: users, events, categories, role assignment],
)

#figure(
  image("screenshots/landing.png", alt: "Landing page"),
  caption: [*Landing* (`/`) --- public hero section. The active-event count and total capacity figures are fetched live from `GET /api/events` on every page load, pulling real data from the database.],
)

#figure(
  image("screenshots/browse_events.png", alt: "Browse Events"),
  caption: [*Browse Events* (`/events`) --- event grid backed by `GET /api/events`. Keyword search uses `ILIKE`, category filter JOINs through EVENT\_CATEGORIES, date range uses `BETWEEN`, and status filter applies a `WHERE` clause --- all composed server-side.],
)

#figure(
  image("screenshots/event_detail.png", alt: "Event Detail"),
  caption: [*Event Detail* (`/events/:id`) --- full event info with a real-time remaining-capacity counter. Capacity is computed by the `check_event_capacity` stored function. The Book Ticket button triggers the `SELECT ... FOR UPDATE` + `INSERT` transaction.],
)

#figure(
  image("screenshots/my_tickets.png", alt: "My Tickets"),
  caption: [*My Tickets* (`/my-tickets`) --- authenticated student's bookings. Each card shows the unique confirmation code, check-in status, and full event info joined across TICKETS, EVENTS, and CATEGORIES.],
)

#figure(
  image("screenshots/organizer_dashboard.png", alt: "Organizer Dashboard"),
  caption: [*Organizer Dashboard* (`/dashboard`) --- stat cards and event grid. Ticket totals come from the `v_event_stats` view. The All Events tab shows every event in the system; the "+ Create Event" button opens a full creation form with an optional Mapbox map picker.],
)

#figure(
  image("screenshots/admin_panel.png", alt: "Admin Panel"),
  caption: [*Admin Panel* (`/admin`) --- full user directory with inline role dropdowns. Selecting a new role immediately issues `PATCH /api/users/:id/role`; the change takes effect on the target user's next login. The Events and Categories tabs provide full system-wide CRUD.],
)

// ============================================================
// 6. SQL QUERY IMPLEMENTATION
// ============================================================

= SQL Query Implementation

All ten distinct SQL query types are implemented as live REST endpoints driving real UI features. Every query is issued through `postgres.js` tagged template literals, which parameterize all user-supplied values automatically. The table below maps each query type to its handler file and the page that exercises it.

#table(
  columns: (auto, 1.5fr, 2fr, 1.8fr),
  align: left,
  table.header[\#][Query Type][Endpoint (handler)][UI Caller],
  [Q1], [`SELECT + JOIN`], [`GET /api/events` \ `routes/events.ts`], [`BrowseEvents.tsx`],
  [Q2], [`GROUP BY + COUNT`], [`GET /api/events/stats` \ `routes/events.ts`], [`OrganizerDashboard.tsx`],
  [Q3], [`SELECT + subquery`], [`GET /api/events/:id` \ `routes/events.ts`], [`EventDetail.tsx`],
  [Q4], [`SELECT + multi-JOIN`], [`GET /api/tickets/user/:id` \ `routes/tickets.ts`], [`MyTickets.tsx`],
  [Q5], [`INSERT` (transaction)], [`POST /api/tickets` \ `routes/tickets.ts`], [`EventDetail.tsx`],
  [Q6], [`UPDATE`], [`PATCH /api/tickets/:id/checkin` \ `routes/tickets.ts`], [`MyTickets.tsx`],
  [Q7], [`UPDATE`], [`PATCH /api/events/:id` \ `routes/events.ts`], [`OrganizerDashboard.tsx`],
  [Q8], [`DELETE`], [`DELETE /api/tickets/:id` \ `routes/tickets.ts`], [`MyTickets.tsx`],
  [Q9], [`SELECT + HAVING`], [`GET /api/categories/popular` \ `routes/categories.ts`], [`BrowseEvents.tsx`],
  [Q10], [`SELECT + BETWEEN`], [`GET /api/events?from=&to=` \ `routes/events.ts`], [`BrowseEvents.tsx`],
)

== Q1 + Q10: Events List with JOIN and Date Filtering

The browse endpoint dynamically composes a `WHERE` clause from optional query parameters. Each condition is a safe tagged-template fragment; they are reduced with `AND` to form the full predicate.

```ts
// routes/events.ts --- GET /api/events
const conditions = [sql`TRUE`];
// Q10: BETWEEN-style date filtering via >= / <=
if (from) conditions.push(sql`e.start_time >= ${new Date(from)}`);
if (to)   conditions.push(sql`e.start_time <= ${new Date(to)}`);
if (search) conditions.push(sql`e.title ILIKE ${"%" + search + "%"}`);
const where = conditions.reduce((a, c) => sql`${a} AND ${c}`);

// Q1: SELECT with JOIN --- events with organizer name
const rows = await sql`
  SELECT e.id, e.title, e.description, e.location,
         e.start_time, e.end_time, e.capacity, e.ticket_price,
         e.status, e.banner_url, e.latitude, e.longitude,
         u.name AS organizer_name
  FROM events e
  INNER JOIN users u ON e.organizer_id = u.id
  WHERE ${where}
  ORDER BY e.start_time
`;
```

When a category filter is active, a second `INNER JOIN` through `event_categories` restricts results to that category.

== Q2: Ticket Sales Aggregation (via View)

The stats endpoint queries `v_event_stats`, which pre-aggregates `tickets_sold` and `spots_remaining` using `GROUP BY + COUNT` on the underlying EVENTS-TICKETS join. Using the view keeps the route lean and demonstrates the database-side view bonus feature.

```ts
// routes/events.ts --- GET /api/events/stats
const rows = await sql`
  SELECT event_id, title, status, capacity, tickets_sold, spots_remaining
  FROM v_event_stats
  WHERE status != 'cancelled' AND end_time >= ${now}
`;
```

== Q3: Remaining Capacity via Correlated Subquery

The event detail endpoint computes `spots_remaining` inline using a correlated subquery against the TICKETS table. This gives an accurate real-time count without a separate query round-trip.

```ts
// routes/events.ts --- GET /api/events/:id
const rows = await sql`
  SELECT e.id, e.title, e.description, e.location,
         e.start_time, e.end_time, e.capacity, e.ticket_price,
         e.status, e.banner_url, e.latitude, e.longitude,
         u.name AS organizer_name,
         (e.capacity - (SELECT COUNT(*)::int FROM tickets WHERE event_id = e.id))
           AS spots_remaining
  FROM events e
  INNER JOIN users u ON e.organizer_id = u.id
  WHERE e.id = ${id}
`;
```

== Q4: Multi-JOIN Ticket History

The My Tickets endpoint joins TICKETS with EVENTS in one query, then batch-fetches all associated categories in a second query using `ANY(array)` to avoid an N+1 pattern. Results are merged in application code before returning.

```ts
// routes/tickets.ts --- GET /api/tickets/user/:userId
const rows = await sql`
  SELECT t.id AS ticket_id, t.purchased_at, t.checked_in, t.confirmation_code,
         e.id AS event_id, e.title AS event_title, e.location AS event_location,
         e.start_time AS event_start_time, e.end_time AS event_end_time,
         e.status AS event_status, e.ticket_price
  FROM tickets t
  INNER JOIN events e ON t.event_id = e.id
  WHERE t.user_id = ${userId}
  ORDER BY e.start_time
`;

// Batch-fetch categories for all event IDs in one shot (avoids N+1)
const categoryRows = await sql`
  SELECT ec.event_id, c.id, c.name
  FROM categories c
  INNER JOIN event_categories ec ON c.id = ec.category_id
  WHERE ec.event_id = ANY(${eventIds})
`;
```

== Q5: Ticket Purchase (INSERT with Transaction + Stored Function)

The ticket purchase flow wraps the capacity check and INSERT in a single database transaction with a row-level lock on the event. The `SELECT ... FOR UPDATE` blocks any concurrent purchaser until this transaction commits, so the ticket count read by `check_event_capacity` is authoritative at insert time --- the mechanism that actually prevents oversell under concurrent requests.

```ts
// routes/tickets.ts --- POST /api/tickets
const outcome = await sql.begin(async (tx) => {
  // Lock the event row to serialize concurrent purchase attempts
  const [event] = await tx`
    SELECT id, capacity, status FROM events WHERE id = ${eventId} FOR UPDATE
  `;
  if (!event)                    return { kind: "not_found" };
  if (event.status === "cancelled") return { kind: "cancelled" };

  // Stored function checks current capacity within the held lock
  const [cap] = await tx`SELECT * FROM check_event_capacity(${eventId})`;
  if (!cap || !cap.isAvailable)  return { kind: "sold_out" };

  // Q5: INSERT new ticket and return the created row
  const [inserted] = await tx`
    INSERT INTO tickets (user_id, event_id, confirmation_code)
    VALUES (${userId}, ${eventId}, ${confirmationCode})
    RETURNING *
  `;
  return { kind: "ok", ticket: inserted };
});
```

== Q6–Q8: State-Modifying Queries

```ts
// Q6: UPDATE --- check in a ticket (toggle boolean flag)
const [updated] = await sql`
  UPDATE tickets SET checked_in = TRUE WHERE id = ${id} RETURNING *
`;

// Q7: UPDATE --- cancel or edit an event (dynamic SET clause)
// sql() helper maps a plain object's keys to SQL column names safely
const [updated] = await sql`
  UPDATE events
  SET ${sql(updates, ...Object.keys(updates))}
  WHERE id = ${id}
  RETURNING *
`;

// Q8: DELETE --- cancel (remove) a ticket
const deleted = await sql`DELETE FROM tickets WHERE id = ${id} RETURNING *`;
```

== Q9: Popular Categories (HAVING)

```ts
// routes/categories.ts --- GET /api/categories/popular
const rows = await sql`
  SELECT c.id AS category_id, c.name,
         COUNT(ec.event_id)::int AS event_count
  FROM categories c
  INNER JOIN event_categories ec ON c.id = ec.category_id
  GROUP BY c.id, c.name
  HAVING COUNT(ec.event_id) > 1
`;
```

// ============================================================
// 7. AUTHENTICATION & AUTHORIZATION
// ============================================================

= Authentication & Authorization

User accounts with userID/password are implemented as bonus feature 1. Passwords are hashed with bcrypt (`@node-rs/bcrypt`, cost factor 10) on registration and verified on login. A successful login returns a JWT signed with `HS256` containing the user's `id` and `role`. The token is stored in `localStorage` on the client and attached to subsequent requests via `Authorization: Bearer`.

All protected routes pass through `authMiddleware` at `backend/src/middleware/auth.ts`, which verifies the token and injects `userId` and `userRole` into the request context. A `requireRole(...)` factory then gates individual routes to specific roles.

```ts
// middleware/auth.ts
export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer "))
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  const payload = await verify(header.slice(7), JWT_SECRET, "HS256");
  c.set("userId",   payload.sub  as number);
  c.set("userRole", payload.role as string);
  await next();
}

export function requireRole(...roles: string[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    if (!roles.includes(c.get("userRole")))
      return c.json({ error: "Forbidden" }, 403);
    await next();
  };
}
```

Role enforcement is applied at the route level: `POST /api/events` requires `organizer` or `admin`; `PATCH /api/users/:id/role` and `GET /api/users` require `admin`; organizers may only modify their own events (ownership verified with `SELECT WHERE organizer_id = $userId` before any mutation). Every write endpoint additionally validates its request body with a Zod schema before any SQL executes, so the database never receives malformed input.

// ============================================================
// 8. HOW TO RUN
// ============================================================

= How to Run

The entire stack boots with one command from the project root:

```bash
docker compose up
```

Docker Compose starts three containers --- `campusevents_db` (PostgreSQL 16), `campusevents_api` (Bun + Hono), and `campusevents_web` (React + Vite). On startup, the backend applies `schema.sql` via `postgres.js`'s `unsafe()` method, creating all six tables, five indexes, two views, and the stored function. All DDL statements use `IF NOT EXISTS` or `CREATE OR REPLACE`, making the migration idempotent and safe to run on every boot. The backend logs `✅ Schema applied` when ready; Vite logs the local URL when the bundle is served.

```bash
# Load demo users, events, and tickets
cd backend && bun run db:seed

# Open the app
open http://localhost:5173

# Backend health check
curl http://localhost:3000/health   # → {"status":"ok"}
```

#table(
  columns: (1.6fr, 1fr, 2.6fr),
  align: left,
  table.header[Email][Password][Role],
  [`admin@usf.edu`], [`password123`], [Administrator --- full system access],
  [`jsmith22@usf.edu`], [`password123`], [Organizer --- event creation and management],
  [`trev123@usf.edu`], [`password123`], [Student --- browse, register, check in],
)

#figure(
  image("screenshots/docker_up.png", alt: "docker compose up terminal output"),
  caption: [`docker compose up` --- all three tiers starting in sequence. The API logs "Schema applied" before accepting traffic; Vite serves the React bundle on port 5173. The seed script can be run immediately after to populate demo data.],
)

#figure(
  image("screenshots/db_tables.png", alt: "psql dt output showing all tables"),
  caption: [Output of `\dt` in `psql` against the running container --- six live relations created by `schema.sql`. Running `\dv` additionally shows `v_event_stats` and `v_upcoming_events`; `\df` shows `check_event_capacity`.],
)

// ============================================================
// 9. STATUS AGAINST COURSE REQUIREMENTS
// ============================================================

= Status Against Course Requirements

The table below maps every graded requirement and bonus item from the assignment handout to our implementation status.

#table(
  columns: (auto, 3.5fr, 1.2fr),
  align: (left, left, center),
  table.header[\#][Requirement][Status],
  [1], [DBMS-backed database with #sym.gt.eq 3 relations loaded with data], [#status-ok 6 tables + seed],
  [2], [#sym.gt.eq 8 distinct SQL query types including state-modifying queries], [#status-ok 10 implemented],
  [3], [Web-based interface with #sym.gt.eq 3 distinct pages], [#status-ok 8 pages],
  [4], [JDBC/ODBC-style connection to send queries to the database], [#status-ok `postgres.js` raw SQL],
  [---], [*Bonus* --- user accounts with userID/password], [#status-ok bcrypt + JWT],
  [---], [*Bonus* --- views with per-role projections], [#status-ok 2 views in `schema.sql`],
  [---], [*Bonus* --- stored procedures/functions on the database side], [#status-ok `check_event_capacity()`],
  [---], [*Bonus* --- client-side scripts for application logic], [#status-ok React 19 SPA],
  [---], [*Bonus* --- additional relevant features], [#status-ok transactions, image upload, Mapbox maps, dark mode],
)

#note[
  All four required features are fully implemented. For the bonus items: user accounts use bcrypt password hashing and JWT-based session tokens; two SQL views (`v_upcoming_events`, `v_event_stats`) provide role-scoped projections of the underlying tables; the `check_event_capacity` PL/pgSQL function encapsulates capacity logic on the database side and is called from within the ticket purchase transaction; and the React single-page application handles all client-side routing, state management, and UI rendering. Additional features beyond the rubric include a row-level-locked ticket purchase transaction to prevent oversell, base-64 image storage in the database for media persistence, Mapbox GL JS map previews for event venues, and full light/dark mode theming.
]
