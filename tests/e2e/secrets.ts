/** Test-only values shared by the Playwright config and the tests (not real secrets). */

/** The scheduler endpoint needs its secret in production mode; the test server gets this one, the tests send it. */
export const E2E_CRON_SECRET = "e2e-cron-secret-0123456789abcdef";
