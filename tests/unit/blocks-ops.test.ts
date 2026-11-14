/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import type { StoredBlock } from "../../src/db/schema";
import { applyOp, selectAfterOp, variantsFor } from "../../src/blocks/ops";
import { describeBlockChanges, compareBlocks } from "../../src/blocks/diff";
import { PRESETS, templateBlocks } from "../../src/blocks/templates";

const page: StoredBlock[] = [
  { id: "h", type: "hero", variant: "image", data: { title: "Hello" } },
  { id: "t", type: "text", variant: "default", data: { body: "One" } },
  { id: "c", type: "cta", variant: "band", data: { title: "Questions?" } },
  { id: "i", type: "indications", variant: "default", data: { indicationsHtml: "<p>x</p>" } },
];
const ids = (l: StoredBlock[]) => l.map((b) => b.id).join(",");

describe("section operations", () => {
  it("add a preset at a position; after the pinned block it lands before it", () => {
    const next = applyOp(page, { op: "add", at: 1, type: "keyNumbers", variant: PRESETS.find((p) => p.type === "keyNumbers")!.variant });
    expect(next[1].type).toBe("keyNumbers");
    expect(next[1].id).toMatch(/^[0-9a-f]{10}$/);
    const end = applyOp(page, { op: "add", at: 4, type: "text", variant: "default" });
    expect(end.map((b) => b.type)).toEqual(["hero", "text", "cta", "text", "indications"]);
  });
  it("only presets can be added", () => {
    expect(() => applyOp(page, { op: "add", at: 0, type: "form", variant: "default" })).toThrow(/not available/);
    expect(() => applyOp(page, { op: "add", at: 0, type: "indications", variant: "default" })).toThrow(/not available/);
    expect(() => applyOp(page, { op: "add", at: 9, type: "text", variant: "default" })).toThrow(/position/);
  });
  it("move, copy, remove", () => {
    expect(ids(applyOp(page, { op: "move", id: "t", dir: -1 }))).toBe("t,h,c,i");
    expect(() => applyOp(page, { op: "move", id: "c", dir: 1 })).toThrow(/last/);
    expect(() => applyOp(page, { op: "move", id: "h", dir: -1 })).toThrow(/first/);
    const copy = applyOp(page, { op: "duplicate", id: "t" });
    expect(copy[2]).toMatchObject({ type: "text", data: { body: "One" } });
    expect(copy[2].id).not.toBe("t");
    expect(ids(applyOp(page, { op: "remove", id: "t" }))).toBe("h,c,i");
  });
  it("the regulatory block stays", () => {
    expect(() => applyOp(page, { op: "remove", id: "i" })).toThrow(/required/);
    expect(() => applyOp(page, { op: "move", id: "i", dir: -1 })).toThrow(/end/);
    expect(() => applyOp(page, { op: "duplicate", id: "i" })).toThrow(/cannot/);
  });
  it("layout changes only between presets of the same block", () => {
    expect(applyOp(page, { op: "variant", id: "t", variant: "lead" })[1].variant).toBe("lead");
    expect(() => applyOp(page, { op: "variant", id: "t", variant: "nope" })).toThrow(/not available/);
    expect(variantsFor("text").length).toBeGreaterThan(1);
  });
  it("a section that is gone gives a clear message", () => {
    expect(() => applyOp(page, { op: "remove", id: "zzz" })).toThrow(/no longer on the page/);
  });
  it("undo puts back an earlier list, but only with content the page had", () => {
    const removed = applyOp(page, { op: "remove", id: "t" });
    expect(ids(applyOp(removed, { op: "set", blocks: page }, page))).toBe("h,t,c,i");
    const forged = page.map((b) => (b.id === "t" ? { ...b, data: { body: "<script>" } } : b));
    expect(() => applyOp(removed, { op: "set", blocks: forged }, page)).toThrow(/History/);
    expect(() => applyOp(page, { op: "set", blocks: page.slice(0, 3) }, page)).toThrow(/required/);
  });
});

describe("changes in words", () => {
  it("added, removed, moved, layout and text", () => {
    const after = applyOp(applyOp(page, { op: "move", id: "t", dir: -1 }), { op: "remove", id: "c" });
    after[0] = { ...after[0], variant: "lead", data: { body: "Two" } };
    after.splice(2, 0, { id: "n", type: "keyNumbers", variant: "default", data: {} });
    const words = describeBlockChanges(page, after);
    expect(words).toContain("Added section Key numbers");
    expect(words).toContain("Removed section Call to action “Questions?”");
    expect(words.some((w) => w.startsWith("Changed layout of Text"))).toBe(true);
    expect(words.some((w) => /^Changed text in Text/.test(w))).toBe(true);
    expect(words.filter((w) => w.startsWith("Moved")).length).toBe(1);
  });
  it("nothing changed → nothing to say", () => {
    expect(describeBlockChanges(page, JSON.parse(JSON.stringify(page)))).toEqual([]);
  });
});

