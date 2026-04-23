import { Hono } from "hono";
import { z } from "zod";
import sql from "../db/client";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";

const router = new Hono<AuthEnv>();

// GET /api/users — list all users (admin panel)
router.get("/", authMiddleware, requireRole("admin"), async (c) => {
  // SELECT specific columns, excluding password_hash for security
  const rows = await sql`
    SELECT id, net_id, name, email, role, created_at
    FROM users
  `;
  return c.json(rows);
});

// GET /api/users/:id — get a user profile
router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  // SELECT all columns for a single user by primary key
  const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!user) return c.json({ error: "User not found" }, 404);

  const { passwordHash: _, ...safe } = user;
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

  // UPDATE a user's role and return the modified row
  const [updated] = await sql`
    UPDATE users
    SET role = ${parsed.data.role}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!updated) return c.json({ error: "User not found" }, 404);

  const { passwordHash: _, ...safe } = updated;
  return c.json(safe);
});

// PATCH /api/users/:id/profile — update own profile (name, email)
const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
});

router.patch("/:id/profile", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Invalid user id" }, 400);
  }
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
    // UPDATE user profile — build SET clause from provided fields.
    // We construct the update object with snake_case keys for SQL column names.
    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email;

    const [updated] = await sql`
      UPDATE users
      SET ${sql(updates, ...Object.keys(updates))}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!updated) return c.json({ error: "User not found" }, 404);

    const { passwordHash: _, ...safe } = updated;
    return c.json(safe);
  } catch (err) {
    const pgErr = err as { code?: string };
    // PostgreSQL error 23505: unique constraint violation (duplicate email)
    if (pgErr.code === "23505") {
      return c.json({ error: "A user with that email already exists" }, 409);
    }
    throw err;
  }
});

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/users/:id/photo — upload profile photo (self only)
router.post("/:id/photo", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "Invalid user id" }, 400);
  }
  const callerUserId = c.get("userId");

  if (id !== callerUserId) {
    return c.json({ error: "You can only update your own photo" }, 403);
  }

  const formData = await c.req.formData();
  const fileEntry = formData.get("photo");
  if (!(fileEntry instanceof File)) {
    return c.json({ error: "No photo file provided" }, 400);
  }
  const file = fileEntry;

  if (!MIME_TO_EXT[file.type]) {
    return c.json({ error: "Invalid image type" }, 400);
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return c.json({ error: "Photo must be smaller than 5MB" }, 400);
  }

  // Verify user exists before storing the image
  const existing = await sql`SELECT id FROM users WHERE id = ${id}`;
  if (!existing.length) return c.json({ error: "User not found" }, 404);

  const ext = MIME_TO_EXT[file.type];
  const filename = `avatar_${id}_${Date.now()}.${ext}`;

  const arrayBuf = await file.arrayBuffer();
  const base64Data = Buffer.from(arrayBuf).toString("base64");

  // INSERT image into the images table, or UPDATE if the filename already exists.
  // Uses ON CONFLICT (upsert) to handle re-uploads gracefully.
  await sql`
    INSERT INTO images (filename, mime_type, data)
    VALUES (${filename}, ${file.type}, ${base64Data})
    ON CONFLICT (filename) DO UPDATE
    SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data
  `;

  const profilePhoto = `/uploads/${filename}`;

  // UPDATE the user's profile_photo URL to point to the new image
  const [updated] = await sql`
    UPDATE users
    SET profile_photo = ${profilePhoto}
    WHERE id = ${id}
    RETURNING *
  `;
  if (!updated) return c.json({ error: "User not found" }, 404);

  const { passwordHash: _, ...safe } = updated;
  return c.json(safe);
});

// POST /api/users — register a new user with Zod validation.
// Public endpoint: role is always forced to 'student'. Admins assign
// elevated roles via PATCH /api/users/:id/role.
const registerUserSchema = z.object({
  netId: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9]+$/, "NetID must be alphanumeric"),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  passwordHash: z.string().min(1),
});

router.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = registerUserSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  try {
    // INSERT a new user and return the created row. Role hard-coded to
    // 'student' to prevent self-promotion through the public endpoint.
    const [inserted] = await sql`
      INSERT INTO users (net_id, name, email, password_hash, role)
      VALUES (${parsed.data.netId}, ${parsed.data.name}, ${parsed.data.email}, ${parsed.data.passwordHash}, 'student')
      RETURNING *
    `;

    const { passwordHash: _, ...safe } = inserted;
    return c.json(safe, 201);
  } catch (err) {
    const pgErr = err as { code?: string };
    // PostgreSQL error 23505: unique constraint violation (duplicate net_id or email)
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
