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

let organizer: Record<string, unknown>;
let orgToken: string;
let student: Record<string, unknown>;
let studentToken: string;
let testEvent: Record<string, unknown>;

beforeAll(async () => {
  await cleanDatabase();
  organizer = await createTestUser({ netId: "evtorg1", email: "evtorg1@usf.edu", role: "organizer" });
  orgToken = await getAuthToken(organizer.id as number, "organizer");
  student = await createTestUser({ netId: "evtstud1", email: "evtstud1@usf.edu", role: "student" });
  studentToken = await getAuthToken(student.id as number, "student");
  testEvent = await createTestEvent(organizer.id as number);
});

afterAll(async () => {
  await closeDatabase();
});

describe("GET /api/events (Q1: SELECT + JOIN)", () => {
  it("returns events with organizer names", async () => {
    const res = await request("GET", "/api/events");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].organizerName).toBeDefined();
  });
});

describe("GET /api/events?from=&to= (Q10: BETWEEN)", () => {
  it("filters events by date range", async () => {
    const res = await request("GET", "/api/events?from=2026-05-01&to=2026-07-01");
    expect(res.status).toBe(200);
    const data = await res.json();
    // Our test event is on 2026-06-01, should be in range
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for out-of-range dates", async () => {
    const res = await request("GET", "/api/events?from=2020-01-01&to=2020-02-01");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(0);
  });
});

describe("GET /api/events?search= (ILIKE)", () => {
  it("filters events by title search", async () => {
    const res = await request("GET", "/api/events?search=Test");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/events/stats (Q2: GROUP BY + COUNT)", () => {
  it("returns ticket counts per event", async () => {
    const res = await request("GET", "/api/events/stats");
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].ticketsSold).toBeDefined();
      expect(data[0].capacity).toBeDefined();
    }
  });
});

describe("GET /api/events/:id (Q3: SELECT + subquery)", () => {
  it("returns a single event with spotsRemaining", async () => {
    const res = await request("GET", `/api/events/${testEvent.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Test Event");
    expect(data.spotsRemaining).toBeDefined();
    expect(data.organizerName).toBeDefined();
  });

  it("returns 404 for nonexistent event", async () => {
    const res = await request("GET", "/api/events/99999");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/events", () => {
  it("creates an event as organizer", async () => {
    const res = await request("POST", "/api/events", {
      token: orgToken,
      body: {
        title: "New Event",
        location: "Somewhere",
        startTime: "2026-07-01T10:00:00Z",
        endTime: "2026-07-01T16:00:00Z",
        capacity: 50,
        organizerId: organizer.id,
      },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("New Event");
  });

  it("returns 403 for students", async () => {
    const res = await request("POST", "/api/events", {
      token: studentToken,
      body: {
        title: "Student Event",
        location: "Nope",
        startTime: "2026-07-01T10:00:00Z",
        endTime: "2026-07-01T16:00:00Z",
        capacity: 50,
        organizerId: student.id,
      },
    });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/events/:id (Q7: UPDATE)", () => {
  it("updates an event's title", async () => {
    const res = await request("PATCH", `/api/events/${testEvent.id}`, {
      token: orgToken,
      body: { title: "Updated Event" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Updated Event");
  });

  it("can cancel an event", async () => {
    const ev = await createTestEvent(organizer.id as number, { title: "To Cancel" });
    const res = await request("PATCH", `/api/events/${ev.id}`, {
      token: orgToken,
      body: { status: "cancelled" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("cancelled");
  });
});

describe("DELETE /api/events/:id", () => {
  it("deletes an event", async () => {
    const ev = await createTestEvent(organizer.id as number, { title: "To Delete" });
    const res = await request("DELETE", `/api/events/${ev.id}`, {
      token: orgToken,
    });
    expect(res.status).toBe(200);

    // Verify it's gone
    const getRes = await request("GET", `/api/events/${ev.id}`);
    expect(getRes.status).toBe(404);
  });
});

describe("PUT /api/events/:id/categories (Transaction)", () => {
  it("replaces categories for an event", async () => {
    const cat1 = await createTestCategory("Cat A");
    const cat2 = await createTestCategory("Cat B");

    const res = await request("PUT", `/api/events/${testEvent.id}/categories`, {
      token: orgToken,
      body: { categoryIds: [cat1.id, cat2.id] },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(2);
  });
});
