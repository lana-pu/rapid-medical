/**
 * Wiping a database is for test databases only (security check 2026-11-17, N.2): `seed --reset` and the e2e setup
 * truncate content, and the e2e setup also creates an admin whose password and two-step key are in this public repo.
 * They run only when the database is on this machine (localhost, 127.0.0.1, ::1, or the `db` service of
 * docker-compose) or in CI; anything else needs ALLOW_DB_RESET=1 set on purpose.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "db"]);

/** The database host of a postgres:// address, or null when it cannot be read. Exported for tests. */
export function databaseHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function isLocalDatabase(url: string | undefined): boolean {
  const host = databaseHost(url);
  return !!host && LOCAL_HOSTS.has(host);
}

/** Throws unless wiping `url` is allowed: a local database, CI, or ALLOW_DB_RESET=1. */
export function assertResettable(url: string | undefined, what: string, env: Record<string, string | undefined> = process.env): void {
  if (isLocalDatabase(url) || env.CI === "true" || env.ALLOW_DB_RESET === "1") return;
  throw new Error(
    `${what} wipes the database, and «${databaseHost(url) ?? "?"}» is not a local one. Point DATABASE_URL at a test database, or set ALLOW_DB_RESET=1 if this really is one.`,
  );
}
