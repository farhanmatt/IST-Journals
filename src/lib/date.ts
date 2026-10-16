import { format } from "date-fns";

/**
 * Format a Date object or ISO string into a readable date and time string.
 * Example output: "12 Oct 2026, 02:30 PM"
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return format(d, "dd MMM yyyy, hh:mm a");
}

/**
 * Format a Date object or ISO string into a readable date-only string.
 * Example output: "12 Oct 2026"
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return format(d, "dd MMM yyyy");
}
