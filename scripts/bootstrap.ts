/**
 * First-run bootstrap used by the Docker image (and handy locally):
 *   1. wait for Postgres
 *   2. apply migrations
 *   3. if the database has no content yet → seed it, link the media library, generate image variants
 *   4. convert pages to block lists (ADR-007), idempotent
 *
 *   npx tsx --env-file=.env scripts/bootstrap.ts
 */
import { execSync } from "node:child_process";
import postgres from "postgres";

async function waitForDb(url: string) {
  for (let i = 1; i <= 60; i++) {
    const sql = postgres(url, { max: 1, connect_timeout: 3 });
    try {
      await sql`select 1`;
      await sql.end();
      return;
    } catch {
      await sql.end().catch(() => {});
      if (i === 1) console.log("waiting for database…");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error(`Database not reachable at ${url.replace(/:[^:@/]+@/, ":***@")}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  await waitForDb(url);

  const run = (cmd: string) => execSync(cmd, { stdio: "inherit", env: process.env });
  run("npx tsx scripts/migrate.ts");

  const sql = postgres(url, { max: 1 });
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from solutions`;
  const [{ u }] = await sql<{ u: number }[]>`select count(*)::int as u from users`;
  await sql.end();

  if (n === 0) {
    console.log("empty database → seeding content from content/seed");
    run("npx tsx scripts/seed.ts");
    run("npx tsx scripts/migrate-media.ts"); // links seeded content to the media snapshot; downloads only what is missing
  } else {
    console.log(`database already has content (${n} therapy pages) – skipping seed`);
    if (u === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) run("npx tsx scripts/seed.ts");
  }
  run("npx tsx scripts/migrate-blocks.ts"); // pages → block lists (ADR-007); converts only what is not converted yet
  if (process.env.ADMIN_EMAIL) console.log(`admin login: ${process.env.ADMIN_EMAIL} (password from ADMIN_PASSWORD)`);
  console.log("bootstrap done");
}
main().catch((e) => { console.error(e); process.exit(1); });
