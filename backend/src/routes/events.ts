import { Hono } from "hono";
import { z } from "zod";
import sql from "../db/client";
import type { EventStatus } from "../db/types";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";

const router = new Hono<AuthEnv>();

// Auto-compute event status from dates (cancelled is always preserved)
function computeStatus(
  stored: EventStatus,
  startTime: Date,
  endTime: Date,
  now: Date,
): EventStatus {
  if (stored === "cancelled") return "cancelled";
  if (now >= endTime) return "completed";
  if (now >= startTime) return "ongoing";
  return "upcoming";
}

// Q1 + Q10: GET /api/events — list upcoming events with organizer name, optional date filtering
router.get("/", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  const statusQuery = c.req.query("status");
  const search = c.req.query("search");
  const categoryId = c.req.query("categoryId");

  // Build a dynamic WHERE clause using postgres.js fragment composition.
  // Each condition is a safe tagged template fragment; they are composed
  // with AND to form the full predicate. This is SQL-injection-safe because
  // all user values go through parameterized placeholders.
  const conditions: ReturnType<typeof sql>[] = [sql`TRUE`];

  // Q10: BETWEEN date filtering — filter events by start_time range
  if (from) conditions.push(sql`e.start_time >= ${new Date(from)}`);
  if (to) conditions.push(sql`e.start_time <= ${new Date(to)}`);

  // ILIKE search — case-insensitive partial match on event title
  if (search) conditions.push(sql`e.title ILIKE ${"%" + search + "%"}`);

  const validStatuses = ["upcoming", "ongoing", "completed", "cancelled"] as const;
  const status =
    statusQuery &&
    validStatuses.includes(statusQuery as (typeof validStatuses)[number])
      ? (statusQuery as (typeof validStatuses)[number])
      : undefined;

  // Reduce conditions array into a single WHERE fragment: TRUE AND cond1 AND cond2 ...
  const where = conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);

  // Q1: SELECT + JOIN — list events with organizer names.
  // When a categoryId filter is provided, we additionally JOIN through
  // the event_categories table to restrict results to that category.
  let rows;
  if (categoryId) {
    rows = await sql`
      SELECT e.id, e.title, e.description, e.location,
             e.start_time, e.end_time, e.capacity, e.ticket_price,
             e.status, e.organizer_id, e.created_at, e.banner_url,
             e.latitude, e.longitude,
             u.name AS organizer_name
      FROM events e
      INNER JOIN users u ON e.organizer_id = u.id
      INNER JOIN event_categories ec ON e.id = ec.event_id
      WHERE ${where} AND ec.category_id = ${Number(categoryId)}
      ORDER BY e.start_time
    `;
  } else {
    rows = await sql`
      SELECT e.id, e.title, e.description, e.location,
             e.start_time, e.end_time, e.capacity, e.ticket_price,
             e.status, e.organizer_id, e.created_at, e.banner_url,
             e.latitude, e.longitude,
             u.name AS organizer_name
      FROM events e
      INNER JOIN users u ON e.organizer_id = u.id
      WHERE ${where}
      ORDER BY e.start_time
    `;
  }

  // Batch-fetch categories for all returned events using ANY(array).
  // This avoids N+1 queries by fetching all category links in one shot.
  const eventIds = rows.map((row: Record<string, unknown>) => row.id as number);
  const categoryRows =
    eventIds.length > 0
      ? await sql`
          SELECT ec.event_id, c.id, c.name
          FROM event_categories ec
          INNER JOIN categories c ON ec.category_id = c.id
          WHERE ec.event_id = ANY(${eventIds})
        `
      : [];

  // Build a lookup map: eventId -> [{ id, name }]
  const categoryMap: Record<number, { id: number; name: string }[]> = {};
  for (const row of categoryRows) {
    const eid = row.eventId as number;
    if (!categoryMap[eid]) categoryMap[eid] = [];
    categoryMap[eid].push({ id: row.id as number, name: row.name as string });
  }

  const now = new Date();
  const enriched = rows
    .map((row: Record<string, unknown>) => ({
      ...row,
      status: computeStatus(
        row.status as EventStatus,
        new Date(row.startTime as string),
        new Date(row.endTime as string),
        now,
      ),
      categories: categoryMap[row.id as number] ?? [],
    }))
    .filter((row) => (status ? row.status === status : true));
  return c.json(enriched);
});

