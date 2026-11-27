import { describe, expect, it } from "vitest";
import { regionForCountry } from "@/lib/regions";
import { groupForSlug, groupTherapies } from "@/lib/therapy-groups";
import { recipientFor, routingOf, isEmailList, TOPIC } from "@/lib/contact-topics";

describe("regionForCountry", () => {
  it("maps real countries", () => {
    expect(regionForCountry("us")).toBe("us");
    expect(regionForCountry("IL")).toBe("apac");
    expect(regionForCountry("DE")).toBe("ous");
  });
  it("unknown country → no region (the visitor gets the location chooser)", () => {
    for (const cc of [null, undefined, "", "XX", "T1", "A1", "EU", "ZZ", "USA"]) expect(regionForCountry(cc)).toBeNull();
  });
});

describe("therapy groups", () => {
  it("default group by slug", () => {
    expect(groupForSlug("mvo")).toBe("ischemic");
    expect(groupForSlug("vasospasm")).toBe("hemorrhagic");
    expect(groupForSlug("hyperdrive")).toBe("access");
    expect(groupForSlug("other")).toBe("");
  });
  it("buckets in menu order, ungrouped last, empty groups dropped", () => {
    const g = groupTherapies([{ therapyGroup: "access" }, { therapyGroup: "" }, { therapyGroup: "ischemic" }]);
    expect(g.map((x) => x.value)).toEqual(["ischemic", "access", ""]);
  });
});


describe("contact routing", () => {
  const s = { ordersEmailInc: "inc@x.com", ordersEmailLtd: "ltd@x.com", ordersEmailCanada: "ca@x.com", ifuEmail: "ifu@x.com" };
  const d = (topic: string, region = "", country = "", form = "contact") => ({ form, topic, region, country });
  it("orders by region, Canada separately; IFU to its box; the rest to MAIL_TO", () => {
    expect(recipientFor(d(TOPIC.orders, "Americas"), s)).toBe("inc@x.com");
    expect(recipientFor(d(TOPIC.orders, "Americas", "Canada"), s)).toBe("ca@x.com");
    expect(recipientFor(d(TOPIC.orders, "Europe"), s)).toBe("ltd@x.com");
    expect(recipientFor(d(TOPIC.ifu, "Asia Pacific"), s)).toBe("ifu@x.com");
    expect(recipientFor(d(TOPIC.demo, "Americas"), s)).toBeUndefined();
    expect(recipientFor(d(TOPIC.orders, "Americas", "", "webinar"), s)).toBeUndefined();
  });
  it("an empty or broken address falls back to MAIL_TO", () => {
    expect(recipientFor(d(TOPIC.ifu), { ifuEmail: "not an email" })).toBeUndefined();
    expect(recipientFor(d(TOPIC.orders, "Europe"), {})).toBeUndefined();
  });
  // Settings → Where requests go (docs/screens/admin-settings.md, 2026-11-27)
  const main = { mainEmailAmericas: "usa@x.com", mainEmail: "intl@x.com" };
  it("every topic and form has its own box; empty → the main address of the visitor's region", () => {
    expect(recipientFor(d(TOPIC.demo, "Americas"), { ...main, demoEmail: "demo@x.com" })).toBe("demo@x.com");
    expect(recipientFor(d(TOPIC.demo, "Americas"), main)).toBe("usa@x.com");
    expect(recipientFor(d(TOPIC.investors, "Europe"), main)).toBe("intl@x.com");
    expect(recipientFor(d(TOPIC.orders, "Europe"), main)).toBe("intl@x.com");
    expect(recipientFor(d("", "", "", "careers"), { ...main, careersEmail: "hr@x.com" })).toBe("hr@x.com");
    expect(recipientFor(d("Some webinar", "Americas", "", "webinar"), main)).toBe("usa@x.com");
    expect(recipientFor(d("A topic we do not know", "Europe"), { ...main, otherEmail: "other@x.com" })).toBe("other@x.com");
  });
  it("one main address covers both regions; several addresses are kept, broken ones dropped", () => {
    expect(recipientFor(d(TOPIC.support, "Americas"), { mainEmail: "intl@x.com" })).toBe("intl@x.com");
    expect(recipientFor(d(TOPIC.support, "Europe"), { mainEmailAmericas: "usa@x.com" })).toBe("usa@x.com");
    expect(recipientFor(d(TOPIC.ifu), { ifuEmail: "a@x.com, b@y.com; nonsense" })).toBe("a@x.com, b@y.com");
    expect(isEmailList("a@x.com, b@y.com")).toBe(true);
    expect(isEmailList("a@x.com, nonsense")).toBe(false);
    expect(isEmailList("")).toBe(true);
  });
  it("reads the old Contact details addresses until Where requests go is saved", () => {
    const r = routingOf({ ifuEmail: "new@x.com" }, { ifuEmail: "old@x.com", ordersEmailInc: "inc@x.com", phoneHq: "+1" });
    expect(r).toEqual({ ifuEmail: "new@x.com", ordersEmailInc: "inc@x.com" });
  });
});
