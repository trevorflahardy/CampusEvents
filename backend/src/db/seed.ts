/**
 * Seed script — run with: bun run src/db/seed.ts
 *
 * Populates the DB with sample data for development/demo. Uses UPSERTs
 * throughout so the script is re-runnable against an existing database
 * (it will refresh password hashes and fill in any missing rows).
 *
 * All seed users share the password "password123".
 */
import sql from "./client";
import { hash } from "@node-rs/bcrypt";

const SEED_PASSWORD = "password123";

async function seed() {
  console.log("🌱 Seeding database...");

  // Categories — referenced by name from event_categories below.
  // Schema.sql already inserts the default set on startup; this is a
  // safety net in case the seed runs against a DB that skipped schema.sql.
  await sql`
    INSERT INTO categories (name) VALUES
      ('Academic'), ('Music'), ('Sports'), ('Career'),
      ('Social'), ('Arts'), ('Technology')
    ON CONFLICT (name) DO NOTHING
  `;

  const passwordHash = await hash(SEED_PASSWORD, 10);

  // Users — upsert on net_id so re-running refreshes the password hash
  // (this is how placeholder or rotated passwords get fixed up).
  const insertedUsers = await sql`
    INSERT INTO users (net_id, name, email, password_hash, role) VALUES
      ('admin1',     'Admin User',      'admin@usf.edu',    ${passwordHash}, 'admin'),
      ('jsmith22',   'Jane Smith',      'jsmith22@usf.edu', ${passwordHash}, 'organizer'),
      ('trev123',    'Trevor Flahardy', 'trev123@usf.edu',  ${passwordHash}, 'student'),
      ('alex456',    'Alex Johnson',    'alex456@usf.edu',  ${passwordHash}, 'student'),
      ('maria789',   'Maria Garcia',    'maria789@usf.edu', ${passwordHash}, 'student')
    ON CONFLICT (net_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role
    RETURNING *
  `;
  console.log(`  ✓ Upserted ${insertedUsers.length} users`);

  const userByNetId = new Map<string, number>();
  for (const u of insertedUsers) {
    userByNetId.set(u.netId as string, u.id as number);
  }

  const organizer = userByNetId.get("jsmith22")!;
  const admin = userByNetId.get("admin1")!;

  // Events — upsert on (organizer_id, title, start_time) so re-runs are
  // idempotent without duplicating rows.
  const insertedEvents = await sql`
    INSERT INTO events
      (title, description, location, start_time, end_time, capacity, ticket_price, status, organizer_id)
    VALUES
      ('Spring Career Fair 2026',
       'Meet top employers hiring USF students for internships and full-time roles.',
       'Marshall Student Center Ballroom',
       '2026-04-10 10:00:00', '2026-04-10 16:00:00',
       500, 0.00, 'upcoming', ${organizer}),
      ('Bulls After Dark: Spring Concert',
       'Live performances by student bands and special guest artists.',
       'USF Amphitheater',
       '2026-04-18 19:00:00', '2026-04-18 23:00:00',
       300, 5.00, 'upcoming', ${organizer}),
      ('Hackathon @ USF 2026',
       '24-hour coding competition — form teams, build projects, win prizes.',
       'ENB 118',
       '2026-04-25 09:00:00', '2026-04-26 09:00:00',
       150, 0.00, 'upcoming', ${organizer}),
      ('Campus 5K Fun Run',
       'Annual charity 5K run around the USF Tampa campus. All skill levels welcome.',
       'USF Track & Field',
       '2026-05-02 08:00:00', '2026-05-02 11:00:00',
       200, 10.00, 'upcoming', ${admin})
    ON CONFLICT (organizer_id, title, start_time) DO UPDATE SET
      description = EXCLUDED.description,
      location = EXCLUDED.location,
      end_time = EXCLUDED.end_time,
      capacity = EXCLUDED.capacity,
      ticket_price = EXCLUDED.ticket_price,
      status = EXCLUDED.status
    RETURNING *
  `;
  console.log(`  ✓ Upserted ${insertedEvents.length} events`);

  const eventIdByTitle = new Map<string, number>();
  for (const e of insertedEvents) {
    eventIdByTitle.set(e.title as string, e.id as number);
  }

  // Category lookups by name — we just inserted the full set above.
  const categoryRows = await sql`
    SELECT id, name FROM categories
    WHERE name IN ('Career', 'Music', 'Social', 'Technology', 'Academic', 'Sports')
  `;
  const categoryIdByName = new Map<string, number>();
  for (const c of categoryRows) {
    categoryIdByName.set(c.name as string, c.id as number);
  }

  const eventCategoryPairs: Array<[string, string]> = [
    ["Spring Career Fair 2026", "Career"],
    ["Bulls After Dark: Spring Concert", "Music"],
    ["Bulls After Dark: Spring Concert", "Social"],
    ["Hackathon @ USF 2026", "Technology"],
    ["Hackathon @ USF 2026", "Academic"],
    ["Campus 5K Fun Run", "Sports"],
  ];
  for (const [title, cat] of eventCategoryPairs) {
    const eid = eventIdByTitle.get(title)!;
    const cid = categoryIdByName.get(cat)!;
    await sql`
      INSERT INTO event_categories (event_id, category_id)
      VALUES (${eid}, ${cid})
      ON CONFLICT DO NOTHING
    `;
  }
  console.log("  ✓ Linked events to categories");

  // Sample tickets — UNIQUE(user_id, event_id) makes these idempotent.
  const ticketSeeds: Array<[string, string, string]> = [
    ["trev123", "Spring Career Fair 2026", "CF26A001"],
    ["alex456", "Spring Career Fair 2026", "CF26A002"],
    ["trev123", "Hackathon @ USF 2026", "HACK2601"],
    ["maria789", "Bulls After Dark: Spring Concert", "CONC2601"],
  ];
  for (const [netId, title, code] of ticketSeeds) {
    const uid = userByNetId.get(netId)!;
    const eid = eventIdByTitle.get(title)!;
    await sql`
      INSERT INTO tickets (user_id, event_id, confirmation_code)
      VALUES (${uid}, ${eid}, ${code})
      ON CONFLICT (user_id, event_id) DO NOTHING
    `;
  }
  console.log("  ✓ Seeded sample tickets");

  console.log("✅ Seed complete!");
  await sql.end();
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await sql.end();
  process.exit(1);
});
