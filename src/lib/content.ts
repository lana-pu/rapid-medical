import "server-only";
import { materialPaths } from "./material";
import { draftMode } from "next/headers";
import { and, asc, desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import {
  db,
  solutions,
  materials,
  events,
  webinars,
  teamMembers,
  jobs,
  pages,
  sitePages,
  products,
  drafts,
  type Region,
  type SitePageKey,
  type Page,
} from "@/db";
import { pageSummary } from "@/blocks/stored";
import { asViewedVersion } from "./version";

/**
 * Public read layer.
 * Normally only `published` rows are returned. In Next draft mode (opened via
 * /api/preview?token=…) unpublished rows are included and pending drafts from
 * the admin are layered on top, so editors can share a preview link.
 */

async function isPreview(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    return false; // outside a request (e.g. sitemap generation)
  }
}

/** status = published, unless previewing. */
async function visible(statusCol: PgColumn): Promise<SQL> {
  return (await isPreview()) ? sql`true` : eq(statusCol, "published");
}

/** Merge pending admin drafts into rows (preview only). `resource` = admin resource slug. */
async function overlay<T extends { id: number }>(resource: string, rows: T[]): Promise<T[]> {
  if (!rows.length || !(await isPreview())) return rows;
  const ids = rows.map((r) => r.id);
  const pending = await db.select().from(drafts).where(and(eq(drafts.resource, resource), inArray(drafts.recordId, ids)));
  if (!pending.length) return rows;
  const byId = new Map(pending.filter((d) => d.data).map((d) => [d.recordId, d.data as Partial<T>]));
  return rows.map((r) => (byId.has(r.id) ? { ...r, ...byId.get(r.id), id: r.id } : r));
}

async function one<T extends { id: number }>(resource: string, row: T | undefined | null): Promise<T | null> {
  if (!row) return null;
  // an earlier version being viewed from History replaces the row (signed-in editors only; src/lib/version.ts)
  return asViewedVersion(resource, (await overlay(resource, [row]))[0]);
}

/* ------------------------------------------------------------------ */

export async function getSolutionsNav(region: Region) {
  const rows = await db
    .select({
      id: solutions.id, slug: solutions.slug, navLabel: solutions.navLabel, therapyGroup: solutions.therapyGroup, proofPoint: solutions.proofPoint,
      heroTitle: solutions.heroTitle, heroBody: solutions.heroBody, heroImageUrl: solutions.heroImageUrl, productName: products.name, productSlug: products.slug,
      blocks: solutions.blocks,
    })
    .from(solutions)
    .leftJoin(products, eq(products.id, solutions.productId))
    .where(and(eq(solutions.region, region), await visible(solutions.status)))
    .orderBy(asc(solutions.sortOrder), asc(solutions.id));
  // A converted page (ADR-007) keeps its hero in the block list; the overview card shows that one.
  return (await overlay("solutions", rows)).map(({ blocks, ...r }) => {
    if (!blocks?.length) return r;
    const sum = pageSummary(blocks);
    return { ...r, heroTitle: sum.title ?? r.heroTitle, heroBody: sum.body ?? "", heroImageUrl: sum.imageUrl ?? null };
  });
}

export async function getSolution(region: Region, slug: string) {
  const row = await db.query.solutions.findFirst({
    where: and(eq(solutions.region, region), eq(solutions.slug, slug), await visible(solutions.status)),
    with: { product: true },
  });
  return one("solutions", row);
}

/** Regions where a given therapy slug exists (for the region switcher). */
export async function getSolutionRegions(slug: string): Promise<Region[]> {
  const rows = await db.select({ region: solutions.region }).from(solutions).where(and(eq(solutions.slug, slug), await visible(solutions.status)));
  return rows.map((r) => r.region);
}

export async function getProducts() {
  return db.select().from(products).orderBy(asc(products.sortOrder));
}