describe("compare regions", () => {
  it("matches sections by type in order", () => {
    const other: StoredBlock[] = [
      { id: "x1", type: "hero", variant: "image", data: { title: "Hello" } },
      { id: "x3", type: "cta", variant: "band", data: { title: "Other" } },
      { id: "x4", type: "indications", variant: "default", data: { indicationsHtml: "<p>x</p>" } },
    ];
    expect(compareBlocks(page, other)).toEqual(["same", "onlyHere", "different", "same"]);
  });
});

describe("templates", () => {
  it("every template is a valid list of known blocks with the pinned block last", () => {
    for (const id of ["text", "landing", "therapy"] as const) {
      const l = templateBlocks(id, "New page");
      expect(l.length).toBeGreaterThan(1);
      expect(new Set(l.map((b) => b.id)).size).toBe(l.length);
    }
    expect(templateBlocks("therapy", "X").at(-1)?.type).toBe("indications");
  });
});

describe("sections inside Product details tabs", () => {
  const txt = (body: string) => ({ type: "text", variant: "default", data: { body } });
  const pd: StoredBlock[] = [
    { id: "h", type: "hero", variant: "image", data: { title: "Hello" } },
    {
      id: "pd",
      type: "productDetails",
      variant: "pills",
      data: {
        tabs: [
          { id: "o", label: "Overview", blocks: [txt("A"), { group: "Specifications", blocks: [txt("S1"), txt("S2")] }, txt("B")] },
          { id: "h", label: "How", blocks: [txt("Only")] },
          { id: "e", label: "Evidence", href: "/x", blocks: [] },
        ],
      },
    },
  ];
  const tab = (l: StoredBlock[], t: number) => ((l[1].data as any).tabs[t].blocks as any[]).map((x) => ("group" in x ? `[${x.blocks.map((n: any) => n.data.body).join(",")}]` : x.data.body)).join(" ");

  it("add only nestable presets, at a position in a tab or a group", () => {
    const next = applyOp(pd, { op: "add", at: 1, type: "keyNumbers", variant: PRESETS.find((p) => p.type === "keyNumbers")!.variant, in: "pd/0" });
    expect(((next[1].data as any).tabs[0].blocks[1] as any).type).toBe("keyNumbers");
    expect((next[1].data as any).tabs[0].blocks[1].id).toBeUndefined();
    const inGroup = applyOp(pd, { op: "add", at: 2, type: "text", variant: "default", in: "pd/0/1" });
    expect((inGroup[1].data as any).tabs[0].blocks[1].blocks).toHaveLength(3);
    expect(() => applyOp(pd, { op: "add", at: 0, type: "hero", variant: PRESETS.find((p) => p.type === "hero")!.variant, in: "pd/0" })).toThrow(/inside a tab/);
    expect(() => applyOp(pd, { op: "add", at: 0, type: "text", variant: "default", in: "pd/2" })).toThrow(/no sections/);
    expect(() => applyOp(pd, { op: "add", at: 0, type: "text", variant: "default", in: "h/0" })).toThrow(/cannot be added/);
    expect(() => applyOp(pd, { op: "add", at: 9, type: "text", variant: "default", in: "pd/0" })).toThrow(/position/);
    expect(pd[1].data).toEqual(structuredClone(pd[1].data)); // the input is not changed
  });
  it("move, copy, remove inside a tab and inside a group", () => {
    expect(tab(applyOp(pd, { op: "move", id: "pd/0/0", dir: 1 }), 0)).toBe("[S1,S2] A B");
    expect(tab(applyOp(pd, { op: "move", id: "pd/0/1/1", dir: -1 }), 0)).toBe("A [S2,S1] B");
    expect(() => applyOp(pd, { op: "move", id: "pd/0/1/0", dir: -1 })).toThrow(/first section in this group/);
    expect(() => applyOp(pd, { op: "move", id: "pd/0/2", dir: 1 })).toThrow(/last section in this tab/);
    expect(tab(applyOp(pd, { op: "duplicate", id: "pd/0/0" }), 0)).toBe("A A [S1,S2] B");
    expect(tab(applyOp(pd, { op: "remove", id: "pd/0/2" }), 0)).toBe("A [S1,S2]");
    // the last section of a group takes its heading with it
    const one = applyOp(pd, { op: "remove", id: "pd/0/1/0" });
    expect(tab(applyOp(one, { op: "remove", id: "pd/0/1/0" }), 0)).toBe("A B");
    expect(() => applyOp(pd, { op: "remove", id: "pd/1/0" })).toThrow(/at least one section/);
    expect(() => applyOp(pd, { op: "remove", id: "pd/0/1" })).toThrow(/no longer/); // a group is not a section
    expect(() => applyOp(pd, { op: "remove", id: "pd/0/__proto__" })).toThrow();
  });
  it("layout, and which section to select after", () => {
    expect((applyOp(pd, { op: "variant", id: "pd/0/0", variant: "lead" })[1].data as any).tabs[0].blocks[0].variant).toBe("lead");
    expect(selectAfterOp({ op: "move", id: "pd/0/1/1", dir: -1 }, pd, pd)).toBe("pd/0/1/0");
    expect(selectAfterOp({ op: "add", at: 2, type: "text", variant: "default", in: "pd/0" }, pd, pd)).toBe("pd/0/2");
  });
  it("changes in words", () => {
    const added = applyOp(pd, { op: "add", at: 0, type: "text", variant: "default", in: "pd/1" });
    expect(describeBlockChanges(pd, added)).toEqual([expect.stringMatching(/^Added Text “.+” in tab “How”$/)]);
    expect(describeBlockChanges(pd, applyOp(pd, { op: "remove", id: "pd/0/2" }))).toEqual(["Removed Text in tab “Overview”"]);
    expect(describeBlockChanges(pd, applyOp(pd, { op: "move", id: "pd/0/0", dir: 1 }))).toEqual(["Moved sections in tab “Overview”"]);
    expect(describeBlockChanges(pd, applyOp(pd, { op: "variant", id: "pd/0/0", variant: "lead" }))).toEqual(["Changed layout of Text in tab “Overview”"]);
  });
});

