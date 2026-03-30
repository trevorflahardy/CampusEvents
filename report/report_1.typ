// ============================================================
// CampusEvents — Intermediate Report 1
// COP 4710 Spring 2026 — Due March 30, 2026
// ============================================================

// ── Page Setup ───────────────────────────────────────────────
#set page(
  paper: "us-letter",
  margin: (top: 1in, bottom: 1in, left: 1.1in, right: 1.1in),
  header: context {
    set text(size: 8pt, fill: luma(120))
    smallcaps[CampusEvents — Campus Event & Ticket Booking System]
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

// ── Fletcher (ER diagram arrows) ─────────────────────────────
#import "@preview/fletcher:0.5.8" as fletcher: diagram, edge, node
#import "@preview/oxdraw:0.1.0": *

// ── Global Typography ────────────────────────────────────────
#set text(font: "Linux Libertine", size: 11pt, fill: luma(20))
#set par(justify: true, leading: 0.7em, spacing: 1.2em)
#set heading(numbering: "1.")

// Heading styles — restrained, academic
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

// Inline code — monospace, no color, subtle box
#show raw.where(block: false): it => box(
  fill: luma(240),
  inset: (x: 3pt, y: 1pt),
  radius: 2pt,
  text(font: "Liberation Mono", size: 9.5pt)[#it],
)

// Code blocks — clean, left-ruled, monospace
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
#let entity-label(name) = block(
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
    COP 4710 — Database Systems #sym.space.quad
    University of South Florida #sym.space.quad
    Spring 2026
  ]
  #v(0.4em)
  #line(length: 60%, stroke: 0.6pt + luma(160))
  #v(0.2em)
  #text(size: 10pt)[*Intermediate Report 1* #sym.dash.em Due March 30, 2026]
]
#v(1.5em)

// ============================================================
// 1. TEAM ROSTER
// ============================================================

= Team Roster

This project is submitted by the two-person team listed below. Per Dr. Tu's course guidelines, two-person groups are held to the same deliverable expectations as a three-person group, and our system design reflects that scope accordingly.

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

CampusEvents is a web-based enterprise information system designed to manage campus events at a university. The platform serves three distinct user roles — *students*, who browse and register for events; *organizers*, who create and manage them; and *administrators*, who oversee the system as a whole. The core value proposition is replacing ad-hoc flyers and email blasts with a centralized, queryable system for event discovery and attendance tracking.

The system follows a standard three-tier architecture. The presentation tier is a single-page application built with React and Vite, styled with Tailwind CSS. The application logic tier is a REST API written in TypeScript running on the Bun runtime with the Hono framework. The data tier is a PostgreSQL 16 relational database, accessed through Drizzle ORM — a lightweight TypeScript-native library that serves as the JDBC-equivalent data access layer.

#v(0.4em)
#table(
  columns: (auto, 1.6fr, 2fr),
  align: left,
  table.header[Tier][Technology][Notes],
  [Presentation], [React 19 + Vite + Tailwind CSS v4], [Web-based UI; ≥ 3 distinct pages],
  [Application], [Bun + Hono (REST API, TypeScript)], [Application logic; handles routing and business rules],
  [Data], [PostgreSQL 16 + Drizzle ORM], [Relational DBMS; JDBC-equivalent via `postgres.js`],
)

// ============================================================
// 3. CONCEPTUAL DESIGN
// ============================================================

= Conceptual Design

The database is modeled around *five entity sets* connected by *four relationship sets*. The design prioritizes normalization and referential integrity — every relationship is enforced at the schema level via foreign keys and `CHECK` constraints rather than relying on application-layer validation alone.

== ER Diagram

The diagram below represents the entity-relationship model for CampusEvents. Entities are shown as labeled rectangles, and the relationships between them are annotated with their cardinality. A machine-readable version of this diagram is also available as `er_diagram.mermaid` in the project root.

#figure(
  image("./schema_diagram.png", alt: "ER Diagram for CampusEvents"),
)

== Entity Sets & Attributes

Each entity set is described below with its full attribute list, types, and constraints. Primary keys are underlined by convention; foreign keys are noted explicitly.

#v(0.4em)
*USERS* — Represents every account in the system. The `role` attribute determines what actions a user may perform: `student` accounts can browse and book tickets, `organizer` accounts can create and manage events, and `admin` accounts have full system access.

