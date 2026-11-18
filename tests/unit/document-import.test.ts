import { describe, expect, it } from "vitest";
import { suggestKind, findNct, quoteFound, valueInQuote, parseAnswer, checkQuoted, mergePassport, documentBlocks, textToHtml, instructionsFor, unchecked } from "@/lib/document-import";
import { registryRows } from "@/lib/clinicaltrials";

// Short excerpts of the real texts (media.text of the PDFs on the site, 2026-11-18)
const SUCCESS = `Davies JM, et al. J NeuroIntervent Surg 2025;0:1–7. doi:10.1136/jnis-2025-024136
Comaneci-assisted embolization of wide-necked
aneurysms: results from the SUCCESS postmarket
US study
METHODS The study was conducted at 17 US centers (NCT04518670). Ninety consecutive patients were enrolled.
RESULTS Successful occlusion (Raymond Roy I and II) was 86% at the end of the procedure and 95% at the 6-month follow-
up. Wide- necked aneurysms were treated.`;
const IFU = "TIGERTRIEVER Revascularization Device — Instructions for Use. Contraindications. Warnings.";
const PRESS = "YOKNEAM, Israel--(BUSINESS WIRE)--Rapid Medical announces FDA clearance. About Rapid Medical: …";
const SLIDES = "DISTALS. Enrolled 149, randomized 98. Primary endpoint. Results: successful reperfusion.";

describe("what the file is (before any AI)", () => {
  it("a journal article by its DOI, a study by results and patients, an IFU, a press release", () => {
    expect(suggestKind(SUCCESS).kind).toBe("publication");
    expect(suggestKind(SLIDES).kind).toBe("study");
    expect(suggestKind(IFU).kind).toBe("document");
    expect(suggestKind(PRESS).kind).toBe("news");
    expect(suggestKind("Some text.").reason).toMatch(/Nothing points/);
  });
  it("finds the NCT number", () => {
    expect(findNct(SUCCESS)).toBe("NCT04518670");
    expect(findNct(SLIDES)).toBeNull();
  });
});

describe("a quote is checked against the PDF's text", () => {
  it("ignores spaces, line breaks, hyphenation and case; short fragments prove nothing", () => {
    expect(quoteFound(SUCCESS, "The study was conducted at 17 US centers")).toBe(true);
    expect(quoteFound(SUCCESS, "results from the SUCCESS postmarket US study")).toBe(true); // across a line break
    expect(quoteFound(SUCCESS, "95% at the 6-month follow-up")).toBe(true); // «follow-\nup»
    expect(quoteFound(SUCCESS, "Wide-necked aneurysms were treated")).toBe(true); // «Wide- necked»
    expect(quoteFound(SUCCESS, "Successful occlusion was 99% at one year")).toBe(false);
    expect(quoteFound(SUCCESS, "95%")).toBe(false);
  });
  it("the value's numbers must be in the quote", () => {
    expect(valueInQuote("95%", "86% at the end of the procedure and 95% at the 6-month follow-up")).toBe(true);
    expect(valueInQuote("96%", "95% at the 6-month follow-up")).toBe(false);
    expect(valueInQuote("0", "none were symptomatic")).toBe(false);
    expect(valueInQuote("None", "none were symptomatic")).toBe(true);
  });
  it("a value is ok, or «Check» with the reason", () => {
    const ok = checkQuoted(SUCCESS, "figures", 0, { value: "95%", label: "Occlusion at 6 months", quote: "86% at the end of the procedure and 95% at the 6-month follow-up" });
    const made = checkQuoted(SUCCESS, "figures", 1, { value: "99%", label: "Occlusion", quote: "Successful occlusion was 99% at one year" });
    const wrong = checkQuoted(SUCCESS, "figures", 2, { value: "96%", label: "Occlusion", quote: "86% at the end of the procedure and 95% at the 6-month follow-up" });
    expect([ok.status, made.status, made.reason, wrong.reason]).toEqual(["ok", "check", "The quote is not in the PDF", "The number is not in the quote"]);
    expect(unchecked([ok, made, wrong, { ...made, status: "confirmed" }])).toHaveLength(2);
  });
});

describe("the answer of the team's own AI", () => {
  const answer = { title: "SUCCESS", conclusion: "High occlusion.", figures: [{ value: "95%", label: "Occlusion", quote: "95% at the 6-month follow-up" }] };
  it("reads JSON in a code fence or with words around it", () => {
    const r = parseAnswer("Sure! Here it is:\n```json\n" + JSON.stringify(answer) + "\n```\nHope it helps.");
    expect(r.ok && r.answer.figures[0].value).toBe("95%");
    expect(r.ok && r.answer.passport).toEqual([]);
  });
  it("says what is wrong in words", () => {
    expect(parseAnswer("I cannot open the PDF.")).toMatchObject({ ok: false, error: expect.stringMatching(/No JSON/) });
    expect(parseAnswer("{ title: 'x' }")).toMatchObject({ ok: false, error: expect.stringMatching(/not valid JSON/) });
    const r = parseAnswer(JSON.stringify({ title: "x", figures: [{ value: "1" }] }));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/conclusion/);
  });
  it("the instructions ask for exact quotes; a passport only for a study", () => {
    expect(instructionsFor("study")).toMatch(/copied exactly from the PDF/);
    expect(instructionsFor("study")).toMatch(/Design, Regulation, Patients, Centers/);
    expect(instructionsFor("news")).toMatch(/"passport": \[\] \(leave empty/);
  });
});

