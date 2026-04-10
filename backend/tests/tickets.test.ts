import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  cleanDatabase,
  createTestUser,
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
  organizer = await createTestUser({ netId: "tktorg1", email: "tktorg1@usf.edu", role: "organizer" });
  orgToken = await getAuthToken(organizer.id as number, "organizer");
  student = await createTestUser({ netId: "tktstud1", email: "tktstud1@usf.edu", role: "student" });
  studentToken = await getAuthToken(student.id as number, "student");
  testEvent = await createTestEvent(organizer.id as number, { capacity: 2 });
});

afterAll(async () => {
  await closeDatabase();
});

describe("POST /api/tickets (Q5: INSERT with capacity check)", () => {
  it("purchases a ticket successfully", async () => {
    const res = await request("POST", "/api/tickets", {
      token: studentToken,
      body: { userId: student.id, eventId: testEvent.id },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.confirmationCode).toBeDefined();
    expect(data.userId).toBe(student.id);
  });

  it("returns 409 for duplicate ticket", async () => {
    const res = await request("POST", "/api/tickets", {
      token: studentToken,
      body: { userId: student.id, eventId: testEvent.id },
    });
    expect(res.status).toBe(409);
  });

  it("returns 400 for sold-out event", async () => {
    // Purchase second ticket (capacity is 2)
    const student2 = await createTestUser({ netId: "tktstud2", email: "tktstud2@usf.edu" });
    const token2 = await getAuthToken(student2.id as number, "student");
    await request("POST", "/api/tickets", {
      token: token2,
      body: { userId: student2.id, eventId: testEvent.id },
    });

    // Third ticket should fail — sold out
    const student3 = await createTestUser({ netId: "tktstud3", email: "tktstud3@usf.edu" });
    const token3 = await getAuthToken(student3.id as number, "student");
    const res = await request("POST", "/api/tickets", {
      token: token3,
      body: { userId: student3.id, eventId: testEvent.id },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("sold out");
  });

  it("returns 404 for nonexistent event", async () => {
    const res = await request("POST", "/api/tickets", {
      token: studentToken,
      body: { userId: student.id, eventId: 99999 },
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/tickets/user/:userId (Q4: multi-JOIN)", () => {
  it("returns user tickets with event info", async () => {
    const res = await request("GET", `/api/tickets/user/${student.id}`, {
      token: studentToken,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].eventTitle).toBeDefined();
    expect(data[0].confirmationCode).toBeDefined();
  });
});

describe("PATCH /api/tickets/:id/checkin (Q6: UPDATE)", () => {
  it("organizer can check in a ticket", async () => {
    // Get the student's ticket ID
    const ticketsRes = await request("GET", `/api/tickets/user/${student.id}`, {
      token: studentToken,
    });
    const tickets = await ticketsRes.json();
    const ticketId = tickets[0].ticketId;

    const res = await request("PATCH", `/api/tickets/${ticketId}/checkin`, {
      token: orgToken,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.checkedIn).toBe(true);
  });

  it("returns 404 for nonexistent ticket", async () => {
    const res = await request("PATCH", "/api/tickets/99999/checkin", {
      token: orgToken,
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tickets/:id (Q8: DELETE)", () => {
  it("cancels a ticket", async () => {
    // Create a new ticket to delete
    const newEvent = await createTestEvent(organizer.id as number, { title: "Delete Ticket Event" });
    const student4 = await createTestUser({ netId: "tktstud4", email: "tktstud4@usf.edu" });
    const token4 = await getAuthToken(student4.id as number, "student");

    const purchaseRes = await request("POST", "/api/tickets", {
      token: token4,
      body: { userId: student4.id, eventId: newEvent.id },
    });
    const ticket = await purchaseRes.json();

    const res = await request("DELETE", `/api/tickets/${ticket.id}`, {
      token: token4,
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 for nonexistent ticket", async () => {
    const res = await request("DELETE", "/api/tickets/99999", {
      token: studentToken,
    });
    expect(res.status).toBe(404);
  });
});
