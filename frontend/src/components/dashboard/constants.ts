/**
 * Shared constants and utility functions for the Organizer Dashboard.
 * @module dashboard/constants
 */

/** Maps event status strings to their corresponding badge CSS classes. */
export const statusBadge: Record<string, string> = {
  upcoming: "badge-success",
  ongoing: "badge-info",
  completed: "badge-neutral",
  cancelled: "badge-danger",
};

/**
 * Formats an ISO date string into a short human-readable form (e.g. "Apr 7").
 * @param dateStr - ISO 8601 date string
 * @returns Formatted date like "Apr 7"
 */
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
