import { describe, expect, it } from "vitest";
import { regionForCountry } from "@/lib/regions";
import { groupForSlug, groupTherapies } from "@/lib/therapy-groups";
import { recipientFor, TOPIC } from "@/lib/contact-topics";

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
});
