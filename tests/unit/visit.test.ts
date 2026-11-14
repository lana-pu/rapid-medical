import { describe, it, expect } from "vitest";
import { isPageLoad } from "../../src/lib/visit";

const h = (x: Record<string, string>) => new Headers(x);

describe("isPageLoad", () => {
  it("opening a page is a visit", () => {
    expect(isPageLoad(h({ "sec-fetch-dest": "document" }))).toBe(true);
    expect(isPageLoad(h({}))).toBe(true); // curl, crawlers without fetch metadata
  });
  it("the router's prefetch and client navigation are not (the page records those itself when it opens)", () => {
    expect(isPageLoad(h({ "sec-fetch-dest": "empty" }))).toBe(false);
    expect(isPageLoad(h({ "sec-fetch-dest": "document", "sec-purpose": "prefetch;prerender" }))).toBe(false);
  });
});
