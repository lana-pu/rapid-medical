import { execSync } from "node:child_process";

/** Fresh seed + known admin password before the suite. */
export default async function globalSetup() {
  const env = { ...process.env, ADMIN_EMAIL: "e2e@rapid-medical.com", ADMIN_PASSWORD: "e2e-password-123456" };
  execSync("npx tsx --env-file=.env scripts/migrate.ts", { stdio: "inherit", env });
  execSync("npx tsx --env-file=.env scripts/seed.ts --reset", { stdio: "inherit", env });
  // seed files reference the Duda CDN; point them back at our media library
  execSync("npx tsx --env-file=.env scripts/migrate-media.ts", { stdio: "inherit", env });
  // pages → block lists (ADR-007), after the media links are in place
  execSync("npx tsx --env-file=.env scripts/migrate-blocks.ts", { stdio: "inherit", env });
  execSync(`psql "${process.env.DATABASE_URL}" -q -c "delete from drafts; delete from revisions; delete from audit_log; delete from sessions; delete from login_attempts; delete from not_found_log; update site_settings set value='{\\"requireApproval\\": false}' where key='workflow'"`, { stdio: "inherit" });
}
