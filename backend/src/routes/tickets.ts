import { Hono } from "hono";
import { z } from "zod";
import sql from "../db/client";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const router = new Hono<AuthEnv>();

// Q5: POST /api/tickets — purchase a ticket (INSERT) with capacity check
const purchaseSchema = z.object({
  userId: z.number().int().positive(),
  eventId: z.number().int().positive(),
});

router.post("/", authMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const { userId, eventId } = parsed.data;

  // Q5 pre-flight: SELECT with correlated subquery to check event capacity.
  // The subquery counts existing tickets for this event inline,
  // avoiding a separate COUNT query and potential race condition window.
  const event = await sql`
    SELECT e.id, e.capacity, e.status,
           (SELECT COUNT(*)::int FROM tickets WHERE event_id = e.id) AS tickets_sold
    FROM events e
    WHERE e.id = ${eventId}
  `;

  if (!event.length) return c.json({ error: "Event not found" }, 404);
  if (event[0].status === "cancelled")
    return c.json({ error: "Event is cancelled" }, 400);
  if (event[0].ticketsSold >= event[0].capacity)
    return c.json({ error: "Event is sold out" }, 400);

  const confirmationCode = crypto.randomUUID().slice(0, 8).toUpperCase();

  try {
    // Q5: INSERT a new ticket with a unique confirmation code.
    // The UNIQUE(user_id, event_id) constraint prevents double bookings —
    // if violated, PostgreSQL raises error code 23505.
    const [inserted] = await sql`
      INSERT INTO tickets (user_id, event_id, confirmation_code)
      VALUES (${userId}, ${eventId}, ${confirmationCode})
      RETURNING *
    `;
    return c.json(inserted, 201);
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return c.json({ error: "You already have a ticket for this event" }, 409);
    }
    console.error("Ticket purchase error:", err);
    return c.json({ error: "Failed to purchase ticket" }, 500);
  }
});

// Q4: GET /api/tickets/user/:userId — user's tickets with event info and categories (multiple JOINs)
router.get("/user/:userId", authMiddleware, async (c) => {
  const userId = Number(c.req.param("userId"));

  // Q4: SELECT with multiple JOINs — tickets joined with events
  // to retrieve full event details alongside each ticket.
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

  // For each ticket, fetch the event's categories via the join table.
  // This uses a separate query per event to get category names.
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const eventId = (row as Record<string, unknown>).eventId as number;
      const cats = await sql`
        SELECT c.id, c.name
        FROM categories c
        INNER JOIN event_categories ec ON c.id = ec.category_id
        WHERE ec.event_id = ${eventId}
      `;
      return { ...row, categories: cats };
    }),
  );

  return c.json(enriched);
});

// Q6: PATCH /api/tickets/:id/checkin — check in a ticket (UPDATE)
// Self-check-in: allowed 30 min before event start through event end.
// Organizers/admins can still check in any ticket at any time.
router.patch("/:id/checkin", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const callerId = c.get("userId");
  const callerRole = c.get("userRole");

  // Fetch the ticket joined with its event so we can validate timing.
  // The JOIN gives us event start/end times and organizer ID in one query.
  const rows = await sql`
    SELECT t.id AS ticket_id, t.user_id AS ticket_user_id, t.checked_in,
           e.start_time AS event_start_time, e.end_time AS event_end_time,
           e.organizer_id AS event_organizer_id
    FROM tickets t
    INNER JOIN events e ON t.event_id = e.id
    WHERE t.id = ${id}
  `;

  if (!rows.length) return c.json({ error: "Ticket not found" }, 404);

  const ticket = rows[0];
  const isTicketOwner = callerId === ticket.ticketUserId;
  const isOrgOrAdmin =
    callerRole === "admin" || callerId === ticket.eventOrganizerId;

  if (!isTicketOwner && !isOrgOrAdmin) {
    return c.json({ error: "Not authorized to check in this ticket" }, 403);
  }

  // For self-check-in, enforce the 30-min-before-start through event-end window
  if (isTicketOwner && !isOrgOrAdmin) {
    const now = new Date();
    const windowStart = new Date(
      new Date(ticket.eventStartTime).getTime() - 30 * 60 * 1000,
    );
    const windowEnd = new Date(ticket.eventEndTime);
    if (now < windowStart) {
      return c.json(
        { error: "Check-in opens 30 minutes before the event starts" },
        400,
      );
    }
    if (now > windowEnd) {
      return c.json({ error: "Check-in has closed for this event" }, 400);
    }
  }

  // Q6: UPDATE — set checked_in to TRUE and return the modified ticket
  const [updated] = await sql`
    UPDATE tickets
    SET checked_in = TRUE
    WHERE id = ${id}
    RETURNING *
  `;
  return c.json(updated);
});

// Q8: DELETE /api/tickets/:id — cancel a ticket (DELETE)
router.delete("/:id", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));

  // Q8: DELETE a ticket by primary key and return the deleted row.
  // If no row is returned, the ticket didn't exist.
  const deleted = await sql`
    DELETE FROM tickets
    WHERE id = ${id}
    RETURNING *
  `;
  if (!deleted.length) return c.json({ error: "Ticket not found" }, 404);
  return c.json({ success: true });
});

export default router;
