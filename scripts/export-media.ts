/**
 * Snapshot the media library (rows + processed variants/posters) into
 * content/seed/media.json so a fresh database can be seeded without
 * re-downloading or re-processing anything:
 *   npx tsx --env-file=.env scripts/export-media.ts
 */
import { writeFile } from "node:fs/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { asc } from "drizzle-orm";
import * as schema from "../src/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  const rows = await db.select().from(schema.media).orderBy(asc(schema.media.id));
  const out = rows
    .filter((m) => m.url.startsWith("/uploads/") && !/^e2e-/.test(m.filename))
    .map(({ id: _id, createdAt: _c, ...m }) => { void _id; void _c; return m; });
  await writeFile("content/seed/media.json", JSON.stringify(out, null, 1));
  console.log(`exported ${out.length} media rows`);
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
