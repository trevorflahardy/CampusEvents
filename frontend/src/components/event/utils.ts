/**
 * Shared utility functions and constants for EventDetail sub-components.
 *
 * Contains date/time formatters, price formatting, datetime-local conversion,
 * and status-to-badge-class mapping used across the event detail page.
 */

/** Maps event status strings to their corresponding badge CSS classes. */
export const statusColors: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
};

/**
 * Formats an ISO date string into a full human-readable date with time.
 * Example: "Monday, January 1, 2026, 3:00 PM"
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Formats an ISO date string into a short date (no time).
 * Example: "Mon, January 1, 2026"
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats an ISO date string into just the time portion.
 * Example: "3:00 PM"
 */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Formats a price string as currency. Returns "Free" for zero-value prices.
 * Example: "15.00" => "$15.00", "0" => "Free"
 */
export function formatPrice(price: string): string {
  const num = parseFloat(price);
  return num === 0 ? "Free" : `$${num.toFixed(2)}`;
}

/**
 * Converts an ISO date string to the `datetime-local` input format (YYYY-MM-DDTHH:MM).
 * Used by EditableField when editing date/time values inline.
 */
export function toDatetimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
