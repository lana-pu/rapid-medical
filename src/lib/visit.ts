/**
 * Whether a request is the browser opening a page (a full load), as opposed to a background fetch: the router's
 * prefetch of a link on screen, a client-side navigation, or a speculative load. Next strips its own router headers
 * (`next-router-prefetch`, `rsc`) before `proxy.ts` runs, so this reads the browser's `Sec-Fetch-*` headers instead.
 * No such header (curl, old browsers) counts as a page load.
 */
export function isPageLoad(headers: Headers): boolean {
  const dest = headers.get("sec-fetch-dest");
  if (dest !== null && dest !== "document") return false;
  return !/prefetch|prerender/i.test(headers.get("sec-purpose") ?? headers.get("purpose") ?? "");
}
