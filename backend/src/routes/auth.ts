import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { hash, verify as verifyPassword } from "@node-rs/bcrypt";
import { sign } from "hono/jwt";

import { db } from "../db/client";
import { users } from "../db/schema";
import { authMiddleware, JWT_SECRET, type AuthEnv } from "../middleware/auth";

const authRouter = new Hono<AuthEnv>();

// ── Validation schemas ──────────────────────────────────────────────────────

const registerSchema = z.object({
  netId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "organizer", "student"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── POST /register ──────────────────────────────────────────────────────────

authRouter.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const { netId, name, email, password, role } = parsed.data;

  // Check for existing user
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "A user with this email already exists" }, 409);
  }

  const passwordHash = await hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      netId,
      name,
      email,
      passwordHash,
      role: role ?? "student",
    })
    .returning();

  const { passwordHash: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword, 201);
});

// ── POST /login ─────────────────────────────────────────────────────────────

authRouter.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await sign({ sub: user.id, role: user.role }, JWT_SECRET);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return c.json({ token, user: userWithoutPassword });
});

// ── GET /me ─────────────────────────────────────────────────────────────────

authRouter.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword);
});

export default authRouter;
