import { defineConfig } from "@playwright/test";
import { E2E_CRON_SECRET } from "./tests/e2e/secrets";

/**
 * E2E tests run against a production build on a scratch database.
 *   npm run test:e2e        (expects DATABASE_URL + AUTH_SECRET in .env, seeds the DB itself)
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1, // tests share one database
  // a save refreshes the page from the server; on a laptop under a full run that took over 5 s now and then (2026-11-16)
  expect: { timeout: 10_000 },
  use: { baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100", trace: "retain-on-failure" },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npx next start -p 3100",
        env: { CRON_SECRET: E2E_CRON_SECRET },
        url: "http://localhost:3100/api/health",
        timeout: 240_000,
        reuseExistingServer: true,
      },
  globalSetup: "./tests/e2e/global-setup.ts",
});
