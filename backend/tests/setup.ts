/**
 * Test setup — shared helpers for integration tests.
 *
 * Tests use the real PostgreSQL database (DATABASE_URL env var).
 * Each test suite truncates tables before running to ensure isolation.
 */
import { sign } from "hono/jwt";
import { hash } from "@node-rs/bcrypt";
import sql from "../src/db/client";
import { createApp } from "../src/app";

export const app = createApp();

const JWT_SECRET = process.env.JWT_SECRET || "campusevents-dev-secret";

/**
 * Truncate all application tables in FK-safe order.
 * Called before each test suite for isolation.
 */
export async function cleanDatabase() {
  await sql`TRUNCATE tickets, event_categories, events, images, categories, users RESTART IDENTITY CASCADE`;
}

/**
 * Insert a test user and return the full row (with camelCase keys).
 */
export async function createTestUser(overrides: {
  netId?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: "admin" | "organizer" | "student";
} = {}) {
  const passwordHash = await hash(overrides.password ?? "password123", 4); // low rounds for speed
  const [user] = await sql`
    INSERT INTO users (net_id, name, email, password_hash, role)
    VALUES (
      ${overrides.netId ?? `test${Date.now()}`},
      ${overrides.name ?? "Test User"},
      ${overrides.email ?? `test${Date.now()}@usf.edu`},
      ${passwordHash},
      ${overrides.role ?? "student"}
    )
    RETURNING *
  `;
  return user;
}

/**
 * Generate a JWT token for the given user (for Authorization headers).
 */
export async function getAuthToken(userId: number, role: string) {
  return await sign({ sub: userId, role }, JWT_SECRET);
}

/**
 * Create a test category and return the row.
 */
export async function createTestCategory(name: string) {
  const [cat] = await sql`
    INSERT INTO categories (name) VALUES (${name}) RETURNING *
  `;
  return cat;
}

/**
 * Create a test event and return the row.
 */
export async function createTestEvent(organizerId: number, overrides: Record<string, unknown> = {}) {
  const [event] = await sql`
    INSERT INTO events (title, description, location, start_time, end_time, capacity, ticket_price, organizer_id)
    VALUES (
      ${(overrides.title as string) ?? "Test Event"},
      ${(overrides.description as string) ?? "A test event"},
      ${(overrides.location as string) ?? "Test Location"},
      ${(overrides.startTime as Date) ?? new Date("2026-06-01T10:00:00")},
      ${(overrides.endTime as Date) ?? new Date("2026-06-01T16:00:00")},
      ${(overrides.capacity as number) ?? 100},
      ${(overrides.ticketPrice as string) ?? "0.00"},
      ${organizerId}
    )
    RETURNING *
  `;
  return event;
}

/**
 * Make an HTTP request to the test app and return the response.
 */
export async function request(
  method: string,
  path: string,
  options: { body?: unknown; token?: string } = {},
) {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  return app.request(path, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

/**
 * Close the database connection. Call in afterAll.
 */
export async function closeDatabase() {
  await sql.end();
}
