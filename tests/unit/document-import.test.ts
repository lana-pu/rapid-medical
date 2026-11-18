import { describe, expect, it } from "vitest";
import { suggestKind, findNct, quoteFound, valueInQuote, parseAnswer, checkQuoted, checkGroups, mergePassport, documentBlocks, textToHtml, instructionsFor, unchecked, comparisonUnit, suggestFromUrl, sourceName } from "@/lib/document-import";
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
    expect(checkQuoted(SUCCESS, "figures", 0, { value: "95%", label: "x", quote: "95% at 6m" }).reason).toMatch(/too short to check/);
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
  const answer = { title: "SUCCESS", conclusion: "High occlusion.", figures: [{ value: "95%", label: "Occlusion", quote: "q" }], passport: [], comparisons: [], matrices: [], distributions: [], tables: [], centres: [] };
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

describe("groups compared and patients as dots (DESIGN.md → Набор инфографики)", () => {
  const DISTALS = "Successful reperfusion at 24 hours was 45% with treatment (n=29) and 15% with control (n=36). Excellent outcome: 4 of 10 patients with treatment and 3 of 10 with control.";
  const raw = {
    title: "DISTALS", conclusion: "More blood flow restored.",
    comparisons: [{ title: "Successful reperfusion at 24 h", unit: "%", pValue: "< 0.05", groups: [
      { label: "Treatment", value: "45", n: "29", quote: "45% with treatment (n=29)" },
      { label: "Control", value: "25", n: "36", quote: "15% with control (n=36)" },
    ] }],
    matrices: [{ title: "Excellent outcome", caption: "One dot — one patient in ten", groups: [{ label: "Treatment", count: "4", total: "10", quote: "4 of 10 patients with treatment" }] }],
  };
  it("are read from the answer (optional), become their blocks after the key figures, each value checked and tied to its block", () => {
    const r = parseAnswer(JSON.stringify(raw));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const blocks = documentBlocks({ kind: "study", title: "DISTALS", answer: r.answer, passport: [], passportSource: null, pdf: { url: "/u/d.pdf", text: DISTALS }, mode: "embed" });
    expect(blocks.map((b) => b.type)).toEqual(["hero", "comparison", "dotMatrix", "richText"]);
    const items = checkGroups(DISTALS, r.answer, blocks);
    expect(items.map((x) => [x.id, x.status, x.block === blocks[1].id || x.block === blocks[2].id])).toEqual([
      ["comparison-0-0", "ok", true], ["comparison-0-0-n", "ok", true],
      ["comparison-0-1", "check", true], ["comparison-0-1-n", "ok", true],
      ["comparison-0-p", "check", true], ["matrix-0-0", "ok", true],
    ]);
    expect(items[0].value).toBe("45%");
    expect(items[2].reason).toBe("The number is not in the quote"); // 25 vs «15% … (n=36)»
    expect(items[4].reason).toBe("No quote for the p-value — look at the PDF");
  });
  it("every number shown is checked: n, the p-value with its quote, the «%» the bar adds", () => {
    const text = "Reperfusion was 45 of the treated patients (n=29). The difference was significant (p < 0.05). Control: 15% (n=36).";
    const r = parseAnswer(JSON.stringify({ ...raw, matrices: [], comparisons: [{ ...raw.comparisons[0], pQuote: "The difference was significant (p < 0.05).", groups: [
      { label: "Treatment", value: "45", n: "30", quote: "Reperfusion was 45 of the treated patients (n=29)." },
      { label: "Control", value: "15", n: "36", quote: "Control: 15% (n=36)." },
    ] }] }));
    if (!r.ok) throw new Error(r.error);
    const blocks = documentBlocks({ kind: "study", title: "x", answer: r.answer, passport: [], passportSource: null, pdf: { url: "/u/d.pdf", text }, mode: "embed" });
    const items = checkGroups(text, r.answer, blocks);
    expect(Object.fromEntries(items.map((x) => [x.id, x.reason ?? x.status]))).toEqual({
      "comparison-0-0": "The quote does not give it in %", "comparison-0-0-n": "The number is not in the quote",
      "comparison-0-1": "ok", "comparison-0-1-n": "ok", "comparison-0-p": "ok",
    });
  });
  it("with no unit in the answer the scale is % only when every value says «%»", () => {
    const c = raw.comparisons[0];
    expect(comparisonUnit({ ...c, unit: undefined })).toBe("");
    expect(comparisonUnit({ ...c, unit: undefined, groups: c.groups.map((g) => ({ ...g, value: `${g.value}%` })) })).toBe("%");
  });
  it("a comparison needs two groups; the instructions offer them only to studies and publications", () => {
    expect(parseAnswer(JSON.stringify({ ...raw, comparisons: [{ title: "x", groups: [raw.comparisons[0].groups[0]] }] })).ok).toBe(false);
    expect(instructionsFor("study")).toMatch(/"comparisons" \(optional/);
    expect(instructionsFor("news")).toMatch(/"comparisons": \[\], "matrices": \[\]/);
  });
});

describe("a web page: its link and the text a person pasted (the site does not fetch it)", () => {
  const RELEASE = "Rapid Medical announced today that the first 50 patients were treated. The device reached the target in 96% of cases. About Rapid Medical: a developer of neurovascular devices. Media contact: press office.";
  it("the kind comes from the address; a press-release service is news, a DOI a publication", () => {
    expect(suggestFromUrl("https://www.businesswire.com/news/home/1/en/x").kind).toBe("news");
    expect(suggestFromUrl("https://www.prnewswire.co.uk/news-releases/x.html").kind).toBe("news");
    expect(suggestFromUrl("https://doi.org/10.1136/jnis-2025-024136").kind).toBe("publication");
    expect(suggestFromUrl("not a link").kind).toBe("news");
    expect(suggestFromUrl("https://evil-businesswire.com/x").reason).toMatch(/A page on the web/);
  });
  it("the checks and the instructions speak of the page text, not the PDF", () => {
    expect(sourceName("page")).toBe("the page text");
    expect(sourceName({ mediaId: null })).toBe("the page text");
    expect(sourceName({ mediaId: 4 })).toBe("the PDF");
    expect(checkQuoted(RELEASE, "figures", 0, { label: "Reached", value: "97%", quote: "The device reached the target in 97% of cases." }, "page").reason).toBe("The quote is not in the page text");
    expect(checkQuoted(RELEASE, "figures", 0, { label: "Reached", value: "96%", quote: "The device reached the target in 96% of cases." }, "page").status).toBe("ok");
    const ins = instructionsFor("news", "page");
    expect(ins).toMatch(/from the text pasted after these instructions/);
    expect(ins).not.toMatch(/PDF/);
  });
  it("a page has no PDF: its text is copied onto the page (or linked), never «Show the PDF»", () => {
    const answer = { title: "First 50 patients", conclusion: "The first 50 patients were treated.", figures: [], passport: [], comparisons: [], matrices: [], distributions: [], tables: [], centres: [] };
    const blocks = documentBlocks({ kind: "news", title: "First 50 patients", answer, passport: [], passportSource: null, pdf: null, text: RELEASE, original: "https://www.prnewswire.com/x.html", mode: "embed" });
    const doc = blocks.at(-1)!.data as { html: string; pdf: unknown; links: { label: string }[] };
    expect(doc.pdf).toBeNull();
    expect(doc.html).toContain("<p>Rapid Medical announced today");
    expect(doc.links.map((l) => l.label)).toEqual(["Open the original ↗"]);
    const linked = documentBlocks({ kind: "publication", title: "x", answer, passport: [], passportSource: null, pdf: null, text: RELEASE, original: "https://doi.org/10.1/x", mode: "link" });
    expect((linked.at(-1)!.data as { html: string }).html).toBe("");
  });
});

describe("distribution, table and centres (DESIGN.md → Набор инфографики, 2026-11-18)", () => {
  const TEXT = `Raymond-Roy occlusion after the procedure: RR I 60%, RR II 26%, RR III 14% (n=90).
At 12 months: RR I 80%, RR II 15%, RR III 8% (n=80).
Treatment arm (n=29) and control arm (n=36) were compared.
Symptomatic haemorrhage 3.4 versus 5.6 in the two arms.
Centres: Sample University Hospital, Boston; Example Clinic, Munich.`;
  const raw = {
    title: "SUCCESS", conclusion: "Occlusion improved.",
    distributions: [{ title: "Occlusion over follow-up", scale: ["RR I", "RR II", "RR III"], series: [{ label: "All patients", points: [
      { label: "After the procedure", n: "90", values: ["60", "26", "14"], quote: "Raymond-Roy occlusion after the procedure: RR I 60%, RR II 26%, RR III 14% (n=90)." },
      { label: "12 months", n: "80", values: ["80", "15", "8"], quote: "At 12 months: RR I 80%, RR II 15%, RR III 8% (n=80)." },
    ] }] }],
    tables: [{ title: "Safety", columns: [{ label: "Treatment", n: "29", quote: "Treatment arm (n=29) and control arm (n=36) were compared." }, { label: "Control", n: "36" }], rows: [
      { label: "Symptomatic haemorrhage", cells: ["3.4", "5.6"], quote: "Symptomatic haemorrhage 3.4 versus 5.6 in the two arms." },
    ] }],
    centres: [{ name: "Sample University Hospital", city: "Boston", country: "USA" }, { name: "Imaginary Institute", country: "France" }],
  };
  it("become their blocks; every number a check tied to the fields it covers", () => {
    const r = parseAnswer(JSON.stringify(raw));
    if (!r.ok) throw new Error(r.error);
    const blocks = documentBlocks({ kind: "study", title: "SUCCESS", answer: r.answer, passport: [], passportSource: null, pdf: { url: "/u/s.pdf", text: TEXT }, mode: "embed" });
    expect(blocks.map((b) => b.type)).toEqual(["hero", "distribution", "dataTable", "centresMap", "richText"]);
    const items = checkGroups(TEXT, r.answer, blocks);
    expect(Object.fromEntries(items.map((x) => [x.id, x.reason ?? x.status]))).toEqual({
      "distribution-0-0-0": "ok", "distribution-0-0-0-n": "ok",
      "distribution-0-0-1": "The shares add up to 103%, not 100%", "distribution-0-0-1-n": "ok",
      "table-0-col-0": "ok", "table-0-col-1": "No quote for this n — look at the PDF", "table-0-row-0": "ok",
      "centres-0": "ok", "centres-1": "The name is not in the PDF",
    });
    const first = items[0];
    expect(first.block).toBe(blocks[1].id);
    expect(first.fields).toEqual(["series.0.points.0.values.0", "series.0.points.0.values.1", "series.0.points.0.values.2"]);
    expect(first.value).toBe("60% · 26% · 14%");
    expect(items.find((x) => x.id === "table-0-row-0")!.fields).toEqual(["rows.0.cells.0", "rows.0.cells.1"]);
    expect(items.find((x) => x.id === "centres-1")!.block).toBe(blocks[3].id);
  });
  it("a point needs a value per category, a row a cell per column — said in words", () => {
    const bad = { ...raw, distributions: [{ ...raw.distributions[0], series: [{ label: "x", points: [{ ...raw.distributions[0].series[0].points[0], values: ["60", "40"] }] }] }] };
    const r = parseAnswer(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/one value per scale category/);
    const badT = parseAnswer(JSON.stringify({ ...raw, tables: [{ ...raw.tables[0], rows: [{ label: "x", cells: ["1"], quote: "q" }] }] }));
    expect(!badT.ok && badT.error).toMatch(/one cell per column/);
  });
  it("centres are asked only of a study; tables and distributions of studies and publications", () => {
    expect(instructionsFor("study")).toMatch(/"centres" \(optional\)/);
    expect(instructionsFor("publication")).toMatch(/"centres": \[\]/);
    expect(instructionsFor("publication")).toMatch(/"distributions" \(optional/);
    expect(instructionsFor("news")).toMatch(/"distributions": \[\] and "tables": \[\]/);
  });
});
