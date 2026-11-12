"use server";

import { revalidatePath } from "next/cache";
import type { Region, StoredBlock } from "@/db";
import { audit } from "@/lib/audit";
import { REGION_CHOICES } from "@/lib/regions";
import { BLOCKS } from "@/blocks/registry";
import type { BlockDef, BlockType } from "@/blocks/types";
import { applyOp, BlockOpError, isPinned, variantsFor, type BlockOp } from "@/blocks/ops";
import { blockName, compareBlocks, describeBlockChanges, type RegionDiff } from "@/blocks/diff";
import { PRESETS, TEMPLATES, templateBlocks, type Preset, type TemplateId } from "@/blocks/templates";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { db } from "@/db";
import { isRegion } from "@/lib/regions";
import { canPublish, getEditable, getRevision, listRevisions, restoreRevision, saveWithWorkflow, workflowSettings } from "./workflow";
import { SITE_PAGE_TYPE } from "./pages-index";
import { checkBase, ConflictError, knownBlocks, pageResource, pageVersion, regionalSiblings, requireEditor, type PageRef } from "./page-core";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Server side of the page editor (docs/screens/on-page-editor.md, ADR-007): what the top bar shows,
 * section operations, review of changes, history and region comparison. Field edits stay in ./inline.ts.
 * Every action re-checks the session; errors come back as `{ error }` so the editor can show them as they are.
 */

type Fail = { error: string; conflict?: boolean };
const fail = (e: unknown): Fail => ({ error: (e as Error).message || "Something went wrong", conflict: e instanceof ConflictError });

export type SectionInfo = { id: string; type: string; name: string; variant: string; variants: { id: string; label: string }[]; pinned: boolean; fromRecords: boolean };

export type PageInfo = {
  ref: PageRef;
  title: string;
  type: string;
  region: Region | null;
  regions: { region: Region; label: string; path: string | null; current: boolean }[];
  status: "live" | "changed" | "draft";
  changedBy: string | null;
  changedAt: string | null;
  version: string;
  livePath: string | null;
  adminHref: string;
  sections: SectionInfo[];
  presets: Preset[];
  canPublish: boolean;
  requireApproval: boolean;
  user: string;
};

const def = (t: string) => (Object.hasOwn(BLOCKS, t) ? (BLOCKS[t as BlockType] as unknown as BlockDef<BlockType>) : null);

function sections(list: StoredBlock[]): SectionInfo[] {
  return list.map((b) => ({
    id: b.id,
    type: b.type,
    name: blockName(b),
    variant: b.variant,
    variants: variantsFor(b.type).some((v) => v.id === b.variant) ? variantsFor(b.type) : [],
    pinned: isPinned(b),
    fromRecords: !!b.source || def(b.type)?.category === "list",
  }));
}

const label = (r: Region) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;

export async function pageInfo(ref: PageRef): Promise<PageInfo | Fail> {
  try {
    const user = await requireEditor();
    const res = pageResource(ref.r);
    const e = await getEditable(res, ref.id);
    if (!e) return { error: "Page not found" };
    const wf = await workflowSettings();
    const region = (e.row.region ?? null) as Region | null;
    const siblings = await regionalSiblings(res, e.live);
    const regions = region
      ? REGION_CHOICES.map((c) => (c.region === region ? { region, label: c.label, path: res.previewUrl?.(e.live) ?? null, current: true } : { region: c.region, label: c.label, path: siblings.find((s) => s.region === c.region)?.path ?? null, current: false }))
      : [];
    const pending = !!e.draft?.data;
    return {
      ref,
      title: String(e.row[res.labelField] ?? ""),
      type: res.slug === "site-pages" ? (SITE_PAGE_TYPE[String(e.row.key)] ?? res.titleSingular) : res.titleSingular,
      region,
      regions,
      status: e.live.status !== "published" ? "draft" : pending ? "changed" : "live",
      changedBy: pending ? e.draft!.updatedByName : null,
      changedAt: pending ? e.draft!.updatedAt.toISOString() : null,
      version: await pageVersion(res, ref.id),
      livePath: res.previewUrl?.(e.live) ?? null,
      adminHref: `/admin/${res.slug}/${ref.id}`,
      sections: sections((e.row.blocks as StoredBlock[] | null) ?? []),
      presets: PRESETS,
      canPublish: (await canPublish(user, e.draft)).ok,
      requireApproval: !!wf.requireApproval,
      user: user.name,
    };
  } catch (err) {
    return fail(err);
  }
}

