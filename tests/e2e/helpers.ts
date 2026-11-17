import { execFileSync, execSync } from "node:child_process";
import type { Page } from "@playwright/test";

export const ADMIN = { email: "e2e@rapid-medical.com", password: "e2e-password-123456" };
/** Two-step sign-in is mandatory: every test person has this authenticator key (set in global-setup / when created). */
export const TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
/** SQL columns that give a test person two-step sign-in with TOTP_SECRET. */
export const TWO_STEP_SQL = `totp_secret='${TOTP_SECRET}', totp_enabled_at=now()`;

/**
 * Runs SQL against the test database and returns what `psql -t -A` would print (rows by line, columns by «|»,
 * true/false as t/f, null empty; several statements → the last one's rows). Through the site's own driver in a child
 * process, so it stays synchronous for the tests and needs no psql on the machine.
 */
const RUN_SQL = `
const postgres = require("postgres");
let q = ""; process.stdin.on("data", (d) => (q += d)).on("end", async () => {
  const db = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    let res = await db.unsafe(q);
    if (res.length && Array.isArray(res[0])) res = res[res.length - 1];
    const cell = (v) => v === null || v === undefined ? "" : v === true ? "t" : v === false ? "f" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
    process.stdout.write(res.map((r) => Object.values(r).map(cell).join("|")).join("\\n"));
  } catch (e) { process.stderr.write(String(e && e.message || e)); process.exitCode = 1; }
  finally { await db.end(); }
});`;

export function sql(q: string): string {
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env");
  return execFileSync(process.execPath, ["-e", RUN_SQL], { input: q, env: process.env }).toString().trim();
}

export async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto("/admin/login");
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL((u) => u.pathname.startsWith("/admin") && u.pathname !== "/admin/login");
  if (new URL(page.url()).pathname === "/admin/login/2fa") {
    await freshCodeWindow(page);
    await page.fill("input[name=code]", totp(TOTP_SECRET));
    await page.click('button:has-text("Verify")');
    await page.waitForURL((u) => u.pathname.startsWith("/admin") && !u.pathname.startsWith("/admin/login"));
  }
}

/** A code made in the last seconds of its 30-second window may be stale by the time it is checked: wait for a new one. */
export async function freshCodeWindow(page: Page) {
  const into = (Date.now() / 1000) % 30;
  if (into > 26) await page.waitForTimeout((30 - into + 0.5) * 1000);
}

export function totp(secret: string): string {
  return execSync(`node -e "require('otplib').generate({secret:'${secret}'}).then(t=>process.stdout.write(t))"`).toString().trim();
}

/** Page editor: Publish → «Review changes» → Publish now → «Live now». */
export async function publishFromEditor(page: Page) {
  await page.click('#rm-editor-ui button:has-text("Publish")');
  await page.click('[role=dialog] button:has-text("Publish now")');
  await page.locator('[role=dialog][aria-label="Live now"]').waitFor();
  await page.click('[role=dialog] button:has-text("Keep editing")');
}
