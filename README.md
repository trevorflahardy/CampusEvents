# CampusEvents — Campus Event & Ticket Booking System

> **COP 4710 Spring 2026 — Term Project**
> A full-stack online enterprise information system built for USF students and event organizers.
> <img width="1280" height="794" alt="image" src="https://github.com/user-attachments/assets/e16ce4ae-072d-4ca5-bc42-882d068b2c1f" />
> <img width="1285" height="796" alt="image" src="https://github.com/user-attachments/assets/bd7ea582-21ae-4dc9-83e9-d2ca44d31dc1" />
> <img width="1284" height="790" alt="image" src="https://github.com/user-attachments/assets/c698e2c1-8e94-485a-85de-10a6ece8348c" />

---

## Tech Stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| Backend  | Bun + Hono (REST API)                          |
| Database | PostgreSQL 16                                  |
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
bun run db:migrate   # apply schema to the DB
bun run db:seed      # (optional) seed with sample data
bun run dev          # start the API server on :3000
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

| Name            | Email              | Role      |
| --------------- | ------------------ | --------- |
| Admin User      | admin@usf.edu      | admin     |
| Jane Smith      | jsmith22@usf.edu   | organizer |
| Trevor Flahardy | trev123@usf.edu    | student   |
| Alex Johnson    | alex456@usf.edu    | student   |
| Maria Garcia    | maria789@usf.edu   | student   |

---

## API Endpoints

### Auth

| Method | Path               | Description              |
| ------ | ------------------ | ------------------------ |
| POST   | /api/auth/register | Register a new user      |
| POST   | /api/auth/login    | Login, returns JWT token |
| GET    | /api/auth/me       | Get current user profile |

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

| Method | Path                      | Description        |
| ------ | ------------------------- | ------------------ |
| POST   | /api/tickets              | Purchase a ticket  |
| GET    | /api/tickets/user/:userId | Get user's tickets |
| PATCH  | /api/tickets/:id/checkin  | Check in a ticket  |
| DELETE | /api/tickets/:id          | Cancel a ticket    |

### Categories

| Method | Path                       | Description                  |
| ------ | -------------------------- | ---------------------------- |
| GET    | /api/categories            | List all categories          |
| GET    | /api/categories/popular    | Categories with >1 event     |
| GET    | /api/categories/:id/events | Events in a category         |
| POST   | /api/categories            | Create category (admin only) |

### Users

| Method | Path           | Description      |
| ------ | -------------- | ---------------- |
| GET    | /api/users     | List all users   |
| GET    | /api/users/:id | Get user profile |

---

## UI Pages

| Page                | Route       | Access    | Description                                        |
| ------------------- | ----------- | --------- | -------------------------------------------------- |
| Browse Events       | /           | Public    | Search and filter events with category/date/status |
| Event Detail        | /events/:id | Public    | Full event info, capacity bar, book ticket         |
| My Tickets          | /my-tickets | Student   | Booking history with confirmation codes            |
| Organizer Dashboard | /dashboard  | Organizer | Create events, view attendees, check-in            |
| Admin Panel         | /admin      | Admin     | Manage users, events, and categories               |
| Login               | /login      | Public    | Email/password login                               |
| Register            | /register   | Public    | Create a new account                               |

---

## SQL Query Types (10 required)

| #   | Type              | Endpoint                       |
| --- | ----------------- | ------------------------------ |
| Q1  | SELECT + JOIN     | GET /api/events                |
| Q2  | GROUP BY + COUNT  | GET /api/events/stats          |
| Q3  | SELECT + subquery | GET /api/events/:id            |
| Q4  | Multiple JOINs    | GET /api/tickets/user/:userId  |
| Q5  | INSERT            | POST /api/tickets              |
| Q6  | UPDATE            | PATCH /api/tickets/:id/checkin |
| Q7  | UPDATE            | PATCH /api/events/:id          |
| Q8  | DELETE            | DELETE /api/tickets/:id        |
| Q9  | SELECT + HAVING   | GET /api/categories/popular    |
| Q10 | SELECT + BETWEEN  | GET /api/events?from=&to=      |

---

## Database Schema

See `schema.sql` at the project root for the full DDL.

### Tables

| Table              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `users`            | Students, organizers, and admins                 |
| `events`           | Campus events with time, location, capacity      |
| `tickets`          | Tickets linking users to events                  |
| `categories`       | Event categories (Music, Sports, Academic, etc.) |
| `event_categories` | Many-to-many join between events and categories  |
| `images`           | Uploaded images stored as base64                 |

### Views (bonus)

| View              | Description                                     |
| ----------------- | ----------------------------------------------- |
| `v_upcoming_events` | Public-facing view of non-cancelled events    |
| `v_event_stats`     | Aggregated ticket counts per event (organizer use) |

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

- [x] Database with >= 3 tables (we have 6)
- [x] >= 8 distinct SQL query types (we have 10)
- [x] >= 3 different UI pages/screens (we have 5 + auth pages)
- [x] User accounts with login/password _(bonus)_
- [x] Database views _(bonus — `v_upcoming_events`, `v_event_stats`)_
- [x] Stored procedures/functions _(bonus — PL/pgSQL function in `schema.sql`)_
- [x] Client-side JavaScript logic _(bonus — React handles this)_
