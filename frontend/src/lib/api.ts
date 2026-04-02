const API_BASE = "/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    if (res.status === 401) {
      localStorage.removeItem("token");
    }
    throw new ApiError(res.status, body.error || "Request failed");
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    netId: string;
    name: string;
    email: string;
    password: string;
    role?: string;
  }) =>
    request<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => request<User>("/auth/me"),

  // Events
  getEvents: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<Event[]>(`/events${qs}`);
  },
  getEvent: (id: number) => request<EventDetail>(`/events/${id}`),
  getEventStats: () => request<EventStat[]>("/events/stats"),
  createEvent: (data: CreateEventData) =>
    request<Event>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEvent: (id: number, data: Partial<Event>) =>
    request<Event>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: number) =>
    request<{ success: boolean }>(`/events/${id}`, { method: "DELETE" }),
  getEventTickets: (id: number) =>
    request<Attendee[]>(`/events/${id}/tickets`),

  // Tickets
  purchaseTicket: (userId: number, eventId: number) =>
    request<Ticket>("/tickets", {
      method: "POST",
      body: JSON.stringify({ userId, eventId }),
    }),
  getUserTickets: (userId: number) =>
    request<UserTicket[]>(`/tickets/user/${userId}`),
  checkinTicket: (id: number) =>
    request<Ticket>(`/tickets/${id}/checkin`, { method: "PATCH" }),
  cancelTicket: (id: number) =>
    request<{ success: boolean }>(`/tickets/${id}`, { method: "DELETE" }),

  // Categories
  getCategories: () => request<Category[]>("/categories"),
  getPopularCategories: () =>
    request<PopularCategory[]>("/categories/popular"),
  createCategory: (name: string) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  // Users
  getUsers: () => request<User[]>("/users"),
  updateUserRole: (id: number, role: string) =>
    request<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};

// Types
export interface User {
  id: number;
  netId: string;
  name: string;
  email: string;
  role: "admin" | "organizer" | "student";
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  ticketPrice: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  organizerId: number;
  createdAt: string;
  organizerName: string;
}

export interface EventDetail extends Event {
  spotsRemaining: number;
  categories: Category[];
}

export interface EventStat {
  eventId: number;
  title: string;
  ticketsSold: number;
  capacity: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  ticketPrice?: string;
  organizerId: number;
}

export interface Ticket {
  id: number;
  userId: number;
  eventId: number;
  purchasedAt: string;
  checkedIn: boolean;
  confirmationCode: string;
}

export interface UserTicket {
  ticketId: number;
  purchasedAt: string;
  checkedIn: boolean;
  confirmationCode: string;
  eventId: number;
  eventTitle: string;
  eventLocation: string;
  eventStartTime: string;
  eventEndTime: string;
  eventStatus: string;
  ticketPrice: string;
  categories: Category[];
}

export interface Attendee {
  ticketId: number;
  userId: number;
  userName: string;
  userEmail: string;
  purchasedAt: string;
  checkedIn: boolean;
  confirmationCode: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface PopularCategory {
  categoryId: number;
  name: string;
  eventCount: number;
}

export { ApiError };
