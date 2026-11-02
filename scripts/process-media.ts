/**
 * Backfill: generate WebP variants / placeholders for images and posters for
 * videos that were imported before the media pipeline existed.
 *   npx tsx --env-file=.env scripts/process-media.ts
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { processImage, videoPoster } from "../src/lib/images";

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client, { schema });
  const rows = await db.select().from(schema.media).where(sql`(${schema.media.mime} LIKE 'image/%' AND jsonb_array_length(${schema.media.variants}) = 0 AND ${schema.media.mime} NOT IN ('image/svg+xml','image/gif')) OR (${schema.media.mime} LIKE 'video/%' AND ${schema.media.posterUrl} IS NULL)`);
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
