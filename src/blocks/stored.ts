import type { NewsItem, Region, StoredBlock, TeamMember } from "@/db/schema";
import { groupTherapies } from "@/lib/therapy-groups";
import { evidenceLists, newsCard, publicationCard, therapyCards, type EvidenceLists, type OverviewTherapy } from "./from-settings";
import { teamCard } from "./from-pages";
import type { Office } from "./offices-map";
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
  lists?: SourceLists;
};

/** The record that holds the page: admin resource slug + id. */
export type PageRef = { r: string; id: number };

type Source = {
  /** Data keys the source fills; they are not editable through the block (their records are). */
  keys: string[];
  /** Filled data, or null to leave the block out (nothing to list, as the old pages did). */
  fill: (data: Record<string, unknown>, ctx: RenderCtx) => Record<string, unknown> | null;
  /** The block's fields live in another record (e.g. offices in Contact details): edit there, not in the page. */
  binding?: EditBinding;
};

/** Lists a page's route loads for its `source` blocks. */
export type SourceLists = {
  news?: NewsItem[];
  team?: TeamMember[];
  offices?: Office[];
  jobCount?: number;
  evidence?: EvidenceLists;
  therapies?: OverviewTherapy[];
};

const choiceLabel = (r: Region) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;

export const SOURCES: Record<string, Source> = {
  /** Hero line "Europe & Middle East version · Asia & Pacific version" */
  regionVersions: {
    keys: ["eyebrowLinks", "eyebrowHref"],
    // «Therapies / Large vessel stroke»: the first part leads back to the region's overview (usability pass 2026-11-13)
    fill: (_d, ctx) => ({ eyebrowLinks: (ctx.versions ?? []).map((v) => ({ label: `${choiceLabel(v.region)} version`, href: v.href })), eyebrowHref: ctx.region ? `/${ctx.region}/therapies` : undefined }),
  },
  /** Region name above the title of a regional text page */
  regionLabel: {
    keys: ["eyebrow"],
    fill: (_d, ctx) => ({ eyebrow: ctx.region ? REGION_LABELS[ctx.region] : undefined }),
  },
  /** Home: featured news cards */
  featuredNews: { keys: ["items"], fill: (_d, ctx) => ({ items: (ctx.lists?.news ?? []).map(newsCard) }) },
  /** Careers: the button to the open positions, with their number */
  openPositions: {
    keys: ["cta"],
    // with no open positions the first action is the general-interest form, not an empty list (docs/screens/careers.md)
    fill: (_d, ctx) => ({ cta: ctx.lists?.jobCount ? { label: `View open positions (${ctx.lists.jobCount})`, href: "/open-positions" } : { label: "Submit general interest", href: "#general-interest" } }),
  },
  /** About: leadership cards (each edits its team record) */
  team: { keys: ["members"], fill: (_d, ctx) => ({ members: (ctx.lists?.team ?? []).map(teamCard) }) },
  /** About: offices from Contact details */
  offices: {
    keys: ["offices"],
    binding: { r: "settings:contact", map: { offices: "offices" } },
    fill: (_d, ctx) => (ctx.lists?.offices?.length ? { offices: ctx.lists.offices } : null),
  },
  /** About: the map's pins — the same offices; the map's own texts stay editable on the page */
  officePins: { keys: ["offices"], fill: (_d, ctx) => ({ offices: ctx.lists?.offices ?? [] }) },
  /** Evidence: featured studies under the counter; the counter shows the number of studies unless typed in */
  featuredPublications: {
    keys: ["items"],
    fill: (d, ctx) => {
      const stat = (d.stat ?? {}) as { value?: string };
      return { items: (ctx.lists?.evidence?.featured ?? []).map(publicationCard), stat: { ...stat, value: stat.value || `${ctx.lists?.evidence?.all.length ?? 0}+` } };
    },
  },
  /** Evidence: the latest studies with a picture */
  latestPublications: {
    keys: ["items"],
    fill: (_d, ctx) => {
      const latest = ctx.lists?.evidence ? evidenceLists(ctx.lists.evidence).latest : [];
      return latest.length ? { items: latest.map(publicationCard) } : null;
    },
  },
  /** Evidence: one tab per product */
  publicationsByProduct: {
    keys: ["groups", "anchors"],
    fill: (_d, ctx) => ({ groups: ctx.lists?.evidence ? evidenceLists(ctx.lists.evidence).groups : [], anchors: (ctx.lists?.evidence?.products ?? []).map((p) => p.slug) }),
  },
  /** Therapies overview: the cards of one therapy group (`data.group`: ischemic / hemorrhagic / access / "" = the rest) */
  therapyGroup: {
    keys: ["title", "items"],
    fill: (d, ctx) => {
      const g = groupTherapies(ctx.lists?.therapies ?? []).find((x) => x.value === (d.group ?? ""));
      return g && ctx.region ? { title: g.label || null, items: therapyCards(g.items, ctx.region), group: undefined } : null;
    },
  },
};

