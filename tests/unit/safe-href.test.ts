import { describe, it, expect } from "vitest";
import { safeHref, isExternalHref } from "../../src/lib/safe-path";

/** Links from records reach an href only through safeHref (security review 2026-11-15). */
describe("safeHref", () => {
  it("keeps http(s), mailto, site paths and anchors", () => {
    for (const u of ["https://www.businesswire.com/x", "HTTP://a.com", "mailto:a@b.c", "/news-events", "#past-events"]) expect(safeHref(u)).toBe(u);
  });
  it("drops scripts, data, protocol-relative and backslash links", () => {
    for (const u of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "//evil.com", "/\\evil.com", "https:///evil", "java\tscript:x", null, undefined]) expect(safeHref(u)).toBe("#");
  });
  it("external means an absolute http(s) link", () => {
    expect(isExternalHref("https://a.com")).toBe(true);
    expect(isExternalHref("/x")).toBe(false);
  });
});
