import { describe, it, expect } from "vitest";
import { checkBlockPath } from "../../src/blocks/paths";

const blocks = [
  { id: "a", type: "hero", variant: "image", data: { title: "T", eyebrow: "E", imageUrl: null, eyebrowLinks: [] }, source: "regionVersions" },
  {
    id: "b",
    type: "productDetails",
    variant: "pills",
    data: {
      tabs: [
        { id: "overview", label: "Overview", blocks: [{ type: "text", variant: "default", data: { body: "x" } }, { group: "Specs", blocks: [{ type: "specTable", variant: "images", data: { images: ["/a.png"], note: "n" } }] }] },
      ],
    },
  },
  { id: "c", type: "columns", variant: "features", data: { items: [{ title: "One", body: "b" }] } },
  { id: "d", type: "indications", variant: "default", data: { indicationsHtml: "<p>i</p>" } },
];
const ok = (p: string) => checkBlockPath(blocks, p.split("."));

describe("checkBlockPath", () => {
  it("text, media and list items of a section", () => {
    expect(ok("0.data.title")).toMatchObject({ ok: true, type: "hero", kind: "text" });
    expect(ok("0.data.imageUrl")).toMatchObject({ ok: true, kind: "media" });
    expect(ok("2.data.items.0.title")).toMatchObject({ ok: true, type: "columns" });
    expect(ok("3.data.indicationsHtml")).toMatchObject({ ok: true, kind: "rich" });
  });
  it("a declared field that is still empty can be filled, its object created", () => {
    expect(ok("0.data.body").ok).toBe(true);
    expect(ok("0.data.cta.label").ok).toBe(true);
  });
  it("inside product tabs and groups", () => {
    expect(ok("1.data.tabs.0.blocks.0.data.body")).toMatchObject({ ok: true, type: "text" });
    expect(ok("1.data.tabs.0.blocks.1.blocks.0.data.images.0")).toMatchObject({ ok: true, type: "specTable" });
    expect(ok("1.data.tabs.0.blocks.5.data.body").ok).toBe(false);
  });
  it("structure is not writable", () => {
    expect(ok("0.type").ok).toBe(false);
    expect(ok("0.data").ok).toBe(false);
    expect(ok("2.data.items").ok).toBe(false);
    expect(ok("2.data.items.0").ok).toBe(false);
    expect(ok("1.data.tabs.0.label").ok).toBe(false);
  });
  it("unknown keys, indexes out of range and prototype keys are refused", () => {
    expect(ok("0.data.whatever").ok).toBe(false);
    expect(ok("2.data.items.7.title").ok).toBe(false);
    expect(ok("0.data.__proto__.x").ok).toBe(false);
    expect(ok("0.data.constructor").ok).toBe(false);
    expect(ok("9.data.title").ok).toBe(false);
    expect(ok("x.data.title").ok).toBe(false);
  });
  it("keys filled from other records are refused", () => {
    expect(ok("0.data.eyebrowLinks.0.label")).toMatchObject({ ok: false });
  });
});