describe("passport: the document first, the registry fills gaps", () => {
  const success = {
    protocolSection: {
      designModule: { studyType: "OBSERVATIONAL", designInfo: {}, enrollmentInfo: { count: 90, type: "ACTUAL" } },
      statusModule: { overallStatus: "COMPLETED", startDateStruct: { date: "2020-11-24" }, primaryCompletionDateStruct: { date: "2024-05-01" } },
      contactsLocationsModule: { locations: Array.from({ length: 8 }, () => ({ country: "United States" })) },
    },
  };
  const distals = {
    protocolSection: {
      designModule: { studyType: "INTERVENTIONAL", designInfo: { allocation: "RANDOMIZED", maskingInfo: { masking: "DOUBLE" } }, enrollmentInfo: { count: 149, type: "ACTUAL" } },
      statusModule: { overallStatus: "COMPLETED", startDateStruct: { date: "2022-03-25" }, primaryCompletionDateStruct: { date: "2025-12-30" } },
      contactsLocationsModule: { locations: [...Array.from({ length: 14 }, () => ({ country: "United States" })), { country: "Belgium" }, { country: "Germany" }] },
    },
  };
  it("registry records → rows (SUCCESS and DISTALS)", () => {
    expect(registryRows("NCT04518670", success).map((r) => `${r.label}: ${r.value}`)).toEqual([
      "Design: Observational", "Patients: 90", "Centers: 8 · United States", "Enrollment period: Nov 2020 – May 2024", "Status: Completed", "Registry: NCT04518670",
    ]);
    expect(registryRows("NCT05152524", distals)[0].value).toBe("Interventional, Randomized, Double masking");
    expect(registryRows("NCT05152524", distals)[2].value).toBe("16 · United States, Belgium, Germany");
  });
  it("SUCCESS: 17 centres in the article, 8 in the registry → the article's value, a conflict; gaps filled", () => {
    const doc = [{ label: "Centers", value: "17 in the US" }, { label: "Patients", value: "90" }];
    const { rows, conflicts } = mergePassport(doc, registryRows("NCT04518670", success));
    expect(rows[0]).toEqual({ label: "Centers", value: "17 in the US" });
    expect(conflicts).toEqual([{ index: 0, registry: "8 · United States" }]);
    expect(rows.map((r) => r.label)).toEqual(["Centers", "Patients", "Design", "Enrollment period", "Status", "Registry"]);
  });
});

describe("the page", () => {
  const pdf = { url: "/uploads/x/success.pdf", text: "Line one of a para-\ngraph\ncontinues.\n\nSecond <b>para</b>.\fPage two." };
  const answer = { title: "SUCCESS", conclusion: "High occlusion.", figures: [{ value: "95%", label: "Occlusion", quote: "q" }], passport: [] };
  it("conclusion under the title, figures with their quotes, passport, the document", () => {
    const b = documentBlocks({ kind: "study", title: "SUCCESS", product: "COMANECI™", answer, passport: [{ label: "Patients", value: "90" }], passportSource: { label: "The study PDF" }, pdf, original: "https://doi.org/10.1136/x", mode: "embed" });
    expect(b.map((x) => `${x.type}/${x.variant}`)).toEqual(["hero/page", "keyNumbers/figures", "passport/default", "richText/document"]);
    expect(b[0].data).toMatchObject({ eyebrow: "Study · COMANECI™", body: "High occlusion." });
    expect(b[1].data).toEqual({ items: [{ value: "95%", label: "Occlusion", note: "q" }] });
    expect(b[3].data).toMatchObject({ pdf: { href: pdf.url }, links: [{ label: "Download PDF" }, { label: "Open the original ↗" }] });
  });
  it("full text: copied (escaped, hyphenation joined), embedded, or a link only; a document is always the PDF", () => {
    const copy = documentBlocks({ kind: "news", title: "N", answer, passport: [], passportSource: null, pdf, mode: "copy" }).at(-1)!;
    expect(copy.data.html).toBe("<p>Line one of a paragraph continues.</p>\n<p>Second &lt;b&gt;para&lt;/b&gt;.</p>\n<p>Page two.</p>");
    const link = documentBlocks({ kind: "publication", title: "P", answer, passport: [], passportSource: null, pdf, original: "https://doi.org/x", mode: "link" }).at(-1)!;
    expect(link.data).toMatchObject({ pdf: null, links: [{ label: "Open the original ↗" }] });
    const ifu = documentBlocks({ kind: "document", title: "IFU", answer: null, passport: [], passportSource: null, pdf, mode: "link" });
    expect(ifu.map((x) => x.type)).toEqual(["hero", "richText"]);
    expect(ifu[1].data.pdf).toMatchObject({ href: pdf.url });
    expect(textToHtml("a\n\n\nb")).toBe("<p>a</p>\n<p>b</p>");
  });
});