/** Add, move, copy, remove, change layout, or put back an earlier list (undo). */
export async function editBlocks(ref: PageRef, op: BlockOp, base?: string): Promise<{ version: string; sections: SectionInfo[]; added?: string; undo: StoredBlock[] } | Fail> {
  try {
    const user = await requireEditor();
    const res = pageResource(ref.r);
    await checkBase(res, ref.id, base, user);
    const e = await getEditable(res, ref.id);
    if (!e) return { error: "Page not found" };
    const current = (e.row.blocks as StoredBlock[] | null) ?? [];
    const next = applyOp(current, op, op.op === "set" ? await knownBlocks(res, ref.id) : []);
    const { status, id: _id, ...data } = e.row;
    void _id;
    const result = await saveWithWorkflow(res, ref.id, { ...data, blocks: next, status }, user);
    await audit(user, "save", { resource: res.slug, recordId: ref.id, label: String(e.row[res.labelField] ?? ""), meta: { sections: op.op } });
    if (!result.pending) for (const p of res.revalidate) revalidatePath(p, "layout");
    const added = op.op === "add" || op.op === "duplicate" ? next.find((b) => !current.some((c) => c.id === b.id))?.id : undefined;
    return { version: await pageVersion(res, ref.id), sections: sections(next), added, undo: current };
  } catch (err) {
    if (err instanceof BlockOpError || err instanceof ConflictError) return fail(err);
    return fail(err);
  }
}

/** «Review changes»: what Publish will change on this page, in words. */
export async function pageChanges(ref: PageRef): Promise<{ items: string[]; by: string | null; at: string | null } | Fail> {
  try {
    await requireEditor();
    const res = pageResource(ref.r);
    const e = await getEditable(res, ref.id);
    if (!e) return { error: "Page not found" };
    if (e.live.status !== "published") return { items: ["New page — not live yet"], by: null, at: null };
    if (!e.draft?.data) return { items: [], by: null, at: null };
    const items = describeBlockChanges(e.live.blocks as StoredBlock[] | null, e.row.blocks as StoredBlock[] | null);
    for (const f of res.fields) {
      if (f.onPage || f.name === "status") continue;
      if (JSON.stringify(e.live[f.name] ?? null) !== JSON.stringify(e.row[f.name] ?? null)) items.push(`Changed ${f.label.toLowerCase()} (page settings)`);
    }
    return { items, by: e.draft.updatedByName, at: e.draft.updatedAt.toISOString() };
  } catch (err) {
    return fail(err);
  }
}

export type HistoryItem = { id: number; kind: string; by: string; at: string; note: string; changes: string[] };

/** Versions of the page, newest first, each with what it changed against the one before. */
export async function pageHistory(ref: PageRef): Promise<{ items: HistoryItem[] } | Fail> {
  try {
    await requireEditor();
    const res = pageResource(ref.r);
    const revs = await listRevisions(res, ref.id, 60);
    const items = revs.map((r, i) => {
      const prev = revs[i + 1];
      const changes = prev ? describeBlockChanges((prev.data as any)?.blocks, (r.data as any)?.blocks) : [];
      return { id: r.id, kind: r.kind, by: r.userName, at: r.createdAt.toISOString(), note: r.note, changes };
    });
    return { items };
  } catch (err) {
    return fail(err);
  }
}