// Q2: GET /api/events/stats — ticket count per event (GROUP BY + COUNT)
// IMPORTANT: This route MUST be defined before /:id to avoid matching "stats" as an id
router.get("/stats", async (c) => {
  const now = new Date();

  // Q2: SELECT with GROUP BY + COUNT — aggregate ticket sales per event.
  // Uses LEFT JOIN so events with zero tickets still appear.
  // The ::int cast converts the bigint COUNT result to a JavaScript number.
  const rows = await sql`
    SELECT e.id AS event_id, e.title,
           COUNT(t.id)::int AS tickets_sold,
           e.capacity
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id
    WHERE e.status != 'cancelled' AND e.end_time >= ${now}
    GROUP BY e.id, e.title, e.capacity
  `;
  return c.json(rows);
});

// Q3: GET /api/events/:id — single event with remaining capacity (subquery)
router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  // Q3: SELECT with correlated subquery — computes spots_remaining
  // by subtracting the ticket count from the event's capacity, all in one query.
  const rows = await sql`
    SELECT e.id, e.title, e.description, e.location,
           e.start_time, e.end_time, e.capacity, e.ticket_price,
           e.status, e.organizer_id, e.created_at, e.banner_url,
           e.latitude, e.longitude,
           u.name AS organizer_name,
           (e.capacity - (SELECT COUNT(*)::int FROM tickets WHERE event_id = e.id)) AS spots_remaining
    FROM events e
    INNER JOIN users u ON e.organizer_id = u.id
    WHERE e.id = ${id}
  `;

  if (!rows.length) return c.json({ error: "Event not found" }, 404);

  const now = new Date();
  const row = rows[0];
  const computed = {
    ...row,
    status: computeStatus(
      row.status as EventStatus,
      new Date(row.startTime as string),
      new Date(row.endTime as string),
      now,
    ),
  };

  // Also fetch categories for this event via the join table
  const eventCats = await sql`
    SELECT c.id, c.name
    FROM categories c
    INNER JOIN event_categories ec ON c.id = ec.category_id
    WHERE ec.event_id = ${id}
  `;

  return c.json({ ...computed, categories: eventCats });
});

