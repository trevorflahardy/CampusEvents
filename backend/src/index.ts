import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import authRouter from "./routes/auth";
import categoriesRouter from "./routes/categories";
import eventsRouter from "./routes/events";
import ticketsRouter from "./routes/tickets";
import usersRouter from "./routes/users";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "/api/*",
  cors({ origin: ["http://localhost:5173", "http://frontend:5173"] }),
);

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
