import { Hono } from "hono";
import sql from "../db/client";

const router = new Hono();

// GET /uploads/:filename — serve an image from the database
router.get("/:filename", async (c) => {
  const filename = c.req.param("filename");

  // Retrieve the stored base64 image data and MIME type by unique filename
  const rows = await sql`
    SELECT mime_type, data
    FROM images
    WHERE filename = ${filename}
  `;

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
