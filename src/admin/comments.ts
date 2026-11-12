"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { comments, db, type Comment } from "@/db";
import { audit } from "@/lib/audit";
import { getEditable } from "./workflow";
import { pageResource, requireEditor, type PageRef } from "./page-core";

/** Comments on a page (docs/screens/on-page-editor.md → «Комментарии»). Everyone signed in reads and writes them. */

export type CommentView = Pick<Comment, "id" | "anchor" | "parentId" | "body" | "authorName" | "resolvedByName"> & { at: string; resolvedAt: string | null; /** author, or an admin */ canDelete: boolean };
type Fail = { error: string };

const ANCHOR = /^[a-f0-9]{10}(\/\d{1,4}){0,3}$/;

async function page(ref: PageRef) {
  const res = pageResource(ref.r); // only pages kept as block lists
  if (!(await getEditable(res, Number(ref.id)))) throw new Error("Page not found");
  return res;
}

export async function listComments(ref: PageRef): Promise<{ items: CommentView[] } | Fail> {
  try {
    const me = await requireEditor();
    const res = await page(ref);
    const rows = await db.select().from(comments).where(and(eq(comments.resource, res.slug), eq(comments.recordId, Number(ref.id)))).orderBy(asc(comments.createdAt));
    return {
      items: rows.map((c) => ({ id: c.id, anchor: c.anchor, parentId: c.parentId, body: c.body, authorName: c.authorName, resolvedByName: c.resolvedByName, at: c.createdAt.toISOString(), resolvedAt: c.resolvedAt?.toISOString() ?? null, canDelete: c.authorId === me.id || me.role === "admin" })),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function addComment(ref: PageRef, anchor: string | null, body: string, parentId?: number): Promise<{ id: number } | Fail> {
  try {
    const me = await requireEditor();
    const res = await page(ref);
    const text = String(body ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 2000);
    if (!text) return { error: "Write something first" };
    if (anchor !== null && !ANCHOR.test(String(anchor))) return { error: "This section is not on the page" };
    let a = anchor;
    if (parentId) {
      const parent = await db.query.comments.findFirst({ where: and(eq(comments.id, Number(parentId)), isNull(comments.parentId)) });
      if (!parent || parent.resource !== res.slug || parent.recordId !== Number(ref.id)) return { error: "That comment is gone" };
      a = parent.anchor; // a reply sits with its thread
    }
    const [c] = await db.insert(comments).values({ resource: res.slug, recordId: Number(ref.id), anchor: a, parentId: parentId ? Number(parentId) : null, body: text, authorId: me.id, authorName: me.name }).returning({ id: comments.id });
    await audit(me, "comment", { resource: res.slug, recordId: Number(ref.id), label: text.slice(0, 80), meta: { reply: !!parentId } });
    return { id: c.id };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Close a thread (or open it again). */
export async function resolveComment(id: number, resolved: boolean): Promise<{ ok: true } | Fail> {
  try {
    const me = await requireEditor();
    const c = await db.query.comments.findFirst({ where: and(eq(comments.id, Number(id)), isNull(comments.parentId)) });
    if (!c) return { error: "That comment is gone" };
    await db.update(comments).set(resolved ? { resolvedAt: new Date(), resolvedByName: me.name } : { resolvedAt: null, resolvedByName: null }).where(eq(comments.id, c.id));
    await audit(me, "comment", { resource: c.resource, recordId: c.recordId, label: c.body.slice(0, 80), meta: { resolved } });
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Your own comment, or any comment if you are an admin; a thread goes with its replies. */
export async function deleteComment(id: number): Promise<{ ok: true } | Fail> {
  try {
    const me = await requireEditor();
    const c = await db.query.comments.findFirst({ where: eq(comments.id, Number(id)) });
    if (!c) return { ok: true };
    if (c.authorId !== me.id && me.role !== "admin") return { error: "Only the author or an admin can delete it" };
    await db.delete(comments).where(eq(comments.parentId, c.id));
    await db.delete(comments).where(eq(comments.id, c.id));
    await audit(me, "comment", { resource: c.resource, recordId: c.recordId, label: c.body.slice(0, 80), meta: { deleted: true } });
    return { ok: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