/** Products that get an Evidence tab in a region, with region-specific names applied. */
export async function getProductsForRegion(region: Region) {
  const all = await getProducts();
  return all
    .filter((p) => p.regions.length === 0 || p.regions.includes(region))
    .map((p) => ({ ...p, name: p.aliases[region]?.name ?? p.name, fullName: p.aliases[region]?.fullName ?? p.fullName }));
}

function regionFilter(table: { regions: PgColumn }, region: Region) {
  // empty array = all regions
  return or(sql`jsonb_array_length(${table.regions}) = 0`, sql`${table.regions} @> ${JSON.stringify([region])}::jsonb`);
}

/*  Materials (ADR-009): one table; where a material shows is its flags, not its table. Drafts are layered before the
 *  flags are checked, so a pending «show in Evidence» is seen in preview. */
const M = "materials";
const inEvidence = (m: { showInEvidence: boolean }) => m.showInEvidence;
const inNews = (m: { showInNews: boolean }) => m.showInNews;

/** All published Evidence materials, every region — the company-wide figure (About, Home). */
export async function getPublicationCount() {
  const rows = await db.select({ id: materials.id }).from(materials).where(and(await visible(materials.status), eq(materials.showInEvidence, true)));
  return rows.length;
}

export async function getPublications(region: Region) {
  const rows = await db.query.materials.findMany({
    where: and(await visible(materials.status), regionFilter(materials, region)),
    with: { product: true },
    orderBy: [desc(materials.publishedOn), desc(materials.id)],
  });
  return (await overlay(M, rows)).filter(inEvidence);
}

/** One Evidence material on its own page, if it is shown in this region (the same rule as Evidence). */
export async function getPublication(region: Region, id: number) {
  const row = await db.query.materials.findFirst({
    where: and(eq(materials.id, id), await visible(materials.status), regionFilter(materials, region)),
    with: { product: true },
  });
  const m = await one(M, row);
  return m && inEvidence(m) ? m : null;
}

export async function getFeaturedPublications(region: Region, limit = 3) {
  const rows = await db.query.materials.findMany({
    where: and(await visible(materials.status), eq(materials.featured, true), regionFilter(materials, region)),
    orderBy: [desc(materials.publishedOn), desc(materials.id)],
  });
  return (await overlay(M, rows)).filter((m) => inEvidence(m) && m.featured).slice(0, limit);
}

export async function getNews(limit?: number) {
  const rows = await db.query.materials.findMany({
    where: await visible(materials.status),
    orderBy: [desc(materials.publishedOn), desc(materials.id)],
  });
  const list = (await overlay(M, rows)).filter(inNews);
  return limit ? list.slice(0, limit) : list;
}

/** One news material on its own page. */
export async function getNewsItem(id: number) {
  const m = await one(M, await db.query.materials.findFirst({ where: and(eq(materials.id, id), await visible(materials.status)) }));
  return m && inNews(m) ? m : null;
}

/** The new id of a news item moved on 2026-11-18 (its old address keeps working: 308 to the new one). */
export async function getMovedNewsId(oldId: number): Promise<number | null> {
  const row = await db.query.materials.findFirst({ columns: { id: true }, where: eq(materials.legacyRef, `news_items:${oldId}`) });
  return row?.id ?? null;
}

export async function getFeaturedNews(limit = 4) {
  const featured = (await getNews()).filter((m) => m.featured);
  return featured.length ? featured.slice(0, limit) : getNews(limit);
}

export async function getWebinars(region: Region) {
  const rows = await db.query.webinars.findMany({
    where: and(await visible(webinars.status), regionFilter(webinars, region)),
    with: { product: true },
    orderBy: [asc(webinars.sortOrder), desc(webinars.heldOn)],
  });
  return overlay("webinars", rows);
}

export async function getTeam() {
  const rows = await db.select().from(teamMembers).where(await visible(teamMembers.status)).orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id));
  return overlay("team", rows);
}

export async function getTeamMember(slug: string) {
  return one("team", await db.query.teamMembers.findFirst({ where: and(eq(teamMembers.slug, slug), await visible(teamMembers.status)) }));
}

