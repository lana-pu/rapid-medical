import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Where a media file is used (docs/screens/admin-media.md): live records, pending drafts of records and of settings.
 * A file that only a draft uses still counts — deleting it would break that draft; replacing it must reach the draft.
 */

export type MediaUsage = {
  /** admin resource slug, or "settings:<key>" */
  r: string;
  id: number;
  table: string;
  label: string;
  adminHref: string;
  /** public address of the page, when the record is a page (opens in the page editor) */
  pagePath: string | null;
  /** found only in a pending draft */
  draftOnly: boolean;
};

/** Region names as editors see them (REGION_CHOICES), not codes. */
const REGION_NAME = `case region when 'us' then 'Americas' when 'apac' then 'Asia & Pacific' when 'ous' then 'Europe & Middle East' end`;

/**
 * Settings whose texts moved to the pages (ADR-007): kept for rollback, not shown on the site — not a use of a file.
 * Their other keys (therapies:* Google title) hold no media.
 */
const RETIRED_SETTINGS = ["home", "about", "careers", "evidence", "therapies:us", "therapies:ous", "therapies:apac"];

/** Tables/columns that can contain a media URL, the admin resource behind them and the page address. */
const SOURCES: { table: string; r: string; cols: string[]; label: string; path?: string }[] = [
  { table: "site_pages", r: "site-pages", cols: ["blocks"], label: `title || coalesce(' (' || ${REGION_NAME} || ')', '')`, path: `case key when 'home' then '/' when 'about' then '/about-us' when 'careers' then '/careers' else '/' || region || '/' || key end` },
  { table: "solutions", r: "solutions", cols: ["hero_image_url", "hero_video_url", "intro_image_url", "intro_video_url", "overview_image_url", "share_image_url", "overview_features", "annotated_image", "spec_image_urls", "benefits", "how_it_works", "in_practice", "closing_embed_url", "regulatory_html", "references_html", "blocks"], label: `nav_label || ' (' || ${REGION_NAME} || ')'`, path: `'/' || region || '/therapies/' || slug` },
  { table: "pages", r: "pages", cols: ["body_html", "share_image_url", "blocks"], label: `title || coalesce(' (' || ${REGION_NAME} || ')', '')`, path: `coalesce('/' || region, '') || '/' || slug` },
  { table: "publications", r: "publications", cols: ["pdf_url", "image_url"], label: "title" },
  { table: "news_items", r: "news", cols: ["image_url"], label: "title" },
  { table: "events", r: "events", cols: ["image_url", "description_html", "recap_html", "recap_photos"], label: "title" },
  { table: "webinars", r: "webinars", cols: ["image_url", "video_url"], label: "title" },
  { table: "team_members", r: "team", cols: ["photo_url", "bio_html"], label: "name" },
  { table: "jobs", r: "jobs", cols: ["description_html"], label: "title" },
];

type Row = { r: string; id: number; table: string; label: string; path: string | null; text: string; draft: boolean };

/** Every record's media-bearing text in one pass (live rows, record drafts, settings and their drafts). */
export async function mediaIndex(): Promise<Row[]> {
  const out: Row[] = [];
  for (const s of SOURCES) {
    const text = s.cols.map((c) => `coalesce("${c}"::text, '')`).join(" || ' ' || ");
    const rows = (await db.execute(sql.raw(`SELECT id, (${s.label}) AS label, ${s.path ? `(${s.path})` : "null"} AS path, ${text} AS text FROM "${s.table}"`))) as unknown as { id: number; label: string; path: string | null; text: string }[];
    for (const x of rows) out.push({ r: s.r, id: x.id, table: s.table, label: String(x.label), path: x.path, text: x.text, draft: false });
  }
  const drafts = (await db.execute(sql`SELECT resource, record_id AS id, data::text AS text FROM drafts WHERE data IS NOT NULL`)) as unknown as { resource: string; id: number; text: string }[];
  for (const d of drafts) {
    const live = out.find((x) => x.r === d.resource && x.id === d.id && !x.draft);
    out.push({ r: d.resource, id: d.id, table: live?.table ?? d.resource, label: live?.label ?? `#${d.id}`, path: live?.path ?? null, text: d.text, draft: true });
  }
  const settings = (await db.execute(sql`SELECT key, value::text AS text, false AS draft FROM site_settings UNION ALL SELECT key, value::text, true FROM setting_drafts`)) as unknown as { key: string; text: string; draft: boolean }[];
  for (const s of settings.filter((x) => !RETIRED_SETTINGS.includes(x.key))) out.push({ r: `settings:${s.key}`, id: 0, table: "site_settings", label: `Settings: ${s.key}`, path: null, text: s.text, draft: s.draft });
  return out;
}

/** The URL as a whole value: not a prefix of a longer file name ("a.png" must not match "a.png.webp"). */
export const urlPattern = (url: string) => new RegExp(`${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w.-])`, "g");

/** Every string holding the address gets the new one (fields, block lists, rich text, lists); dates and other objects stay. */
export function swapUrl(v: unknown, from: RegExp, to: string): unknown {
  if (typeof v === "string") {
    from.lastIndex = 0;
    return from.test(v) ? v.replace(from, () => to) : v;
  }
  if (Array.isArray(v)) return v.map((x) => swapUrl(x, from, to));
  if (v && typeof v === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(v))) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swapUrl(x, from, to)]));
  }
  return v;
}

export function usageIn(index: Row[], url: string): MediaUsage[] {
  const re = urlPattern(url);
  const byRecord = new Map<string, MediaUsage>();
  for (const x of index) {
    re.lastIndex = 0;
    if (!re.test(x.text)) continue;
    const key = `${x.r}#${x.id}`;
    const seen = byRecord.get(key);
    if (seen) {
      if (!x.draft) seen.draftOnly = false;
      continue;
    }
    const settings = x.r.startsWith("settings:");
    byRecord.set(key, {
      r: x.r,
      id: x.id,
      table: x.table,
      label: x.label,
      adminHref: settings ? `/admin/settings?group=${x.r.slice(9)}` : `/admin/${x.r}/${x.id}`,
      pagePath: x.path,
      draftOnly: x.draft,
    });
  }
  return [...byRecord.values()];
}

/** Finds every record referencing a media URL (live or in a pending draft). */
export async function findMediaUsage(url: string): Promise<MediaUsage[]> {
  return usageIn(await mediaIndex(), url);
}
