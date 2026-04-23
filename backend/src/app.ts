/**
 * Hono app factory — separated from index.ts so tests can import the app
 * without triggering migrations or starting the server.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import authRouter from "./routes/auth";
import categoriesRouter from "./routes/categories";
import eventsRouter from "./routes/events";
import ticketsRouter from "./routes/tickets";
import imagesRouter from "./routes/images";
import usersRouter from "./routes/users";

export function createApp() {
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

  return app;
}
