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
