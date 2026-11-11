/**
 * Events: upcoming / past and whether registration is open — always derived from the dates
 * (docs/screens/events.md). No cron and no manual archiving: pages are rendered per request.
 * Dates are compared as calendar days (YYYY-MM-DD, UTC), so an event stays "upcoming" through its last day.
 */

export type EventDates = {
  startsOn: Date | string;
  endsOn?: Date | string | null;
  registration?: string | null;
  registrationUrl?: string | null;
  registrationClosesOn?: Date | string | null;
};

export const day = (d: Date | string): string => (typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10));
export const today = () => day(new Date());

/** Past from the day after the last day of the event. */
export function isPast(e: EventDates, now: string = today()): boolean {
  return now > day(e.endsOn ?? e.startsOn);
}

/** Registration shown as open: a registration type is set, the event is not over, the closing day has not passed. */
export function registrationOpen(e: EventDates, now: string = today()): boolean {
  if (e.registration !== "form" && !(e.registration === "link" && e.registrationUrl)) return false;
  if (isPast(e, now)) return false;
  return now <= day(e.registrationClosesOn ?? e.startsOn);
}

/** Upcoming soonest first, past newest first. */
export function splitEvents<T extends EventDates>(items: T[], now: string = today()): { upcoming: T[]; past: T[] } {
  const upcoming = items.filter((e) => !isPast(e, now)).sort((a, b) => day(a.startsOn).localeCompare(day(b.startsOn)));
  const past = items.filter((e) => isPast(e, now)).sort((a, b) => day(b.startsOn).localeCompare(day(a.startsOn)));
  return { upcoming, past };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "3 September 2026", "15–16 September 2026", "30 September – 2 October 2026". */
export function formatEventDates(e: EventDates): string {
  const [y1, m1, d1] = day(e.startsOn).split("-").map(Number);
  const one = `${d1} ${MONTHS[m1 - 1]} ${y1}`;
  if (!e.endsOn || day(e.endsOn) === day(e.startsOn)) return one;
  const [y2, m2, d2] = day(e.endsOn).split("-").map(Number);
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m1 - 1]} ${y1}`;
  if (y1 === y2) return `${d1} ${MONTHS[m1 - 1]} – ${d2} ${MONTHS[m2 - 1]} ${y1}`;
  return `${one} – ${d2} ${MONTHS[m2 - 1]} ${y2}`;
}
