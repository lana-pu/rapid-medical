import { describe, it, expect } from "vitest";
import { buildPageTree, pageKey } from "../../src/admin/page-tree";

const card = (r: string, id: number, title: string, region: any, path: string) => ({ r, id, title, type: "Page", region, path, status: "live" as const });

describe("page tree", () => {
  const tree = buildPageTree([
    card("site-pages", 1, "Home", null, "/"),
    card("site-pages", 2, "Therapies", "us", "/us/therapies"),
    card("site-pages", 3, "Therapies", "apac", "/apac/therapies"),
    card("solutions", 4, "Large vessel stroke", "apac", "/apac/therapies/lvo"),
    card("solutions", 5, "Large vessel stroke", "us", "/us/therapies/lvo"),
    card("solutions", 6, "Medium vessel stroke", "ous", "/ous/therapies/mvo"),
    card("site-pages", 7, "Careers", null, "/careers"),
    card("pages", 8, "Terms of Use", null, "/terms"),
    card("pages", 9, "DISTALS results", "us", "/us/distals-results"),
  ]);
  it("every page once, its regions as versions, by the site's menu", () => {
    expect(pageKey("/apac/therapies/lvo")).toBe("/therapies/lvo");
    expect(tree.map((n) => n.key)).toEqual(["/", "/therapies", "/webinars", "/news-events", "/careers", "/contact-us", "other"]);
    const t = tree[1];
    expect(t.versions.map((v) => v.region)).toEqual(["us", "apac"]);
    expect(t.children.map((c) => c.title)).toEqual(["Large vessel stroke", "Medium vessel stroke"]);
    expect(t.children[0].versions.map((v) => v.region)).toEqual(["us", "apac"]);
  });
  it("list pages stand where they are on the site; text pages under Other pages", () => {
    expect(tree.find((n) => n.key === "/careers")!.children.map((c) => c.key)).toEqual(["/open-positions"]);
    expect(tree.find((n) => n.key === "/webinars")!.fieldsOnly).toBe(true);
    expect(tree.find((n) => n.key === "other")!.children.map((c) => c.title)).toEqual(["DISTALS results", "Terms of Use"]);
  });
});
