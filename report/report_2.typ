// ============================================================
// CampusEvents --- Intermediate Report 2
// COP 4710 Spring 2026 --- Due April 10, 2026
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

// ── Fletcher (architecture diagram arrows) ───────────────────
#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node

// ── Global Typography ────────────────────────────────────────
#set text(font: "Linux Libertine", size: 11pt, fill: luma(20))
#set par(justify: true, leading: 0.7em, spacing: 1.2em)
#set heading(numbering: "1.")

// Heading styles --- restrained, academic
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

// Inline code --- monospace, no color, subtle box
#show raw.where(block: false): it => box(
  fill: luma(240),
  inset: (x: 3pt, y: 1pt),
  radius: 2pt,
  text(font: "Liberation Mono", size: 9.5pt)[#it],
)

// Code blocks --- clean, left-ruled, monospace
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
#let tier-label(name) = block(
  inset: (x: 7pt, y: 4pt),
  fill: luma(235),
  stroke: 0.5pt + luma(160),
  radius: 2pt,
  text(font: "Liberation Mono", size: 9.5pt, weight: "bold")[#name],
)

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
  #text(size: 10pt)[*Intermediate Report 2* #sym.dash.em Due April 10, 2026]
]
#v(1.5em)

// Table of contents
#outline()

// ============================================================
// 1. TEAM ROSTER
// ============================================================

= Team Roster

This report is submitted by the two-person team listed in the mini report. Per Dr. Tu's course guidelines, two-person groups carry the same deliverable expectations as a three-person group, and the scope demonstrated in this progress report reflects that.

#v(0.5em)
#table(
  columns: (1.5fr, 2fr, 1fr),
  align: left,
  table.header[Name][Email][Role],
  [Trevor Flahardy], [trevorflahardy\@usf.edu], [Developer],
  [Sofia Cobo Navas], [scobonavas\@usf.edu], [Developer],
)

// ============================================================
// 2. PURPOSE OF THIS REPORT
// ============================================================

= Purpose of This Report

The April 10 milestone asks us to show that an *initial version of all three tiers* of the proposed system --- interface, application logic, and database --- is in a working state. Functionality can be of the simplest form; the grading criterion is whether the system is demonstrably alive end-to-end.

We are pleased to report that CampusEvents is already well past the "simplest form" bar. Every tier is running, the three tiers communicate end-to-end over HTTP and SQL, all ten planned SQL query types from the mini report are implemented against real endpoints, and the user interface exercises those endpoints through a React single-page application. This document walks through each tier, cites the files where the code lives, shows representative code excerpts, and includes screenshots of the running system.

#note[
  All code references in this report point to files inside the project repository. The repo lives at the path printed in the README and is structured as `backend/` (application + data access), `frontend/` (interface), `schema.sql` (reference DDL), and `docker-compose.yml` (orchestration). The system is launched with a single command: `docker compose up`.
]

// ============================================================
// 3. ARCHITECTURE OVERVIEW
// ============================================================

= Three-Tier Architecture Overview

The system follows a textbook three-tier architecture. The *interface tier* is a React 19 single-page application served by Vite; it renders the UI, manages local state, and talks to the backend over `fetch`. The *application tier* is a TypeScript REST API running on the Bun runtime, built with the Hono framework; it validates input, enforces authorization, and issues SQL through Drizzle ORM. The *data tier* is a PostgreSQL 16 database running in Docker, owning all persistent state and enforcing integrity constraints at the schema level.

#v(0.4em)
#table(
  columns: (auto, 1.6fr, 1.2fr, 1.6fr),
  align: left,
  table.header[Tier][Technology][Port][Responsibility],
  [Interface], [React 19 + Vite + Tailwind v4], [`:5173`], [Rendering, routing, client-side state],
  [Application], [Bun + Hono (REST, TypeScript)], [`:3000`], [Validation, auth, SQL execution via Drizzle],
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
    edge((1, 0), (2, 0), "->", [Drizzle / SQL], label-pos: 0.5, label-side: center),
    edge((1, 0), (0, 0), "->", [JSON], label-pos: 0.5, label-side: center, bend: 30deg),
    edge((2, 0), (1, 0), "->", [rows], label-pos: 0.5, label-side: center, bend: 30deg),
  ),
  caption: [Three-tier architecture --- browser calls the Hono API, which issues SQL to PostgreSQL via Drizzle ORM.],
)