export const isSource = (name: string | undefined): name is string => !!name && Object.hasOwn(SOURCES, name);

/* ------------------------------------------------------------------ */
/*  Links with placeholders                                            */
/* ------------------------------------------------------------------ */

const isHrefKey = (k: string) => k === "href" || k.endsWith("Href");
/** Only plain objects are walked: dates and other class instances (news and study dates) pass through as they are. */
const isPlain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(v));

function mapHrefs(v: unknown, f: (href: string) => string): unknown {
  if (Array.isArray(v)) return v.map((x) => mapHrefs(x, f));
  if (isPlain(v)) {
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
  let h = href;
  if (!ctx.region) {
    // region not known yet (Home before the visitor chose one): regional pages go through the chooser,
    // links that only preselect a region drop the parameter
    h = h.replace(/^\/\{region\}(?=\/|$|[?#]).*$/, "/choose-your-location");
    h = h.replace(/([?&])region=\{region\}(&|$)/, (_m, sep: string, next: string) => (next ? sep : "")).replace(/\?$/, "");
  }
  return h.replaceAll("{region}", ctx.region ?? "us").replaceAll("{product}", ctx.product || "browse-by-product");
}

/* ------------------------------------------------------------------ */
/*  Rendered blocks → stored (one-time conversion, new sections)        */
/* ------------------------------------------------------------------ */

/** Drop editor bindings (they are rebuilt from the position on render). */
function stripEdit(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stripEdit);
  if (isPlain(v)) {
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

/**
 * Product details tabs hold blocks (or groups of blocks); give each one a binding to its own path and — for the page
 * editor's section tools (`sectionsOf`: the Product details block's id) — its address `{id}/{tab}/{j}[/{k}]`.
 */
function bindNested(data: Record<string, unknown>, page: PageRef | null, prefix: string, sectionsOf: string | null): Record<string, unknown> {
  if (!Array.isArray(data.tabs)) return data;
  const tabs = (data.tabs as Record<string, unknown>[]).map((tab, t) => {
    if (!Array.isArray(tab.blocks)) return tab;
    const uid = (path: string) => (page && sectionsOf && !tab.href ? { uid: `${sectionsOf}/${t}/${path}` } : {});
    const blocks = (tab.blocks as (Nested | Group)[]).map((x, j) => {
      const at = `${prefix}tabs.${t}.blocks.${j}.`;
      if ("group" in x && Array.isArray(x.blocks)) {
        return { ...x, blocks: x.blocks.map((n, k) => ({ ...n, edit: page ? { r: page.r, id: page.id, prefix: `${at}blocks.${k}.data.` } : undefined, ...uid(`${j}/${k}`) })) };
      }
      const n = x as Nested;
      return { ...n, edit: page ? { r: page.r, id: page.id, prefix: `${at}data.` } : undefined, ...uid(String(j)) };
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
  const out = stored.map((s, i) => {
    let data: Record<string, unknown> = { ...s.data };
    const source = isSource(s.source) ? SOURCES[s.source] : null;
    if (source) {
      const filled = source.fill(data, ctx);
      if (!filled) return null; // nothing to list: the section is left out (it stays in the stored list)
      data = { ...data, ...filled };
    }
    data = mapHrefs(data, (h) => fillHref(h, ctx)) as Record<string, unknown>;
    const prefix = `blocks.${i}.data.`;
    data = bindNested(data, page, prefix, s.type === "productDetails" && !source ? s.id : null);
    const edit: EditBinding | undefined = source?.binding
      ? source.binding
      : page
        ? { r: page.r, id: page.id, prefix, ...(source ? { map: Object.fromEntries(source.keys.map((k) => [k, null])) } : {}) }
        : undefined;
    return { type: s.type, variant: s.variant, data, edit, uid: s.id } as unknown as Block;
  });
  return out.filter((b): b is Block => b !== null);
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