export async function getJobs() {
  const rows = await db.select().from(jobs).where(await visible(jobs.status)).orderBy(asc(jobs.sortOrder), desc(jobs.createdAt));
  return overlay("jobs", rows);
}

export async function getEvents() {
  const rows = await db.query.events.findMany({ where: await visible(events.status), orderBy: [desc(events.startsOn), desc(events.id)] });
  return overlay("events", rows);
}

export async function getEvent(slug: string) {
  return one("events", await db.query.events.findFirst({ where: and(eq(events.slug, slug), await visible(events.status)) }));
}

export async function getJob(slug: string) {
  return one("jobs", await db.query.jobs.findFirst({ where: and(eq(jobs.slug, slug), await visible(jobs.status)) }));
}

/** A text page (Privacy, Terms, landings) or a material kept at its old address (a moved study page); `resource` says which. */
export type SitePageRow = Page & { resource: "pages" | "materials" };

export async function getPage(slug: string, region: Region | null): Promise<SitePageRow | null> {
  const page = await one(
    "pages",
    await db.query.pages.findFirst({
      where: and(eq(pages.slug, slug), region ? eq(pages.region, region) : isNull(pages.region), await visible(pages.status)),
    }),
  );
  if (page) return { ...page, resource: "pages" };
  // a material with its own address: one region → /{region}/{slug}, none → /{slug} (docs/screens/material.md)
  const m = await one(
    M,
    await db.query.materials.findFirst({
      where: and(eq(materials.slug, slug), sql`${materials.regions} = ${JSON.stringify(region ? [region] : [])}::jsonb`, await visible(materials.status)),
    }),
  );
  if (!m || !m.slug) return null;
  return {
    id: m.id, slug: m.slug, region, title: m.title, bodyHtml: m.bodyHtml, blocks: m.blocks, metaTitle: m.metaTitle, metaDescription: m.metaDescription,
    shareImageUrl: m.shareImageUrl, noindex: m.noindex, status: m.status, createdAt: m.createdAt, updatedAt: m.updatedAt, resource: "materials",
  };
}

/** Home, About, Careers, Evidence, Therapies overview as block lists (ADR-007). Always live; drafts layered in preview. */
export async function getSitePage(key: SitePageKey, region: Region | null) {
  return one("site-pages", await db.query.sitePages.findFirst({ where: and(eq(sitePages.key, key), region ? eq(sitePages.region, region) : isNull(sitePages.region)) }));
}

export async function getAllPublicPaths(): Promise<string[]> {
  const [sols, pgs, jb, ev, mats] = await Promise.all([
    db.select({ slug: solutions.slug, region: solutions.region }).from(solutions).where(eq(solutions.status, "published")),
    db.select({ slug: pages.slug, region: pages.region, noindex: pages.noindex }).from(pages).where(eq(pages.status, "published")),
    db.select({ slug: jobs.slug }).from(jobs).where(eq(jobs.status, "published")),
    db.select({ slug: events.slug }).from(events).where(eq(events.status, "published")),
    db.select({ id: materials.id, title: materials.title, regions: materials.regions, slug: materials.slug, noindex: materials.noindex, showInEvidence: materials.showInEvidence, showInNews: materials.showInNews })
      .from(materials).where(eq(materials.status, "published")),
  ]);
  return [
    "/", "/news-events", "/about-us", "/careers", "/contact-us",
    ...["us", "ous", "apac"].flatMap((r) => [`/${r}/therapies`, `/${r}/evidence`, `/${r}/webinars`]),
    ...sols.map((s) => `/${s.region}/therapies/${s.slug}`),
    ...pgs.filter((p) => !p.noindex).map((p) => (p.region ? `/${p.region}/${p.slug}` : `/${p.slug}`)),
    ...jb.map((j) => `/open-positions/${j.slug}`),
    ...ev.map((e) => `/events/${e.slug}`),
    // own pages of materials (docs/screens/material.md): a kept address; else Evidence (in each region that shows it) or News
    ...mats.filter((m) => !m.noindex).flatMap((m) => materialPaths(m)),
  ];
}
