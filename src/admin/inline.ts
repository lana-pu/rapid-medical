"use server";

import { revalidatePath } from "next/cache";
import { getSession, type SessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getSettingDraft, getLiveSetting, setSettingDraft, deleteSettingDraft, publishSettingDraft } from "@/lib/settings";
import { getSettingsGroup } from "./settings";
import { getResource, type Resource } from "./resources";
import type { FieldDef } from "./fields";
import { getRow } from "./engine";
import { checkBlockPath } from "@/blocks/paths";
import { checkBase, ConflictError, pageVersion } from "./page-core";
import { saveWithWorkflow, publish, discardDraft, getDraft, getEditable, canPublish, setReview, workflowSettings, hasWorkflow } from "./workflow";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Server side of the on-page editor. A target addresses one field of one
 * record: `r` is an admin resource slug (e.g. "solutions") with a numeric
 * `id`, or "settings:<group>" with id 0. `f` is a dotted path into the row,
 * e.g. "heroTitle" or "benefits.2.imageUrl".
 */
export type Target = { r: string; id: number; f: string };
export type InlineKind = "text" | "rich" | "image" | "video" | "url";

async function requireEditor(): Promise<SessionUser> {
  const u = await getSession();
  if (!u || u.totpPending) throw new Error("Not signed in");
  return u;
}

/** Walk the field definitions along a dotted path; null if the path is not an editable leaf. */
function resolveField(fields: FieldDef[], path: string[]): FieldDef | null {
  const [head, ...rest] = path;
  const f = fields.find((x) => x.name === head);
  if (!f) return null;
  if (rest.length === 0) return f;
  if (f.type === "repeater" && f.fields) {
    const [idx, ...tail] = rest;
    if (!/^\d+$/.test(idx) || tail.length === 0) return null;
    return resolveField(f.fields, tail);
  }
  if (f.type === "stringList" && rest.length === 1 && /^\d+$/.test(rest[0])) return { name: rest[0], label: f.label, type: "url" };
  if (f.type === "link" && rest.length === 1 && (rest[0] === "label" || rest[0] === "href")) return { name: rest[0], label: rest[0], type: rest[0] === "href" ? "url" : "text" };
  if (f.type === "json") return { name: rest.join("."), label: "", type: "text" }; // free-form objects (e.g. settings sub-objects)
  return null;
}

function allowedKind(f: FieldDef, kind: InlineKind): boolean {
  switch (f.type) {
    case "text":
    case "textarea":
    case "slug":
      return kind === "text";
    case "markdown":
      return kind === "rich";
    case "image":
      return kind === "image" || kind === "video";
    case "url":
      return kind === "url" || kind === "image" || kind === "video" || kind === "text";
    default:
      return false;
  }
}

function getPath(obj: any, path: string[]): unknown {
  return path.reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj: any, path: string[], value: unknown): any {
  if (path.length === 0) return value;
  const [k, ...rest] = path;
  const isIndex = /^\d+$/.test(k);
  const base = obj == null ? (isIndex ? [] : {}) : Array.isArray(obj) ? [...obj] : { ...obj };
  base[isIndex ? Number(k) : k] = setPath(base[isIndex ? Number(k) : k], rest, value);
  return base;
}

type Resolved =
  | { kind: "resource"; res: Resource; id: number; path: string[]; field: FieldDef }
  | { kind: "blocks"; res: Resource; id: number; path: string[]; field: FieldDef }
  | { kind: "settings"; key: string; path: string[]; field: FieldDef };

/** A field inside the page's block list (ADR-007): checked against the current blocks, typed by the kind of edit. */
function blockField(row: Record<string, unknown>, r: Extract<Resolved, { kind: "blocks" }>, kind: InlineKind | null): FieldDef {
  const check = checkBlockPath(row[r.path[0]], r.path.slice(1));
  if (!check.ok) throw new Error(check.reason);
  const label = check.key;
  if (kind === "rich") {
    if (check.kind !== "rich") throw new Error("This text has no formatting");
    return { name: label, label, type: "markdown" };
  }
  if (kind === "image" || kind === "video" || kind === "url") return { name: label, label, type: "url" };
  return { name: label, label, type: check.kind === "rich" ? "markdown" : "textarea" };
}

function resolve(t: Target): Resolved {
  const path = t.f.split(".").filter(Boolean);
  if (!path.length) throw new Error("Bad field");
  if (t.r.startsWith("settings:")) {
    const key = t.r.slice("settings:".length);
    const group = getSettingsGroup(key);
    if (!group) throw new Error("Unknown settings group");
    const field = resolveField(group.fields, path);
    if (!field) throw new Error(`Field ${t.f} is not editable`);
    return { kind: "settings", key, path, field };
  }
  const res = getResource(t.r);
  if (!res || !t.id) throw new Error("Unknown resource");
  const top = res.fields.find((f) => f.name === path[0]);
  if (top?.type === "blocks") return { kind: "blocks", res, id: t.id, path, field: top };
  const field = resolveField(res.fields, path);
  if (!field) throw new Error(`Field ${t.f} is not editable`);
  return { kind: "resource", res, id: t.id, path, field };
}

