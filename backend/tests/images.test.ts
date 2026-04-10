import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import sql from "../src/db/client";
import { cleanDatabase, request, closeDatabase } from "./setup";

beforeAll(async () => {
  await cleanDatabase();
  // Insert a test image directly
  const base64Data = Buffer.from("fake-image-data").toString("base64");
  await sql`
    INSERT INTO images (filename, mime_type, data)
    VALUES ('test_image.png', 'image/png', ${base64Data})
  `;
});

afterAll(async () => {
  await closeDatabase();
});

describe("GET /uploads/:filename", () => {
  it("serves a stored image", async () => {
    const res = await request("GET", "/uploads/test_image.png");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });

  it("returns 404 for missing image", async () => {
    const res = await request("GET", "/uploads/nonexistent.png");
    expect(res.status).toBe(404);
  });
});