#v(0.3em)
#note[
  Drizzle ORM plays the role of JDBC/ODBC in this stack: it is a lightweight TypeScript-native data access layer sitting on top of the `postgres.js` driver, translating typed query builders into parameterized SQL. The course requirement to "utilize JDBC/ODBC or other communication protocols to connect to the database and send in queries" is satisfied through this driver.
]

// ============================================================
// 4. DATA TIER
// ============================================================

= Data Tier --- PostgreSQL + Drizzle

== Running Database

A PostgreSQL 16 instance runs inside Docker, provisioned by `docker-compose.yml` at the project root. On first boot, the container executes `schema.sql` as part of its init script, creating the enums and tables laid out in the mini report. The service listens on `localhost:5432` with database `campusevents`, user `campus`, password `campus123`.

```yaml
// docker-compose.yml (excerpt)
postgres:
  image: postgres:16-alpine
  container_name: campusevents_db
  environment:
    POSTGRES_USER: campus
    POSTGRES_PASSWORD: campus123
    POSTGRES_DB: campusevents
  ports: ["5432:5432"]
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
```

== Schema (Drizzle, TypeScript-native)

The authoritative schema definition lives in `backend/src/db/schema.ts` as a Drizzle `pgTable` description. Drizzle generates migration SQL from this file via `drizzle-kit generate`, and the generated migrations are committed under `backend/src/db/migrations/`. At backend startup, the server runs any pending migrations automatically, so a fresh clone of the repo always boots into a consistent state.

```ts
// backend/src/db/schema.ts (excerpt)
export const events = pgTable("events", {
  id:          serial("id").primaryKey(),
  title:       text("title").notNull(),
  description: text("description"),
  location:    text("location").notNull(),
  startTime:   timestamp("start_time").notNull(),
  endTime:     timestamp("end_time").notNull(),
  capacity:    integer("capacity").notNull(),
  ticketPrice: numeric("ticket_price", { precision: 10, scale: 2 })
                 .notNull().default("0.00"),
  status:      eventStatusEnum("status").notNull().default("upcoming"),
  organizerId: integer("organizer_id")
                 .references(() => users.id).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});
```

== Tables & Seed Data

All five tables from the mini report are live: `users`, `events`, `tickets`, `categories`, and `event_categories`. A sixth table, `images`, stores uploaded event banners as base-64 blobs (a small addition beyond the mini report so organizers can attach artwork to events). A seed script at `backend/src/db/seed.ts` populates the database with representative users (a student, an organizer, an admin), a handful of events across categories, and a sample ticket --- enough content for the interface tier to render meaningful data on first load.

#figure(
  image("screenshots/db_tables.png", alt: "psql \dt output showing all CampusEvents tables"),
  caption: [PostgreSQL 16 running inside Docker after `docker compose up`. Output of `\dt` in `psql` shows the seven relations created by Drizzle migrations --- the five from the ER diagram, plus `images` and the Drizzle migration bookkeeping table.],
)

== Integrity Constraints

The constraints promised in the mini report are enforced at the schema level. Foreign keys link $"events.organizer_id" #sym.arrow "users.id"$, $"tickets.user_id" #sym.arrow "users.id"$, $"tickets.event_id" #sym.arrow "events.id"$, and the join table's composite primary key on `(event_id, category_id)`. The `UNIQUE(user_id, event_id)` constraint on `tickets` prevents double bookings --- if a user tries to purchase a second ticket for the same event, PostgreSQL raises SQL state `23505` and the API translates that into a `409 Conflict` response to the client.

```ts
// backend/src/routes/tickets.ts --- catching unique-constraint violation
try {
  const inserted = await db.insert(tickets)
    .values({ userId, eventId, confirmationCode }).returning();
  return c.json(inserted[0], 201);
} catch (err) {
  const pgErr = err as { code?: string };
  if (pgErr.code === "23505") {
    return c.json({ error: "You already have a ticket for this event" }, 409);
  }
  throw err;
}
```

