import { Hono } from "hono";
import { db } from "../db/client";
import { tickets } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = new Hono();

// POST /api/tickets — purchase a ticket
router.post("/", async (c) => {
  const body = await c.req.json<{ userId: number; eventId: number }>();
  const confirmationCode = randomUUID().slice(0, 8).toUpperCase();
  const inserted = await db
    .insert(tickets)
    .values({ ...body, confirmationCode })
    .returning();
  return c.json(inserted[0], 201);
});

// GET /api/tickets/user/:userId — get all tickets for a user
router.get("/user/:userId", async (c) => {
  const userId = Number(c.req.param("userId"));
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.userId, userId));
  return c.json(rows);
});

// PATCH /api/tickets/:id/checkin — check in a ticket
router.patch("/:id/checkin", async (c) => {
  const id = Number(c.req.param("id"));
  const updated = await db
    .update(tickets)
    .set({ checkedIn: true })
    .where(eq(tickets.id, id))
    .returning();
  if (!updated.length) return c.json({ error: "Ticket not found" }, 404);
  return c.json(updated[0]);
});

// DELETE /api/tickets/:id — cancel a ticket
router.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await db.delete(tickets).where(eq(tickets.id, id));
  return c.json({ success: true });
});

export default router;
