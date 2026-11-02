import "server-only";
import { eq, sql } from "drizzle-orm";
import { permanentRedirect, redirect } from "next/navigation";
import { headers } from "next/headers";
import { db, redirects, notFoundLog } from "@/db";

/**
 * Looks up a legacy path in the redirects table and redirects if found.
 * Called by catch-all pages right before they would 404, so the lookup
 * only costs anything on misses.
 */
export async function redirectIfLegacy(path: string): Promise<never | void> {
  const row = await db.query.redirects.findFirst({ where: eq(redirects.from, path) });
  if (!row) {
    await logNotFound(path);
    return;
  }
  // fire-and-forget hit counter
  db.update(redirects).set({ hits: sql`${redirects.hits} + 1` }).where(eq(redirects.id, row.id)).catch(() => {});
  if (row.permanent) permanentRedirect(row.to);
  redirect(row.to);
}

/** Record a public 404 (deduplicated by path) so editors can add a redirect. */
export async function logNotFound(path: string) {
  if (!/^\/[a-z0-9\-_/.%]{1,200}$/i.test(path) || /\.(php|asp|env|git|xml|json|map|txt)$/i.test(path) || /wp-|wordpress|admin|\.well-known/i.test(path)) return; // ignore scanner noise
  let referer: string | null = null;
  try { referer = (await headers()).get("referer")?.slice(0, 300) ?? null; } catch { /* no request */ }
  await db
    .insert(notFoundLog)
    .values({ path, lastReferer: referer })
    .onConflictDoUpdate({ target: notFoundLog.path, set: { hits: sql`${notFoundLog.hits} + 1`, lastSeenAt: new Date(), lastReferer: referer ?? notFoundLog.lastReferer, resolvedAt: null } })
    .catch(() => {});
}
