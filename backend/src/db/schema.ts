import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "organizer",
  "student",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "upcoming",
  "ongoing",
  "completed",
  "cancelled",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  netId: text("net_id").notNull().unique(), // USF NetID (e.g. tjsmith1)
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  capacity: integer("capacity").notNull(),
  ticketPrice: numeric("ticket_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  status: eventStatusEnum("status").notNull().default("upcoming"),
  organizerId: integer("organizer_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  eventId: integer("event_id")
    .references(() => events.id)
    .notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  checkedIn: boolean("checked_in").notNull().default(false),
  confirmationCode: text("confirmation_code").notNull().unique(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Music", "Sports", "Academic"
});

// Event <-> Category join table
export const eventCategories = pgTable("event_categories", {
  eventId: integer("event_id")
    .references(() => events.id)
    .notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id)
    .notNull(),
});
