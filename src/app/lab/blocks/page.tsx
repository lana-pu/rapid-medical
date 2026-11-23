import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, desc, eq, isNotNull, like } from "drizzle-orm";
import { db, jobs, media, newsItems, publications, webinars } from "@/db";
import { formatMonth } from "@/components/site/layout-primitives";
import { Builder } from "@/components/kit/Builder";
import type { LabData } from "@/components/kit/render";
import { DEMO } from "@/lib/demo";

/**
 * Blocks sandbox: the proposed block model (sections → columns → blocks with switchable options) on the site's own look,
 * with real pictures and records, before it goes into the editor. Not linked from the site; no index.
 */
export const metadata: Metadata = { title: "Blocks sandbox", robots: { index: false, follow: false } };

export default async function LabBlocks() {
  // only in the static demo and local development: on the live site it would list media-library files, unpublished too
  if (!DEMO && process.env.NODE_ENV === "production") notFound();
  const [pics, news, pubs, webs, roles] = await Promise.all([
    db.select().from(media).where(like(media.url, "/uploads/%")).orderBy(desc(media.createdAt)),
    db.select().from(newsItems).where(eq(newsItems.status, "published")).orderBy(desc(newsItems.publishedOn)).limit(6),
    db.select().from(publications).where(eq(publications.status, "published")).orderBy(desc(publications.publishedOn)).limit(6),
    db.select().from(webinars).where(and(eq(webinars.status, "published"), isNotNull(webinars.title))).limit(6),
    db.select().from(jobs).where(eq(jobs.status, "published")).limit(6),
  ]);
  const data: LabData = {
    // photographs first: big files are the pictures, small ones are icons and logos
    // photographs first (by size): small files are icons and logos
    images: pics.filter((p) => p.mime.startsWith("image/") && !/svg|icon/.test(p.mime)).sort((a, b) => b.size - a.size).slice(0, 24).map((p) => ({ url: p.url, alt: p.alt ?? "" })),
    // the whole library, as the media library shows it (images, videos, PDFs)
    library: pics.map((m) => ({
      id: m.id,
      url: m.url,
      filename: m.filename,
      kind: m.mime.startsWith("image/") ? "image" : m.mime.startsWith("video/") ? "video" : m.mime === "application/pdf" ? "document" : "other",
      mime: m.mime,
      size: m.size,
      width: m.width,
      height: m.height,
      alt: m.alt,
      thumb: m.mime.startsWith("image/") ? (m.variants.find((v) => v.w >= 320)?.url ?? m.url) : m.mime.startsWith("video/") ? m.posterUrl : (m.pages[0]?.variants[0]?.url ?? null),
      poster: m.posterUrl,
      pages: m.pageCount || m.pages.length,
      firstPage: m.pages[0]?.variants.at(-1)?.url ?? null,
      created: m.createdAt.toISOString().slice(0, 10),
    })),
    news: news.map((n) => ({ title: n.title, date: formatMonth(n.publishedOn), source: n.source, image: n.imageUrl })),
    publications: pubs.map((p) => ({ title: p.title, journal: p.journal, date: formatMonth(p.publishedOn) })),
    webinars: webs.map((w) => ({ title: w.title, speaker: w.speaker, image: w.imageUrl })),
    jobs: roles.map((j) => ({ title: j.title, department: j.department, location: j.location })),
  };
  return <Builder data={data} />;
}