/** Current value as the editor should see it (pending draft layered over live). */
export async function readField(t: Target): Promise<{ value: unknown; label: string }> {
  await requireEditor();
  const r = resolve(t);
  if (r.kind === "settings") {
    const [live, draft] = await Promise.all([getLiveSetting(r.key), getSettingDraft(r.key)]);
    return { value: getPath({ ...live, ...(draft?.value ?? {}) }, r.path) ?? "", label: r.field.label };
  }
  const e = await getEditable(r.res, r.id);
  if (!e) throw new Error("Record not found");
  const field = r.kind === "blocks" ? blockField(e.row, r, null) : r.field;
  return { value: getPath(e.row, r.path) ?? "", label: field.label };
}

function coerce(field: FieldDef, kind: InlineKind, raw: unknown): unknown {
  const s = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  if (field.type === "markdown") return /^(<p>\s*<\/p>\s*)*$/.test(s.trim()) ? "" : s;
  if (field.type === "image" || field.type === "url") {
    const v = s.trim();
    if (v && !/^(https?:\/\/|mailto:|\/)/i.test(v)) throw new Error("Must be an absolute URL or a path");
    return v || null;
  }
  if (field.type === "slug") return s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  // text / textarea: normalise line endings, keep newlines for textareas only
  const t = s.replace(/\r\n?/g, "\n");
  return field.type === "textarea" ? t.trim() : t.replace(/\n+/g, " ").trim();
}

/**
 * Save one field. Published records get a pending draft; unpublished rows and settings-drafts are updated directly.
 * `base` = the page version the editor loaded (page-core.ts → pageVersion): if someone else changed the record since,
 * nothing is saved and `conflict` says who. The new version comes back for the next save.
 */
export async function saveField(t: Target, kind: InlineKind, raw: unknown, base?: string): Promise<{ pending: boolean; version?: string; conflict?: string }> {
  const user = await requireEditor();
  const r = resolve(t);
  if (r.kind !== "settings" && base) {
    try {
      await checkBase(r.res, r.id, base, user);
    } catch (e) {
      if (e instanceof ConflictError) return { pending: false, conflict: e.message };
      throw e;
    }
  }
  const saved = await saveFieldChecked(r, t, kind, raw, user);
  return r.kind === "settings" ? saved : { ...saved, version: await pageVersion(r.res, r.id) };
}

async function saveFieldChecked(r: Resolved, t: Target, kind: InlineKind, raw: unknown, user: SessionUser): Promise<{ pending: boolean }> {
  if (r.kind === "blocks") {
    const e = await getEditable(r.res, r.id);
    if (!e) throw new Error("Record not found");
    const field = blockField(e.row, r, kind);
    const next = setPath(e.row, r.path, coerce(field, kind, raw));
    const { status: _s, id: _i, ...data } = next;
    void _i;
    const result = await saveWithWorkflow(r.res, r.id, { ...data, status: _s }, user);
    if (!result.pending) for (const p of r.res.revalidate) revalidatePath(p, "layout");
    return { pending: result.pending };
  }
  if (!allowedKind(r.field, kind)) throw new Error(`Field ${t.f} cannot be edited as ${kind}`);
  const value = coerce(r.field, kind, raw);

  if (r.kind === "settings") {
    const [live, draft] = await Promise.all([getLiveSetting(r.key), getSettingDraft(r.key)]);
    const next = setPath({ ...live, ...(draft?.value ?? {}) }, r.path, value);
    await setSettingDraft(r.key, next, user);
    await audit(user, "save", { resource: `settings:${r.key}`, label: r.field.label, meta: { pending: true, inline: true, field: t.f } });
    return { pending: true };
  }

  const e = await getEditable(r.res, r.id);
  if (!e) throw new Error("Record not found");
  const next = setPath(e.row, r.path, value);
  const { status: _s, id: _i, ...data } = next;
  void _i;
  const result = await saveWithWorkflow(r.res, r.id, { ...data, status: _s }, user);
  if (!result.pending) for (const p of r.res.revalidate) revalidatePath(p, "layout");
  return { pending: result.pending };
}

export type PendingItem = { r: string; id: number; label: string; href: string | null; by: string; at: string; reviewStatus: string | null; publishAt: string | null };

