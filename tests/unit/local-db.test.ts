import { describe, expect, it } from "vitest";
import { assertResettable, databaseHost, isLocalDatabase } from "../../scripts/local-db";

describe("wiping a database is for test databases only (security check 2026-11-17)", () => {
  it("reads the host of a postgres address", () => {
    expect(databaseHost("postgres://u:p@127.0.0.1:55432/rapid_medical")).toBe("127.0.0.1");
    expect(databaseHost("postgres://u:p@ep-cool-1234.eu-central-1.aws.neon.tech/neondb?sslmode=require")).toBe("ep-cool-1234.eu-central-1.aws.neon.tech");
    expect(databaseHost("not a url")).toBeNull();
  });
  it("local: this machine and the docker-compose db service", () => {
    for (const u of ["postgres://u@localhost/x", "postgres://u@127.0.0.1:5432/x", "postgres://u@[::1]:5432/x", "postgres://u@db:5432/x"]) expect(isLocalDatabase(u)).toBe(true);
    expect(isLocalDatabase("postgres://u@ep-cool-1234.neon.tech/x")).toBe(false);
    expect(isLocalDatabase(undefined)).toBe(false);
  });
  it("a remote database is refused unless CI or ALLOW_DB_RESET=1", () => {
    const neon = "postgres://u:p@ep-cool-1234.neon.tech/neondb";
    expect(() => assertResettable(neon, "seed --reset", {})).toThrow(/not a local one/);
    expect(() => assertResettable(neon, "seed --reset", { CI: "true" })).not.toThrow();
    expect(() => assertResettable(neon, "seed --reset", { ALLOW_DB_RESET: "1" })).not.toThrow();
    expect(() => assertResettable("postgres://u@127.0.0.1/x", "seed --reset", {})).not.toThrow();
  });
});
