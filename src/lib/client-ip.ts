/**
 * The visitor's address as the host wrote it, never as the visitor claims it (security check 2026-11-13, «Формы сайта»;
 * review 2026-11-16): on Vercel its own `x-vercel-forwarded-for` (elsewhere anyone can send that header, so it is not
 * read), else the right-most `x-forwarded-for` entry — the one the last proxy appended; entries to its left come from
 * the client. Only a real IP address counts (Node's own parser, after taking off «[…]», a port and an IPv6 zone). Null
 * when there is none (a direct local request). Used for limits (forms, sign-in, page views) and the journal.
 */
import { isIP } from "node:net";

function asIp(raw: string | undefined): string | null {
  if (!raw) return null;
  let v = raw.trim();
  const bracket = /^\[([^\]]+)\](?::\d+)?$/.exec(v); // [2001:db8::1]:443
  if (bracket) v = bracket[1];
  else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(v)) v = v.slice(0, v.lastIndexOf(":")); // 203.0.113.7:443
  v = v.replace(/%.*$/, ""); // fe80::1%eth0
  return isIP(v) ? v : null;
}

export function clientIp(h: Pick<Headers, "get">, onVercel = !!process.env.VERCEL): string | null {
  const vercel = onVercel ? h.get("x-vercel-forwarded-for")?.split(",")[0].trim() : undefined;
  const entries = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return asIp(vercel || entries[entries.length - 1]);
}
