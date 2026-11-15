import { describe, expect, it } from "vitest";
import { subscribers, whereTo } from "@/lib/subscribers";

const row = (email: string, at: string, over: Partial<Parameters<typeof subscribers>[0][number]> = {}) => ({
  email, firstName: "A", lastName: "B", organization: "", country: "", region: "", form: "contact", optIn: true, status: "new", createdAt: new Date(at), ...over,
});

describe("subscribers (the Mailchimp list)", () => {
  it("keeps one row per person, the latest request, case-insensitive", () => {
    const out = subscribers([row("Ann@x.com", "2026-11-01", { firstName: "Old" }), row("ann@x.com", "2026-11-10", { firstName: "New" }), row("bob@x.com", "2026-11-05")]);
    expect(out.map((r) => r.firstName + r.email)).toEqual(["Newann@x.com", "Abob@x.com"]);
  });
  it("leaves out unticked boxes and spam", () => {
    expect(subscribers([row("a@x.com", "2026-11-01", { optIn: false }), row("b@x.com", "2026-11-01", { status: "spam" })])).toEqual([]);
  });
});

describe("whereTo", () => {
  it("names a link by its site and an email by its address", () => {
    expect(whereTo("https://www.sparkhire.com/jobs/1")).toBe("sparkhire.com");
    expect(whereTo("mailto:hr@rapid-medical.com?subject=x")).toBe("hr@rapid-medical.com");
    expect(whereTo("hr@rapid-medical.com")).toBe("hr@rapid-medical.com");
  });
  it("is null for nothing or nonsense", () => {
    expect(whereTo("")).toBeNull();
    expect(whereTo(null)).toBeNull();
    expect(whereTo("not a link")).toBeNull();
  });
});
