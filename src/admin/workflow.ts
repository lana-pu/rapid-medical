import "server-only";
import { and, desc, eq, lte, isNotNull, sql } from "drizzle-orm";
import { db, drafts, revisions, type Draft, type Revision, type ReviewStatus } from "@/db";
import type { SessionUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { sendMail } from "@/lib/mail";
import { getResource, type Resource } from "./resources";
import { getRow, saveRow, type Row } from "./engine";

/* eslint-disable @typescript-eslint/no-explicit-any */

export type WorkflowSettings = { requireApproval?: boolean; notifyEmail?: string };

export async function workflowSettings(): Promise<WorkflowSettings> {
  return getSetting<WorkflowSettings>("workflow");
}

/** Which resources go through draft → publish (everything with a status column). */
export function hasWorkflow(res: Resource): boolean {
  return res.fields.some((f) => f.name === "status");
}

export async function getDraft(res: Resource, id: number): Promise<Draft | null> {
  return (await db.query.drafts.findFirst({ where: and(eq(drafts.resource, res.slug), eq(drafts.recordId, id)) })) ?? null;
}

/** Row as the editor should see it: pending draft layered over the live row. */
export async function getEditable(res: Resource, id: number): Promise<{ row: Row; draft: Draft | null; live: Row } | null> {
  const live = await getRow(res, id);
  if (!live) return null;
  const draft = hasWorkflow(res) ? await getDraft(res, id) : null;
  return { row: draft?.data ? { ...live, ...draft.data, id } : live, draft, live };
}

/** Strip server-managed columns before snapshotting / diffing. */
export function snapshot(res: Resource, row: Row): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of res.fields) out[f.name] = row[f.name] ?? null;
  return out;
}

async function addRevision(res: Resource, id: number, kind: Revision["kind"], data: Record<string, unknown>, user: SessionUser, note = "") {
  // id 0 = system actor (scheduler); no users row behind it
  await db.insert(revisions).values({ resource: res.slug, recordId: id, kind, data, userId: user.id > 0 ? user.id : null, userName: user.name, note });
}

/** Records imported by seed have no history: snapshot the live row before its first edit. */
async function ensureBaseline(res: Resource, id: number, live: Row) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(revisions).where(and(eq(revisions.resource, res.slug), eq(revisions.recordId, id)));
  if (n === 0) await db.insert(revisions).values({ resource: res.slug, recordId: id, kind: live.status === "published" ? "published" : "draft", data: snapshot(res, live), userName: "Import", note: "Baseline before first edit" });
}

/**
 * Save from the admin form.
 * - new record            → insert as draft (status forced to "draft"), revision "created"
 * - unpublished record    → update live row directly, revision "draft"
 * - published record      → write to drafts table (live untouched), revision "draft"
 * Returns the record id and whether the change is pending (in a draft).
 * Only the admin form may publish an unpublished record through its status select (`formPublish`), and only when
 * `canPublish` allows it. Every other save (on-page edits, sections, media replace, restore) never publishes: a status
 * carried over from a stale draft must not skip Publish and the approval check.
 */
export async function saveWithWorkflow(
  res: Resource,
  id: number | null,
  data: Row,
  user: SessionUser,
  opts: { formPublish?: boolean } = {},
): Promise<{ id: number; pending: boolean; notPublished?: boolean }> {
  if (!hasWorkflow(res)) {
    const saved = await saveRow(res, id, data);
    await audit(user, "save", { resource: res.slug, recordId: saved, label: String(data[res.labelField] ?? "") });
    return { id: saved, pending: false };
  }

  if (!id) {
    const saved = await saveRow(res, null, { ...data, status: "draft" });
    await addRevision(res, saved, "created", snapshot(res, { ...data, status: "draft" }), user);
    await audit(user, "save", { resource: res.slug, recordId: saved, label: String(data[res.labelField] ?? ""), meta: { created: true } });
    return { id: saved, pending: false };
  }

  const live = await getRow(res, id);
  if (!live) throw new Error("Record not found");
  await ensureBaseline(res, id, live);

  if (live.status !== "published") {
    // Not live yet: edit in place. The form's status select may flip it to published → that is a publish.
    const wantsPublish = opts.formPublish === true && data.status === "published";
    await saveRow(res, id, { ...data, status: "draft" });
    // an approval was given to the content before this edit (as with pending changes below)
    await db.update(drafts).set({ reviewStatus: "editing" }).where(and(eq(drafts.resource, res.slug), eq(drafts.recordId, id), eq(drafts.reviewStatus, "approved")));
    await addRevision(res, id, "draft", snapshot(res, { ...data, status: "draft" }), user);
    await audit(user, "save", { resource: res.slug, recordId: id, label: String(data[res.labelField] ?? "") });
    if (!wantsPublish) return { id, pending: false };
    const checked = await getDraft(res, id);
    if (!(await canPublish(user, checked)).ok) return { id, pending: false, notPublished: true };
    await publish(res, id, user, checked);
    return { id, pending: false };
  }

  // Published: park changes in a draft; status stays whatever the live row has.
  const { status: _s, ...rest } = data;
  void _s;
  const payload = snapshot(res, { ...rest, status: live.status });
  const existing = await getDraft(res, id);
  await db
    .insert(drafts)
    .values({ resource: res.slug, recordId: id, data: payload, reviewStatus: existing?.reviewStatus === "approved" ? "editing" : existing?.reviewStatus ?? "editing", updatedById: user.id, updatedByName: user.name, updatedAt: new Date(), publishAt: existing?.publishAt ?? null })
    .onConflictDoUpdate({
      target: [drafts.resource, drafts.recordId],
      set: { data: payload, reviewStatus: existing?.reviewStatus === "approved" ? "editing" : existing?.reviewStatus ?? "editing", updatedById: user.id, updatedByName: user.name, updatedAt: new Date() },
    });
  await addRevision(res, id, "draft", payload, user);
  await audit(user, "save", { resource: res.slug, recordId: id, label: String(data[res.labelField] ?? ""), meta: { pending: true } });
  return { id, pending: true };
}

