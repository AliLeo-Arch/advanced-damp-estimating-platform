/** UK-oriented date/time display helpers (en-GB). */

export const APP_LOCALE = "en-GB";

function parseDateInput(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Date-only YYYY-MM-DD — parse as local calendar date (avoid UTC shift).
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    const local = new Date(year, month - 1, day);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Display dates as dd/mm/yyyy. */
export function formatUkDate(
  value: string | Date | null | undefined,
  empty = "—",
): string {
  const date = parseDateInput(value);
  if (!date) return empty;
  return date.toLocaleDateString(APP_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Display timestamps as dd/mm/yyyy, HH:MM. */
export function formatUkDateTime(
  value: string | Date | null | undefined,
  empty = "—",
): string {
  const date = parseDateInput(value);
  if (!date) return empty;
  return date.toLocaleString(APP_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Display clock time as HH:MM. */
export function formatUkTime(
  value: string | Date | null | undefined,
  empty = "—",
): string {
  const date = parseDateInput(value);
  if (!date) return empty;
  return date.toLocaleTimeString(APP_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
