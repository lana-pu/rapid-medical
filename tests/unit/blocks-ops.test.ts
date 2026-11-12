import { describe, it, expect } from "vitest";
import type { StoredBlock } from "../../src/db/schema";
import { applyOp, variantsFor } from "../../src/blocks/ops";
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
