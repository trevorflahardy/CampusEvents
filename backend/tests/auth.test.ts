import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  cleanDatabase,
  createTestUser,
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

describe("POST /api/auth/register", () => {
  it("registers a new user and returns 201", async () => {
    const res = await request("POST", "/api/auth/register", {
      body: {
        netId: "newuser1",
        name: "New User",
        email: "newuser1@usf.edu",
        password: "password123",
      },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.netId).toBe("newuser1");
    expect(data.email).toBe("newuser1@usf.edu");
    expect(data.role).toBe("student");
    // Password hash should not be in the response
    expect(data.passwordHash).toBeUndefined();
  });

  it("returns 409 for duplicate email", async () => {
    const res = await request("POST", "/api/auth/register", {
      body: {
        netId: "newuser2",
        name: "Another User",
        email: "newuser1@usf.edu", // same email as above
        password: "password123",
      },
    });
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid input", async () => {
    const res = await request("POST", "/api/auth/register", {
      body: { netId: "", name: "", email: "bad", password: "12" },
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and returns a token", async () => {
    const res = await request("POST", "/api/auth/login", {
      body: { email: "newuser1@usf.edu", password: "password123" },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe("newuser1@usf.edu");
    expect(data.user.passwordHash).toBeUndefined();
  });

  it("returns 401 for wrong password", async () => {
    const res = await request("POST", "/api/auth/login", {
      body: { email: "newuser1@usf.edu", password: "wrongpassword" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for nonexistent user", async () => {
    const res = await request("POST", "/api/auth/login", {
      body: { email: "nobody@usf.edu", password: "password123" },
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns the authenticated user's profile", async () => {
    // Login first to get token
    const loginRes = await request("POST", "/api/auth/login", {
      body: { email: "newuser1@usf.edu", password: "password123" },
    });
    const { token } = await loginRes.json();

    const res = await request("GET", "/api/auth/me", { token });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe("newuser1@usf.edu");
    expect(data.passwordHash).toBeUndefined();
  });

  it("returns 401 without a token", async () => {
    const res = await request("GET", "/api/auth/me");
    expect(res.status).toBe(401);
  });
});
