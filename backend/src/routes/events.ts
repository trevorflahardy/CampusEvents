import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client";
import {
  events,
  users,
  tickets,
  eventCategories,
  categories,
  images,
} from "../db/schema";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";

const router = new Hono<AuthEnv>();

// Auto-compute event status from dates (cancelled is always preserved)
function computeStatus(
  stored: "upcoming" | "ongoing" | "completed" | "cancelled",
  startTime: Date,
  endTime: Date,
  now: Date,
): "upcoming" | "ongoing" | "completed" | "cancelled" {
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

  // Build conditions array
  const conditions = [];

  // Q10: BETWEEN date filtering
  if (from) conditions.push(gte(events.startTime, new Date(from)));
  if (to) conditions.push(lte(events.startTime, new Date(to)));
  const validStatuses = [
    "upcoming",
    "ongoing",
    "completed",
    "cancelled",
  ] as const;
  const status =
    statusQuery &&
    validStatuses.includes(statusQuery as (typeof validStatuses)[number])
      ? (statusQuery as (typeof validStatuses)[number])
      : undefined;
  if (search) conditions.push(sql`${events.title} ILIKE ${"%" + search + "%"}`);

  // Base query: Q1 — SELECT + JOIN with users for organizer name
  let query;
  if (categoryId) {
    // Join through eventCategories to filter by category
    query = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        location: events.location,
        startTime: events.startTime,
        endTime: events.endTime,
        capacity: events.capacity,
        ticketPrice: events.ticketPrice,
        status: events.status,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        organizerName: users.name,
        bannerUrl: events.bannerUrl,
        latitude: events.latitude,
        longitude: events.longitude,
      })
      .from(events)
      .innerJoin(users, eq(events.organizerId, users.id))
      .innerJoin(eventCategories, eq(events.id, eventCategories.eventId))
      .where(
        conditions.length > 0
          ? and(
              ...conditions,
              eq(eventCategories.categoryId, Number(categoryId)),
            )
          : eq(eventCategories.categoryId, Number(categoryId)),
      )
      .orderBy(events.startTime);
  } else {
    query = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        location: events.location,
        startTime: events.startTime,
        endTime: events.endTime,
        capacity: events.capacity,
        ticketPrice: events.ticketPrice,
        status: events.status,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        organizerName: users.name,
        bannerUrl: events.bannerUrl,
        latitude: events.latitude,
        longitude: events.longitude,
      })
      .from(events)
      .innerJoin(users, eq(events.organizerId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(events.startTime);
  }

  const rows = await query;
  const eventIds = rows.map((row) => row.id);
  const categoryRows =
    eventIds.length > 0
      ? await db
          .select({
            eventId: eventCategories.eventId,
            id: categories.id,
            name: categories.name,
          })
          .from(eventCategories)
          .innerJoin(categories, eq(eventCategories.categoryId, categories.id))
          .where(inArray(eventCategories.eventId, eventIds))
      : [];

  const categoryMap: Record<number, { id: number; name: string }[]> = {};
  for (const row of categoryRows) {
    if (!categoryMap[row.eventId]) categoryMap[row.eventId] = [];
    categoryMap[row.eventId].push({ id: row.id, name: row.name });
  }

  const now = new Date();
  const enriched = rows
    .map((row) => ({
      ...row,
      status: computeStatus(
        row.status,
        new Date(row.startTime),
        new Date(row.endTime),
        now,
      ),
      categories: categoryMap[row.id] ?? [],
    }))
    .filter((row) => (status ? row.status === status : true));
  return c.json(enriched);
});

// Q2: GET /api/events/stats — ticket count per event (GROUP BY + COUNT)
// IMPORTANT: This route MUST be defined before /:id to avoid matching "stats" as an id
router.get("/stats", async (c) => {
  const now = new Date();
  const rows = await db
    .select({
      eventId: events.id,
      title: events.title,
      ticketsSold: sql<number>`cast(count(${tickets.id}) as int)`,
      capacity: events.capacity,
    })
    .from(events)
    .leftJoin(tickets, eq(events.id, tickets.eventId))
    .where(and(sql`${events.status} != 'cancelled'`, gte(events.endTime, now)))
    .groupBy(events.id, events.title, events.capacity);
  return c.json(rows);
});

