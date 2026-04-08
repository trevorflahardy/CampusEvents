import { Hono } from "hono";
import { db } from "../db/client";
import { images } from "../db/schema";
import { eq } from "drizzle-orm";

const router = new Hono();

// GET /uploads/:filename — serve an image from the database
router.get("/:filename", async (c) => {
  const filename = c.req.param("filename");

  const rows = await db
    .select({ mimeType: images.mimeType, data: images.data })
    .from(images)
    .where(eq(images.filename, filename));

  if (!rows.length) {
    return c.json({ error: "Image not found" }, 404);
  }

  const { mimeType, data } = rows[0];
  const buffer = Buffer.from(data, "base64");

  return new Response(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

export default router;
