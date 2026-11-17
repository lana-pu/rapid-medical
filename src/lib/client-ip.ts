import { isIP } from "node:net";

/**
 * The visitor's address as the host wrote it, never as the visitor claims it (security check 2026-11-13, «Формы сайта»;
 * reviews 2026-11-16). Who wrote it is configured, not guessed:
 * - on Vercel — only Vercel's own `x-vercel-forwarded-for`;
 * - elsewhere — `x-forwarded-for` only when TRUSTED_PROXY_HOPS says how many proxies stand in front (1 for one nginx):
 *   the entry that many places from the right is the one the outermost trusted proxy wrote; anything left of it came
 *   from the client. Without the setting the header is not trusted at all.
 * Only a real IP address counts (Node's parser, after taking off «[…]», a port and an IPv6 zone). Null when there is
 * none — then limits use their shared «unknown» bucket. Used for limits (forms, sign-in, page views) and the journal.
 */
export function clientIp(
  h: Pick<Headers, "get">,
  onVercel = !!process.env.VERCEL,
  hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 0),
): string | null {
  if (onVercel) return asIp(h.get("x-vercel-forwarded-for")?.split(",")[0]);
  if (!Number.isInteger(hops) || hops < 1) {
    warnOnce();
    return null;
  }
  const entries = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return entries.length >= hops ? asIp(entries[entries.length - hops]) : null;
}

let warned = false;
/** A production server off Vercel with no TRUSTED_PROXY_HOPS has no per-address limits: say so once in the log. */
function warnOnce() {
  if (warned || process.env.NODE_ENV !== "production" || process.env.VERCEL) return;
  warned = true;
  console.warn("[client-ip] TRUSTED_PROXY_HOPS is not set: visitor addresses are unknown, per-address limits share one bucket (.env.example)");
}

function asIp(raw: string | undefined): string | null {
  if (!raw) return null;
  let v = raw.trim();
  const bracket = /^\[([^\]]+)\](?::\d+)?$/.exec(v); // [2001:db8::1]:443
  if (bracket) v = bracket[1];
  else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(v)) v = v.slice(0, v.lastIndexOf(":")); // 203.0.113.7:443
  v = v.replace(/%.*$/, ""); // fe80::1%eth0
  return isIP(v) ? v : null;
}
