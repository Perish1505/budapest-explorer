// Pure business rules shared by UI. The database enforces the same rules authoritatively.
export const CANCELLATION_HOURS = 24;
export const CURRENCY = "EUR";

export function calcTotal(priceAdult: number, priceChild: number | null, adults: number, children: number) {
  return Math.round((priceAdult * adults + (priceChild ?? 0) * children) * 100) / 100;
}

export function canUserCancel(status: string, startsAt: string | Date, now: Date = new Date()) {
  if (status !== "pending" && status !== "confirmed") return false;
  const start = new Date(startsAt).getTime();
  return start - now.getTime() >= CANCELLATION_HOURS * 3600 * 1000;
}

export function placesLeft(capacity: number, reserved: number) {
  return Math.max(capacity - reserved, 0);
}

export function formatPrice(n: number | string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: CURRENCY }).format(Number(n));
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDateTime(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Budapest",
  }).format(new Date(d));
}

export function formatDate(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Budapest" }).format(new Date(d));
}

export function formatTime(d: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Budapest" }).format(new Date(d));
}

/** YYYY-MM-DD in Budapest time */
export function budapestDay(d: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Budapest" }).format(new Date(d));
}
