import { describe, it, expect } from "vitest";
import { titleSlug, idFromParam, publicationHref, newsHref } from "../../src/lib/material";
import { studyPageBlocks, STUDIES } from "../../src/blocks/studies";
import type { StoredBlock } from "../../src/db/schema";

/** Own pages of publications, news and studies (docs/screens/material.md). */

describe("addresses", () => {
  it("id and a readable slug, cut at a word", () => {
    expect(titleSlug("Rapid Medical™ Announces FDA Clearance of DRIVEWIRE™ 35")).toBe("rapid-medical-announces-fda-clearance-of-drivewire-35");
    const long = titleSlug("Use of Drivewire 24 guidewire in neurointervention: initial clinical experience and technical advancements");
    expect(long).toBe("use-of-drivewire-24-guidewire-in-neurointervention-initial-clinical-experience");
    expect(long.length).toBeLessThanOrEqual(80);
    expect(titleSlug("™")).toBe("item");
    expect(publicationHref("us", { id: 7, title: "Côte study" })).toBe("/us/evidence/7-cote-study");
    expect(newsHref({ id: 3, title: "News one" })).toBe("/news-events/3-news-one");
  });
  it("the id decides; anything else is not a record", () => {
    expect(idFromParam("12-any-slug")).toBe(12);
    expect(idFromParam("12")).toBe(12);
    for (const bad of ["abc", "12abc", "-12", "12-Upper", "1234567890-x"]) expect(idFromParam(bad)).toBeNull();
  });
});

describe("study pages", () => {
  const imported = (): StoredBlock[] => [
    { id: "h", type: "hero", variant: "page", data: { title: "SUCCESS Study – Final Results" }, source: "regionLabel" },
    { id: "t", type: "richText", variant: "default", data: { html: "<p>poster</p>" } },
  ];
  it("a page as imported gets the conclusion, key figures with quotes, the passport and its source", () => {
    const b = studyPageBlocks("success-study-final-results", imported())!;
    expect(b.map((x) => `${x.type}:${x.variant}`)).toEqual(["hero:page", "keyNumbers:figures", "passport:default", "richText:document"]);
    expect(b[0].data).toMatchObject({ title: "SUCCESS Study – Final Results", eyebrow: "Study · COMANECI™" });
    expect(b[0].source).toBeUndefined(); // the region label would replace «Study · product»
    expect((b[1].data.items as { note: string }[]).every((i) => i.note)).toBe(true); // every figure is quoted
    expect(b[3].data).toMatchObject({ html: "<p>poster</p>" }); // the text stays
  });
  it("every figure's value appears in its quote (nothing computed)", () => {
    for (const s of Object.values(STUDIES)) for (const f of s.figures) {
      if (f.value === "0" || f.value === "All" || f.value.startsWith("~")) continue; // stated in words in the quote
      expect(f.note).toContain(f.value);
    }
  });
  it("an edited page, another page or an unknown slug is left alone", () => {
    expect(studyPageBlocks("success-study-final-results", [...imported(), { id: "x", type: "cta", variant: "light", data: {} }])).toBeNull();
    expect(studyPageBlocks("terms", imported())).toBeNull();
    expect(studyPageBlocks("toString", imported())).toBeNull();
  });
});
