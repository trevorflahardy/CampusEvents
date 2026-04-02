# CampusEvents — Campus Event & Ticket Booking System

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
| Auth     | JWT + bcrypt                                   |
| Dev DB   | Docker Compose                                 |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com/products/docker-desktop) (for Postgres)

### 1. Clone the repo

```bash
git clone https://github.com/trevorflahardy/campusevents.git
cd campusevents
```

### 2. Start the database

```bash
docker compose up -d postgres
```

This starts a Postgres 16 instance at `localhost:5432` with:

- **Database:** `campusevents`
- **User:** `campus`
- **Password:** `campus123`

### 3. Install & run the backend

```bash
cd backend
bun install
export DATABASE_URL="postgres://campus:campus123@localhost:5432/campusevents"
bun run db:generate    # generate migration files from schema
bun run db:migrate     # apply migrations to the DB
bun run src/db/seed.ts # (optional) seed with sample data
bun run dev            # start the API server on :3000
```

### 4. Install & run the frontend

```bash
cd frontend
bun install
bun run dev   # starts Vite on :5173, proxies /api to :3000
```

### Docker Compose (all services)

To run everything at once:

```bash
docker compose up -d
```

This starts:
- **postgres** on `:5432`
- **backend** on `:3000`
- **frontend** on `:5173`

### Seed User Credentials

All seed users share the password `password123`:

| Email            | Role      |
| ---------------- | --------- |
| admin@usf.edu    | admin     |
| jane@usf.edu     | organizer |
| trevor@usf.edu   | student   |
| alex@usf.edu     | student   |

---

## API Endpoints

### Auth

| Method | Path                | Description              |
| ------ | ------------------- | ------------------------ |
| POST   | /api/auth/register  | Register a new user      |
| POST   | /api/auth/login     | Login, returns JWT token |
| GET    | /api/auth/me        | Get current user profile |

### Events

| Method | Path                    | Description                               |
| ------ | ----------------------- | ----------------------------------------- |
| GET    | /api/events             | List events (supports filters)            |
| GET    | /api/events/stats       | Ticket stats per event (GROUP BY + COUNT) |
| GET    | /api/events/:id         | Get event with remaining capacity         |
| POST   | /api/events             | Create a new event                        |
| PATCH  | /api/events/:id         | Update/cancel event                       |
| DELETE | /api/events/:id         | Delete an event                           |
| GET    | /api/events/:id/tickets | List attendees for an event               |

### Tickets

| Method | Path                      | Description          |
| ------ | ------------------------- | -------------------- |
| POST   | /api/tickets              | Purchase a ticket    |
| GET    | /api/tickets/user/:userId | Get user's tickets   |
| PATCH  | /api/tickets/:id/checkin  | Check in a ticket    |
| DELETE | /api/tickets/:id          | Cancel a ticket      |

### Categories

| Method | Path                       | Description                    |
| ------ | -------------------------- | ------------------------------ |
| GET    | /api/categories            | List all categories            |
| GET    | /api/categories/popular    | Categories with >1 event       |
| GET    | /api/categories/:id/events | Events in a category           |
| POST   | /api/categories            | Create category (admin only)   |

### Users

| Method | Path           | Description       |
| ------ | -------------- | ----------------- |
| GET    | /api/users     | List all users    |
| GET    | /api/users/:id | Get user profile  |

---

## UI Pages

| Page                | Route         | Access    | Description                                        |
| ------------------- | ------------- | --------- | -------------------------------------------------- |
| Browse Events       | /             | Public    | Search and filter events with category/date/status |
| Event Detail        | /events/:id   | Public    | Full event info, capacity bar, book ticket         |
| My Tickets          | /my-tickets   | Student   | Booking history with confirmation codes            |
| Organizer Dashboard | /dashboard    | Organizer | Create events, view attendees, check-in            |
| Admin Panel         | /admin        | Admin     | Manage users, events, and categories               |
| Login               | /login        | Public    | Email/password login                               |
| Register            | /register     | Public    | Create a new account                               |

---

## SQL Query Types (10 required)

| #   | Type                     | Endpoint                       |
| --- | ------------------------ | ------------------------------ |
| Q1  | SELECT + JOIN            | GET /api/events                |
| Q2  | GROUP BY + COUNT         | GET /api/events/stats          |
| Q3  | SELECT + subquery        | GET /api/events/:id            |
| Q4  | Multiple JOINs           | GET /api/tickets/user/:userId  |
| Q5  | INSERT                   | POST /api/tickets              |
| Q6  | UPDATE                   | PATCH /api/tickets/:id/checkin |
| Q7  | UPDATE                   | PATCH /api/events/:id          |
| Q8  | DELETE                   | DELETE /api/tickets/:id        |
| Q9  | SELECT + HAVING          | GET /api/categories/popular    |
| Q10 | SELECT + BETWEEN         | GET /api/events?from=&to=      |

---

## Database Schema

See `backend/src/db/schema.ts` for the full Drizzle schema.

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

- [x] Database with >= 3 tables (we have 5)
- [x] >= 8 distinct SQL query types (we have 10)
- [x] >= 3 different UI pages/screens (we have 5 + auth pages)
- [x] JDBC/ODBC equivalent (Drizzle ORM over postgres.js)
- [x] User accounts with login/password _(bonus)_
- [ ] Database views + user privileges _(bonus)_
- [ ] Stored procedures/functions _(bonus)_
- [x] Client-side JavaScript logic _(bonus — React handles this)_
