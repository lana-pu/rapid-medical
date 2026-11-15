import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, revisions, type Revision } from "@/db";
import { getSession, isReady, type SessionUser } from "./auth";
import { getResource } from "@/admin/resources";
import { getRow } from "@/admin/engine";

/**
 * «View» an earlier version of a page without restoring it (docs/screens/on-page-editor.md → «История»): the page is
 * shown with the revision's data instead of the live row. Only for a signed-in editor (2FA passed); the revision must be
 * one of a page record. `x-rm-version` comes from `?version=` through proxy.ts.
 */
export const PAGE_RESOURCES = ["solutions", "pages", "site-pages"];

export const viewingVersion = cache(async (): Promise<{ rev: Revision; user: SessionUser; path: string } | null> => {
  try {
    const h = await headers();
    const v = h.get("x-rm-version");
    if (!v || !/^\d{1,10}$/.test(v)) return null;
    const user = await getSession();
    if (!isReady(user)) return null;
    const rev = await db.query.revisions.findFirst({ where: eq(revisions.id, Number(v)) });
    if (!rev || !PAGE_RESOURCES.includes(rev.resource)) return null;
    // only a version of the page on screen: page A with page B's version shows nothing (security review 2026-11-15)
    const path = await revisionPath(rev);
    if (!path || path !== h.get("x-rm-path")) return null;
    return { rev, user: user!, path };
  } catch {
    return null; // outside a request (sitemap, build)
  }
});

/** The address of the page a revision belongs to. */
export async function revisionPath(rev: Revision): Promise<string | null> {
  const res = getResource(rev.resource);
  const row = res ? await getRow(res, rev.recordId) : null;
  return res && row ? (res.previewUrl?.(row) ?? null) : null;
}

/** A row of `resource` as it was in the version being viewed, if that is the row on screen. */
export async function asViewedVersion<T extends { id: number }>(resource: string, row: T): Promise<T> {
  const v = await viewingVersion();
  if (!v || v.rev.resource !== resource || v.rev.recordId !== row.id) return row;
  return { ...row, ...(v.rev.data as Partial<T>), id: row.id };
}
