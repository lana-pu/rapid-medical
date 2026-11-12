/**
 * Seeds the database from content/seed/*.
 *
 *   npx tsx --env-file=.env scripts/seed.ts            # upsert content, keep users/submissions
 *   npx tsx --env-file=.env scripts/seed.ts --reset    # wipe content tables first
 *   ADMIN_EMAIL=you@x.com ADMIN_PASSWORD=... npx tsx --env-file=.env scripts/seed.ts
 */
import { readFile } from "node:fs/promises";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { markdownToHtml } from "../src/lib/html";
import { SOLUTIONS } from "../content/seed/solutions";
import { groupForSlug } from "../src/lib/therapy-groups";
import { SETTINGS, PRODUCTS, REDIRECTS, WEBINARS } from "../content/seed/settings";
import { EVENTS, UNDATED_EVENT_PATHS } from "../content/seed/events";

const RESET = process.argv.includes("--reset");

async function json<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(`content/seed/${name}.json`, "utf8")) as T;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });
  const { products, solutions, publications, newsItems, teamMembers, pages, siteSettings, redirects, users, webinars, events } = schema;

  if (RESET) {
    await db.execute(sql`TRUNCATE solutions, publications, news_items, webinars, team_members, jobs, pages, site_pages, redirects RESTART IDENTITY CASCADE`);
    console.log("content tables truncated");
  }

  /* products */
  for (const p of PRODUCTS) {
    const row = { ...p, regions: p.regions as schema.Region[], aliases: p.aliases as schema.Product["aliases"] };
    await db.insert(products).values(row).onConflictDoUpdate({ target: products.slug, set: row });
  }
  const prodRows = await db.select().from(products);
  const prodId = (slug: string | null | undefined) => prodRows.find((p) => p.slug === slug)?.id ?? null;

  /* settings */
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.insert(siteSettings).values({ key, value }).onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  }

  /* webinars */
  if (!RESET) await db.delete(webinars);
  await db.insert(webinars).values(WEBINARS.map((w) => ({ title: w.title, speaker: w.speaker, event: w.event ?? "", productId: prodId(w.product), sortOrder: w.sortOrder, regions: [], status: "published" as const })));

  /* solutions */
  for (const s of SOLUTIONS) {
    const { product, heroCta, ...rest } = s;
    const row: schema.NewSolution = { ...rest, therapyGroup: groupForSlug(rest.slug), regulatoryHtml: markdownToHtml(rest.regulatoryHtml), referencesHtml: markdownToHtml(rest.referencesHtml), productId: prodId(product), heroCta: heroCta ?? null, status: "published" };
    await db
      .insert(solutions)
      .values(row)
      .onConflictDoUpdate({ target: [solutions.slug, solutions.region], set: { ...row, updatedAt: new Date() } });
  }

  /* publications */
  type PubSeed = { title: string; authors: string; journal: string; doi: string | null; url: string | null; pdfUrl: string | null; publishedOn: string; product: string; variant: string | null; regions: schema.Region[]; featured: boolean; imageUrl: string | null };
  const pubs = await json<PubSeed[]>("publications");
  if (!RESET) await db.delete(publications);
  await db.insert(publications).values(
    pubs.map((p) => ({
      title: p.title, authors: p.authors, journal: p.journal, doi: p.doi, url: p.url, pdfUrl: p.pdfUrl,
      publishedOn: new Date(p.publishedOn), productId: prodId(p.product), regions: p.regions, featured: p.featured, imageUrl: p.imageUrl, status: "published" as const,
    })),
  );

  /* news */
  type NewsSeed = { title: string; publishedOn: string; url: string; source: string; imageUrl: string | null; featured: boolean };
  const news = await json<NewsSeed[]>("news");
  if (!RESET) await db.delete(newsItems);
  await db.insert(newsItems).values(news.map((n) => ({ ...n, publishedOn: new Date(n.publishedOn), status: "published" as const })));

  /* team */
  type TeamSeed = { slug: string; name: string; title: string; longTitle: string; bioMd: string; photoUrl: string | null; sortOrder: number };
  for (const t of await json<TeamSeed[]>("team")) {
    const { bioMd, ...member } = t;
    const tt = { ...member, bioHtml: markdownToHtml(bioMd) };
    await db.insert(teamMembers).values({ ...tt, status: "published" }).onConflictDoUpdate({ target: teamMembers.slug, set: { ...tt, updatedAt: new Date() } });
  }

  /* pages */
  type PageSeed = { slug: string; region: schema.Region | null; title: string; metaTitle: string; metaDescription: string; noindex: boolean; bodyMd: string; status?: "draft" | "published" };
  for (const p of await json<PageSeed[]>("pages")) {
    const existing = await db.query.pages.findFirst({ where: p.region ? sql`${pages.slug} = ${p.slug} AND ${pages.region} = ${p.region}` : sql`${pages.slug} = ${p.slug} AND ${pages.region} IS NULL` });
    const { bodyMd, ...page } = p;
    const pp = { ...page, bodyHtml: markdownToHtml(bodyMd) };
    if (existing) await db.update(pages).set({ ...pp, updatedAt: new Date() }).where(eq(pages.id, existing.id));
    else await db.insert(pages).values({ ...pp, status: pp.status ?? "published" });
  }

  /* media library snapshot (rows + variants/posters) – only rows not present yet */
  try {
    const snap = await json<Omit<schema.Media, "id" | "createdAt">[]>("media");
    const have = new Set((await db.select({ url: schema.media.url }).from(schema.media)).map((r) => r.url));
    const fresh = snap.filter((m) => !have.has(m.url));
    for (let i = 0; i < fresh.length; i += 50) await db.insert(schema.media).values(fresh.slice(i, i + 50));
    console.log(`media: ${fresh.length} rows added from snapshot (${have.size} already present)`);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }

  /* events (Duda event pages) + their old URLs */
  for (const { from, startsOn, endsOn, ...e } of EVENTS) {
    const row: schema.NewEvent = { ...e, startsOn: new Date(startsOn), endsOn: endsOn ? new Date(endsOn) : null };
    await db.insert(events).values(row).onConflictDoUpdate({ target: events.slug, set: { ...row, updatedAt: new Date() } });
    await db.insert(redirects).values({ from, to: `/events/${e.slug}` }).onConflictDoUpdate({ target: redirects.from, set: { to: `/events/${e.slug}` } });
  }
  for (const from of UNDATED_EVENT_PATHS) {
    await db.insert(redirects).values({ from, to: "/news-events" }).onConflictDoUpdate({ target: redirects.from, set: { to: "/news-events" } });
  }

  /* redirects */
  for (const r of REDIRECTS) {
    await db.insert(redirects).values(r).onConflictDoUpdate({ target: redirects.from, set: { to: r.to } });
  }

  /* first admin user */
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const hash = await bcrypt.hash(password, 12);
    await db.insert(users).values({ email: email.toLowerCase(), name: "Admin", role: "admin", passwordHash: hash }).onConflictDoUpdate({ target: users.email, set: { passwordHash: hash, active: true } });
    console.log(`admin user ${email} ready`);
  }

  console.log(`seeded: ${SOLUTIONS.length} solutions, ${pubs.length} publications, ${news.length} news, redirects ${REDIRECTS.length}`);
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
