import "server-only";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import {
  db,
  solutions,
  publications,
  newsItems,
  webinars,
  teamMembers,
  jobs,
  pages,
  products,
  type Region,
} from "@/db";

/* Public read layer – always filters to published content. */

const published = { status: "published" as const };

export async function getSolutionsNav(region: Region) {
  return db
    .select({ slug: solutions.slug, navLabel: solutions.navLabel, heroTitle: solutions.heroTitle, heroBody: solutions.heroBody, heroImageUrl: solutions.heroImageUrl })
    .from(solutions)
    .where(and(eq(solutions.region, region), eq(solutions.status, published.status)))
    .orderBy(asc(solutions.sortOrder), asc(solutions.id));
}

export async function getSolution(region: Region, slug: string) {
  return db.query.solutions.findFirst({
    where: and(eq(solutions.region, region), eq(solutions.slug, slug), eq(solutions.status, published.status)),
    with: { product: true },
  });
}

/** Regions where a given therapy slug exists (for the region switcher). */
export async function getSolutionRegions(slug: string): Promise<Region[]> {
  const rows = await db.select({ region: solutions.region }).from(solutions).where(and(eq(solutions.slug, slug), eq(solutions.status, published.status)));
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
    where: and(eq(publications.status, published.status), regionFilter(publications, region)),
    with: { product: true },
    orderBy: [desc(publications.publishedOn), desc(publications.id)],
  });
  return rows;
}

export async function getFeaturedPublications(region: Region, limit = 3) {
  return db.query.publications.findMany({
    where: and(eq(publications.status, published.status), eq(publications.featured, true), regionFilter(publications, region)),
    orderBy: [desc(publications.publishedOn)],
    limit,
  });
}

export async function getNews(limit?: number) {
  return db.query.newsItems.findMany({
    where: eq(newsItems.status, published.status),
    orderBy: [desc(newsItems.publishedOn), desc(newsItems.id)],
    limit,
  });
}

export async function getFeaturedNews(limit = 4) {
  const rows = await db.query.newsItems.findMany({
    where: and(eq(newsItems.status, published.status), eq(newsItems.featured, true)),
    orderBy: [desc(newsItems.publishedOn)],
    limit,
  });
  return rows.length ? rows : getNews(limit);
}

export async function getWebinars(region: Region) {
  return db.query.webinars.findMany({
    where: and(eq(webinars.status, published.status), regionFilter(webinars, region)),
    with: { product: true },
    orderBy: [asc(webinars.sortOrder), desc(webinars.heldOn)],
  });
}

export async function getTeam() {
  return db.select().from(teamMembers).where(eq(teamMembers.status, published.status)).orderBy(asc(teamMembers.sortOrder), asc(teamMembers.id));
}

export async function getTeamMember(slug: string) {
  return db.query.teamMembers.findFirst({ where: and(eq(teamMembers.slug, slug), eq(teamMembers.status, published.status)) });
}

export async function getJobs() {
  return db.select().from(jobs).where(eq(jobs.status, published.status)).orderBy(asc(jobs.sortOrder), desc(jobs.createdAt));
}

export async function getJob(slug: string) {
  return db.query.jobs.findFirst({ where: and(eq(jobs.slug, slug), eq(jobs.status, published.status)) });
}

export async function getPage(slug: string, region: Region | null) {
  return db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), region ? eq(pages.region, region) : isNull(pages.region), eq(pages.status, published.status)),
  });
}

export async function getAllPublicPaths(): Promise<string[]> {
  const [sols, pgs, team, jb] = await Promise.all([
    db.select({ slug: solutions.slug, region: solutions.region }).from(solutions).where(eq(solutions.status, "published")),
    db.select({ slug: pages.slug, region: pages.region, noindex: pages.noindex }).from(pages).where(eq(pages.status, "published")),
    db.select({ slug: teamMembers.slug }).from(teamMembers).where(eq(teamMembers.status, "published")),
    db.select({ slug: jobs.slug }).from(jobs).where(eq(jobs.status, "published")),
  ]);
  return [
    "/", "/news-events", "/about-us", "/careers", "/open-positions", "/contact-us", "/choose-your-location",
    ...["us", "ous", "apac"].flatMap((r) => [`/${r}/therapies`, `/${r}/evidence`, `/${r}/webinars`]),
    ...sols.map((s) => `/${s.region}/therapies/${s.slug}`),
    ...pgs.filter((p) => !p.noindex).map((p) => (p.region ? `/${p.region}/${p.slug}` : `/${p.slug}`)),
    ...team.map((t) => `/team/${t.slug}`),
    ...jb.map((j) => `/open-positions/${j.slug}`),
  ];
}
