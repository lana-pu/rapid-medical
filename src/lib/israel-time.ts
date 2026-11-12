/**
 * Times people type in the admin are Israel time (the company's time; docs/screens/admin-record-edit.md → Schedule),
 * whatever time zone the server runs in.
 */
const TZ = "Asia/Jerusalem";

/** Minutes Israel is ahead of UTC at that moment (120 or 180). */
export function israelOffset(at: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

/** "2026-11-12T10:00" typed as Israel time → the moment. Invalid → null. */
export function fromIsraelInput(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const naive = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  let at = new Date(naive - israelOffset(new Date(naive)) * 60000);
  at = new Date(naive - israelOffset(at) * 60000); // once more across a clock change
  return at;
}

/** The moment → "2026-11-12T10:00" in Israel time, for a datetime-local input. */
export function toIsraelInput(at: Date | null | undefined): string {
  if (!at) return "";
  return new Date(at.getTime() + israelOffset(at) * 60000).toISOString().slice(0, 16);
}

/** "Israel (UTC+2)" for that moment. */
export const israelZoneLabel = (at = new Date()) => `Israel (UTC+${israelOffset(at) / 60})`;
