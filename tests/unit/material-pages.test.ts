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

import { sameArticle } from "../../src/lib/material";

describe("an abstract belongs to this article", () => {
  it("shortened titles, prefixes and hyphens still match; another article does not (a wrong DOI in a record)", () => {
    expect(sameArticle("Treatment of Cerebral Vasospasm … Comaneci", "Treatment of Cerebral Vasospasm after Aneurysmal Subarachnoid Hemorrhage Using the Comaneci Device")).toBe(true);
    expect(sameArticle("Technical video: Applications of the Columbus Steerable Guidewire*", "Applications of the Columbus steerable guidewire.")).toBe(true);
    expect(sameArticle("Comaneci-Assisted Coiling Embolization of a Post-Traumatic Carotid-Cavernous Fistula", "Comaneci-Assisted Coiling Embolization of a Posttraumatic Carotid-Cavernous Fistula")).toBe(true);
    expect(sameArticle("Thrombectomy for distal medium vessel occlusion with a new generation of stentriever", "Mechanical thrombectomy in pediatric stroke: systematic review, individual patient data meta-analysis")).toBe(false);
  });
});

import { sameArticleByTitle } from "../../src/lib/material";

describe("a hit found only by our title", () => {
  it("needs enough words, all of them, and a cut title must match the beginning", () => {
    expect(sameArticleByTitle("E-272 Novel use of a triple stent retriever ‘bouquet’ …", "E-272 Novel use of a triple stent retriever ‘bouquet’ deployment with zoom 88")).toBe(true);
    expect(sameArticleByTitle("Comaneci-assisted coiling of wide-necked intracranial Aneurysm: Single center preliminary experience", "Comaneci-Assisted Coiling of Wide-Necked Intracranial Aneurysm: A Single-Center Preliminary Experience")).toBe(true);
    expect(sameArticleByTitle("MCA Aneurysm Embolization", "P501 Technical and nursing aspects in a case of distal MCA aneurysm embolization")).toBe(false); // too short
    expect(sameArticleByTitle("Mechanical thrombectomy … Propensity score analysis", "Conscious sedation versus general anaesthesia during mechanical thrombectomy for stroke: a propensity score analysis")).toBe(false);
    expect(sameArticleByTitle("Revascularization of acute basilar artery occlusion …", "Successful Endovascular Revascularization of Acute Basilar Artery Occlusion Approached via an Aberrant Artery")).toBe(false);
    // the same words in another order are another title
    expect(sameArticleByTitle("Stent retriever thrombectomy versus aspiration outcomes", "Aspiration versus stent retriever thrombectomy outcomes")).toBe(false);
    // and something besides the title must agree: the year or the first author
    const t = "Comaneci-assisted coiling of wide-necked intracranial aneurysm: a single center preliminary experience";
    expect(sameArticleByTitle(t, t, { year: 2022, authors: "Vinacci G, Sirakov A" }, { year: 2022, firstAuthor: "Someone Else" })).toBe(true);
    expect(sameArticleByTitle(t, t, { year: 2022, authors: "Vinacci G, Sirakov A" }, { year: 2015, firstAuthor: "Gabriele Vinacci" })).toBe(true);
    expect(sameArticleByTitle(t, t, { year: 2022, authors: "Vinacci G" }, { year: 2015, firstAuthor: "Someone Else" })).toBe(false);
  });
});
