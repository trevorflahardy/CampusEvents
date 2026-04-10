// ============================================================
// TypeScript interfaces for database row types.
// These mirror the tables defined in schema.sql and replace
// the type inference that Drizzle ORM previously provided.
// ============================================================

export type UserRole = "admin" | "organizer" | "student";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface User {
  id: number;
  netId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  profilePhoto: string | null;
  createdAt: Date;
}

export type UserWithoutPassword = Omit<User, "passwordHash">;

export interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  ticketPrice: string; // NUMERIC comes back as string
  status: EventStatus;
  organizerId: number;
  bannerUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
}

export interface Ticket {
  id: number;
  userId: number;
  eventId: number;
  purchasedAt: Date;
  checkedIn: boolean;
  confirmationCode: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface EventCategory {
  eventId: number;
  categoryId: number;
}

export interface Image {
  id: number;
  filename: string;
  mimeType: string;
  data: string; // base64-encoded
  createdAt: Date;
}
