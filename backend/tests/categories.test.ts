import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import sql from "../src/db/client";
import {
  cleanDatabase,
  createTestUser,
  createTestCategory,
  createTestEvent,
  getAuthToken,
  request,
  closeDatabase,
} from "./setup";

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("GET /api/categories", () => {
  it("returns all categories", async () => {
    await createTestCategory("Music");
    await createTestCategory("Sports");

    const res = await request("GET", "/api/categories");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(2);
  });
});

describe("GET /api/categories/popular (Q9: HAVING)", () => {
  it("returns categories with more than 1 event", async () => {
    const organizer = await createTestUser({ netId: "catorg1", email: "catorg1@usf.edu", role: "organizer" });
    const cat = await createTestCategory("Academic");
    const event1 = await createTestEvent(organizer.id, { title: "Event A" });
    const event2 = await createTestEvent(organizer.id, { title: "Event B" });

    // Link both events to the same category
    await sql`INSERT INTO event_categories (event_id, category_id) VALUES (${event1.id}, ${cat.id})`;
    await sql`INSERT INTO event_categories (event_id, category_id) VALUES (${event2.id}, ${cat.id})`;

    const res = await request("GET", "/api/categories/popular");
    expect(res.status).toBe(200);
    const data = await res.json();
    const academic = data.find((c: Record<string, unknown>) => c.name === "Academic");
    expect(academic).toBeDefined();
    expect(academic.eventCount).toBeGreaterThanOrEqual(2);
  });
});

describe("POST /api/categories", () => {
  it("creates a category when admin", async () => {
    const admin = await createTestUser({ netId: "catadmin1", email: "catadmin1@usf.edu", role: "admin" });
    const token = await getAuthToken(admin.id, "admin");

    const res = await request("POST", "/api/categories", {
      token,
      body: { name: "Technology" },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Technology");
  });

  it("returns 403 for non-admin", async () => {
    const student = await createTestUser({ netId: "catstud1", email: "catstud1@usf.edu", role: "student" });
    const token = await getAuthToken(student.id, "student");

    const res = await request("POST", "/api/categories", {
      token,
      body: { name: "Social" },
    });
    expect(res.status).toBe(403);
  });
});
