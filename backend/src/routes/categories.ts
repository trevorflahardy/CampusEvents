import { Hono } from "hono";
import { z } from "zod";
import sql from "../db/client";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";

const categoriesRouter = new Hono<AuthEnv>();

// ── GET / — list all categories (public) ────────────────────────────────────

categoriesRouter.get("/", async (c) => {
  // Simple SELECT to retrieve every category row
  const rows = await sql`SELECT id, name FROM categories`;
  return c.json(rows);
});

// ── GET /popular — categories with more than 1 event (SELECT + HAVING) ──────

categoriesRouter.get("/popular", async (c) => {
  // Q9: SELECT with GROUP BY + HAVING
  // Groups categories by their event count via the join table,
  // then filters to only those appearing in more than one event.
  const rows = await sql`
    SELECT c.id AS category_id, c.name,
           COUNT(ec.event_id)::int AS event_count
    FROM categories c
    INNER JOIN event_categories ec ON c.id = ec.category_id
    GROUP BY c.id, c.name
    HAVING COUNT(ec.event_id) > 1
  `;

  return c.json(rows);
});

// ── GET /:id/events — events in a category (JOIN) ───────────────────────────

categoriesRouter.get("/:id/events", async (c) => {
  const id = Number(c.req.param("id"));

  if (Number.isNaN(id)) {
    return c.json({ error: "Invalid category ID" }, 400);
  }

  // SELECT with JOIN through the event_categories many-to-many table
  // to find all events belonging to the given category
  const rows = await sql`
    SELECT e.*
    FROM events e
    INNER JOIN event_categories ec ON e.id = ec.event_id
    WHERE ec.category_id = ${id}
  `;

  return c.json(rows);
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

  // INSERT a new category and return the created row
  const [category] = await sql`
    INSERT INTO categories (name)
    VALUES (${parsed.data.name})
    RETURNING *
  `;

  return c.json(category, 201);
});

export default categoriesRouter;
