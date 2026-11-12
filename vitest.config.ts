import path from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "tests/unit/server-only-stub.ts") } },
  // a placeholder URL: block modules import the db client, unit tests never query it
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node", env: { DATABASE_URL: "postgres://unit@127.0.0.1:1/none" } },
});
