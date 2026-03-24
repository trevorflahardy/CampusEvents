import { Hono } from "hono";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const router = new Hono();

// GET /api/users/:id — get a user profile
router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const user = await db.select().from(users).where(eq(users.id, id));
  if (!user.length) return c.json({ error: "User not found" }, 404);
  const { passwordHash: _, ...safe } = user[0];
  return c.json(safe);
});

// POST /api/users — register a new user
router.post("/", async (c) => {
  const body = await c.req.json();
  const inserted = await db.insert(users).values(body).returning();
  const { passwordHash: _, ...safe } = inserted[0];
  return c.json(safe, 201);
});

export default router;