/** Put a version back on the page as a draft (live after Publish). */
export async function restorePage(ref: PageRef, revisionId: number, base?: string): Promise<{ version: string; undo: StoredBlock[] } | Fail> {
  try {
    const user = await requireEditor();
    const res = pageResource(ref.r);
    const rev = await getRevision(revisionId);
    if (!rev || rev.resource !== res.slug || rev.recordId !== ref.id) return { error: "Version not found" };
    await checkBase(res, ref.id, base, user);
    const before = await getEditable(res, ref.id);
    await restoreRevision(res, revisionId, user);
    return { version: await pageVersion(res, ref.id), undo: (before?.row.blocks as StoredBlock[] | null) ?? [] };
  } catch (err) {
    return fail(err);
  }
}

/** «Compare with…»: for each section of this page, whether the same page in `region` has it the same, different or not at all. */
export async function compareWith(ref: PageRef, region: Region): Promise<{ sections: RegionDiff[]; label: string } | Fail> {
  try {
    await requireEditor();
    const res = pageResource(ref.r);
    const e = await getEditable(res, ref.id);
    if (!e) return { error: "Page not found" };
    const other = (await regionalSiblings(res, e.live)).find((s) => s.region === region);
    if (!other) return { error: `No ${label(region)} version of this page` };
    const o = await getEditable(res, other.id);
    return { sections: compareBlocks((e.row.blocks as StoredBlock[]) ?? [], (o?.row.blocks as StoredBlock[]) ?? []), label: label(region) };
  } catch (err) {
    return fail(err);
  }
}

export async function currentPageVersion(ref: PageRef): Promise<{ version: string } | Fail> {
  try {
    await requireEditor();
    return { version: await pageVersion(pageResource(ref.r), ref.id) };
  } catch (err) {
    return fail(err);
  }
}

/* ------------------------------------------------------------------ */
/*  New page from a template (docs/screens/admin-editor-pages.md)       */
/* ------------------------------------------------------------------ */

export type NewPageInput = { template: TemplateId; title: string; region: string; slug: string };

/** Creates the page as a draft from a template and returns its address; the editor opens it there. */
export async function createPage(input: NewPageInput): Promise<{ path: string } | (Fail & { field?: "title" | "slug" | "region" })> {
  try {
    const user = await requireEditor();
    const tpl = TEMPLATES.find((t) => t.id === input.template);
    if (!tpl) return { error: "Choose a template" };
    const title = String(input.title ?? "").trim().slice(0, 200);
    if (!title) return { error: "Required", field: "title" };
    const slug = slugify(input.slug || title);
    if (!slug) return { error: "Use letters or numbers", field: "slug" };
    const region = input.region && input.region !== "global" ? input.region : null;
    if (region && !isRegion(region)) return { error: "Unknown region", field: "region" };
    if (tpl.resource === "solutions" && !region) return { error: "A therapy page belongs to a region", field: "region" };
    const res = pageResource(tpl.resource);
    const cols = getTableColumns(res.table) as Record<string, any>;
    const taken = await db.select({ id: cols.id }).from(res.table as any).where(and(eq(cols.slug, slug), region ? eq(cols.region, region) : isNull(cols.region))).limit(1);
    if (taken.length) return { error: `A page with this address already exists in ${region ? label(region as Region) : "Global"}`, field: "slug" };
    const blocks = templateBlocks(tpl.id, title);
    const data: Record<string, unknown> =
      tpl.resource === "solutions"
        ? { navLabel: title, heroTitle: title, slug, region, blocks, sortOrder: 100, status: "draft" }
        : { title, slug, region, blocks, status: "draft" };
    const { id } = await saveWithWorkflow(res, null, data, user);
    const row = await getEditable(res, id);
    return { path: res.previewUrl?.(row!.live) ?? "/" };
  } catch (err) {
    return fail(err);
  }
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
