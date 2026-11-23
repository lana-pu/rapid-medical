import { describe, expect, it } from "vitest";
import { therapyLayout2026, THERAPY_NAV, therapyPageBlocks } from "@/blocks/convert";
import { studyCardOf } from "@/lib/material";
import type { StoredBlock } from "@/db/schema";

// Therapy page in the layout of DESIGN.md → Страница терапии (2026-11-15, preliminary): nothing moved or removed
const PAGE: StoredBlock[] = [
  { id: "h", type: "hero", variant: "video", data: { title: "A patient-centric approach" } },
  { id: "b", type: "textMedia", variant: "mediaRight", data: { title: "control" } },
  { id: "p", type: "productDetails", variant: "pills", data: { tabs: [
    { id: "overview", label: "Product overview", blocks: [] },
    { id: "practice", label: "In-Practice", blocks: [{ type: "cta", variant: "buttons", data: { buttons: [{ label: "Case", href: "/ous/comaneci-spinal-case-patankar" }] } }] },
    { id: "evidence", label: "Clinical evidence", href: "/{region}/evidence#{product}", blocks: [] },
  ] } },
  { id: "i", type: "indications", variant: "default", data: { indicationsHtml: "<p><strong>Indications for Use.</strong> …</p>", referencesHtml: "<ol><li>R</li></ol>" } },
];

describe("therapy layout 2026-11", () => {
  it("adds the section navigation under the hero and the link to the indications; every other block as it was", () => {
    const next = therapyLayout2026(PAGE)!;
    expect(next.map((b) => b.type)).toEqual(["hero", "sectionNav", "textMedia", "productDetails", "indications"]);
    expect(next[1].data.items).toEqual(THERAPY_NAV);
    expect(next[0].data.jump).toEqual({ label: "Indications, Safety & Warnings ↓", href: "#indications" });
    expect(next.filter((b) => b.type !== "sectionNav" && b.type !== "hero")).toEqual(PAGE.slice(1));
    expect(next[3].source).toBeUndefined(); // the tabs keep no source: their sections stay editable on the page
  });
  it("no indications text, no link; runs once", () => {
    const noInd = PAGE.map((b) => (b.type === "indications" ? { ...b, data: { indicationsHtml: "<p> </p>", referencesHtml: "<ol></ol>" } } : b));
    expect(therapyLayout2026(noInd)![0].data.jump).toBeUndefined();
    expect(therapyLayout2026(therapyLayout2026(PAGE))).toBeNull();
    expect(therapyLayout2026([])).toBeNull();
  });
  it("the product's materials go into its tabs at show time", () => {
    const s = { id: 1, slug: "aneurysm", blocks: therapyLayout2026(PAGE), product: { slug: "comaneci" } } as never;
    const studies = [{ title: "SUCCESS", href: "/us/success-study-final-results", meta: "90 consecutive subjects", figure: { value: "95%", label: "occlusion" } }];
    const blocks = therapyPageBlocks(s, { region: "us", others: [], materials: { studies, cases: [], ifu: null, publications: 12 } });
    const pd = blocks.find((b) => b.type === "productDetails")!.data as { studies: unknown; publications: number };
    expect(pd.studies).toEqual(studies);
    expect(pd.publications).toBe(12);
  });
  it("a study card: design · N from the passport, the first key figure", () => {
    const card = studyCardOf({ title: "DISTALS", blocks: [
      { type: "passport", data: { rows: [{ label: "Design", value: "Randomized, multicenter" }, { label: "Patients", value: "111" }] } },
      { type: "keyNumbers", data: { items: [{ value: "86.3%", label: "Reperfusion" }, { value: "x", label: "y" }] } },
    ] });
    expect(card).toEqual({ meta: "Randomized, multicenter · 111", figure: { value: "86.3%", label: "Reperfusion" } });
    expect(studyCardOf({ title: "x", blocks: [] })).toEqual({ meta: null, figure: null });
  });
});