#table(
  columns: (1.1fr, 1.2fr, 1.3fr, 1.8fr),
  align: left,
  table.header[Attribute][Type][Constraint][Notes],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`], [Auto-incremented surrogate key],
  [`net_id`], [`VARCHAR(50)`], [`NOT NULL, UNIQUE`], [University-issued NetID (e.g., `jsmith22`)],
  [`name`], [`VARCHAR(100)`], [`NOT NULL`], [Full display name],
  [`email`], [`VARCHAR(150)`], [`NOT NULL, UNIQUE`], [University email address],
  [`password_hash`], [`TEXT`], [`NOT NULL`], [bcrypt-hashed; never stored in plaintext],
  [`role`], [`ENUM`], [`DEFAULT 'student'`], [`admin` | `organizer` | `student`],
  [`created_at`], [`TIMESTAMP`], [`DEFAULT NOW()`], [Account creation timestamp],
)

#v(0.8em)
*EVENTS* — The central entity of the system. Every event has a designated organizer (a foreign key to USERS), a time range, a physical location, and a capacity ceiling. The `ticket_price` field defaults to `0.00`, making free events the default case. The `status` enum drives filtering throughout the UI.

#table(
  columns: (1.1fr, 1.2fr, 1.4fr, 1.7fr),
  align: left,
  table.header[Attribute][Type][Constraint][Notes],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`], [Auto-incremented surrogate key],
  [`title`], [`VARCHAR(200)`], [`NOT NULL`], [Event display name],
  [`description`], [`TEXT`], [`NULLABLE`], [Optional long-form description],
  [`location`], [`VARCHAR(200)`], [`NOT NULL`], [Venue name or address],
  [`start_time`], [`TIMESTAMP`], [`NOT NULL`], [Event start date and time],
  [`end_time`], [`TIMESTAMP`], [`NOT NULL, > start_time`], [`CHECK` ensures end is after start],
  [`capacity`], [`INTEGER`], [`CHECK > 0`], [Maximum number of attendees],
  [`ticket_price`], [`NUMERIC(10,2)`], [`DEFAULT 0.00, >= 0`], [`0.00` indicates a free event],
  [`status`], [`ENUM`], [`DEFAULT 'upcoming'`], [`upcoming` | `ongoing` | `completed` | `cancelled`],
  [`organizer_id`], [`INTEGER`], [`FK → USERS.id`], [References the event creator],
  [`created_at`], [`TIMESTAMP`], [`DEFAULT NOW()`], [Record insertion timestamp],
)

#v(0.8em)
*TICKETS* — A ticket represents a confirmed booking between a user and an event. The `UNIQUE(user_id, event_id)` constraint enforces the business rule that a student may only hold one ticket per event. The `confirmation_code` is a short, human-readable identifier shown to the user after booking and used for check-in.

#table(
  columns: (1.3fr, 1.1fr, 1.6fr, 1.5fr),
  align: left,
  table.header[Attribute][Type][Constraint][Notes],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`], [Auto-incremented surrogate key],
  [`user_id`], [`INTEGER`], [`FK → USERS.id`], [References the ticket holder],
  [`event_id`], [`INTEGER`], [`FK → EVENTS.id`], [References the booked event],
  [`purchased_at`], [`TIMESTAMP`], [`DEFAULT NOW()`], [Booking timestamp],
  [`checked_in`], [`BOOLEAN`], [`DEFAULT FALSE`], [Set to `TRUE` upon event entry],
  [`confirmation_code`], [`VARCHAR(20)`], [`UNIQUE`], [Short alphanumeric booking code],
  [(`user_id`, `event_id`)], [—], [`UNIQUE` composite], [Prevents duplicate bookings],
)

#v(0.8em)
*CATEGORIES* and *EVENT\_CATEGORIES* — Categories form a simple lookup table (e.g., Academic, Music, Sports, Career, Technology). The many-to-many relationship between EVENTS and CATEGORIES is resolved through the EVENT\_CATEGORIES join table, allowing a single event to belong to multiple categories for filtering purposes.

#v(0.3em)

#table(
  columns: (1fr, 1fr, 1fr),
  table.header[Attribute][Type][Constant],
  [#underline[id]], [`SERIAL`], [`PRIMARY KEY`],
  [`name`], [`VARCHAR(100)`], [`NOT NULL, UNIQUE`],
  [`event_id`], [`INTEGER`], [`FK → EVENTS, PK`],
  [`category_id`], [`INTEGER`], [`FK → CATEGORIES, PK`],
)


// ============================================================
// 4. RELATIONSHIP SETS
// ============================================================

= Relationship Sets

The four relationship sets in the model are summarized below. Each is enforced at the schema level — cardinality is not merely documented but implemented through foreign key constraints and, in the case of the many-to-many relationship, a dedicated join table.

#table(
  columns: (1fr, 1fr, 1.1fr, 0.8fr, 2.8fr),
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

// ============================================================
// 5. KEY CONSTRAINTS
// ============================================================

= Key Constraints

Beyond standard foreign key and uniqueness constraints, the schema enforces the following business rules at the database level:

- `end_time > start_time` — A `CHECK` constraint on EVENTS ensures that no event can be created with an end time that precedes or equals its start time.
- `capacity > 0` — A `CHECK` constraint ensures every event must allow at least one attendee.
- `ticket_price >= 0` — Prevents negative ticket prices from being inserted.
- `UNIQUE(user_id, event_id)` on TICKETS — Enforces the one-ticket-per-user-per-event rule at the schema level, making it impossible to double-book regardless of application behavior.
- `confirmation_code UNIQUE` — Every ticket carries a globally unique confirmation code for check-in purposes.
- `net_id UNIQUE` — Prevents duplicate accounts sharing the same university NetID.
- `ON DELETE CASCADE` on TICKETS — Deleting a user or event automatically removes all associated tickets and category links, maintaining referential integrity without manual cleanup.

The SQL `CREATE TABLE` statements encoding these constraints are included in `schema.sql` at the project root. A representative excerpt is shown below:

```sql
CREATE TABLE events (
    id            SERIAL          PRIMARY KEY,
    title         VARCHAR(200)    NOT NULL,
    location      VARCHAR(200)    NOT NULL,
    start_time    TIMESTAMP       NOT NULL,
    end_time      TIMESTAMP       NOT NULL,
    capacity      INTEGER         NOT NULL CHECK (capacity > 0),
    ticket_price  NUMERIC(10, 2)  NOT NULL DEFAULT 0.00
                                  CHECK (ticket_price >= 0),
    status        event_status    NOT NULL DEFAULT 'upcoming',
    organizer_id  INTEGER         NOT NULL REFERENCES users(id)
                                  ON DELETE CASCADE,

    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);
