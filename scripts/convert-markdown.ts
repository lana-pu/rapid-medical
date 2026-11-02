/**
 * One-off: copy legacy Markdown columns into the new HTML columns.
 * Safe to re-run (only fills empty HTML columns). After this, migration
 * 0003 drops the *_md columns.
 *
 *   npx tsx --env-file=.env scripts/convert-markdown.ts
 */
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { markdownToHtml } from "../src/lib/html";

const PAIRS: [string, string, string][] = [
  ["solutions", "regulatory_md", "regulatory_html"],
  ["solutions", "references_md", "references_html"],
  ["team_members", "bio_md", "bio_html"],
  ["jobs", "description_md", "description_html"],
  ["pages", "body_md", "body_html"],
];

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(client);
  for (const [table, from, to] of PAIRS) {
    const rows = (await db.execute(sql.raw(`SELECT id, "${from}" AS src FROM "${table}" WHERE "${to}" = '' AND "${from}" <> ''`))) as unknown as { id: number; src: string }[];
    for (const r of rows) {
      const html = markdownToHtml(r.src);
      await db.execute(sql`UPDATE ${sql.raw(`"${table}"`)} SET ${sql.raw(`"${to}"`)} = ${html} WHERE id = ${r.id}`);
    }
    console.log(`${table}.${from} → ${to}: ${rows.length} rows`);
  }
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
