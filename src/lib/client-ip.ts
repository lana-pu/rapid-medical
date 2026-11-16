/**
 * The visitor's address as the host wrote it, never as the visitor claims it (security check 2026-11-13, «Формы сайта»):
 * Vercel's `x-vercel-forwarded-for`, else the right-most `x-forwarded-for` entry — the one the last proxy appended; the
 * entries to its left come from the client and can be anything. Null when there is neither (a direct local request).
 * Used for limits (forms, sign-in, page views) and the journal.
 */
export function clientIp(h: Pick<Headers, "get">): string | null {
  const vercel = h.get("x-vercel-forwarded-for")?.split(",")[0].trim();
  if (vercel) return vercel.slice(0, 64);
  const last = (h.get("x-forwarded-for") ?? "").split(",").pop()?.trim();
  return last ? last.slice(0, 64) : null;
}
