-- ============================================================
-- CampusEvents: Campus Event & Ticket Booking System
-- COP 4710 Spring 2026 — Term Project
-- PostgreSQL Schema
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'organizer', 'student');

CREATE TYPE event_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- ──────────────────────────────────────────────────────────────
-- TABLE: users
--   Stores all system users: students, event organizers, admins.
--   net_id corresponds to a university NetID (unique identifier).
-- ──────────────────────────────────────────────────────────────

CREATE TABLE users (
    id            SERIAL          PRIMARY KEY,
    net_id        VARCHAR(50)     NOT NULL UNIQUE,
    name          VARCHAR(100)    NOT NULL,
    email         VARCHAR(150)    NOT NULL UNIQUE,
    password_hash TEXT            NOT NULL,
    role          user_role       NOT NULL DEFAULT 'student',
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
-- TABLE: categories
--   Lookup table for event categories (e.g. Music, Academic).
-- ──────────────────────────────────────────────────────────────

CREATE TABLE categories (
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

CREATE TABLE events (
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

-- ──────────────────────────────────────────────────────────────
-- TABLE: event_categories
--   Many-to-many join between events and categories.
--   An event can belong to multiple categories.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE event_categories (
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

CREATE TABLE tickets (
    id                 SERIAL       PRIMARY KEY,
    user_id            INTEGER      NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    event_id           INTEGER      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    purchased_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    checked_in         BOOLEAN      NOT NULL DEFAULT FALSE,
    confirmation_code  VARCHAR(20)  NOT NULL UNIQUE,

    -- A user can only hold one ticket per event
    CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- ============================================================
-- INDEXES (for common query patterns)
-- ============================================================

-- Find all upcoming events quickly
CREATE INDEX idx_events_status ON events(status);

-- Find events by organizer
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- Find events in a time window
CREATE INDEX idx_events_start_time ON events(start_time);

-- Find all tickets for a user (e.g. "My Tickets" page)
CREATE INDEX idx_tickets_user ON tickets(user_id);

-- Find all tickets for an event (e.g. attendee list)
CREATE INDEX idx_tickets_event ON tickets(event_id);

-- ============================================================
-- SAMPLE DATA (for development & demo)
-- ============================================================

INSERT INTO categories (name) VALUES
    ('Academic'),
    ('Music'),
    ('Sports'),
    ('Career'),
    ('Social'),
    ('Arts'),
    ('Technology');

INSERT INTO users (net_id, name, email, password_hash, role) VALUES
    ('admin1',     'Admin User',       'admin@usf.edu',      'hashed_pw_admin',  'admin'),
    ('jsmith22',   'Jane Smith',       'jsmith22@usf.edu',   'hashed_pw_jane',   'organizer'),
    ('trev123',    'Trevor Flahardy',  'trev123@usf.edu',    'hashed_pw_trev',   'student'),
    ('alex456',    'Alex Johnson',     'alex456@usf.edu',    'hashed_pw_alex',   'student'),
    ('maria789',   'Maria Garcia',     'maria789@usf.edu',   'hashed_pw_maria',  'student');

INSERT INTO events (title, description, location, start_time, end_time, capacity, ticket_price, status, organizer_id) VALUES
    (
        'Spring Career Fair 2026',
        'Meet top employers hiring USF students for internships and full-time roles.',
        'Marshall Student Center Ballroom',
        '2026-04-10 10:00:00',
        '2026-04-10 16:00:00',
        500, 0.00, 'upcoming',
        (SELECT id FROM users WHERE net_id = 'jsmith22')
    ),
    (
        'Bulls After Dark: Spring Concert',
        'Live performances by student bands and special guest artists.',
        'USF Amphitheater',
        '2026-04-18 19:00:00',
        '2026-04-18 23:00:00',
        300, 5.00, 'upcoming',
        (SELECT id FROM users WHERE net_id = 'jsmith22')
    ),
    (
        'Hackathon @ USF 2026',
        '24-hour coding competition — form teams, build projects, win prizes.',
        'ENB 118',
        '2026-04-25 09:00:00',
        '2026-04-26 09:00:00',
        150, 0.00, 'upcoming',
        (SELECT id FROM users WHERE net_id = 'jsmith22')
    ),
    (
        'Campus 5K Fun Run',
        'Annual charity 5K run around the USF Tampa campus. All skill levels welcome.',
        'USF Track & Field',
        '2026-05-02 08:00:00',
        '2026-05-02 11:00:00',
        200, 10.00, 'upcoming',
        (SELECT id FROM users WHERE net_id = 'admin1')
    );

INSERT INTO event_categories (event_id, category_id) VALUES
    ((SELECT id FROM events WHERE title = 'Spring Career Fair 2026'),    (SELECT id FROM categories WHERE name = 'Career')),
    ((SELECT id FROM events WHERE title = 'Bulls After Dark: Spring Concert'), (SELECT id FROM categories WHERE name = 'Music')),
    ((SELECT id FROM events WHERE title = 'Bulls After Dark: Spring Concert'), (SELECT id FROM categories WHERE name = 'Social')),
    ((SELECT id FROM events WHERE title = 'Hackathon @ USF 2026'),       (SELECT id FROM categories WHERE name = 'Technology')),
    ((SELECT id FROM events WHERE title = 'Hackathon @ USF 2026'),       (SELECT id FROM categories WHERE name = 'Academic')),
    ((SELECT id FROM events WHERE title = 'Campus 5K Fun Run'),          (SELECT id FROM categories WHERE name = 'Sports'));

INSERT INTO tickets (user_id, event_id, confirmation_code) VALUES
    (
        (SELECT id FROM users WHERE net_id = 'trev123'),
        (SELECT id FROM events WHERE title = 'Spring Career Fair 2026'),
        'CF26A001'
    ),
    (
        (SELECT id FROM users WHERE net_id = 'alex456'),
        (SELECT id FROM events WHERE title = 'Spring Career Fair 2026'),
        'CF26A002'
    ),
    (
        (SELECT id FROM users WHERE net_id = 'trev123'),
        (SELECT id FROM events WHERE title = 'Hackathon @ USF 2026'),
        'HACK2601'
    ),
    (
        (SELECT id FROM users WHERE net_id = 'maria789'),
        (SELECT id FROM events WHERE title = 'Bulls After Dark: Spring Concert'),
        'CONC2601'
    );

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