// POST /api/events — create event with Zod validation
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().min(1).max(200),
  startTime: z.string().transform((s) => new Date(s)),
  endTime: z.string().transform((s) => new Date(s)),
  capacity: z.number().int().positive(),
  ticketPrice: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .optional()
    .default("0.00"),
  organizerId: z.number().int().positive(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.post(
  "/",
  authMiddleware,
  requireRole("organizer", "admin"),
  async (c) => {
    const body = await c.req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const d = parsed.data;

    // INSERT a new event and return all columns of the created row
    const [inserted] = await sql`
      INSERT INTO events (title, description, location, start_time, end_time,
                          capacity, ticket_price, organizer_id, latitude, longitude)
      VALUES (${d.title}, ${d.description ?? null}, ${d.location},
              ${d.startTime}, ${d.endTime}, ${d.capacity}, ${d.ticketPrice},
              ${d.organizerId}, ${d.latitude ?? null}, ${d.longitude ?? null})
      RETURNING *
    `;
    return c.json(inserted, 201);
  },
);

// Q7: PATCH /api/events/:id — update event (including cancel by setting status)
const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  location: z.string().min(1).max(200).optional(),
  startTime: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  endTime: z
    .string()
    .transform((s) => new Date(s))
    .optional(),
  capacity: z.number().int().positive().optional(),
  ticketPrice: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .optional(),
  organizerId: z.number().int().positive().optional(),
  status: z.enum(["cancelled"]).optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

router.patch(
  "/:id",
  authMiddleware,
  requireRole("organizer", "admin"),
  async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: "Invalid event id" }, 400);
    }

    const userRole = c.get("userRole");
    const userId = c.get("userId");

    const body = await c.req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    if (parsed.data.organizerId !== undefined && userRole !== "admin") {
      return c.json({ error: "Only admins can reassign organizer" }, 403);
    }

    if (parsed.data.status && parsed.data.status !== "cancelled") {
      return c.json(
        {
          error:
            "Status is computed from event dates; only cancellation can be set manually",
        },
        400,
      );
    }

    // Ownership check: organizers can only update their own events
    if (userRole !== "admin") {
      const owned = await sql`
        SELECT id FROM events
        WHERE id = ${id} AND organizer_id = ${userId}
      `;
      if (!owned.length) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    // Q7: UPDATE — build a dynamic SET clause from the validated fields.
    // We map camelCase Zod output keys to snake_case SQL column names.
    const updates: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.location !== undefined) updates.location = parsed.data.location;
    if (parsed.data.startTime !== undefined) updates.start_time = parsed.data.startTime;
    if (parsed.data.endTime !== undefined) updates.end_time = parsed.data.endTime;
    if (parsed.data.capacity !== undefined) updates.capacity = parsed.data.capacity;
    if (parsed.data.ticketPrice !== undefined) updates.ticket_price = parsed.data.ticketPrice;
    if (parsed.data.organizerId !== undefined) updates.organizer_id = parsed.data.organizerId;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.latitude !== undefined) updates.latitude = parsed.data.latitude;
    if (parsed.data.longitude !== undefined) updates.longitude = parsed.data.longitude;

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const [updated] = await sql`
      UPDATE events
      SET ${sql(updates, ...Object.keys(updates))}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!updated) return c.json({ error: "Event not found" }, 404);
    return c.json(updated);
  },
);

// POST /api/events/:id/banner — upload a banner image (organizer/admin only)
router.post(
  "/:id/banner",
  authMiddleware,
  requireRole("organizer", "admin"),
  async (c) => {
    const id = Number(c.req.param("id"));
    const userRole = c.get("userRole");
    const userId = c.get("userId");

    // Ownership check (admins bypass)
    if (userRole !== "admin") {
      const owned = await sql`
        SELECT id FROM events
        WHERE id = ${id} AND organizer_id = ${userId}
      `;
      if (!owned.length) return c.json({ error: "Forbidden" }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get("banner") as File | null;
    if (!file) return c.json({ error: "No file provided" }, 400);

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return c.json(
        { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
        400,
      );
    }
    if (file.size > 25 * 1024 * 1024) {
      return c.json({ error: "File too large. Max 25MB." }, 400);
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `banner_${id}_${Date.now()}.${ext}`;

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // INSERT image data into the images table (upsert on filename conflict)
    await sql`
      INSERT INTO images (filename, mime_type, data)
      VALUES (${filename}, ${file.type}, ${base64Data})
      ON CONFLICT (filename) DO UPDATE
      SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data
    `;

    const bannerUrl = `/uploads/${filename}`;

    // UPDATE the event's banner_url to point to the new image
    const [updated] = await sql`
      UPDATE events
      SET banner_url = ${bannerUrl}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updated) return c.json({ error: "Event not found" }, 404);
    return c.json({ bannerUrl });
  },
);

// DELETE /api/events/:id
router.delete(
  "/:id",
  authMiddleware,
  requireRole("organizer", "admin"),
  async (c) => {
    const id = Number(c.req.param("id"));

    // DELETE an event by primary key and return the deleted row
    const deleted = await sql`
      DELETE FROM events WHERE id = ${id} RETURNING *
    `;
    if (!deleted.length) return c.json({ error: "Event not found" }, 404);
    return c.json({ success: true });
  },
);

