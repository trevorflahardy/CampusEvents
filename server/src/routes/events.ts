import { Hono } from "hono";
import { db } from "../db/client";
import { events, tickets, eventCategories, categories } from "../db/schema";
import { eq, sql } from "drizzle-orm";

const router = new Hono();

// GET /api/events — list all upcoming events
router.get("/", async (c) => {
  const rows = await db.select().from(events);
  return c.json(rows);
});

// GET /api/events/:id — get a single event with category tags
router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const event = await db.select().from(events).where(eq(events.id, id));
  if (!event.length) return c.json({ error: "Event not found" }, 404);
  return c.json(event[0]);
});

// POST /api/events — create a new event (organizer/admin only — auth middleware TODO)
router.post("/", async (c) => {
  const body = await c.req.json();
  const inserted = await db.insert(events).values(body).returning();
  return c.json(inserted[0], 201);
});

// PATCH /api/events/:id — update event details
router.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const updated = await db.update(events).set(body).where(eq(events.id, id)).returning();
  if (!updated.length) return c.json({ error: "Event not found" }, 404);
  return c.json(updated[0]);
});

// DELETE /api/events/:id — cancel/delete an event
router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(events).where(eq(events.id, id));
  return c.json({ success: true });
});

// GET /api/events/:id/tickets — get ticket count for an event
router.get("/:id/tickets", async (c) => {
  const id = Number(c.req.param("id"));
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets)
    .where(eq(tickets.eventId, id));
  return c.json({ eventId: id, ticketsSold: result[0].count });
});

export default router;
