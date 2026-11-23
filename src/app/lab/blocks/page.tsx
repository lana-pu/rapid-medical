import type { Metadata } from "next";
import { and, desc, eq, isNotNull, like } from "drizzle-orm";
import { db, jobs, media, newsItems, publications, webinars } from "@/db";
import { formatMonth } from "@/components/site/layout-primitives";
import { Builder } from "@/components/kit/Builder";
import type { LabData } from "@/components/kit/render";

/**
 * Blocks sandbox: the proposed block model (sections → columns → blocks with switchable options) on the site's own look,
 * with real pictures and records, before it goes into the editor. Not linked from the site; no index.
 */
export const metadata: Metadata = { title: "Blocks sandbox", robots: { index: false, follow: false } };

export default async function LabBlocks() {
  const [pics, news, pubs, webs, roles] = await Promise.all([
    db.select({ url: media.url, alt: media.alt }).from(media).where(and(like(media.mime, "image/%"), like(media.url, "/uploads/%"))).orderBy(desc(media.size)).limit(24),
    db.select().from(newsItems).where(eq(newsItems.status, "published")).orderBy(desc(newsItems.publishedOn)).limit(6),
    db.select().from(publications).where(eq(publications.status, "published")).orderBy(desc(publications.publishedOn)).limit(6),
    db.select().from(webinars).where(and(eq(webinars.status, "published"), isNotNull(webinars.title))).limit(6),
    db.select().from(jobs).where(eq(jobs.status, "published")).limit(6),
  ]);
  const data: LabData = {
    // photographs first: big files are the pictures, small ones are icons and logos
    images: pics.filter((p) => !/\.svg$/i.test(p.url)).map((p) => ({ url: p.url, alt: p.alt ?? "" })),
    news: news.map((n) => ({ title: n.title, date: formatMonth(n.publishedOn), source: n.source, image: n.imageUrl })),
    publications: pubs.map((p) => ({ title: p.title, journal: p.journal, date: formatMonth(p.publishedOn) })),
    webinars: webs.map((w) => ({ title: w.title, speaker: w.speaker, image: w.imageUrl })),
    jobs: roles.map((j) => ({ title: j.title, department: j.department, location: j.location })),
  };
  return <Builder data={data} />;
}
