import type { Region, StoredBlock } from "@/db/schema";
import { REGION_CHOICES, REGION_LABELS } from "@/lib/regions";
import type { EditBinding } from "./bind";
import type { Block } from "./types";

/**
 * Pages stored as block lists (ADR-007).
 *
 * A stored block is `{ id, type, variant, data, source? }`. Its data is the page's own content. Two things are filled in
 * when the page is shown, because they belong to the page's context rather than to the page:
 *  - `source`: a list taken from other records (versions in other regions, news, team…) — see SOURCES;
 *  - `{region}` / `{product}` in links (`href`, `…Href`): the page's region and product slug.
 * The on-page editor addresses a block field as `blocks.{n}.data.{key}` of the page record.
 */

export type { StoredBlock };

/** Where a page is shown: its region, product and the regions that have the same page. */
export type RenderCtx = {
  region: Region | null;
  /** Product slug of a therapy page (Evidence tab link) */
  product?: string | null;
  /** Other regions that have this page, with the path of the page there */
  versions?: { region: Region; href: string }[];
  /** Preloaded lists for `source` blocks that need records (filled by the page's route) */
  lists?: Record<string, unknown>;
};

/** The record that holds the page: admin resource slug + id. */
export type PageRef = { r: string; id: number };

type Source = {
  /** Data keys the source fills; they are not editable through the block (their records are). */
  keys: string[];
  fill: (data: Record<string, unknown>, ctx: RenderCtx) => Record<string, unknown>;
};

const choiceLabel = (r: Region) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;

export const SOURCES: Record<string, Source> = {
  /** Hero line "Europe & Middle East version · Asia & Pacific version" */
  regionVersions: {
    keys: ["eyebrowLinks"],
    fill: (_d, ctx) => ({ eyebrowLinks: (ctx.versions ?? []).map((v) => ({ label: `${choiceLabel(v.region)} version`, href: v.href })) }),
  },
  /** Region name above the title of a regional text page */
  regionLabel: {
    keys: ["eyebrow"],
    fill: (_d, ctx) => ({ eyebrow: ctx.region ? REGION_LABELS[ctx.region] : undefined }),
  },
};

export const isSource = (name: string | undefined): name is string => !!name && Object.hasOwn(SOURCES, name);

/* ------------------------------------------------------------------ */
/*  Links with placeholders                                            */
/* ------------------------------------------------------------------ */

const isHrefKey = (k: string) => k === "href" || k.endsWith("Href");

function mapHrefs(v: unknown, f: (href: string) => string): unknown {
  if (Array.isArray(v)) return v.map((x) => mapHrefs(x, f));
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = typeof x === "string" && isHrefKey(k) ? f(x) : mapHrefs(x, f);
    return out;
  }
  return v;
}

/** Page links → templates: "/us/webinars" → "/{region}/webinars", "/us/evidence#comaneci" → "/{region}/evidence#{product}". */
export function templateHref(href: string, region: Region | null, product?: string | null): string {
  let h = href;
  if (region) {
    h = h.replace(new RegExp(`^/${region}(?=/|$|[?#])`), "/{region}").replace(new RegExp(`([?&]region=)${region}(?=&|#|$)`), "$1{region}");
  }
  if (product) h = h.replace(new RegExp(`(/evidence#)${product}$`), "$1{product}");
  return h;
}

export function fillHref(href: string, ctx: RenderCtx): string {
  if (!href.includes("{")) return href;
  return href.replaceAll("{region}", ctx.region ?? "us").replaceAll("{product}", ctx.product || "browse-by-product");
}

/* ------------------------------------------------------------------ */
/*  Rendered blocks → stored (one-time conversion, new sections)        */
/* ------------------------------------------------------------------ */

/** Drop editor bindings (they are rebuilt from the position on render). */
function stripEdit(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripEdit);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (k !== "edit" && x !== undefined) out[k] = stripEdit(x);
    return out;
  }
  return v;
}