/** Can this user publish right now? */
export async function canPublish(user: SessionUser, draft: Draft | null): Promise<{ ok: boolean; reason?: string }> {
  const s = await workflowSettings();
  if (!s.requireApproval) return { ok: true };
  if (user.role === "admin") return { ok: true };
  if (user.role === "approver") return { ok: true };
  if (draft?.reviewStatus === "approved") return { ok: true };
  return { ok: false, reason: "Changes must be approved before publishing." };
}

const sameDraft = (a: Draft | null, b: Draft | null) =>
  a === b || (!!a && !!b && a.id === b.id && a.reviewStatus === b.reviewStatus && a.updatedAt.getTime() === b.updatedAt.getTime() && JSON.stringify(a.data) === JSON.stringify(b.data));

/**
 * Make the draft (or the unpublished row) live. `checked`: the draft the caller ran `canPublish` on — if it was edited
 * or its review changed since, nothing is published (what goes live is what was checked).
 */
export async function publish(res: Resource, id: number, user: SessionUser, checked?: Draft | null): Promise<void> {
  const draft = await getDraft(res, id);
  if (checked !== undefined && !sameDraft(draft, checked)) throw new Error("These changes were edited or their review changed meanwhile. Check them and publish again.");
  const live = await getRow(res, id);
  if (!live) throw new Error("Record not found");
  const next = { ...(draft?.data ?? {}), status: "published" };
  await saveRow(res, id, next);
  if (draft) await db.update(drafts).set({ data: null, reviewStatus: draft.reviewStatus === "approved" ? "editing" : draft.reviewStatus }).where(eq(drafts.id, draft.id));
  const row = (await getRow(res, id))!;
  await addRevision(res, id, "published", snapshot(res, row), user);
  await audit(user, "publish", { resource: res.slug, recordId: id, label: String(row[res.labelField] ?? "") });
}

/**
 * Take the record off the site. Pending changes move into the record itself (an unpublished record is edited in place),
 * an approval is reset and a schedule is cancelled: a later Publish must not lay old changes or an old approval over it,
 * and the record does not come back on its own.
 */
export async function unpublish(res: Resource, id: number, user: SessionUser): Promise<void> {
  if (!(await getRow(res, id))) return; // gone meanwhile (a list action with an old row)
  const draft = await getDraft(res, id);
  await saveRow(res, id, { ...(draft?.data ?? {}), status: "draft" });
  if (draft) {
    await db.update(drafts).set({ data: null, publishAt: null, reviewStatus: draft.reviewStatus === "approved" ? "editing" : draft.reviewStatus }).where(eq(drafts.id, draft.id));
    // what the pending changes made of the record is in its history
    if (draft.data) await addRevision(res, id, "draft", snapshot(res, (await getRow(res, id))!), user, "Unpublished: pending changes kept in the record");
  }
  const row = (await getRow(res, id))!;
  await audit(user, "unpublish", { resource: res.slug, recordId: id, label: String(row[res.labelField] ?? "") });
}

export async function discardDraft(res: Resource, id: number, user: SessionUser): Promise<void> {
  await db.delete(drafts).where(and(eq(drafts.resource, res.slug), eq(drafts.recordId, id)));
  await audit(user, "save", { resource: res.slug, recordId: id, meta: { discardedDraft: true } });
}