// ============================================================
// 5. APPLICATION TIER
// ============================================================

= Application Tier --- Bun + Hono REST API

== Server Entry Point

The backend is a TypeScript application that runs on the Bun runtime. Its entry point is `backend/src/index.ts`, which wires a Hono `App` with logger and CORS middleware, runs database migrations on startup, mounts five sub-routers under `/api/*`, and exposes a `/health` probe. Bun's `--hot` flag gives us hot reload during development; the Docker service reuses the same `bun run src/index.ts` command in production.

```ts
// backend/src/index.ts (excerpt)
const app = new Hono();
app.use("*", logger());
app.use("/api/*", cors({ origin: ["http://localhost:5173"] }));

app.route("/api/auth",       authRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/events",     eventsRouter);
app.route("/api/tickets",    ticketsRouter);
app.route("/api/users",      usersRouter);

console.log(`🚀 Server running on http://localhost:3000`);
export default { port: 3000, fetch: app.fetch };
```

== Route Modules

The API is split into six route modules under `backend/src/routes/`, each owning a resource:

#table(
  columns: (1.4fr, 2fr, 3fr),
  align: left,
  table.header[Module][Mounted at][Purpose],
  [`auth.ts`], [`/api/auth`], [Register, login (bcrypt + JWT), `GET /me`],
  [`users.ts`], [`/api/users`], [Profile CRUD, role management],
  [`events.ts`], [`/api/events`], [Event CRUD, listing, stats, attendees],
  [`tickets.ts`], [`/api/tickets`], [Purchase, list, cancel, check-in],
  [`categories.ts`], [`/api/categories`], [Category lookup, popular categories],
  [`images.ts`], [`/uploads`], [Event banner upload & retrieval],
)

== Authentication & Authorization

We implemented the first two bonus features from the assignment handout --- *user accounts with userID/password* and *different privileges for different users* --- directly in the application tier. Passwords are hashed with bcrypt (`@node-rs/bcrypt`) on registration and verified on login. A successful login returns a JWT signed with `HS256` containing the user's `id` and `role`. A Hono middleware at `backend/src/middleware/auth.ts` verifies the token on protected routes and injects `userId` and `userRole` into the request context; a `requireRole(...)` factory enforces role gating on organizer- and admin-only endpoints.

```ts
// backend/src/middleware/auth.ts (excerpt)
export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  const payload = await verify(header.slice(7), JWT_SECRET, "HS256");
  c.set("userId",   payload.sub  as number);
  c.set("userRole", payload.role as string);
  await next();
}

