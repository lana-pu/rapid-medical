import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";
import { db, revisions, type Region, type StoredBlock } from "@/db";
import type { SessionUser } from "@/lib/auth";
import { getSession, isReady } from "@/lib/auth";
import { REGIONS } from "@/db/schema";
import { getResource, type Resource } from "./resources";
import { getDraft, getEditable, hasWorkflow } from "./workflow";
import { getRow, type Row } from "./engine";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Shared server helpers of the page editor (ADR-007). Not server actions themselves. */

export type PageRef = { r: string; id: number };

export async function requireEditor(): Promise<SessionUser> {
  const u = await getSession();
  if (!isReady(u)) throw new Error("Not signed in");
  return u;
}

/** Resources whose records are pages stored as block lists. */
export function pageResource(r: string): Resource {
  const res = getResource(r);
  if (!res || !res.fields.some((f) => f.type === "blocks")) throw new Error("Not a page");
  return res;
}

/** What the editor last saw: the pending draft's time, else the live row's. */
export async function pageVersion(res: Resource, id: number): Promise<string> {
  const [draft, live] = await Promise.all([hasWorkflow(res) ? getDraft(res, id) : null, getRow(res, id)]);
  const t = draft?.data ? draft.updatedAt : live?.updatedAt;
  return t ? new Date(t).toISOString() : "";
}

export class ConflictError extends Error {}

/**
 * Someone else changed the page since the editor loaded it → refuse instead of overwriting their work.
 * The same person in two tabs is not a conflict (their own last save wins).
 */
export async function checkBase(res: Resource, id: number, base: string | undefined, user: SessionUser): Promise<void> {
  if (!base) return;
  const now = await pageVersion(res, id);
  if (!now || now === base) return;
  const draft = hasWorkflow(res) ? await getDraft(res, id) : null;
  if (draft?.data && draft.updatedById === user.id) return;
  throw new ConflictError(`This page was changed by ${draft?.data ? draft.updatedByName : "someone else"}. Reload to see their changes.`);
}

/** Blocks the page had recently (live, draft and the last revisions) — what an undo may put back. */
export async function knownBlocks(res: Resource, id: number): Promise<StoredBlock[]> {
  const e = await getEditable(res, id);
  const revs = await db.select({ data: revisions.data }).from(revisions).where(and(eq(revisions.resource, res.slug), eq(revisions.recordId, id))).orderBy(desc(revisions.createdAt)).limit(30);
  const lists = [e?.live.blocks, e?.row.blocks, ...revs.map((r) => (r.data as any)?.blocks)];
  return lists.filter(Array.isArray).flat() as StoredBlock[];
}

/** The same page in the other regions (same slug, or same key for singleton pages), unpublished ones included. */
export async function regionalSiblings(res: Resource, row: Row): Promise<{ region: Region; id: number; path: string | null }[]> {
  const cols = getTableColumns(res.table) as Row;
  if (!cols.region || !row.region) return [];
  const by = cols.slug ? "slug" : cols.key ? "key" : null;
  if (!by) return [];
  const rows = (await db.select().from(res.table as any).where(and(eq(cols[by], row[by]), ne(cols.id, row.id)))) as Row[];
  return rows
    .filter((x) => REGIONS.includes(x.region))
    .map((x) => ({ region: x.region as Region, id: x.id as number, path: res.previewUrl?.(x) ?? null }));
}
