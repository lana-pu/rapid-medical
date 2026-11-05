/**
 * Downloads every Duda-CDN asset referenced anywhere in the database into
 * public/uploads/duda/, registers each in the media table and rewrites the
 * references. Safe to re-run: already-migrated URLs are skipped.
 *
 *   npx tsx --env-file=.env scripts/migrate-media.ts
 */
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const CDN_RE = /https?:\/\/(?:l?irp|vid)\.cdn-website\.com\/[^\s"'<>)\]]+/g;
const OUT_DIR = path.join(process.cwd(), "public", "uploads", "duda");

/** Columns that may hold asset URLs (text or jsonb), per table. */
const TARGETS: Record<string, string[]> = {
  solutions: ["hero_image_url", "hero_video_url", "intro_image_url", "intro_video_url", "overview_image_url", "overview_features", "annotated_image", "spec_image_urls", "benefits", "how_it_works", "in_practice", "closing_embed_url", "regulatory_html", "references_html"],
  publications: ["pdf_url", "image_url"],
  news_items: ["image_url", "url"],
  webinars: ["image_url"],
  team_members: ["photo_url", "bio_html"],
  jobs: ["description_html"],
  pages: ["body_html"],
  site_settings: ["value"],
};

function localName(url: string) {
  const u = new URL(url);
  const base = decodeURIComponent(path.basename(u.pathname)).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-1920w(?=\.)/, "");
  const hash = crypto.createHash("md5").update(url).digest("hex").slice(0, 6);
  const ext = path.extname(base);
  return `${path.basename(base, ext)}-${hash}${ext}`;
}

async function download(url: string): Promise<{ file: string; size: number; mime: string } | null> {
  const name = localName(url);
  const file = path.join(OUT_DIR, name);
  try {
    const s = await stat(file);
    return { file: name, size: s.size, mime: "" };
  } catch { /* not downloaded yet */ }
  // Duda serves responsive variants; ask for the original when the URL has /opt/…-1920w.
  // Videos (vid.cdn-website.com) have no variants and the CDN wants a browser UA.
  const isVideo = /vid\.cdn-website\.com/.test(url);
  const original = url.replace("/dms3rep/multi/opt/", "/dms3rep/multi/").replace(/-1920w(?=\.\w+$)/, "");
  for (const candidate of isVideo ? [url] : [original, url]) {
    const res = await fetch(candidate, { headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", referer: "https://www.rapid-medical.com/" } });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(file, buf);
    return { file: name, size: buf.length, mime: res.headers.get("content-type") ?? "" };
  }
  return null;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  await mkdir(OUT_DIR, { recursive: true });

  // 1. collect
  const found = new Set<string>();
  for (const [table, cols] of Object.entries(TARGETS)) {
    const rows = await db.execute(sql.raw(`SELECT ${cols.map((c) => `"${c}"::text AS "${c}"`).join(", ")} FROM "${table}"`));
    for (const r of rows as Record<string, string | null>[]) for (const c of cols) for (const m of (r[c] ?? "").matchAll(CDN_RE)) found.add(m[0].replace(/\\\//g, "/"));
  }
  console.log(`${found.size} CDN assets referenced`);

  // 2. download + register
  const map = new Map<string, string>();
  const existing = await db.select({ sourceUrl: schema.media.sourceUrl, url: schema.media.url }).from(schema.media);
  for (const e of existing) if (e.sourceUrl) map.set(e.sourceUrl, e.url);

  let n = 0;
  for (const src of found) {
    if (map.has(src)) continue;
    const d = await download(src);
    if (!d) { console.warn(`  ✗ ${src}`); continue; }
    const publicUrl = `/uploads/duda/${d.file}`;
    await db.insert(schema.media).values({ url: publicUrl, filename: d.file, mime: d.mime || guessMime(d.file), size: d.size, sourceUrl: src });
    map.set(src, publicUrl);
    n++;
    if (n % 10 === 0) console.log(`  ${n} downloaded…`);
  }
  console.log(`${n} new files downloaded`);

  // 3. rewrite references (text replace on each column, including jsonb via ::text round-trip)
  for (const [table, cols] of Object.entries(TARGETS)) {
    for (const c of cols) {
      for (const [from, to] of map) {
        const fromJson = from.replace(/\//g, "\\/"); // jsonb may escape slashes
        await db.execute(sql.raw(
          `UPDATE "${table}" SET "${c}" = REPLACE(REPLACE("${c}"::text, '${from}', '${to}'), '${fromJson}', '${to}')::${c.endsWith("_html") || c.endsWith("_url") ? "text" : "jsonb"} WHERE "${c}"::text LIKE '%cdn-website.com%'`,
        )).catch(async () => {
          // text columns can't be cast to jsonb – retry as plain text
          await db.execute(sql.raw(`UPDATE "${table}" SET "${c}" = REPLACE("${c}", '${from}', '${to}') WHERE "${c}" LIKE '%cdn-website.com%'`));
        });
      }
    }
  }
  const left = await db.execute(sql.raw(`SELECT count(*) AS n FROM media WHERE url LIKE '%cdn-website%'`));
  console.log("rewrite done; remaining cdn refs in media:", (left as unknown as { n: string }[])[0].n);
  await client.end();
}

function guessMime(f: string) {
  const ext = path.extname(f).toLowerCase();
  return { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".mp4": "video/mp4" }[ext] ?? "application/octet-stream";
}

main().catch((e) => { console.error(e); process.exit(1); });
