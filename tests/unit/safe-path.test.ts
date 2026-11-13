import { describe, it, expect } from "vitest";
import { safeLocalPath } from "../../src/lib/safe-path";

describe("redirect targets from a request stay on this site", () => {
  it("paths on the site pass", () => {
    for (const p of ["/", "/admin/start", "/us/therapies/lvo?x=1#tab", "/api/editor?on=1&redirect=%2F"]) expect(safeLocalPath(p)).toBe(p);
  });
  it("other sites and tricks fall back", () => {
    for (const p of ["https://evil.com", "//evil.com", "/\\evil.com", "\\\\evil.com", "/admin\\..\\x", "javascript:alert(1)", "evil.com", "", "/\tevil", "/\nx"]) expect(safeLocalPath(p, "/x")).toBe("/x");
    expect(safeLocalPath(null)).toBe("/");
    expect(safeLocalPath(undefined, "/admin")).toBe("/admin");
  });
  it("what the browser would do with the fallback-less ones", () => {
    expect(new URL(safeLocalPath("/\\evil.com"), "https://site.example").host).toBe("site.example");
  });
});
