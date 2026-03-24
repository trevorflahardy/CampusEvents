# 🎟️ CampusEvents — Campus Event & Ticket Booking System

> **COP 4710 Spring 2026 — Term Project**
> A full-stack online enterprise information system built for USF students and event organizers.

---

## Tech Stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Backend  | Bun + Hono (REST API)                          |
| Database | PostgreSQL 16                                  |
| ORM      | Drizzle ORM                                    |
| Dev DB   | Docker Compose                                 |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com/products/docker-desktop) (for Postgres)
- Node.js (for the client, or use `bun` to run Vite too)

### 1. Clone the repo

```bash
git clone https://github.com/trevorflahardy/campusevents.git
cd campusevents
```

### 2. Start the database

```bash
docker compose up -d
```

This starts a Postgres 16 instance at `localhost:5432` with:

- **Database:** `campusevents`
- **User:** `campus`
- **Password:** `campus123`

### 3. Set up environment variables

```bash
cp .env.example server/.env
```

### 4. Install & run the backend

```bash
cd server
bun install
bun run db:generate    # generate migration files from schema
bun run db:migrate     # apply migrations to the DB
bun run src/db/seed.ts # (optional) seed with sample data
bun run dev            # start the API server on :3000
```

### 5. Install & run the frontend

```bash
cd client
bun install   # or npm install
bun run dev   # starts Vite on :5173, proxies /api to :3000
```

---

## API Endpoints

| Method | Path                      | Description                |
| ------ | ------------------------- | -------------------------- |
| GET    | /api/events               | List all events            |
| GET    | /api/events/:id           | Get event by ID            |
| POST   | /api/events               | Create a new event         |
| PATCH  | /api/events/:id           | Update event details       |
| DELETE | /api/events/:id           | Delete/cancel an event     |
| GET    | /api/events/:id/tickets   | Ticket count for an event  |
| GET    | /api/tickets/user/:userId | Get all tickets for a user |
| POST   | /api/tickets              | Purchase a ticket          |
| PATCH  | /api/tickets/:id/checkin  | Check in a ticket          |
| DELETE | /api/tickets/:id          | Cancel a ticket            |
| GET    | /api/users/:id            | Get user profile           |
| POST   | /api/users                | Register a user            |

---

## Database Schema (Overview)

See `server/src/db/schema.ts` for the full Drizzle schema.

| Table              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `users`            | Students, organizers, and admins                 |
| `events`           | Campus events with time, location, capacity      |
| `tickets`          | Tickets linking users to events                  |
| `categories`       | Event categories (Music, Sports, Academic, etc.) |
| `event_categories` | Many-to-many join between events and categories  |

---

## Project Deadlines

| Date       | Deliverable                                                 |
| ---------- | ----------------------------------------------------------- |
| **Mar 30** | Mini report: team roster + ER diagram (conceptual design)   |
| **Apr 10** | Progress report: working skeleton of all 3 tiers            |
| **May 1**  | Final submission: full report + code zip + 10-min live demo |

---

## Team

| Name             |
| ---------------- |
| Trevor Flahardy  |
| Sofia Cobo Navas |

---

## Grading Checklist

- [x] Database with ≥ 3 tables (we have 5)
- [ ] ≥ 8 distinct SQL query types (including INSERT, UPDATE, DELETE)
- [ ] ≥ 3 different UI pages/screens
- [x] JDBC/ODBC equivalent (JDBC analog = Drizzle ORM over postgres.js)
- [ ] User accounts with login/password _(bonus)_
- [ ] Database views + user privileges _(bonus)_
- [ ] Stored procedures/functions _(bonus)_
- [ ] Client-side JavaScript logic _(bonus — React handles this)_
