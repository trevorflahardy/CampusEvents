import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";

const router = new Hono<AuthEnv>();

// GET /api/users — list all users (admin panel)
router.get("/", authMiddleware, requireRole("admin"), async (c) => {
  const rows = await db
    .select({
      id: users.id,
      netId: users.netId,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);
  return c.json(rows);
});

// GET /api/users/:id — get a user profile
router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const user = await db.select().from(users).where(eq(users.id, id));
  if (!user.length) return c.json({ error: "User not found" }, 404);
  const { passwordHash: _, ...safe } = user[0];
  return c.json(safe);
});

// PATCH /api/users/:id — update user role (admin only)
const updateUserSchema = z.object({
  role: z.enum(["admin", "organizer", "student"]),
});

router.patch("/:id", authMiddleware, requireRole("admin"), async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Invalid user id" }, 400);
  }
  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const updated = await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, id))
    .returning();
  if (!updated.length) return c.json({ error: "User not found" }, 404);
  const { passwordHash: _, ...safe } = updated[0];
  return c.json(safe);
});

// POST /api/users — register a new user with Zod validation
const registerUserSchema = z.object({
  netId: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9]+$/, "NetID must be alphanumeric"),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  role: z.enum(["admin", "organizer", "student"]).optional().default("student"),
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = registerUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  try {
    const inserted = await db.insert(users).values(parsed.data).returning();
    const { passwordHash: _, ...safe } = inserted[0];
    return c.json(safe, 201);
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return c.json(
        { error: "A user with that NetID or email already exists" },
        409,
      );
    }
    console.error("User registration error:", err);
    return c.json({ error: "Failed to register user" }, 500);
  }
});

export default router;