// Q3: GET /api/events/:id — single event with remaining capacity (subquery)
router.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      location: events.location,
      startTime: events.startTime,
      endTime: events.endTime,
      capacity: events.capacity,
      ticketPrice: events.ticketPrice,
      status: events.status,
      organizerId: events.organizerId,
      createdAt: events.createdAt,
      organizerName: users.name,
      bannerUrl: events.bannerUrl,
      latitude: events.latitude,
      longitude: events.longitude,
      spotsRemaining: sql<number>`${events.capacity} - (SELECT count(*) FROM tickets WHERE tickets.event_id = ${events.id})`,
    })
    .from(events)
    .innerJoin(users, eq(events.organizerId, users.id))
    .where(eq(events.id, id));

  if (!rows.length) return c.json({ error: "Event not found" }, 404);

  const now = new Date();
  const row = rows[0];
  const computed = {
    ...row,
    status: computeStatus(
      row.status,
      new Date(row.startTime),
      new Date(row.endTime),
      now,
    ),
  };

  // Also fetch categories for this event
  const eventCats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .innerJoin(eventCategories, eq(categories.id, eventCategories.categoryId))
    .where(eq(eventCategories.eventId, id));

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
    const inserted = await db.insert(events).values(parsed.data).returning();
    return c.json(inserted[0], 201);
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

    if (userRole !== "admin") {
      const owned = await db
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, id), eq(events.organizerId, userId)));
      if (!owned.length) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    const updated = await db
      .update(events)
      .set(parsed.data)
      .where(eq(events.id, id))
      .returning();
    if (!updated.length) return c.json({ error: "Event not found" }, 404);
    return c.json(updated[0]);
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
      const owned = await db
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, id), eq(events.organizerId, userId)));
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

    // Store image data in the database
    await db
      .insert(images)
      .values({ filename, mimeType: file.type, data: base64Data })
      .onConflictDoUpdate({
        target: images.filename,
        set: { mimeType: file.type, data: base64Data },
      });

    const bannerUrl = `/uploads/${filename}`;
    const updated = await db
      .update(events)
      .set({ bannerUrl })
      .where(eq(events.id, id))
      .returning();

    if (!updated.length) return c.json({ error: "Event not found" }, 404);
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
    const deleted = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();
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
    const rows = await db
      .select({
        ticketId: tickets.id,
        userId: tickets.userId,
        userName: users.name,
        userEmail: users.email,
        purchasedAt: tickets.purchasedAt,
        checkedIn: tickets.checkedIn,
        confirmationCode: tickets.confirmationCode,
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.userId, users.id))
      .where(eq(tickets.eventId, id));
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

  const eventRows = await db
    .select({
      startTime: events.startTime,
      endTime: events.endTime,
      organizerId: events.organizerId,
      capacity: events.capacity,
    })
    .from(events)
    .where(eq(events.id, id));

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

  const checkedInRows = await db
    .select({
      ticketId: tickets.id,
      userId: tickets.userId,
      userName: users.name,
      checkedIn: tickets.checkedIn,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.userId, users.id))
    .where(and(eq(tickets.eventId, id), eq(tickets.checkedIn, true)));

  const totalRows = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(tickets)
    .where(eq(tickets.eventId, id));

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

    if (userRole !== "admin") {
      const owned = await db
        .select({ id: events.id })
        .from(events)
        .where(and(eq(events.id, id), eq(events.organizerId, userId)));
      if (!owned.length) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    const body = await c.req.json();
    const parsed = setCategoriesSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

    const categoryIds = [...new Set(parsed.data.categoryIds)];

    await db.transaction(async (tx) => {
      await tx.delete(eventCategories).where(eq(eventCategories.eventId, id));

      if (categoryIds.length > 0) {
        await tx.insert(eventCategories).values(
          categoryIds.map((categoryId) => ({
            eventId: id,
            categoryId,
          })),
        );
      }
    });

    const cats = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .innerJoin(eventCategories, eq(categories.id, eventCategories.categoryId))
      .where(eq(eventCategories.eventId, id));

    return c.json(cats);
  },
);

export default router;
