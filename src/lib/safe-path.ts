import { withBase } from "./demo";

/**
 * A redirect target taken from a request (`next`, `redirect`, `back`) may only be a path on this site: it starts with
 * one "/", has no "//" or "\" at the start (browsers read "/\evil.com" as "//evil.com"), no backslashes or control
 * characters at all. Anything else → the fallback (security check 2026-11-13).
 */
export function safeLocalPath(p: string | null | undefined, fallback = "/"): string {
  if (typeof p !== "string" || p.length > 2000) return fallback;
  if (!/^\/(?![/\\])/.test(p) || /[\\\u0000-\u001f\u007f]/.test(p)) return fallback;
  return p;
}

/**
 * A link stored in a record (news, publications, block fields) as it may reach an `href`: http(s), mailto, a path on
 * this site or an in-page anchor. Anything else (javascript:, data:, "//host", "/\host", control characters) → "#".
 * Safe on client and server.
 */
export function safeHref(u: string | null | undefined): string {
  if (typeof u !== "string" || u.length > 2000 || /[\u0000-\u001f\u007f]/.test(u)) return "#";
  const t = u.trim();
  if (/^https?:\/\/[^/\\]/i.test(t) || /^mailto:/i.test(t) || /^#/.test(t)) return t;
  return safeLocalPath(t, "#");
}

/** An href for a plain <a> (not next/link): a site path gets the build's base path (the static demo on Pages). */
export function siteHref(u: string | null | undefined): string {
  const h = safeHref(u);
  return h.startsWith("/") ? withBase(h) : h;
}

/** Leaves the site: an absolute http(s) link (after `safeHref`, nothing else can point elsewhere). */
export function isExternalHref(u: string): boolean {
  return /^https?:\/\//i.test(u);
}