// GET /api/events/:id/tickets — attendees for an event
router.get(
  "/:id/tickets",
  authMiddleware,
  requireRole("organizer", "admin"),
  async (c) => {
    const id = Number(c.req.param("id"));

    // SELECT with JOIN — fetch all ticket holders for an event,
    // joining with the users table to get attendee names and emails.
    const rows = await sql`
      SELECT t.id AS ticket_id, t.user_id, u.name AS user_name,
             u.email AS user_email, t.purchased_at, t.checked_in,
             t.confirmation_code
      FROM tickets t
      INNER JOIN users u ON t.user_id = u.id
      WHERE t.event_id = ${id}
    `;
    return c.json(rows);
  },
);

// GET /api/events/:id/checkins — checked-in attendee count + list
// Organizers/admins: always accessible.
// All other authenticated users: only accessible within the check-in window
// (30 min before event start through event end).
router.get("/:id/checkins", authMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const callerId = c.get("userId");
  const callerRole = c.get("userRole");

  // Fetch event timing info for the check-in window validation
  const eventRows = await sql`
    SELECT start_time, end_time, organizer_id, capacity
    FROM events
    WHERE id = ${id}
  `;

  if (!eventRows.length) return c.json({ error: "Event not found" }, 404);

  const ev = eventRows[0];
  const isOrgOrAdmin = callerRole === "admin" || callerId === ev.organizerId;

  if (!isOrgOrAdmin) {
    const now = new Date();
    const windowStart = new Date(
      new Date(ev.startTime).getTime() - 30 * 60 * 1000,
    );
    const windowEnd = new Date(ev.endTime);
    if (now < windowStart) {
      return c.json(
        { error: "Check-in data is not available yet" },
        403,
      );
    }
    if (now > windowEnd) {
      return c.json(
        { error: "This event has ended" },
        403,
      );
    }
  }

  // SELECT with JOIN + WHERE — fetch only checked-in attendees
  const checkedInRows = await sql`
    SELECT t.id AS ticket_id, t.user_id, u.name AS user_name, t.checked_in
    FROM tickets t
    INNER JOIN users u ON t.user_id = u.id
    WHERE t.event_id = ${id} AND t.checked_in = TRUE
  `;

  // COUNT total tickets for this event (checked in or not)
  const totalRows = await sql`
    SELECT COUNT(*)::int AS count
    FROM tickets
    WHERE event_id = ${id}
  `;

  return c.json({
    checkedInCount: checkedInRows.length,
    totalTickets: totalRows[0].count,
    attendees: checkedInRows,
  });
});

// PUT /api/events/:id/categories — replace all categories for an event
const setCategoriesSchema = z.object({
  categoryIds: z.array(z.number().int().positive()),
});

router.put(
  "/:id/categories",
  authMiddleware,
  requireRole("organizer", "admin"),
  async (c) => {
    const id = Number(c.req.param("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: "Invalid event id" }, 400);
    }

    const userRole = c.get("userRole");
    const userId = c.get("userId");

    // Ownership check
    if (userRole !== "admin") {
      const owned = await sql`
        SELECT id FROM events
        WHERE id = ${id} AND organizer_id = ${userId}
      `;
      if (!owned.length) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    const body = await c.req.json();
    const parsed = setCategoriesSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const categoryIds = [...new Set(parsed.data.categoryIds)];

    // Transaction: atomically replace all category links for this event.
    // sql.begin() reserves a connection and auto-commits on success
    // or rolls back on error, ensuring the event never has a partially
    // updated category list.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await sql.begin(async (tx: any) => {
      // Delete all existing category links for this event
      await tx`DELETE FROM event_categories WHERE event_id = ${id}`;

      // Insert new category links one by one within the transaction
      for (const catId of categoryIds) {
        await tx`
          INSERT INTO event_categories (event_id, category_id)
          VALUES (${id}, ${catId})
        `;
      }
    });

    // Re-fetch the updated category list to return to the client
    const cats = await sql`
      SELECT c.id, c.name
      FROM categories c
      INNER JOIN event_categories ec ON c.id = ec.category_id
      WHERE ec.event_id = ${id}
    `;

    return c.json(cats);
  },
);

export default router;
