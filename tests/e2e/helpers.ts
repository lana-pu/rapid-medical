import { execSync } from "node:child_process";
import type { Page } from "@playwright/test";

export const ADMIN = { email: "e2e@rapid-medical.com", password: "e2e-password-123456" };

export function sql(q: string): string {
  return execSync(`psql "${process.env.DATABASE_URL}" -t -A -c "${q.replace(/"/g, '\\"')}"`).toString().trim();
}

export async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto("/admin/login");
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", password);
  await page.click('button:has-text("Sign in")');
  await page.waitForURL((u) => u.pathname.startsWith("/admin") && !u.pathname.startsWith("/admin/login"));
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
