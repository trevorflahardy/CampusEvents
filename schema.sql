-- ============================================================
-- CampusEvents: Campus Event & Ticket Booking System
-- COP 4710 Spring 2026 — Term Project
-- PostgreSQL Schema
--
-- This file is the authoritative DDL for the project.
-- It is applied on every backend startup and is idempotent
-- (safe to run repeatedly) thanks to IF NOT EXISTS / ON CONFLICT
-- guards on every statement.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────────────────────────────────────────────────────────
-- TABLE: users
--   Stores all system users: students, event organizers, admins.
--   net_id corresponds to a university NetID (unique identifier).
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL          PRIMARY KEY,
    net_id        VARCHAR(50)     NOT NULL UNIQUE,
    name          VARCHAR(100)    NOT NULL,
    email         VARCHAR(150)    NOT NULL UNIQUE,
    password_hash TEXT            NOT NULL,
    role          user_role       NOT NULL DEFAULT 'student',
    profile_photo TEXT,
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- TABLE: categories
--   Lookup table for event categories (e.g. Music, Academic).
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
    id    SERIAL        PRIMARY KEY,
    name  VARCHAR(100)  NOT NULL UNIQUE
);

-- ──────────────────────────────────────────────────────────────
-- TABLE: events
--   Campus events created by organizers or admins.
--   capacity: max attendees allowed.
--   ticket_price: 0.00 means free.
--   organizer_id: FK to users (must be role = 'organizer' or 'admin').
-- ──────────────────────────────────────────────────────────────

-- Note: titles are intentionally not globally UNIQUE — in the real world
-- multiple organizers may run events with the same name (e.g. "Open House").
-- Seed data uses ON CONFLICT on PK/other natural keys instead of title.
CREATE TABLE IF NOT EXISTS events (
    id            SERIAL          PRIMARY KEY,
    title         VARCHAR(200)    NOT NULL,
    description   TEXT,
    location      VARCHAR(200)    NOT NULL,
    start_time    TIMESTAMP       NOT NULL,
    end_time      TIMESTAMP       NOT NULL,
    capacity      INTEGER         NOT NULL CHECK (capacity > 0),
    ticket_price  NUMERIC(10, 2)  NOT NULL DEFAULT 0.00 CHECK (ticket_price >= 0),
    status        event_status    NOT NULL DEFAULT 'upcoming',
    organizer_id  INTEGER         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    banner_url    TEXT,
    latitude      DOUBLE PRECISION,
    longitude     DOUBLE PRECISION,
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Drop the old UNIQUE(title) constraint if it exists from earlier deployments.
DO $$ BEGIN
  ALTER TABLE events DROP CONSTRAINT events_title_key;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- A single organizer can't schedule two events with the same title at the
-- same start time. This is what the seed data's ON CONFLICT targets — it
-- prevents re-runs from duplicating seed events while still allowing two
-- different organizers to use identical titles in production.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_organizer_title_start_key'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_organizer_title_start_key
      UNIQUE (organizer_id, title, start_time);
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- TABLE: event_categories
--   Many-to-many join between events and categories.
--   An event can belong to multiple categories.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_categories (
    event_id     INTEGER  NOT NULL REFERENCES events(id)     ON DELETE CASCADE,
    category_id  INTEGER  NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, category_id)
);

-- ──────────────────────────────────────────────────────────────
-- TABLE: tickets
--   A ticket represents a user's registration/booking for an event.
--   confirmation_code: unique short code shown to the user (e.g. "A3F9C2B1").
--   checked_in: toggled to TRUE when the user arrives at the event.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tickets (
    id                 SERIAL       PRIMARY KEY,
    user_id            INTEGER      NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    event_id           INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    purchased_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    checked_in         BOOLEAN      NOT NULL DEFAULT FALSE,
    confirmation_code  VARCHAR(20)  NOT NULL UNIQUE,

    -- A user can only hold one ticket per event
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- ──────────────────────────────────────────────────────────────
-- Uploaded images — stores image binary data in the DB so images
-- survive branch switches, container restarts, and reseeds.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS images (
    id          SERIAL      PRIMARY KEY,
    filename    TEXT        NOT NULL UNIQUE,
    mime_type   TEXT        NOT NULL,
    data        TEXT        NOT NULL,   -- base64-encoded image data
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES (for common query patterns)
-- ============================================================

-- Find all upcoming events quickly
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Find events by organizer
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

-- Find events in a time window
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- Find all tickets for a user (e.g. "My Tickets" page)
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);

-- Find all tickets for an event (e.g. attendee list)
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);

