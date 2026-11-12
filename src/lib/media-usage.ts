import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type MediaUsage = { table: string; id: number | string; label: string; adminHref: string };

/** Tables/columns that can contain a media URL, and how to link back to the record in the admin. */
const SOURCES: { table: string; cols: string[]; label: string; admin: string; idCol?: string }[] = [
  { table: "solutions", cols: ["hero_image_url", "hero_video_url", "intro_image_url", "intro_video_url", "overview_image_url", "share_image_url", "overview_features", "annotated_image", "spec_image_urls", "benefits", "how_it_works", "in_practice", "closing_embed_url", "regulatory_html", "references_html", "blocks"], label: "nav_label", admin: "solutions" },
  { table: "publications", cols: ["pdf_url", "image_url"], label: "title", admin: "publications" },
  { table: "news_items", cols: ["image_url"], label: "title", admin: "news" },
  { table: "webinars", cols: ["image_url", "video_url"], label: "title", admin: "webinars" },
  { table: "team_members", cols: ["photo_url", "bio_html"], label: "name", admin: "team" },
  { table: "jobs", cols: ["description_html"], label: "title", admin: "jobs" },
  { table: "pages", cols: ["body_html", "blocks"], label: "title", admin: "pages" },
  { table: "site_pages", cols: ["blocks"], label: "title", admin: "site-pages" },
  { table: "site_settings", cols: ["value"], label: "key", admin: "settings?group=", idCol: "key" },
];

/** Finds every record referencing a media URL. */
export async function findMediaUsage(url: string): Promise<MediaUsage[]> {
  const out: MediaUsage[] = [];
  for (const s of SOURCES) {
    const idCol = s.idCol ?? "id";
    const where = s.cols.map((c) => `"${c}"::text LIKE $1`).join(" OR ");
    const rows = (await db.execute(sql.raw(`SELECT "${idCol}" AS id, "${s.label}" AS label FROM "${s.table}" WHERE ${where.replace(/\$1/g, `'%${url.replace(/'/g, "''")}%'`)}`))) as unknown as { id: number | string; label: string }[];
    for (const r of rows) out.push({ table: s.table, id: r.id, label: String(r.label), adminHref: s.idCol ? `/admin/${s.admin}${r.id}` : `/admin/${s.admin}/${r.id}` });
  }
  return out;
}
