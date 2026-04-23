import { Hono } from "hono";
import { z } from "zod";
import { hash, verify as verifyPassword } from "@node-rs/bcrypt";
import { sign } from "hono/jwt";

import sql from "../db/client";
import { authMiddleware, JWT_SECRET, type AuthEnv } from "../middleware/auth";

const authRouter = new Hono<AuthEnv>();

// ── Validation schemas ──────────────────────────────────────────────────────

// Public registration is always student-level. Elevated roles must be
// granted by an admin via PATCH /api/users/:id/role.
const registerSchema = z.object({
  netId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
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

  const { netId, name, email, password } = parsed.data;

  // Check for existing user by email to provide a friendly error message
  const existing = await sql`
    SELECT id FROM users WHERE email = ${email} LIMIT 1
  `;

  if (existing.length > 0) {
    return c.json({ error: "A user with this email already exists" }, 409);
  }

  const passwordHash = await hash(password, 10);

  // INSERT a new user with hashed password. Role is forced to 'student';
  // an admin must promote accounts via PATCH /api/users/:id/role.
  const [user] = await sql`
    INSERT INTO users (net_id, name, email, password_hash, role)
    VALUES (${netId}, ${name}, ${email}, ${passwordHash}, 'student')
    RETURNING *
  `;

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

  // SELECT user by email for credential verification
  const [user] = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;

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

  // SELECT the authenticated user's profile by their JWT-derived ID
  const [user] = await sql`
    SELECT * FROM users WHERE id = ${userId} LIMIT 1
  `;

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  return c.json(userWithoutPassword);
});

export default authRouter;
