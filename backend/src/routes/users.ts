import { Hono } from "hono";
import { z } from "zod";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
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

// PATCH /api/users/:id/role — update user role (admin only)
const updateRoleSchema = z.object({
  role: z.enum(["admin", "organizer", "student"]),
});

router.patch("/:id/role", authMiddleware, requireRole("admin"), async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Invalid user id" }, 400);
  }
  const body = await c.req.json();
  const parsed = updateRoleSchema.safeParse(body);
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

// PATCH /api/users/:id/profile — update own profile (name, email)
const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
});

router.patch("/:id/profile", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const callerUserId = c.get("userId");

  if (id !== callerUserId) {
    return c.json({ error: "You can only update your own profile" }, 403);
  }

  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  if (!parsed.data.name && !parsed.data.email) {
    return c.json({ error: "No fields to update" }, 400);
  }

  try {
    const updated = await db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, id))
      .returning();
    if (!updated.length) return c.json({ error: "User not found" }, 404);
    const { passwordHash: _, ...safe } = updated[0];
    return c.json(safe);
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return c.json({ error: "A user with that email already exists" }, 409);
    }
    throw err;
  }
});

// POST /api/users/:id/photo — upload profile photo (self only)
router.post("/:id/photo", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const callerUserId = c.get("userId");

  if (id !== callerUserId) {
    return c.json({ error: "You can only update your own photo" }, 403);
  }

  const formData = await c.req.formData();
  const file = formData.get("photo") as File | null;
  if (!file) return c.json({ error: "No photo file provided" }, 400);

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return c.json({ error: "Invalid image type" }, 400);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `avatar_${id}_${Date.now()}.${ext}`;
  const uploadsDir = join(import.meta.dir, "..", "..", "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  const filepath = join(uploadsDir, filename);

  await Bun.write(filepath, file);

  const profilePhoto = `/uploads/${filename}`;
  const updated = await db
    .update(users)
    .set({ profilePhoto })
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