```

// ============================================================
// 6. PLANNED SQL QUERIES
// ============================================================

= Planned SQL Query Types

The system is required to support at least eight distinct SQL query types, including queries that modify database state. We have planned ten query types to ensure the requirement is met with margin. Each query corresponds to a core application feature — they are not academic exercises but the actual queries that will back the UI. All ten are defined and commented in `schema.sql`.

#table(
  columns: (auto, 1.7fr, 3fr),
  align: left,
  table.header[\#][Type][Application Feature],
  [Q1], [`SELECT` + `JOIN`], [Browse page — list upcoming events with organizer name],
  [Q2], [`SELECT` + `GROUP BY` + `COUNT`], [Dashboard — count tickets sold per event],
  [Q3], [`SELECT` + subquery], [Event detail page — compute remaining capacity],
  [Q4], [`SELECT` + multiple `JOIN`s], [My Tickets page — show booking history with category tags],
  [Q5], [`INSERT`], [Ticket purchase — create a new booking record],
  [Q6], [`UPDATE`], [Check-in flow — set `checked_in = TRUE` on a ticket],
  [Q7], [`UPDATE`], [Organizer dashboard — cancel an event by updating its status],
  [Q8], [`DELETE`], [Cancel booking — remove a ticket record],
  [Q9], [`SELECT` + `HAVING`], [Analytics — find categories with more than one active event],
  [Q10], [`SELECT` + `BETWEEN`], [Date filtering — retrieve events within a specified date range],
)

A representative sample of how these will be expressed in SQL:

```sql
-- Q1: Upcoming events with organizer name
SELECT e.title, e.location, e.start_time, u.name AS organizer
FROM events e
JOIN users u ON e.organizer_id = u.id
WHERE e.status = 'upcoming'
ORDER BY e.start_time;

-- Q3: Remaining capacity via subquery
SELECT e.title,
       e.capacity - (
           SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id
       ) AS spots_remaining
FROM events e
WHERE e.status = 'upcoming';

-- Q5: Ticket purchase (INSERT)
INSERT INTO tickets (user_id, event_id, confirmation_code)
VALUES ($1, $2, $3);
```

// ============================================================
// 7. PLANNED UI PAGES
// ============================================================

= Planned Interface Pages

The interface requirement specifies at least three distinct pages. We have designed five, three of which fulfill the requirement and two of which are planned bonus features that expand the system's functionality toward a realistic enterprise application.

#table(
  columns: (1.5fr, 0.8fr, 3fr),
  align: left,
  table.header[Page][Access][Description],
  [Home / Browse Events],
  [Public],
  [Lists all upcoming events with search and category filtering. The primary discovery surface for students.],

  [Event Detail],
  [Public],
  [Displays full event info, real-time remaining capacity, and a Book Ticket button for authenticated users.],

  [My Tickets],
  [Student],
  [Shows the authenticated user's booking history, confirmation codes, and check-in status for each event.],

  [Organizer Dashboard],
  [Organizer],
  [*(Bonus)* Allows organizers to create, edit, and cancel events, and view a full attendee list per event.],

  [Admin Panel],
  [Admin],
  [*(Bonus)* Full system view — manage all users, events, and categories; assign and revoke user roles.],
)

The page structure maps directly to the query plan in Section 6. The Browse Events page is backed by Q1 and Q10; the Event Detail page uses Q3 for capacity calculation; My Tickets uses Q4; the Organizer Dashboard uses Q2 for sales metrics, Q6 for check-in, and Q7 for cancellations; and ticket purchase (Q5) and cancellation (Q8) are triggered from both the detail page and the dashboard.