export function requireRole(...roles: string[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    if (!roles.includes(c.get("userRole"))) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}
```

== Input Validation

Every write endpoint validates its JSON body with a Zod schema before touching the database. This catches malformed input at the edge of the application tier --- the database never sees an event with a missing title or a ticket with a negative `event_id`.

```ts
// backend/src/routes/tickets.ts
const purchaseSchema = z.object({
  userId:  z.number().int().positive(),
  eventId: z.number().int().positive(),
});
const parsed = purchaseSchema.safeParse(await c.req.json());
if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
```

// ============================================================
// 6. INTERFACE TIER
// ============================================================

= Interface Tier --- React + Vite + Tailwind

== Page Inventory

The frontend is a React 19 single-page application bootstrapped with Vite and styled with Tailwind CSS v4. It ships eight routed pages --- three more than the mini report promised --- giving us comfortable margin above the "at least three pages" requirement. Routing is handled by `react-router-dom` v7; protected routes redirect unauthenticated users to `/login`.

#table(
  columns: (1.5fr, 1fr, 2.8fr),
  align: left,
  table.header[Page (`frontend/src/pages/`)][Route][Purpose],
  [`Landing.tsx`], [`/`], [Marketing-style landing page for logged-out visitors],
  [`BrowseEvents.tsx`], [`/events`], [Event discovery --- search, category filter, date range],
  [`EventDetail.tsx`], [`/events/:id`], [Full event info, remaining capacity, Book Ticket button],
  [`Login.tsx`], [`/login`], [JWT-based sign-in form],
  [`Register.tsx`], [`/register`], [Account creation with role selection],
  [`MyTickets.tsx`], [`/my-tickets`], [Authenticated student's booking history & check-in],
  [`OrganizerDashboard.tsx`], [`/dashboard`], [Create/edit/cancel events, view attendees],
  [`AdminPanel.tsx`], [`/admin`], [Full system view --- manage users, events, categories],
)

== Client ↔ API Contract

All network calls are funneled through a small typed client at `frontend/src/lib/api.ts`. Each method returns a strongly-typed result that mirrors a row shape from the backend, so the interface tier never hand-crafts a URL or parses a raw response. Authentication state lives in `frontend/src/context/AuthContext.tsx`: on login the JWT is persisted to `localStorage`, restored on page reload, and attached to subsequent requests via the `Authorization: Bearer` header.

```tsx
// frontend/src/pages/BrowseEvents.tsx --- hitting GET /api/events
useEffect(() => {
  const timer = setTimeout(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search)     params.search     = search;
    if (categoryId) params.categoryId = categoryId;
    if (from)       params.from       = from;
    if (to)         params.to         = to;
    if (status)     params.status     = status;
    const data = await api.getEvents(params);
    setEvents(data);
    setLoading(false);
  }, 300);              // debounce
  return () => clearTimeout(timer);
}, [search, categoryId, from, to, status]);
```

== Screenshots of the Running Interface

#figure(
  image("screenshots/browse_events.png", alt: "Browse Events page"),
  caption: [*Browse Events* (`/events`) --- grid of event cards fetched from `GET /api/events`, with live search, category filter, and date-range picker. This view exercises queries Q1 (`SELECT + JOIN` on events + users) and Q10 (`BETWEEN` date filtering) on every keystroke.],
)

#figure(
  image("screenshots/event_detail.png", alt: "Event Detail page"),
  caption: [*Event Detail* (`/events/:id`) --- hero banner, description, remaining-capacity counter, and Book Ticket action. The remaining-capacity number comes from query Q3 (`SELECT` with subquery) computed on the backend.],
)

#figure(
  image("screenshots/my_tickets.png", alt: "My Tickets page"),
  caption: [*My Tickets* (`/my-tickets`) --- authenticated student's bookings with confirmation codes and check-in controls, backed by query Q4 (multiple `JOIN`s across tickets, events, and categories).],
)

#figure(
  image("screenshots/organizer_dashboard.png", alt: "Organizer Dashboard"),
  caption: [*Organizer Dashboard* (`/dashboard`) --- event creation, edits, attendee list, and sales counts from query Q2 (`GROUP BY + COUNT`). The Cancel action issues the `UPDATE` from Q7.],
)

#figure(
  image("screenshots/login.png", alt: "Login page"),
  caption: [*Login* (`/login`) --- submits credentials to `POST /api/auth/login`, receives a JWT, and stores it in `localStorage` via `AuthContext`.],
)

// ============================================================
// 7. END-TO-END WALKTHROUGH
// ============================================================

= End-to-End Walkthrough --- Ticket Purchase

To make it concrete that the three tiers actually talk to each other, this section traces a single user action --- *a student clicking "Book Ticket" on an event* --- through every layer. This is the canonical Q5 path (`INSERT` into `tickets`).

#v(0.4em)
+ *Interface tier.* The user is on `EventDetail.tsx`. Clicking the button calls `api.purchaseTicket(user.id, event.id)`, which issues `POST /api/tickets` with the JWT attached.

+ *Application tier --- validation.* Hono routes the request into `tickets.ts`. The `authMiddleware` verifies the JWT and sets `userId` / `userRole`. The body is parsed with `purchaseSchema` (Zod) to guarantee both IDs are positive integers.

+ *Application tier --- business rules.* The handler issues a pre-flight `SELECT` against `events` with a correlated sub-select to compute `ticketsSold`. If the event is cancelled or sold out, the API short-circuits with a `400` response; the interface tier shows a toast.

+ *Data tier --- INSERT.* If the pre-flight passes, the handler generates an 8-character confirmation code and issues `INSERT INTO tickets`. The `UNIQUE(user_id, event_id)` constraint is the final guard: if the student already holds a ticket, PostgreSQL raises `23505` and the API returns `409 Conflict`.

+ *Response path.* On success, the new ticket row is returned as JSON. The frontend shows a success toast via `sonner` and navigates to `/my-tickets`, where a fresh call to `GET /api/tickets/user/:userId` re-renders the list including the new booking.

#v(0.4em)
#note[
  This walkthrough touches queries Q3 (capacity sub-select), Q5 (INSERT), and Q4 (multi-JOIN re-fetch), and involves the JWT middleware on the application tier and two foreign-key plus one unique constraint on the data tier. A single button click exercises every layer of the stack.
]

// ============================================================
// 8. SQL QUERY COVERAGE
// ============================================================

= SQL Query Implementation Status

All ten SQL query types planned in the mini report are implemented as real REST endpoints driving real UI features. The table below maps each query to its application-tier handler and its interface-tier caller.

#table(
  columns: (auto, 1.4fr, 1.9fr, 1.8fr),
  align: left,
  table.header[\#][Type][Endpoint (handler file)][UI caller],
  [Q1], [`SELECT + JOIN`], [`GET /api/events`                 \ `routes/events.ts`], [`BrowseEvents.tsx`],
  [Q2], [`GROUP BY + COUNT`], [`GET /api/events/stats`           \ `routes/events.ts`], [`OrganizerDashboard.tsx`],
  [Q3], [`SELECT + subquery`], [`GET /api/events/:id`             \ `routes/events.ts`], [`EventDetail.tsx`],
  [Q4], [`SELECT + multi-JOIN`], [`GET /api/tickets/user/:userId`   \ `routes/tickets.ts`], [`MyTickets.tsx`],
  [Q5], [`INSERT`], [`POST /api/tickets`               \ `routes/tickets.ts`], [`EventDetail.tsx`],
  [Q6], [`UPDATE`], [`PATCH /api/tickets/:id/checkin`  \ `routes/tickets.ts`], [`MyTickets.tsx`],
  [Q7], [`UPDATE`], [`PATCH /api/events/:id`           \ `routes/events.ts`], [`OrganizerDashboard.tsx`],
  [Q8], [`DELETE`], [`DELETE /api/tickets/:id`         \ `routes/tickets.ts`], [`MyTickets.tsx`],
  [Q9], [`SELECT + HAVING`], [`GET /api/categories/popular`     \ `routes/categories.ts`], [`BrowseEvents.tsx`],
  [Q10], [`SELECT + BETWEEN`], [`GET /api/events?from=&to=`       \ `routes/events.ts`], [`BrowseEvents.tsx`],
)

Some representative SQL is shown below. Each snippet is the actual Drizzle query the backend issues; the comments indicate which query number and endpoint it backs.

```ts
// Q1 + Q10: events list with optional BETWEEN date filtering
db.select({
    id: events.id, title: events.title, location: events.location,
    startTime: events.startTime, organizerName: users.name,
  })
  .from(events)
  .innerJoin(users, eq(events.organizerId, users.id))
  .where(and(
    from ? gte(events.startTime, new Date(from)) : undefined,
    to   ? lte(events.startTime, new Date(to))   : undefined,
  ));

