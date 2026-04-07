import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import {
  tickets,
  events,
  users,
  eventCategories,
  categories,
} from "../db/schema";
import { eq, sql } from "drizzle-orm";
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

  // Check event exists and has capacity
  const event = await db
    .select({
      id: events.id,
      capacity: events.capacity,
      status: events.status,
      ticketsSold: sql<number>`(SELECT count(*) FROM tickets WHERE tickets.event_id = ${events.id})`,
    })
    .from(events)
    .where(eq(events.id, eventId));

  if (!event.length) return c.json({ error: "Event not found" }, 404);
  if (event[0].status === "cancelled")
    return c.json({ error: "Event is cancelled" }, 400);
  if (event[0].ticketsSold >= event[0].capacity)
    return c.json({ error: "Event is sold out" }, 400);

  const confirmationCode = crypto.randomUUID().slice(0, 8).toUpperCase();

  try {
    const inserted = await db
      .insert(tickets)
      .values({ userId, eventId, confirmationCode })
      .returning();
    return c.json(inserted[0], 201);
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

  // Get tickets with event details
  const rows = await db
    .select({
      ticketId: tickets.id,
      purchasedAt: tickets.purchasedAt,
      checkedIn: tickets.checkedIn,
      confirmationCode: tickets.confirmationCode,
      eventId: events.id,
      eventTitle: events.title,
      eventLocation: events.location,
      eventStartTime: events.startTime,
      eventEndTime: events.endTime,
      eventStatus: events.status,
      ticketPrice: events.ticketPrice,
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .where(eq(tickets.userId, userId))
    .orderBy(events.startTime);

  // For each ticket, fetch the event's categories
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const cats = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .innerJoin(
          eventCategories,
          eq(categories.id, eventCategories.categoryId),
        )
        .where(eq(eventCategories.eventId, row.eventId));
      return { ...row, categories: cats };
    }),
  );

  return c.json(enriched);
});

// Q6: PATCH /api/tickets/:id/checkin — check in a ticket (UPDATE)
router.patch("/:id/checkin", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const updated = await db
    .update(tickets)
    .set({ checkedIn: true })
    .where(eq(tickets.id, id))
    .returning();
  if (!updated.length) return c.json({ error: "Ticket not found" }, 404);
  return c.json(updated[0]);
});

// Q8: DELETE /api/tickets/:id — cancel a ticket (DELETE)
router.delete("/:id", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await db
    .delete(tickets)
    .where(eq(tickets.id, id))
    .returning();
  if (!deleted.length) return c.json({ error: "Ticket not found" }, 404);
  return c.json({ success: true });
});

export default router;
