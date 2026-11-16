/**
 * The visitor's address as the host wrote it, never as the visitor claims it (security check 2026-11-13, «Формы сайта»;
 * review 2026-11-16): on Vercel its own `x-vercel-forwarded-for` (elsewhere anyone can send that header, so it is not
 * read), else the right-most `x-forwarded-for` entry — the one the last proxy appended; entries to its left come from
 * the client. Only something shaped like an IP address counts. Null when there is none (a direct local request).
 * Used for limits (forms, sign-in, page views) and the journal.
 */
const IP = /^(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:.]{2,45})$/i;

export function clientIp(h: Pick<Headers, "get">, onVercel = !!process.env.VERCEL): string | null {
  const vercel = onVercel ? h.get("x-vercel-forwarded-for")?.split(",")[0].trim() : undefined;
  const entries = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const v = vercel || entries[entries.length - 1];
  return v && IP.test(v) ? v : null;
}