// Q2: tickets sold per event (GROUP BY + COUNT)
db.select({
    eventId: events.id, title: events.title,
    ticketsSold: sql<number>`cast(count(${tickets.id}) as int)`,
    capacity: events.capacity,
  })
  .from(events)
  .leftJoin(tickets, eq(events.id, tickets.eventId))
  .groupBy(events.id, events.title, events.capacity);

// Q9: categories with more than one event (SELECT + HAVING)
db.select({
    categoryId: categories.id, name: categories.name,
    eventCount: sql<number>`count(${eventCategories.eventId})`,
  })
  .from(categories)
  .innerJoin(eventCategories, eq(categories.id, eventCategories.categoryId))
  .groupBy(categories.id, categories.name)
  .having(sql`count(${eventCategories.eventId}) > 1`);
```

// ============================================================
// 9. RUNNING THE SYSTEM
// ============================================================

= Running the System

The entire stack boots with one command. The following transcript is what a grader would see on a fresh clone:

```bash
$ docker compose up
[+] Running 3/3
 ✔ Container campusevents_db       Started
 ✔ Container campusevents_api      Started
 ✔ Container campusevents_web      Started
campusevents_db   | PostgreSQL init process complete; ready for connections.
campusevents_api  | ✅ Migrations applied
campusevents_api  | 🚀 Server running on http://localhost:3000
campusevents_web  | VITE v8.0.1  ready in 412 ms
campusevents_web  |   ➜  Local:   http://localhost:5173/
```

Navigating to `http://localhost:5173` loads the Landing page; `http://localhost:3000/health` returns `{"status":"ok"}`; `psql -h localhost -U campus -d campusevents` opens a shell onto the live database. A seed script (`bun run src/db/seed.ts`) populates representative users, events, and tickets for demo purposes.

