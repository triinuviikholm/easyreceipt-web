// Calendar helpers. Receipt dates are plain calendar dates ("YYYY-MM-DD"); "today"
// and month boundaries are always decided in the Europe/Tallinn timezone.

export const TIMEZONE = "Europe/Tallinn";
export const MIN_DATE = "2000-01-01";

const isoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayIso(now: Date = new Date()): string {
  return isoFormatter.format(now); // en-CA gives YYYY-MM-DD
}

export function currentMonth(now: Date = new Date()): string {
  return todayIso(now).slice(0, 7);
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isValidMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// DATE column values are UTC midnight Date objects.
export function isoToDbDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function dbDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// [first day, first day of next month) for a "YYYY-MM" month
export function monthRange(month: string): { gte: Date; lt: Date } {
  return { gte: isoToDbDate(`${month}-01`), lt: isoToDbDate(`${shiftMonth(month, 1)}-01`) };
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-11-03" -> "3 Nov 2026". Built by hand because en-GB "short" gives "Sept" in newer ICU versions.
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${SHORT_MONTHS[m - 1]} ${y}`;
}

// "2026-11" -> "November 2026"
export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    isoToDbDate(`${month}-01`),
  );
}

// Months offered in selectors: the current month and earlier ones, never future months.
export function recentMonths(count = 24, now: Date = new Date()): string[] {
  const current = currentMonth(now);
  return Array.from({ length: count }, (_, i) => shiftMonth(current, -i));
}
