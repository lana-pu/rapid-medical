import "server-only";
import { inArray, isNotNull } from "drizzle-orm";
import { db, drafts, materials, pages, sitePages, solutions, type Region, type StoredBlock } from "@/db";
import { pageSummary } from "@/blocks/stored";
import { sitePagePath } from "@/blocks/site-pages";
import { REGION_CHOICES } from "@/lib/regions";

/** How a singleton page is named in the list. */
export const SITE_PAGE_TYPE: Record<string, string> = { home: "Home page", about: "About", careers: "Careers", evidence: "Evidence", therapies: "Therapies overview" };

/**
 * Every page an editor can open in the page editor (docs/screens/admin-editor-pages.md):
 * singleton pages (Home, About, Careers, Evidence, Therapies overview), therapy pages and text pages (ADR-007).
 */

export type PageCard = {
  r: string;
  id: number;
  title: string;
  type: string;
  region: Region | null;
  path: string;
  status: "live" | "changed" | "draft";
  changedBy: string | null;
  changedAt: string | null;
  thumb: string | null;
  adminHref: string;
  /** site pages: their key (home, about, careers, evidence, therapies) */
  siteKey?: string;
};

/** Regions in the order of the region menu (Americas, Asia & Pacific, Europe & Middle East). */
const regionOrder = (r: Region | null) => (r ? REGION_CHOICES.findIndex((c) => c.region === r) : -1);

const isPicture = (u: string | undefined) => !!u && !/\.(mp4|webm|mov)(\?|$)/i.test(u);

export async function listEditorPages(): Promise<PageCard[]> {
  const [sites, sols, pgs, pend, mats] = await Promise.all([
    db.select({ id: sitePages.id, key: sitePages.key, title: sitePages.title, region: sitePages.region, status: sitePages.status, blocks: sitePages.blocks }).from(sitePages),
    db.select({ id: solutions.id, title: solutions.navLabel, slug: solutions.slug, region: solutions.region, status: solutions.status, blocks: solutions.blocks, sortOrder: solutions.sortOrder }).from(solutions),
    db.select({ id: pages.id, title: pages.title, slug: pages.slug, region: pages.region, status: pages.status, blocks: pages.blocks }).from(pages),
    db.select().from(drafts).where(inArray(drafts.resource, ["site-pages", "solutions", "pages", "materials"])),
    // materials kept at their own address (moved study, case and document pages, ADR-009)
    db.select({ id: materials.id, title: materials.title, slug: materials.slug, regions: materials.regions, status: materials.status, blocks: materials.blocks }).from(materials).where(isNotNull(materials.slug)),
  ]);
  const draftOf = (r: string, id: number) => pend.find((d) => d.resource === r && d.recordId === id && d.data);
  const card = (r: string, type: string, x: { id: number; title: string; region: Region | null; status: string; blocks: StoredBlock[] | null }, path: string): PageCard => {
    const d = draftOf(r, x.id);
    const img = pageSummary(x.blocks).imageUrl;
    return {
      r,
      id: x.id,
      title: x.title,
      type,
      region: x.region,
      path,
      status: x.status !== "published" ? "draft" : d ? "changed" : "live",
      changedBy: d?.updatedByName ?? null,
      changedAt: d?.updatedAt.toISOString() ?? null,
      thumb: isPicture(img) ? img! : null,
      adminHref: `/admin/${r}/${x.id}`,
    };
  };
  const order = Object.keys(SITE_PAGE_TYPE);
  return [
    ...sites
      .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key) || regionOrder(a.region) - regionOrder(b.region))
      .map((x) => ({ ...card("site-pages", SITE_PAGE_TYPE[x.key] ?? "Page", x, sitePagePath(x.key, x.region)), siteKey: x.key })),
    ...sols.sort((a, b) => a.sortOrder - b.sortOrder).map((s) => card("solutions", "Therapy page", s, `/${s.region}/therapies/${s.slug}`)),
    ...[
      ...pgs.map((p) => ({ r: "pages", x: p, path: p.region ? `/${p.region}/${p.slug}` : `/${p.slug}` })),
      ...mats.filter((m) => m.slug).map((m) => {
        const region = m.regions.length === 1 ? m.regions[0] : null;
        return { r: "materials", x: { ...m, region }, path: region ? `/${region}/${m.slug}` : `/${m.slug}` };
      }),
    ].sort((a, b) => a.x.title.localeCompare(b.x.title)).map((p) => card(p.r, "Page", p.x, p.path)),
  ];
}