#figure(
  image("screenshots/docker_up.png", alt: "docker compose up terminal output"),
  caption: [`docker compose up` --- all three tiers booting together. The Hono API reports "Migrations applied" before accepting traffic, and Vite serves the React bundle on port 5173.],
)

// ============================================================
// 10. STATUS AGAINST COURSE REQUIREMENTS
// ============================================================

= Status Against Course Requirements

The assignment handout lists four graded features and a set of optional bonuses. Our status on each, as of this report, is below.

#table(
  columns: (auto, 3.2fr, 1.1fr),
  align: (left, left, center),
  table.header[\#][Requirement][Status],
  [1], [DBMS-backed database with #sym.gt.eq 3 relations loaded with data], [#status-ok Done (5 tables + seed)],
  [2], [#sym.gt.eq 8 distinct SQL query types, including state-modifying], [#status-ok Done (10 implemented)],
  [3], [Web-based interface with #sym.gt.eq 3 distinct pages], [#status-ok Done (8 pages)],
  [4], [JDBC/ODBC-style connection to send queries to the DB], [#status-ok Done (Drizzle + `postgres.js`)],
  [---], [*Bonus* --- user accounts with ID/password], [#status-ok Done (bcrypt + JWT)],
  [---], [*Bonus* --- different privileges per user], [#status-ok Done (role middleware)],
  [---], [*Bonus* --- client-side scripts for application logic], [#status-ok Done (React SPA)],
  [---], [*Bonus* --- stored procedures / functions on the DB side], [Planned for final],
  [---], [*Bonus* --- views with per-role privileges], [Planned for final],
)

// ============================================================
// 11. REMAINING WORK
// ============================================================

= Remaining Work Toward May 1

The progress reported here puts us comfortably past the "simplest form" threshold for this milestone. The remaining work for the final submission and live demo is focused on depth rather than breadth:

- *Database-side logic.* Add a small set of PL/pgSQL stored procedures (e.g., atomic ticket purchase with capacity check) and a handful of `CREATE VIEW` definitions exposing role-specific projections. These pick up two of the remaining bonus points.
- *Admin panel polish.* The `AdminPanel.tsx` page currently lists users and events; we will flesh out role assignment, bulk category editing, and a simple analytics dashboard on top of Q2 and Q9.
- *Demo script.* Prepare a 10-minute guided walkthrough that hits every query type, including the state-modifying ones, and shows a deliberate failure (e.g., double-booking) to demonstrate database constraints firing.
- *Test coverage.* Add a small integration test suite against the running API with Bun's built-in test runner, so the demo environment can be verified with `bun test` before the live session.
- *Report polish.* Expand this document into the final report with a revised ER diagram, schema diff from the mini report, and a complete user manual.

#v(0.5em)
#note[
  *TL;DR.* All three tiers are running, communicate end-to-end, and cover every requirement on the rubric plus three of the five bonus items. The remaining work for May 1 is additive: database-side procedures, an admin panel pass, a demo script, and a small test suite.
]
