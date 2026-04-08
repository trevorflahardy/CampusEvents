import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import authRouter from "./routes/auth";
import categoriesRouter from "./routes/categories";
import eventsRouter from "./routes/events";
import ticketsRouter from "./routes/tickets";
import imagesRouter from "./routes/images";
import usersRouter from "./routes/users";

// Run migrations on startup so the images table (and any future tables) are always present
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
await migrate(drizzle(migrationClient), {
  migrationsFolder: "./src/db/migrations",
});
await migrationClient.end();
console.log("✅ Migrations applied");

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "/api/*",
  cors({ origin: ["http://localhost:5173", "http://frontend:5173"] }),
);

// Serve uploaded images from database
app.route("/uploads", imagesRouter);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/auth", authRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/events", eventsRouter);
app.route("/api/tickets", ticketsRouter);
app.route("/api/users", usersRouter);

const PORT = Number(process.env.PORT) || 3000;
console.log(`🚀 Server running on http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
