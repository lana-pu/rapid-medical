import { describe, it, expect } from "vitest";
import { sourceOf, hostOf } from "../../src/lib/source";

describe("where a visit or a request came from", () => {
  it("LinkedIn by UTM or by referrer", () => {
    expect(sourceOf({ utm_source: "linkedin" })).toBe("LinkedIn");
    expect(sourceOf({ referrer: "https://www.linkedin.com/feed/" })).toBe("LinkedIn");
    expect(sourceOf({ referrer: "https://lnkd.in/abc" })).toBe("LinkedIn");
  });
  it("search, email, campaigns, other sites, direct", () => {
    expect(sourceOf({ referrer: "https://www.google.com/" })).toBe("Google");
    expect(sourceOf({ referrer: "https://www.bing.com/search?q=x" })).toBe("Other search engines");
    expect(sourceOf({ utm_source: "mailchimp", utm_medium: "email" })).toBe("Email");
    expect(sourceOf({ utm_source: "esmint2026" })).toBe("Campaign: esmint2026");
    expect(sourceOf({ referrer: "https://www.esmint.eu/program" })).toBe("esmint.eu");
    expect(sourceOf({ referrer: "(direct)" })).toBe("Direct");
    expect(sourceOf({})).toBe("Direct");
    expect(hostOf("not a url")).toBeNull();
  });
});
