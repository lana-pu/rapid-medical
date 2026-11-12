import { execSync } from "node:child_process";
import type { Page } from "@playwright/test";

export const ADMIN = { email: "e2e@rapid-medical.com", password: "e2e-password-123456" };
/** Two-step sign-in is mandatory: every test person has this authenticator key (set in global-setup / when created). */
export const TOTP_SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
/** SQL columns that give a test person two-step sign-in with TOTP_SECRET. */
export const TWO_STEP_SQL = `totp_secret='${TOTP_SECRET}', totp_enabled_at=now()`;

export function sql(q: string): string {
  return execSync(`psql "${process.env.DATABASE_URL}" -t -A -c "${q.replace(/"/g, '\\"')}"`).toString().trim();
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
