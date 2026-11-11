import "server-only";
import { draftMode } from "next/headers";
import { and, asc, desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import {
  db,
  solutions,
  publications,
  newsItems,
  events,
  webinars,
  teamMembers,
  jobs,
  pages,
  products,
  drafts,
  type Region,
} from "@/db";

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
  return (await overlay(resource, [row]))[0];
}

/* ------------------------------------------------------------------ */

export async function getSolutionsNav(region: Region) {
  const rows = await db
    .select({
      id: solutions.id, slug: solutions.slug, navLabel: solutions.navLabel, therapyGroup: solutions.therapyGroup, proofPoint: solutions.proofPoint,
      heroTitle: solutions.heroTitle, heroBody: solutions.heroBody, heroImageUrl: solutions.heroImageUrl, productName: products.name,
    })
    .from(solutions)
    .leftJoin(products, eq(products.id, solutions.productId))
    .where(and(eq(solutions.region, region), await visible(solutions.status)))
    .orderBy(asc(solutions.sortOrder), asc(solutions.id));
  return overlay("solutions", rows);
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

export async function getPublications(region: Region) {
  const rows = await db.query.publications.findMany({
    where: and(await visible(publications.status), regionFilter(publications, region)),
    with: { product: true },
    orderBy: [desc(publications.publishedOn), desc(publications.id)],
  });
  return overlay("publications", rows);
}

export async function getFeaturedPublications(region: Region, limit = 3) {
  const rows = await db.query.publications.findMany({
    where: and(await visible(publications.status), eq(publications.featured, true), regionFilter(publications, region)),
    orderBy: [desc(publications.publishedOn)],
    limit,
  });
  return overlay("publications", rows);
}

export async function getNews(limit?: number) {
  const rows = await db.query.newsItems.findMany({
    where: await visible(newsItems.status),
    orderBy: [desc(newsItems.publishedOn), desc(newsItems.id)],
    limit,
  });
  return overlay("news", rows);
}

export async function getFeaturedNews(limit = 4) {
  const rows = await db.query.newsItems.findMany({
    where: and(await visible(newsItems.status), eq(newsItems.featured, true)),
    orderBy: [desc(newsItems.publishedOn)],
    limit,
  });
  return rows.length ? overlay("news", rows) : getNews(limit);
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

export async function getPage(slug: string, region: Region | null) {
  return one(
    "pages",
    await db.query.pages.findFirst({
      where: and(eq(pages.slug, slug), region ? eq(pages.region, region) : isNull(pages.region), await visible(pages.status)),
    }),
  );
}

export async function getAllPublicPaths(): Promise<string[]> {
  const [sols, pgs, team, jb, ev] = await Promise.all([
    db.select({ slug: solutions.slug, region: solutions.region }).from(solutions).where(eq(solutions.status, "published")),
    db.select({ slug: pages.slug, region: pages.region, noindex: pages.noindex }).from(pages).where(eq(pages.status, "published")),
    db.select({ slug: teamMembers.slug }).from(teamMembers).where(eq(teamMembers.status, "published")),
    db.select({ slug: jobs.slug }).from(jobs).where(eq(jobs.status, "published")),
    db.select({ slug: events.slug }).from(events).where(eq(events.status, "published")),
  ]);
  return [
    "/", "/news-events", "/about-us", "/careers", "/open-positions", "/contact-us",
    ...["us", "ous", "apac"].flatMap((r) => [`/${r}/therapies`, `/${r}/evidence`, `/${r}/webinars`]),
    ...sols.map((s) => `/${s.region}/therapies/${s.slug}`),
    ...pgs.filter((p) => !p.noindex).map((p) => (p.region ? `/${p.region}/${p.slug}` : `/${p.slug}`)),
    ...team.map((t) => `/team/${t.slug}`),
    ...jb.map((j) => `/open-positions/${j.slug}`),
    ...ev.map((e) => `/events/${e.slug}`),
  ];
}
