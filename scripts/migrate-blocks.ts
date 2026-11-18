/**
 * Pages → block lists (ADR-007). Idempotent: converts only records whose `blocks` is still empty,
 * and pending drafts of those records (so an unpublished edit is not lost on the next Publish);
 * creates the singleton pages (Home, About, Careers, Evidence, Therapies overview) from site settings if missing.
 * Runs after seeding and media linking (both write the old fields).
 *
 *   npx tsx --env-file=.env scripts/migrate-blocks.ts
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { solutionToStored, pageToStored } from "../src/blocks/convert";
import { studyPageBlocks } from "../src/blocks/studies";
import { materialAsPage } from "../src/lib/material";
import { SITE_PAGES, homeToStored, aboutToStored, careersToStored, evidenceToStored, therapiesToStored } from "../src/blocks/site-pages";

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
  // materials kept at their own address (moved pages, ADR-009): the same conversion, in the shape of a text page
  const { materials } = schema;
  for (const x of await db.select().from(materials).where(and(isNull(materials.blocks), isNotNull(materials.slug)))) {
    await db.update(materials).set({ blocks: pageToStored({ ...materialAsPage(x), slug: x.slug! } as schema.Page) }).where(eq(materials.id, x.id));
    m++;
  }
  // study pages still as imported → «page from a document» with passport and key figures (src/blocks/studies.ts)
  let st = 0;
  for (const p of await db.select().from(pages)) {
    const next = studyPageBlocks(p.slug, p.blocks);
    if (!next) continue;
    await db.update(pages).set({ blocks: next }).where(eq(pages.id, p.id));
    st++;
  }
  for (const x of await db.select().from(materials).where(isNotNull(materials.slug))) {
    const next = studyPageBlocks(x.slug!, x.blocks);
    if (!next) continue;
    await db.update(materials).set({ blocks: next }).where(eq(materials.id, x.id));
    st++;
  }
  // singleton pages: texts from site settings (settings rows stay, for rollback)
  const { siteSettings, sitePages, REGIONS } = schema;
  const settings = new Map((await db.select().from(siteSettings)).map((r) => [r.key, (r.value ?? {}) as Record<string, any>]));
  const have = await db.select({ key: sitePages.key, region: sitePages.region }).from(sitePages);
  let k = 0;
  for (const def of SITE_PAGES) {
    for (const region of def.regional ? REGIONS : [null]) {
      if (have.some((h) => h.key === def.key && h.region === region)) continue;
      const blocks =
        def.key === "home" ? homeToStored(settings.get("home") ?? {})
        : def.key === "about" ? aboutToStored(settings.get("about") ?? {})
        : def.key === "careers" ? careersToStored(settings.get("careers") ?? {})
        : def.key === "evidence" ? evidenceToStored(settings.get("evidence") ?? {}, region!)
        : therapiesToStored(settings.get(`therapies:${region}`) ?? {}, region!);
      await db.insert(sitePages).values({ key: def.key, region, title: def.title, blocks, status: "published" });
      k++;
    }
  }
  console.log(`block lists: ${n} therapy pages, ${m} pages converted, ${st} study pages, ${k} site pages created`);
  await client.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
