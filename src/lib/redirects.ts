import "server-only";
import { eq, sql } from "drizzle-orm";
import { permanentRedirect, redirect } from "next/navigation";
import { db, redirects } from "@/db";

/**
 * Looks up a legacy path in the redirects table and redirects if found.
 * Called by catch-all pages right before they would 404, so the lookup
 * only costs anything on misses.
 */
export async function redirectIfLegacy(path: string): Promise<never | void> {
  const row = await db.query.redirects.findFirst({ where: eq(redirects.from, path) });
  if (!row) return;
  // fire-and-forget hit counter
  db.update(redirects).set({ hits: sql`${redirects.hits} + 1` }).where(eq(redirects.id, row.id)).catch(() => {});
  if (row.permanent) permanentRedirect(row.to);
  redirect(row.to);
}
