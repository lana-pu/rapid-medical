import { describe, expect, it } from "vitest";
import { regionForCountry } from "@/lib/regions";
import { groupForSlug, groupTherapies } from "@/lib/therapy-groups";

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