describe("the tabs of Product details", () => {
  const mk = (): StoredBlock[] => [
    {
      id: "pd",
      type: "productDetails",
      variant: "pills",
      data: { tabs: [
        { id: "overview", label: "Overview", title: "Overview", blocks: [{ type: "text", variant: "default", data: { body: "A" } }] },
        { id: "evidence", label: "Evidence", href: "/us/evidence", blocks: [] },
      ] },
    },
  ];
  const tabs = (l: StoredBlock[]) => ((l[0].data as any).tabs as any[]).map((t) => `${t.id}:${t.label}${t.href ? `→${t.href}` : ""}`);

  it("add a tab with one text section, or a link tab; ids from the name stay unique", () => {
    const one = applyOp(mk(), { op: "tab", id: "pd", act: "add", at: 1, label: "How it works" });
    expect(tabs(one)).toEqual(["overview:Overview", "how-it-works:How it works", "evidence:Evidence→/us/evidence"]);
    expect((one[0].data as any).tabs[1].blocks).toHaveLength(1);
    const two = applyOp(one, { op: "tab", id: "pd", act: "add", at: 3, label: "Overview", href: "https://example.com/x" });
    expect(tabs(two)[3]).toBe("overview-2:Overview→https://example.com/x");
    expect(() => applyOp(mk(), { op: "tab", id: "pd", act: "add", at: 0, label: "X", href: "//evil.example" })).toThrow(/page address/);
    expect(() => applyOp(mk(), { op: "tab", id: "pd", act: "add", at: 0, label: "X", href: "javascript:alert(1)" })).toThrow(/page address/);
    expect(() => applyOp(mk(), { op: "tab", id: "pd", act: "add", at: 0, label: "   " })).toThrow(/1–60/);
  });
  it("move, rename (the address stays), change a link, remove — one tab with content stays", () => {
    expect(tabs(applyOp(mk(), { op: "tab", id: "pd", act: "move", tab: 1, dir: -1 }))).toEqual(["evidence:Evidence→/us/evidence", "overview:Overview"]);
    expect(() => applyOp(mk(), { op: "tab", id: "pd", act: "move", tab: 0, dir: -1 })).toThrow(/first tab/);
    const renamed = applyOp(mk(), { op: "tab", id: "pd", act: "rename", tab: 0, label: "Product overview" });
    expect(tabs(renamed)[0]).toBe("overview:Product overview");
    expect((renamed[0].data as any).tabs[0].title).toBe("Product overview");
    expect(tabs(applyOp(mk(), { op: "tab", id: "pd", act: "link", tab: 1, href: "/ous/evidence" }))[1]).toBe("evidence:Evidence→/ous/evidence");
    expect(() => applyOp(mk(), { op: "tab", id: "pd", act: "link", tab: 0, href: "/x" })).toThrow(/not a link/);
    expect(tabs(applyOp(mk(), { op: "tab", id: "pd", act: "remove", tab: 1 }))).toEqual(["overview:Overview"]);
    expect(() => applyOp(mk(), { op: "tab", id: "pd", act: "remove", tab: 0 })).toThrow(/at least one tab/);
    expect(() => applyOp(mk(), { op: "tab", id: "pd", act: "remove", tab: 5 })).toThrow(/no longer there/);
  });
  it("in words", () => {
    const b = mk();
    expect(describeBlockChanges(b, applyOp(b, { op: "tab", id: "pd", act: "add", at: 2, label: "Sizes" }))).toEqual(["Added tab “Sizes”"]);
    expect(describeBlockChanges(b, applyOp(b, { op: "tab", id: "pd", act: "remove", tab: 1 }))).toEqual(["Removed tab “Evidence”"]);
    expect(describeBlockChanges(b, applyOp(b, { op: "tab", id: "pd", act: "rename", tab: 0, label: "Intro" }))).toEqual(["Renamed tab “Overview” to “Intro”"]);
    expect(describeBlockChanges(b, applyOp(b, { op: "tab", id: "pd", act: "move", tab: 1, dir: -1 }))).toEqual(["Moved tabs"]);
  });
});

