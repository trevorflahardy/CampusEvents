import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  cleanDatabase,
  createTestUser,
  getAuthToken,
  request,
  closeDatabase,
} from "./setup";

let admin: Record<string, unknown>;
let adminToken: string;
let student: Record<string, unknown>;
let studentToken: string;

beforeAll(async () => {
  await cleanDatabase();
  admin = await createTestUser({ netId: "usradmin1", email: "usradmin1@usf.edu", role: "admin" });
  adminToken = await getAuthToken(admin.id as number, "admin");
  student = await createTestUser({ netId: "usrstud1", email: "usrstud1@usf.edu", role: "student" });
  studentToken = await getAuthToken(student.id as number, "student");
});

afterAll(async () => {
  await closeDatabase();
});

describe("GET /api/users (admin only)", () => {
  it("returns all users for admin", async () => {
    const res = await request("GET", "/api/users", { token: adminToken });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(2);
    // Should not include password_hash
    expect(data[0].passwordHash).toBeUndefined();
  });

  it("returns 403 for non-admin", async () => {
    const res = await request("GET", "/api/users", { token: studentToken });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/users/:id", () => {
  it("returns a user profile without password", async () => {
    const res = await request("GET", `/api/users/${student.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBeDefined();
    expect(data.passwordHash).toBeUndefined();
  });

  it("returns 404 for nonexistent user", async () => {
    const res = await request("GET", "/api/users/99999");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/users/:id/role (admin only)", () => {
  it("updates a user role", async () => {
    const res = await request("PATCH", `/api/users/${student.id}/role`, {
      token: adminToken,
      body: { role: "organizer" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.role).toBe("organizer");
  });

  it("returns 403 for non-admin", async () => {
    const res = await request("PATCH", `/api/users/${student.id}/role`, {
      token: studentToken,
      body: { role: "admin" },
    });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/users/:id/profile", () => {
  it("updates own name", async () => {
    const res = await request("PATCH", `/api/users/${student.id}/profile`, {
      token: studentToken,
      body: { name: "Updated Name" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated Name");
  });

  it("returns 403 when updating another user", async () => {
    const res = await request("PATCH", `/api/users/${admin.id}/profile`, {
      token: studentToken,
      body: { name: "Hacked" },
    });
    expect(res.status).toBe(403);
  });

  it("returns 409 for duplicate email", async () => {
    const res = await request("PATCH", `/api/users/${student.id}/profile`, {
      token: studentToken,
      body: { email: "usradmin1@usf.edu" }, // admin's email
    });
    expect(res.status).toBe(409);
  });
});
