import type { Page, Region, StoredBlock } from "@/db/schema";
import { REGION_LABELS } from "@/lib/regions";
import { solutionToBlocks, type SolutionForBlocks } from "./from-solution";
import { pageToBlocks } from "./from-pages";
import { toStored, resolveBlocks, newBlockId } from "./stored";
import type { ProductDetailsData } from "./product-details";

export type ProductMaterials = Pick<ProductDetailsData, "studies" | "cases" | "ifu" | "publications">;

/**
 * One-time conversion of records into stored block lists (ADR-007), used by scripts/migrate-blocks.ts.
 * The old adapters stay the single description of how the fields map to blocks.
 */

export function solutionToStored(s: SolutionForBlocks): StoredBlock[] {
  return toStored(solutionToBlocks(s, { region: s.region, others: [] }), { region: s.region, product: s.product?.slug }, { 0: "regionVersions" });
}

export function pageToStored(p: Page): StoredBlock[] {
  return toStored(pageToBlocks(p, p.region ? REGION_LABELS[p.region] : undefined), { region: p.region }, { 0: "regionLabel" });
}

/* ------------------------------------------------------------------ */
/*  Render: stored list when the record has one, else the old adapter   */
/* ------------------------------------------------------------------ */

export function therapyPageBlocks(s: SolutionForBlocks, ctx: { region: Region; others: Region[]; materials?: ProductMaterials | null }) {
  if (!s.blocks?.length) return solutionToBlocks(s, ctx);
  const versions = ctx.others.map((o) => ({ region: o, href: `/${o}/therapies/${s.slug}` }));
  const blocks = resolveBlocks(s.blocks, { region: ctx.region, product: s.product?.slug, versions }, { r: "solutions", id: s.id });
  // the product's studies, cases and IFU go into its tabs at show time (docs/screens/therapy.md, 2026-11-19); not stored,
  // and not a `source` — the tabs' own sections stay editable on the page
  const m = ctx.materials;
  return m ? blocks.map((b) => (b.type === "productDetails" ? ({ ...b, data: { ...b.data, ...m } } as typeof b) : b)) : blocks;
}

/** A text page or a material at its kept address (`resource`: which record the editor binds to; default pages). */
export function textPageBlocks(p: Page & { resource?: "pages" | "materials" }) {
  if (!p.blocks?.length) return pageToBlocks(p, p.region ? REGION_LABELS[p.region] : undefined, p.resource);
  return resolveBlocks(p.blocks, { region: p.region }, { r: p.resource ?? "pages", id: p.id });
}

/** The therapy page's sections (DESIGN.md → Страница терапии): tab ids of Product details, and the specifications inside Overview. */
export const THERAPY_NAV = [
  { label: "Overview", href: "#overview" },
  { label: "How it works", href: "#how" },
  { label: "In-Practice", href: "#practice" },
  { label: "Evidence", href: "#evidence" },
  { label: "Specs", href: "#specs" },
];

/**
 * A therapy page in the layout of DESIGN.md → Страница терапии (2026-11-15, preliminary until Emily confirms): the section
 * navigation under the hero, and «Indications, Safety & Warnings ↓» in the hero when the page has indications. Nothing is
 * moved or removed. Only a page without a section navigation yet is changed — null otherwise.
 */
export function therapyLayout2026(blocks: StoredBlock[] | null | undefined): StoredBlock[] | null {
  if (!blocks?.length || blocks.some((b) => b.type === "sectionNav")) return null;
  const hero = blocks.findIndex((b) => b.type === "hero");
  if (hero < 0) return null;
  const ind = blocks.find((b) => b.type === "indications");
  const hasIndications = String(ind?.data.indicationsHtml ?? "").replace(/<[^>]+>|\s|&nbsp;/g, "").length > 0;
  const out = blocks.map((b, i) =>
    i === hero && hasIndications && !b.data.jump ? { ...b, data: { ...b.data, jump: { label: "Indications, Safety & Warnings ↓", href: "#indications" } } } : b,
  );
  out.splice(hero + 1, 0, { id: newBlockId(), type: "sectionNav", variant: "default", data: { items: THERAPY_NAV } });
  return out;
}
