import { Hono } from "hono";
import { z } from "zod";
import sql from "../db/client";
import { authMiddleware, type AuthEnv } from "../middleware/auth";

const router = new Hono<AuthEnv>();

// Q5: POST /api/tickets — purchase a ticket (INSERT) with capacity check.
// The purchaser is always the JWT-authenticated caller; the body's userId
// is accepted for backward compatibility but must match the caller or be
// absent (prevents buying tickets on another user's behalf).
const purchaseSchema = z.object({
  userId: z.number().int().positive().optional(),
  eventId: z.number().int().positive(),
});

router.post("/", authMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const callerId = c.get("userId");
  const callerRole = c.get("userRole");
  const { userId: bodyUserId, eventId } = parsed.data;

  // Non-admins may only purchase tickets for themselves.
  if (
    callerRole !== "admin" &&
    bodyUserId !== undefined &&
    bodyUserId !== callerId
  ) {
    return c.json(
      { error: "Cannot purchase a ticket on behalf of another user" },
      403,
    );
  }
  const userId = callerRole === "admin" ? (bodyUserId ?? callerId) : callerId;

  const confirmationCode = crypto.randomUUID().slice(0, 8).toUpperCase();

  type PurchaseOutcome =
    | { kind: "not_found" }
    | { kind: "cancelled" }
    | { kind: "sold_out" }
    | { kind: "ok"; ticket: Record<string, unknown> };

  try {
    // Wrap capacity check + insert in a transaction with a row-level lock
    // on the event. SELECT ... FOR UPDATE blocks concurrent purchasers until
    // this transaction commits, so the ticket count we read is the count
    // that will be authoritative at insert time. This is what actually
    // prevents oversell under concurrent requests.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outcome: PurchaseOutcome = await sql.begin(async (tx: any) => {
      const [event] = await tx`
        SELECT id, capacity, status
        FROM events
        WHERE id = ${eventId}
        FOR UPDATE
      `;

      if (!event) return { kind: "not_found" };
      if (event.status === "cancelled") return { kind: "cancelled" };

      // Call the stored function to get current capacity stats.
      // check_event_capacity() counts tickets and returns spots_remaining
      // and is_available. Running it inside the FOR UPDATE transaction means
      // the ticket count it reads is authoritative — no other transaction
      // can insert a ticket for this event until we commit.
      const [cap] = await tx`SELECT * FROM check_event_capacity(${eventId})`;
      if (!cap || !cap.isAvailable) return { kind: "sold_out" };

      const [inserted] = await tx`
        INSERT INTO tickets (user_id, event_id, confirmation_code)
        VALUES (${userId}, ${eventId}, ${confirmationCode})
        RETURNING *
      `;
      return { kind: "ok", ticket: inserted };
    });

    if (outcome.kind === "not_found") {
      return c.json({ error: "Event not found" }, 404);
    }
    if (outcome.kind === "cancelled") {
      return c.json({ error: "Event is cancelled" }, 400);
    }
    if (outcome.kind === "sold_out") {
      return c.json({ error: "Event is sold out" }, 400);
    }
    return c.json(outcome.ticket, 201);
  } catch (err) {
    const pgErr = err as { code?: string };
    // UNIQUE(user_id, event_id) constraint — user already has a ticket.
    if (pgErr.code === "23505") {
      return c.json({ error: "You already have a ticket for this event" }, 409);
    }
    console.error("Ticket purchase error:", err);
    return c.json({ error: "Failed to purchase ticket" }, 500);
  }
});

// Q4: GET /api/tickets/user/:userId — user's tickets with event info and categories (multiple JOINs).
// Authz: a user may only view their own tickets; admins may view any.
router.get("/user/:userId", authMiddleware, async (c) => {
  const userId = Number(c.req.param("userId"));
  if (!Number.isInteger(userId) || userId <= 0) {
    return c.json({ error: "Invalid user id" }, 400);
  }

  const callerId = c.get("userId");
  const callerRole = c.get("userRole");
  if (callerRole !== "admin" && callerId !== userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

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

  // Batch-fetch categories for all referenced events in one query to avoid
  // the N+1 pattern. Group them into a map keyed by event_id for O(1) lookup.
  const eventIds = rows.map(
    (r) => (r as Record<string, unknown>).eventId as number,
  );
  const categoryRows =
    eventIds.length > 0
      ? await sql`
          SELECT ec.event_id, c.id, c.name
          FROM categories c
          INNER JOIN event_categories ec ON c.id = ec.category_id
          WHERE ec.event_id = ANY(${eventIds})
        `
      : [];

  const categoryMap: Record<number, { id: number; name: string }[]> = {};
  for (const row of categoryRows) {
    const eid = (row as Record<string, unknown>).eventId as number;
    if (!categoryMap[eid]) categoryMap[eid] = [];
    categoryMap[eid].push({
      id: (row as Record<string, unknown>).id as number,
      name: (row as Record<string, unknown>).name as string,
    });
  }

  const enriched = rows.map((row) => {
    const eventId = (row as Record<string, unknown>).eventId as number;
    return { ...row, categories: categoryMap[eventId] ?? [] };
  });

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
