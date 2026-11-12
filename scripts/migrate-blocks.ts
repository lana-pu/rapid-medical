/**
 * Pages → block lists (ADR-007). Idempotent: converts only records whose `blocks` is still empty,
 * and pending drafts of those records (so an unpublished edit is not lost on the next Publish).
 * Runs after seeding and media linking (both write the old fields).
 *
 *   npx tsx --env-file=.env scripts/migrate-blocks.ts
 */
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { solutionToStored, pageToStored } from "../src/blocks/convert";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  const { solutions, pages, drafts, products } = schema;
  const productSlug = new Map((await db.select({ id: products.id, slug: products.slug }).from(products)).map((p) => [p.id, p.slug]));

  let n = 0;
  for (const s of await db.select().from(solutions).where(isNull(solutions.blocks))) {
    const product = s.productId ? { slug: productSlug.get(s.productId) ?? "" } : null;
    await db.update(solutions).set({ blocks: solutionToStored({ ...s, product }) }).where(eq(solutions.id, s.id));
    n++;
    const [d] = await db.select().from(drafts).where(and(eq(drafts.resource, "solutions"), eq(drafts.recordId, s.id)));
    if (d?.data && !("blocks" in d.data && d.data.blocks)) {
      const merged = { ...s, ...(d.data as Partial<schema.Solution>), id: s.id };
      await db.update(drafts).set({ data: { ...d.data, blocks: solutionToStored({ ...merged, product }) } }).where(eq(drafts.id, d.id));
    }
  }
  let m = 0;
  for (const p of await db.select().from(pages).where(isNull(pages.blocks))) {
    await db.update(pages).set({ blocks: pageToStored(p) }).where(eq(pages.id, p.id));
    m++;
    const [d] = await db.select().from(drafts).where(and(eq(drafts.resource, "pages"), eq(drafts.recordId, p.id)));
    if (d?.data && !("blocks" in d.data && d.data.blocks)) {
      await db.update(drafts).set({ data: { ...d.data, blocks: pageToStored({ ...p, ...(d.data as Partial<schema.Page>), id: p.id }) } }).where(eq(drafts.id, d.id));
    }
  }
  console.log(`block lists: ${n} therapy pages, ${m} pages converted`);
  await client.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