/** Which of the records on this page have pending changes, and whether this user may publish them. */
export async function pendingFor(targets: { r: string; id: number }[]): Promise<{ items: PendingItem[]; canPublishAll: boolean; requireApproval: boolean; user: { name: string; role: string } }> {
  const user = await requireEditor();
  const wf = await workflowSettings();
  const items: PendingItem[] = [];
  let canPublishAll = true;
  const seen = new Set<string>();
  for (const t of targets) {
    const key = `${t.r}#${t.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (t.r.startsWith("settings:")) {
      const k = t.r.slice(9);
      const d = await getSettingDraft(k);
      if (!d) continue;
      const g = getSettingsGroup(k);
      items.push({ r: t.r, id: 0, label: g?.title ?? k, href: `/admin/settings?group=${k}`, by: d.updatedByName, at: d.updatedAt.toISOString(), reviewStatus: null, publishAt: null });
      if (wf.requireApproval && user.role === "editor") canPublishAll = false;
      continue;
    }
    const res = getResource(t.r);
    if (!res) continue;
    const d = await getDraft(res, t.id);
    if (!d?.data) {
      // an unpublished record is "pending" in the sense that it is not live yet
      const live = await getRow(res, t.id);
      if (live && hasWorkflow(res) && live.status !== "published") {
        items.push({ r: t.r, id: t.id, label: `${res.titleSingular}: ${live[res.labelField] ?? t.id} (not published yet)`, href: `/admin/${res.slug}/${t.id}`, by: "", at: "", reviewStatus: null, publishAt: null });
        if (!(await canPublish(user, null)).ok) canPublishAll = false;
      }
      continue;
    }
    const label = String((d.data as any)[res.labelField] ?? t.id);
    items.push({ r: t.r, id: t.id, label: `${res.titleSingular}: ${label}`, href: `/admin/${res.slug}/${t.id}`, by: d.updatedByName, at: d.updatedAt.toISOString(), reviewStatus: d.reviewStatus, publishAt: d.publishAt?.toISOString() ?? null });
    if (!(await canPublish(user, d)).ok) canPublishAll = false;
  }
  return { items, canPublishAll, requireApproval: !!wf.requireApproval, user: { name: user.name, role: user.role } };
}

/** Publish every pending change among the given records. */
export async function publishTargets(targets: { r: string; id: number }[]): Promise<{ published: number; blocked: string[] }> {
  const user = await requireEditor();
  const wf = await workflowSettings();
  let published = 0;
  const blocked: string[] = [];
  const seen = new Set<string>();
  for (const t of targets) {
    const key = `${t.r}#${t.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (t.r.startsWith("settings:")) {
      const k = t.r.slice(9);
      if (wf.requireApproval && user.role === "editor") { blocked.push(k); continue; }
      if (await publishSettingDraft(k)) {
        published++;
        await audit(user, "publish", { resource: `settings:${k}`, label: getSettingsGroup(k)?.title ?? k });
        for (const p of getSettingsGroup(k)?.revalidate ?? ["/"]) revalidatePath(p, "layout");
      }
      continue;
    }
    const res = getResource(t.r);
    if (!res) continue;
    const draft = await getDraft(res, t.id);
    const live = await getRow(res, t.id);
    if (!live) continue;
    if (!draft?.data && live.status === "published") continue; // nothing pending
    const ok = await canPublish(user, draft);
    if (!ok.ok) { blocked.push(`${res.titleSingular} ${live[res.labelField] ?? t.id}`); continue; }
    await publish(res, t.id, user);
    published++;
    for (const p of res.revalidate) revalidatePath(p, "layout");
    const url = res.previewUrl?.(live);
    if (url) revalidatePath(url);
  }
  revalidatePath("/sitemap.xml");
  return { published, blocked };
}

export async function discardTargets(targets: { r: string; id: number }[]): Promise<number> {
  const user = await requireEditor();
  let n = 0;
  for (const t of targets) {
    if (t.r.startsWith("settings:")) {
      const k = t.r.slice(9);
      if (await getSettingDraft(k)) { await deleteSettingDraft(k); n++; await audit(user, "save", { resource: `settings:${k}`, meta: { discardedDraft: true } }); }
      continue;
    }
    const res = getResource(t.r);
    if (!res) continue;
    if (await getDraft(res, t.id)) { await discardDraft(res, t.id, user); n++; }
  }
  return n;
}

export async function submitTargetsForReview(targets: { r: string; id: number }[], note: string): Promise<number> {
  const user = await requireEditor();
  let n = 0;
  for (const t of targets) {
    if (t.r.startsWith("settings:")) continue;
    const res = getResource(t.r);
    if (!res) continue;
    const d = await getDraft(res, t.id);
    if (d?.data && d.reviewStatus !== "in_review") { await setReview(res, t.id, "in_review", note, user); n++; }
  }
  return n;
}
