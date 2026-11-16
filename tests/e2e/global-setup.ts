import { execSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

/** Fresh seed + known admin password before the suite. */
export default async function globalSetup() {
  const env = { ...process.env, ADMIN_EMAIL: "e2e@rapid-medical.com", ADMIN_PASSWORD: "e2e-password-123456" };
  execSync("npx tsx --env-file=.env scripts/migrate.ts", { stdio: "inherit", env });
  execSync("npx tsx --env-file=.env scripts/seed.ts --reset", { stdio: "inherit", env });
  // seed files reference the Duda CDN; point them back at our media library
  execSync("npx tsx --env-file=.env scripts/migrate-media.ts", { stdio: "inherit", env });
  // pages → block lists (ADR-007), after the media links are in place
  execSync("npx tsx --env-file=.env scripts/migrate-blocks.ts", { stdio: "inherit", env });
  // files uploaded by earlier runs (e2e-…): out of the media library and off the disk, so the library shows the site's
  // own pictures first (UX walk 2026-11-14). Nothing references them after the reset above.
  // through the site's own driver: psql is not on every machine, and DATABASE_URL lives in .env, not in this process
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env");
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
  const uploads = join(process.cwd(), "public", "uploads");
  // a test PDF also leaves its pages drawn as pictures: their folders go by the row's own URLs (folder names carry ids
  // of the database that drew them, so a fresh database may reuse the number)
  const gone = await sql<{ pages: { variants: { url: string }[] }[] }[]>`delete from media where filename like 'e2e-%' returning pages`;
  const dirs = new Set(gone.flatMap((r) => r.pages.flatMap((p) => p.variants.map((v) => /^\/uploads\/(pages\/[^/]+)\//.exec(v.url)?.[1]))));
  for (const d of dirs) if (d && existsSync(join(uploads, d))) rmSync(join(uploads, d), { recursive: true });
  for (const dir of readdirSync(uploads, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const f of readdirSync(join(uploads, dir.name))) if (f.startsWith("e2e-")) rmSync(join(uploads, dir.name, f));
  }
  await sql.unsafe("delete from page_views; delete from drafts; delete from revisions; delete from audit_log; delete from sessions; delete from login_attempts; delete from not_found_log; delete from site_settings where key='workflow'; update users set totp_secret='JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', totp_enabled_at=now(), recovery_codes='[]' where email='e2e@rapid-medical.com'");
  await sql.end();
}
