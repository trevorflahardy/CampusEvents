/**
 * Seed script — run with: bun run src/db/seed.ts
 * Populates the DB with sample data for development/demo.
 */
import { db } from "./client";
import { users, events, tickets, categories, eventCategories } from "./schema";
import { randomUUID } from "crypto";
import { hash } from "@node-rs/bcrypt";

// ── Categories ──────────────────────────────────────────────────────────────
const categoryData = [
  { name: "Academic" },
  { name: "Music" },
  { name: "Sports" },
  { name: "Career" },
  { name: "Social" },
];

// ── Users ────────────────────────────────────────────────────────────────────
// All seed users share the password "password123" for development/testing.
const SEED_PASSWORD = "password123";

async function buildUserData() {
  const passwordHash = await hash(SEED_PASSWORD, 10);
  return [
    {
      netId: "admin1",
      name: "Admin User",
      email: "admin@usf.edu",
      passwordHash,
      role: "admin" as const,
    },
    {
      netId: "organizer1",
      name: "Jane Organizer",
      email: "jane@usf.edu",
      passwordHash,
      role: "organizer" as const,
    },
    {
      netId: "student1",
      name: "Trevor Student",
      email: "trevor@usf.edu",
      passwordHash,
      role: "student" as const,
    },
    {
      netId: "student2",
      name: "Alex Student",
      email: "alex@usf.edu",
      passwordHash,
      role: "student" as const,
    },
  ];
}

async function seed() {
  console.log("🌱 Seeding database...");

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning();
  console.log(`  ✓ Inserted ${insertedCategories.length} categories`);

  const userData = await buildUserData();
  const insertedUsers = await db.insert(users).values(userData).returning();
  console.log(`  ✓ Inserted ${insertedUsers.length} users`);

  const organizer = insertedUsers.find((u) => u.role === "organizer")!;

  const eventData = [
    {
      title: "Spring Career Fair 2026",
      description:
        "Meet top employers hiring USF students for internships and full-time roles.",
      location: "Marshall Student Center Ballroom",
      startTime: new Date("2026-04-10T10:00:00"),
      endTime: new Date("2026-04-10T16:00:00"),
      capacity: 500,
      ticketPrice: "0.00",
      status: "upcoming" as const,
      organizerId: organizer.id,
    },
    {
      title: "Bulls After Dark: Spring Concert",
      description:
        "Live performances by student bands and special guest artists.",
      location: "USF Amphitheater",
      startTime: new Date("2026-04-18T19:00:00"),
      endTime: new Date("2026-04-18T23:00:00"),
      capacity: 300,
      ticketPrice: "5.00",
      status: "upcoming" as const,
      organizerId: organizer.id,
    },
    {
      title: "Hackathon @ USF 2026",
      description:
        "24-hour coding competition — form teams, build projects, win prizes.",
      location: "ENB 118",
      startTime: new Date("2026-04-25T09:00:00"),
      endTime: new Date("2026-04-26T09:00:00"),
      capacity: 150,
      ticketPrice: "0.00",
      status: "upcoming" as const,
      organizerId: organizer.id,
    },
  ];

  const insertedEvents = await db.insert(events).values(eventData).returning();
  console.log(`  ✓ Inserted ${insertedEvents.length} events`);

  // Link events to categories
  await db.insert(eventCategories).values([
    { eventId: insertedEvents[0].id, categoryId: insertedCategories[3].id }, // Career Fair -> Career
    { eventId: insertedEvents[1].id, categoryId: insertedCategories[1].id }, // Concert -> Music
    { eventId: insertedEvents[1].id, categoryId: insertedCategories[4].id }, // Concert -> Social
    { eventId: insertedEvents[2].id, categoryId: insertedCategories[0].id }, // Hackathon -> Academic
  ]);
  console.log("  ✓ Linked events to categories");

  // Add a sample ticket
  const student = insertedUsers.find((u) => u.netId === "student1")!;
  await db.insert(tickets).values({
    userId: student.id,
    eventId: insertedEvents[0].id,
    confirmationCode: randomUUID().slice(0, 8).toUpperCase(),
  });
  console.log("  ✓ Inserted sample ticket");

  console.log("✅ Seed complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
