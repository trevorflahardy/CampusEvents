/**
 * Seed script — run with: bun run src/db/seed.ts
 * Populates the DB with sample data for development/demo.
 */
import sql from "./client";
import { hash } from "@node-rs/bcrypt";

// All seed users share the password "password123" for development/testing.
const SEED_PASSWORD = "password123";

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert default categories
  const insertedCategories = await sql`
    INSERT INTO categories (name)
    VALUES ('Academic'), ('Music'), ('Sports'), ('Career'), ('Social')
    RETURNING *
  `;
  console.log(`  ✓ Inserted ${insertedCategories.length} categories`);

  // Insert seed users with bcrypt-hashed passwords
  const passwordHash = await hash(SEED_PASSWORD, 10);
  const insertedUsers = await sql`
    INSERT INTO users (net_id, name, email, password_hash, role) VALUES
      ('admin1',     'Admin User',      'admin@usf.edu',   ${passwordHash}, 'admin'),
      ('organizer1', 'Jane Organizer',  'jane@usf.edu',    ${passwordHash}, 'organizer'),
      ('student1',   'Trevor Student',  'trevor@usf.edu',  ${passwordHash}, 'student'),
      ('student2',   'Alex Student',    'alex@usf.edu',    ${passwordHash}, 'student')
    RETURNING *
  `;
  console.log(`  ✓ Inserted ${insertedUsers.length} users`);

  const organizer = insertedUsers.find((u: Record<string, unknown>) => u.role === "organizer")!;

  // Insert sample events
  const insertedEvents = await sql`
    INSERT INTO events (title, description, location, start_time, end_time,
                        capacity, ticket_price, status, organizer_id) VALUES
      (
        'Spring Career Fair 2026',
        'Meet top employers hiring USF students for internships and full-time roles.',
        'Marshall Student Center Ballroom',
        '2026-04-10 10:00:00', '2026-04-10 16:00:00',
        500, 0.00, 'upcoming', ${organizer.id}
      ),
      (
        'Bulls After Dark: Spring Concert',
        'Live performances by student bands and special guest artists.',
        'USF Amphitheater',
        '2026-04-18 19:00:00', '2026-04-18 23:00:00',
        300, 5.00, 'upcoming', ${organizer.id}
      ),
      (
        'Hackathon @ USF 2026',
        '24-hour coding competition — form teams, build projects, win prizes.',
        'ENB 118',
        '2026-04-25 09:00:00', '2026-04-26 09:00:00',
        150, 0.00, 'upcoming', ${organizer.id}
      )
    RETURNING *
  `;
  console.log(`  ✓ Inserted ${insertedEvents.length} events`);

  // Link events to categories via the many-to-many join table
  await sql`
    INSERT INTO event_categories (event_id, category_id) VALUES
      (${insertedEvents[0].id}, ${insertedCategories[3].id}),
      (${insertedEvents[1].id}, ${insertedCategories[1].id}),
      (${insertedEvents[1].id}, ${insertedCategories[4].id}),
      (${insertedEvents[2].id}, ${insertedCategories[0].id})
  `;
  console.log("  ✓ Linked events to categories");

  // Add a sample ticket for the first student
  const student = insertedUsers.find((u: Record<string, unknown>) => u.netId === "student1")!;
  const confirmationCode = crypto.randomUUID().slice(0, 8).toUpperCase();
  await sql`
    INSERT INTO tickets (user_id, event_id, confirmation_code)
    VALUES (${student.id}, ${insertedEvents[0].id}, ${confirmationCode})
  `;
  console.log("  ✓ Inserted sample ticket");

  console.log("✅ Seed complete!");
  await sql.end();
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await sql.end();
  process.exit(1);
});