export async function setReview(res: Resource, id: number, status: ReviewStatus, note: string, user: SessionUser): Promise<void> {
  await db
    .insert(drafts)
    .values({ resource: res.slug, recordId: id, data: null, reviewStatus: status, reviewNote: note, updatedById: user.id, updatedByName: user.name })
    .onConflictDoUpdate({ target: [drafts.resource, drafts.recordId], set: { reviewStatus: status, reviewNote: note, updatedAt: new Date() } });
  await audit(user, "review", { resource: res.slug, recordId: id, meta: { status, note } });
  if (status === "in_review") {
    const wf = await workflowSettings();
    if (wf.notifyEmail) {
      const live = await getRow(res, id);
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      sendMail({
        to: wf.notifyEmail,
        subject: `[Website] Review requested: ${res.titleSingular} “${live?.[res.labelField] ?? id}”`,
        text: `${user.name} submitted changes for review.\n\n${note ? `Note: ${note}\n\n` : ""}Open: ${base}/admin/${res.slug}/${id}`,
      }).catch((e) => console.error("notify failed", e));
    }
  }
}

export async function schedule(res: Resource, id: number, at: Date | null, user: SessionUser): Promise<void> {
  await db
    .insert(drafts)
    .values({ resource: res.slug, recordId: id, data: null, publishAt: at, updatedById: user.id, updatedByName: user.name })
    .onConflictDoUpdate({ target: [drafts.resource, drafts.recordId], set: { publishAt: at, updatedAt: new Date() } });
  await audit(user, "schedule", { resource: res.slug, recordId: id, meta: { at: at?.toISOString() ?? null } });
}

/** Called by the cron route: publish everything whose time has come. */
export async function publishDue(now = new Date()): Promise<{ resource: string; id: number }[]> {
  const due = await db.select().from(drafts).where(and(isNotNull(drafts.publishAt), lte(drafts.publishAt, now)));
  const done: { resource: string; id: number }[] = [];
  const system: SessionUser = { id: 0, email: "system", name: "Scheduler", role: "admin" };
  const { requireApproval } = await workflowSettings();
  for (const d of due) {
    const res = getResource(d.resource);
    if (!res) continue;
    // with approval on, a schedule publishes only approved changes; it waits until they are approved
    if (requireApproval && d.reviewStatus !== "approved") continue;
    try {
      await publish(res, d.recordId, system, requireApproval ? d : undefined);
    } catch {
      continue; // changed after the approval: waits for a new one
    }
    done.push({ resource: d.resource, id: d.recordId });
  }
  return done;
}

export async function listRevisions(res: Resource, id: number, limit = 50): Promise<Revision[]> {
  return db.select().from(revisions).where(and(eq(revisions.resource, res.slug), eq(revisions.recordId, id))).orderBy(desc(revisions.createdAt)).limit(limit);
}

export async function getRevision(id: number): Promise<Revision | null> {
  return (await db.query.revisions.findFirst({ where: eq(revisions.id, id) })) ?? null;
}

/** Restore a revision as the current draft (published records) or live row (unpublished). */
export async function restoreRevision(res: Resource, revId: number, user: SessionUser): Promise<number> {
  const rev = await getRevision(revId);
  if (!rev || rev.resource !== res.slug) throw new Error("Revision not found");
  // A restore never changes whether the record is live: a revision taken while published must not publish an
  // unpublished record (that would skip Publish and the approval check). Publishing stays a separate step.
  const live = await getRow(res, rev.recordId);
  if (!live) throw new Error("Record not found");
  const data = hasWorkflow(res) ? { ...rev.data, status: live.status } : { ...rev.data };
  const { id } = await saveWithWorkflow(res, rev.recordId, data, user);
  await addRevision(res, id, "restored", rev.data, user, `Restored revision #${rev.id}`);
  await audit(user, "restore", { resource: res.slug, recordId: id, meta: { revisionId: rev.id } });
  return id;
}

/** Pending drafts across all resources (for the dashboard / review queue). */
export async function pendingDrafts(): Promise<(Draft & { label: string; resourceTitle: string })[]> {
  const rows = await db.select().from(drafts).orderBy(desc(drafts.updatedAt));
  const out = [];
  for (const d of rows) {
    const res = getResource(d.resource);
    if (!res) continue;
    const live = await getRow(res, d.recordId);
    out.push({ ...d, label: String((d.data as any)?.[res.labelField] ?? live?.[res.labelField] ?? `#${d.recordId}`), resourceTitle: res.titleSingular });
  }
  return out;
}
