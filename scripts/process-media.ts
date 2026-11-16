/**
 * Backfill: generate WebP variants / placeholders for images, posters for videos and pages for PDFs
 * («the document on the page», 2026-11-16) that came in before the media pipeline did.
 * A PDF in public/uploads that is not in the library yet (open-access copies) is added to it first.
 *   npx tsx --env-file=.env scripts/process-media.ts [--pdf-again]   (--pdf-again: draw every PDF anew)
 */
import { readFile, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { processImage, videoPoster } from "../src/lib/images";
import { storeDocumentPages } from "../src/lib/document-pages";

const PDF = "application/pdf";

/** Every PDF file under public/uploads, as its public URL. */
async function localPdfs(dir = path.join(process.cwd(), "public", "uploads")): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await localPdfs(full)));
    else if (/\.pdf$/i.test(e.name)) out.push("/" + path.relative(path.join(process.cwd(), "public"), full).split(path.sep).join("/"));
  }
  return out;
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });
  const again = process.argv.includes("--pdf-again");

  // PDFs on disk that the library does not know (copies of open-access articles were put there by hand)
  const known = new Set((await db.select({ url: schema.media.url }).from(schema.media).where(eq(schema.media.mime, PDF))).map((r) => r.url));
  for (const url of await localPdfs()) {
    if (known.has(url)) continue;
    const { size } = await stat(path.join(process.cwd(), "public", url));
    await db.insert(schema.media).values({ url, filename: path.basename(url), mime: PDF, size, key: url.replace(/^\/uploads\//, "") });
    console.log(`  + library: ${url}`);
  }

  const rows = await db.select().from(schema.media).where(sql`(${schema.media.mime} LIKE 'image/%' AND jsonb_array_length(${schema.media.variants}) = 0 AND ${schema.media.mime} NOT IN ('image/svg+xml','image/gif')) OR (${schema.media.mime} LIKE 'video/%' AND ${schema.media.posterUrl} IS NULL) OR (${schema.media.mime} = ${PDF} AND (${again} OR jsonb_array_length(${schema.media.pages}) = 0))`);
  console.log(`${rows.length} files to process`);
  let n = 0;
  for (const m of rows) {
    if (!m.url.startsWith("/uploads/")) continue; // only local files can be read here
    const file = path.join(process.cwd(), "public", m.url);
    const buf = await readFile(file).catch(() => null);
    if (!buf) continue;
    const prefix = path.dirname(m.url.replace(/^\/uploads\//, ""));
    try {
      if (m.mime.startsWith("image/")) {
        const p = await processImage(m.filename, buf, m.mime, prefix + "/variants", { skipOriginal: true });
        await db.update(schema.media).set({ width: p.width, height: p.height, variants: p.variants, placeholder: p.placeholder, key: m.url.replace(/^\/uploads\//, "") }).where(eq(schema.media.id, m.id));
      } else if (m.mime === PDF) {
        const { pages, text } = await storeDocumentPages(m.id, buf);
        // pictures of an earlier drawing that are not reused go away
        const keep = new Set(pages.flatMap((p) => p.variants.map((v) => v.url)));
        for (const old of m.pages.flatMap((p) => p.variants.map((v) => v.url))) {
          if (!keep.has(old) && old.startsWith("/uploads/")) await unlink(path.join(process.cwd(), "public", old)).catch(() => {});
        }
        await db.update(schema.media).set({ pages, text, key: m.url.replace(/^\/uploads\//, "") }).where(eq(schema.media.id, m.id));
        console.log(`  ${m.filename}: ${pages.length} pages${text ? "" : ", no text"}`);
      } else {
        const poster = await videoPoster(m.filename, buf, prefix + "/variants");
        await db.update(schema.media).set({ posterUrl: poster?.url ?? null, key: m.url.replace(/^\/uploads\//, "") }).where(eq(schema.media.id, m.id));
      }
      n++;
      if (n % 20 === 0) console.log(`  ${n}…`);
    } catch (e) {
      console.warn(`  ✗ ${m.filename}: ${(e as Error).message}`);
    }
  }
  console.log(`processed ${n}`);
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