-- ============================================================
-- REFERENCE DATA (always present — the frontend's category dropdown
-- expects these rows to exist on a fresh DB). ON CONFLICT DO NOTHING
-- keeps this idempotent across restarts.
-- ============================================================

INSERT INTO categories (name) VALUES
    ('Academic'),
    ('Music'),
    ('Sports'),
    ('Career'),
    ('Social'),
    ('Arts'),
    ('Technology')
ON CONFLICT DO NOTHING;

-- Demo users, events, event_categories, and tickets live in
-- backend/src/db/seed.ts. Run `bun run db:seed` to load them; the seed
-- script uses real bcrypt hashes so the documented credentials actually
-- authenticate. Keeping this DDL file free of placeholder password
-- hashes prevents accounts that can exist but never log in.

-- ============================================================
-- EXAMPLE QUERIES (demonstrates the 8+ required query types)
-- ============================================================

-- Q1. SELECT with JOIN — Get all upcoming events with organizer name
-- SELECT e.title, e.location, e.start_time, u.name AS organizer
-- FROM events e
-- JOIN users u ON e.organizer_id = u.id
-- WHERE e.status = 'upcoming'
-- ORDER BY e.start_time;

-- Q2. SELECT with GROUP BY + COUNT — Tickets sold per event
-- SELECT e.title, COUNT(t.id) AS tickets_sold
-- FROM events e
-- LEFT JOIN tickets t ON e.id = t.event_id
-- GROUP BY e.id, e.title
-- ORDER BY tickets_sold DESC;

-- Q3. SELECT with subquery — Events that still have capacity
-- SELECT e.title, e.capacity,
--        (e.capacity - (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id)) AS spots_left
-- FROM events e
-- WHERE e.status = 'upcoming';

-- Q4. SELECT with multiple JOINs — User ticket history with event + category
-- SELECT u.name, e.title, c.name AS category, t.purchased_at, t.checked_in
-- FROM tickets t
-- JOIN users u ON t.user_id = u.id
-- JOIN events e ON t.event_id = e.id
-- LEFT JOIN event_categories ec ON ec.event_id = e.id
-- LEFT JOIN categories c ON ec.category_id = c.id
-- WHERE u.net_id = 'trev123';

-- Q5. INSERT — Purchase a ticket
-- INSERT INTO tickets (user_id, event_id, confirmation_code)
-- VALUES (3, 2, 'CONC2602');

-- Q6. UPDATE — Check in a ticket at event entry
-- UPDATE tickets
-- SET checked_in = TRUE
-- WHERE confirmation_code = 'CF26A001';

-- Q7. UPDATE — Cancel an event
-- UPDATE events
-- SET status = 'cancelled'
-- WHERE id = 1;

-- Q8. DELETE — Cancel (delete) a ticket
-- DELETE FROM tickets
-- WHERE user_id = 3 AND event_id = 2;

-- Q9. SELECT with HAVING — Categories with more than 1 event
-- SELECT c.name, COUNT(ec.event_id) AS event_count
-- FROM categories c
-- JOIN event_categories ec ON c.id = ec.category_id
-- GROUP BY c.name
-- HAVING COUNT(ec.event_id) > 1;

-- Q10. SELECT with BETWEEN — Events starting in April 2026
-- SELECT title, location, start_time
-- FROM events
-- WHERE start_time BETWEEN '2026-04-01' AND '2026-04-30'
-- ORDER BY start_time;
