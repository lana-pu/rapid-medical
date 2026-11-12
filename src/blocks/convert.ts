import type { Page, Region, StoredBlock } from "@/db/schema";
import { REGION_LABELS } from "@/lib/regions";
import { solutionToBlocks, type SolutionForBlocks } from "./from-solution";
import { pageToBlocks } from "./from-pages";
import { toStored, resolveBlocks } from "./stored";

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

export function therapyPageBlocks(s: SolutionForBlocks, ctx: { region: Region; others: Region[] }) {
  if (!s.blocks?.length) return solutionToBlocks(s, ctx);
  const versions = ctx.others.map((o) => ({ region: o, href: `/${o}/therapies/${s.slug}` }));
  return resolveBlocks(s.blocks, { region: ctx.region, product: s.product?.slug, versions }, { r: "solutions", id: s.id });
}

export function textPageBlocks(p: Page) {
  if (!p.blocks?.length) return pageToBlocks(p, p.region ? REGION_LABELS[p.region] : undefined);
  return resolveBlocks(p.blocks, { region: p.region }, { r: "pages", id: p.id });
}