describe("hide a section (editor's content mode, on-page-editor.md → «Скрытые секции»)", () => {
  it("hides and shows a section; the regulatory block stays", () => {
    const hid = applyOp(page, { op: "hide", id: "t", hidden: true });
    expect(hid[1]).toEqual({ ...page[1], hidden: true });
    expect(ids(hid)).toBe(ids(page));
    const shown = applyOp(hid, { op: "hide", id: "t", hidden: false });
    expect(shown[1]).toEqual(page[1]); // no leftover flag
    expect(() => applyOp(page, { op: "hide", id: "i", hidden: true })).toThrow(/required/);
    // only `true` hides: anything else from a client shows
    expect(applyOp(page, { op: "hide", id: "t", hidden: "yes" as any })[1].hidden).toBeUndefined();
  });
  it("in words for Review and History", () => {
    const hid = applyOp(page, { op: "hide", id: "c", hidden: true });
    expect(describeBlockChanges(page, hid)).toEqual(["Hid section Call to action “Questions?”"]);
    expect(describeBlockChanges(hid, page)).toEqual(["Showed section Call to action “Questions?”"]);
  });
  it("a section inside a Product details tab", () => {
    const pd: StoredBlock[] = [{ id: "p", type: "productDetails", variant: "pills", data: { tabs: [{ id: "o", label: "Overview", blocks: [{ type: "text", variant: "default", data: { body: "a" } }, { type: "text", variant: "default", data: { body: "b" } }] }] } }];
    const hid = applyOp(pd, { op: "hide", id: "p/0/1", hidden: true });
    expect((hid[0].data as any).tabs[0].blocks[1].hidden).toBe(true);
    expect(describeBlockChanges(pd, hid)).toEqual(["Hid Text in tab “Overview”"]);
  });
});

describe("drag and drop: put a section at a position", () => {
  it("moves within the page; pinned blocks stay last", () => {
    expect(ids(applyOp(page, { op: "moveTo", id: "c", to: 0 }))).toBe("c,h,t,i");
    expect(ids(applyOp(page, { op: "moveTo", id: "h", to: 3 }))).toBe("t,c,h,i"); // not after the pinned one
    expect(() => applyOp(page, { op: "moveTo", id: "i", to: 0 })).toThrow(/end of the page/);
    expect(() => applyOp(page, { op: "moveTo", id: "h", to: 9 })).toThrow(/position/);
  });
  it("moves inside a tab and selects the new address", () => {
    const pd: StoredBlock[] = [{ id: "p", type: "productDetails", variant: "pills", data: { tabs: [{ id: "o", label: "O", blocks: ["a", "b", "c"].map((body) => ({ type: "text", variant: "default", data: { body } })) }] } }];
    const next = applyOp(pd, { op: "moveTo", id: "p/0/2", to: 0 });
    expect((next[0].data as any).tabs[0].blocks.map((b: any) => b.data.body).join("")).toBe("cab");
    expect(selectAfterOp({ op: "moveTo", id: "p/0/2", to: 0 }, pd, next)).toBe("p/0/0");
  });
});
