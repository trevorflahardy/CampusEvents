import { Hono } from "hono";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

import { db } from "../db/client";
import { categories, eventCategories, events } from "../db/schema";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";

const categoriesRouter = new Hono<AuthEnv>();

// ── GET / — list all categories (public) ────────────────────────────────────

categoriesRouter.get("/", async (c) => {
  const rows = await db.select().from(categories);
  return c.json(rows);
});

// ── GET /popular — categories with more than 1 event (SELECT + HAVING) ──────

categoriesRouter.get("/popular", async (c) => {
  const rows = await db
    .select({
      categoryId: categories.id,
      name: categories.name,
      eventCount: sql<number>`count(${eventCategories.eventId})`,
    })
    .from(categories)
    .innerJoin(eventCategories, eq(categories.id, eventCategories.categoryId))
    .groupBy(categories.id, categories.name)
    .having(sql`count(${eventCategories.eventId}) > 1`);

  return c.json(rows);
});

// ── GET /:id/events — events in a category (JOIN) ───────────────────────────

categoriesRouter.get("/:id/events", async (c) => {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid category ID" }, 400);
  }

  const rows = await db
    .select({ event: events })
    .from(events)
    .innerJoin(eventCategories, eq(events.id, eventCategories.eventId))
    .where(eq(eventCategories.categoryId, id));

  return c.json(rows.map((r) => r.event));
});

// ── POST / — create category (admin only) ───────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1),
});

categoriesRouter.post("/", authMiddleware, requireRole("admin"), async (c) => {
  const body = await c.req.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const [category] = await db
    .insert(categories)
    .values({ name: parsed.data.name })
    .returning();

  return c.json(category, 201);
});

export default categoriesRouter;