export function newBlockId(): string {
  return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 10);
}

/**
 * Blocks built by the old adapters (src/blocks/from-*.ts) → a stored list.
 * `sources` marks blocks (by index) whose listed keys come from a source; those keys are not stored.
 */
export function toStored(blocks: Block[], ctx: { region: Region | null; product?: string | null }, sources: Record<number, string> = {}): StoredBlock[] {
  return blocks.map((b, i) => {
    const source = sources[i];
    let data = stripEdit(b.data) as Record<string, unknown>;
    if (isSource(source)) for (const k of SOURCES[source].keys) delete data[k];
    data = mapHrefs(data, (h) => templateHref(h, ctx.region, ctx.product)) as Record<string, unknown>;
    return { id: newBlockId(), type: b.type, variant: b.variant as string, data, ...(source ? { source } : {}) };
  });
}

/* ------------------------------------------------------------------ */
/*  Stored → rendered                                                  */
/* ------------------------------------------------------------------ */

type Nested = { type: string; variant: string; data: Record<string, unknown>; edit?: EditBinding };
type Group = { group: string; blocks: Nested[] };

/** Product details tabs hold blocks (or groups of blocks); give each one a binding to its own path. */
function bindNested(data: Record<string, unknown>, page: PageRef | null, prefix: string): Record<string, unknown> {
  if (!Array.isArray(data.tabs)) return data;
  const tabs = (data.tabs as Record<string, unknown>[]).map((tab, t) => {
    if (!Array.isArray(tab.blocks)) return tab;
    const blocks = (tab.blocks as (Nested | Group)[]).map((x, j) => {
      const at = `${prefix}tabs.${t}.blocks.${j}.`;
      if ("group" in x && Array.isArray(x.blocks)) {
        return { ...x, blocks: x.blocks.map((n, k) => ({ ...n, edit: page ? { r: page.r, id: page.id, prefix: `${at}blocks.${k}.data.` } : undefined })) };
      }
      const n = x as Nested;
      return { ...n, edit: page ? { r: page.r, id: page.id, prefix: `${at}data.` } : undefined };
    });
    return { ...tab, blocks };
  });
  return { ...data, tabs };
}

/**
 * Stored list → blocks ready for `<BlockList>`: sources filled, link templates resolved, and — when `page` is given —
 * every block bound to `blocks.{n}.data.` of that record for the on-page editor.
 */
export function resolveBlocks(stored: StoredBlock[], ctx: RenderCtx, page: PageRef | null = null): Block[] {
  return stored.map((s, i) => {
    let data: Record<string, unknown> = { ...s.data };
    const source = isSource(s.source) ? SOURCES[s.source] : null;
    if (source) data = { ...data, ...source.fill(data, ctx) };
    data = mapHrefs(data, (h) => fillHref(h, ctx)) as Record<string, unknown>;
    const prefix = `blocks.${i}.data.`;
    data = bindNested(data, page, prefix);
    const edit: EditBinding | undefined = page
      ? { r: page.r, id: page.id, prefix, ...(source ? { map: Object.fromEntries(source.keys.map((k) => [k, null])) } : {}) }
      : undefined;
    return { type: s.type, variant: s.variant, data, edit, uid: s.id } as unknown as Block;
  });
}

/** Title, text and image for SEO and cards: the first hero block, else the first block with a title. */
export function pageSummary(stored: StoredBlock[] | null | undefined): { title?: string; body?: string; imageUrl?: string } {
  if (!stored?.length) return {};
  const hero = stored.find((b) => b.type === "hero") ?? stored[0];
  const d = hero.data as { title?: unknown; body?: unknown; imageUrl?: unknown };
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const firstImage = stored.map((b) => str((b.data as { imageUrl?: unknown }).imageUrl)).find(Boolean);
  return { title: str(d.title), body: str(d.body), imageUrl: str(d.imageUrl) ?? firstImage };
}
