import "server-only";
import { inArray } from "drizzle-orm";
import { db, drafts, pages, solutions, type Region, type StoredBlock } from "@/db";
import { pageSummary } from "@/blocks/stored";

/**
 * Every page an editor can open in the page editor (docs/screens/admin-editor-pages.md):
 * therapy pages and text pages; singleton pages join when they move to `site_pages` (ADR-007).
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
};

const isPicture = (u: string | undefined) => !!u && !/\.(mp4|webm|mov)(\?|$)/i.test(u);

export async function listEditorPages(): Promise<PageCard[]> {
  const [sols, pgs, pend] = await Promise.all([
    db.select({ id: solutions.id, title: solutions.navLabel, slug: solutions.slug, region: solutions.region, status: solutions.status, blocks: solutions.blocks, sortOrder: solutions.sortOrder }).from(solutions),
    db.select({ id: pages.id, title: pages.title, slug: pages.slug, region: pages.region, status: pages.status, blocks: pages.blocks }).from(pages),
    db.select().from(drafts).where(inArray(drafts.resource, ["solutions", "pages"])),
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
  return [
    ...sols.sort((a, b) => a.sortOrder - b.sortOrder).map((s) => card("solutions", "Therapy page", s, `/${s.region}/therapies/${s.slug}`)),
    ...pgs.sort((a, b) => a.title.localeCompare(b.title)).map((p) => card("pages", "Page", p, p.region ? `/${p.region}/${p.slug}` : `/${p.slug}`)),
  ];
}
