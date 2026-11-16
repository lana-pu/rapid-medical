import { describe, expect, it } from "vitest";
import { parseForm } from "../../src/admin/engine";
import { getResource } from "../../src/admin/resources";

describe("a page's region is fixed once created (security review 2026-11-15)", () => {
  const res = getResource("solutions")!;
  const form = (extra: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ navLabel: "Large vessel stroke", slug: "lvo", region: "apac", ...extra })) fd.set(k, v);
    return fd;
  };
  it("an existing page: a region sent by the form is not taken (the server keeps the current one)", () => {
    const { data, errors } = parseForm(res, form({ __id: "1" }));
    expect("region" in data).toBe(false);
    expect(errors.region).toBeUndefined();
  });
  it("a new page: the region is chosen", () => {
    expect(parseForm(res, form({})).data.region).toBe("apac");
  });
});
