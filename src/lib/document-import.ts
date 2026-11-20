/**
 * «Create from a document» (docs/briefs/create-from-document.md, docs/screens/admin-create-from-document.md): the parts that
 * need no database — what kind of material the PDF looks like, its NCT number, the instructions for the marketing team's
 * own AI, reading the answer, checking every quote against the PDF's text, and the page's blocks. The site never calls an
 * AI (decision 2026-11-14). Safe on client and server.
 */
import { z } from "zod";
import type { MaterialKind, StoredBlock } from "@/db/schema";

/* ------------------------------------------------------------------ */
/*  What the file is: suggested before any AI, from the text itself    */
/* ------------------------------------------------------------------ */

export type Suggestion = { kind: MaterialKind; reason: string };

export function suggestKind(text: string): Suggestion {
  const t = text.toLowerCase();
  const head = t.slice(0, 4000);
  if (/instructions for use/.test(t) || (/contraindications/.test(t) && /warnings/.test(t))) return { kind: "document", reason: "It says «Instructions for Use»: shown as the PDF itself." };
  if (/about rapid medical|media contact|press release|business ?wire|prnewswire/.test(t)) return { kind: "news", reason: "It reads as a press release («About Rapid Medical», media contact)." };
  if (/\bdoi:?\s*10\.\d{4,}/.test(head) || /doi\.org\/10\./.test(head)) return { kind: "publication", reason: "It has a DOI at the top: a journal article." };
  if (/\bresults?\b/.test(t) && /\b(methods?|enrolled|randomi[sz]ed|primary endpoint|patients)\b/.test(t)) return { kind: "study", reason: "It has results and patient numbers: a study." };
  return { kind: "publication", reason: "Nothing points to another kind." };
}

/** The first ClinicalTrials.gov number in the text (NCT + 8 digits). */
/** What the draft is built from: a PDF of the media library, or a web page whose text a person pasted (the site does not fetch it). */
export type DocSource = "pdf" | "page";
/** «the PDF» / «the page text» — the words of every check message; a check of a page has no mediaId. */
export const sourceName = (src: DocSource | { mediaId: number | null }) => ((typeof src === "string" ? src === "page" : src.mediaId == null) ? "the page text" : "the PDF");

/** The kind a web page looks like, from its address (BusinessWire → news, doi.org → publication); news by default. */
export function suggestFromUrl(url: string): Suggestion {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* not a link yet */
  }
  if (/(^|\.)(businesswire|prnewswire|globenewswire)\.com$/.test(host) || /(^|\.)prnewswire\.co\.uk$/.test(host)) return { kind: "news", reason: "The link is a press-release service." };
  if (/(^|\.)(doi\.org|pubmed\.ncbi\.nlm\.nih\.gov|ncbi\.nlm\.nih\.gov)$/.test(host)) return { kind: "publication", reason: "The link is a DOI or PubMed: a journal article." };
  return { kind: "news", reason: "A page on the web — most often a press release or an article about us." };
}

export function findNct(text: string): string | null {
  return /\bNCT\d{8}\b/.exec(text)?.[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Checking a quote against the PDF's text                            */
/* ------------------------------------------------------------------ */

/** Letters, digits and % only, lower case: spaces, line breaks, hyphenation, ligatures and punctuation do not matter. */
export const compact = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^a-z0-9%]/g, "");

/**
 * The quote is in the document, word for word (ignoring spacing and punctuation). A short one (6–11 characters, e.g. a
 * table row «A1 1.6% (1) (0) 1» of a slide) counts only where it stands once in the whole document — then it is clear
 * where it is; shorter fragments prove nothing.
 */
export function quoteFound(text: string, quote: string): boolean {
  const q = compact(quote);
  const t = compact(text);
  if (q.length >= 12) return t.includes(q);
  if (q.length < 6) return false;
  const i = t.indexOf(q);
  return i >= 0 && t.indexOf(q, i + 1) < 0;
}

const numbers = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
/** «seven patients… six of them» — articles write small counts in words (T13, 2026-11-18) */
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const numberWords = (s: string) => (s.toLowerCase().match(/\b[a-z]+\b/g) ?? []).map((w) => WORDS.indexOf(w)).filter((i) => i >= 0).map(String);

/** Every number of the value is in the quote (95% → «… 95% at 6 month follow up»). A value with no number passes. */
export function valueInQuote(value: string, quote: string): boolean {
  const inQuote = new Set([...numbers(quote), ...numberWords(quote)]);
  return numbers(value).every((n) => inQuote.has(n));
}

/* ------------------------------------------------------------------ */
/*  The answer of the team's own AI                                    */
/* ------------------------------------------------------------------ */

const text = (max: number) => z.string().trim().min(1).max(max);
const quoted = z.object({ value: text(80), label: text(160), quote: text(600) });

const opt = (max: number) => z.string().trim().max(max).optional();
const comparisonSchema = z.object({
  title: text(160),
  endpoint: opt(300),
  unit: opt(5),
  pValue: opt(30),
  /** the sentence of the PDF with the p-value — without it the p-value waits for a person */
  pQuote: opt(600),
  groups: z.array(z.object({ label: text(80), value: text(20), n: opt(20), quote: text(600) })).min(2).max(4),
});
const matrixSchema = z.object({
  title: text(160),
  caption: opt(200),
  groups: z.array(z.object({ label: text(80), count: text(10), total: text(10), quote: text(600) })).min(1).max(6),
});
const distributionSchema = z
  .object({
    title: text(160),
    caption: opt(200),
    scale: z.array(text(40)).min(2).max(7),
    series: z.array(z.object({ label: text(80), points: z.array(z.object({ label: text(60), n: opt(20), values: z.array(text(12)).min(2).max(7), quote: text(600) })).min(1).max(6) })).min(1).max(3),
  })
  .refine((d) => d.series.every((s) => s.points.every((p) => p.values.length === d.scale.length)), { message: "every point needs one value per scale category", path: ["series"] });
const tableSchema = z
  .object({
    title: text(160),
    caption: opt(400),
    columns: z.array(z.object({ label: text(80), n: opt(20), quote: opt(600) })).min(1).max(8),
    rows: z.array(z.object({ label: text(160), cells: z.array(z.string().trim().max(60)), quote: text(600) })).min(1).max(30),
  })
  .refine((t) => t.rows.every((r) => r.cells.length === t.columns.length), { message: "every row needs one cell per column", path: ["rows"] });
const place = (max: number) => z.string().trim().min(1).max(max).regex(/^[\p{L}\p{M} .,'()&/-]+$/u, "letters, spaces and . , ' ( ) & / - only");
const centreSchema = z.object({ name: text(160), city: place(80).optional(), country: place(60).optional() });

/** Every part of the answer: its item schema, how many are kept, its name in a message. */
const PARTS = {
  figures: { item: quoted, max: 6, name: "Key figure" },
  passport: { item: quoted, max: 12, name: "Passport row" },
  /** DESIGN.md → Набор инфографики: groups compared (bars) and patients as dots — only when the document compares groups */
  comparisons: { item: comparisonSchema, max: 2, name: "Comparison" },
  matrices: { item: matrixSchema, max: 2, name: "Dot matrix" },
  /** shares over time (mRS, occlusion grades), tables as in the document, the study's centres */
  distributions: { item: distributionSchema, max: 2, name: "Distribution" },
  tables: { item: tableSchema, max: 3, name: "Table" },
  centres: { item: centreSchema, max: 200, name: "Centre" },
} as const;
type Parts = typeof PARTS;
export const AnswerSchema = z.object({
  title: text(200),
  conclusion: text(400),
  ...(Object.fromEntries(Object.entries(PARTS).map(([k, p]) => [k, z.array(p.item).max(p.max).default([])])) as { [K in keyof Parts]: z.ZodDefault<z.ZodArray<Parts[K]["item"]>> }),
});
export type Answer = z.infer<typeof AnswerSchema>;

/**
 * The pasted answer → its data, or what is wrong in words. The JSON may come wrapped in a chat's code fence or with a
 * sentence around it: everything from the first «{» to the last «}» is read.
 */
/** numbers → text, null → not given, "" in a field → not given (an empty table cell stays a cell) */
function tidy(v: unknown): unknown {
  if (typeof v === "number") return String(v);
  if (v === null) return undefined;
  if (Array.isArray(v)) return v.map((x) => (x === null ? "" : tidy(x)));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === "string" && !x.trim() ? undefined : tidy(x)]));
  return v;
}
const itemName = (x: unknown) => {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  const n = [o.title, o.label, o.name].find((v) => typeof v === "string" && v.trim());
  return n ? String(n).slice(0, 60) : "";
};

export function parseAnswer(raw: string): { ok: true; answer: Answer; skipped: string[] } | { ok: false; error: string } {
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a < 0 || b <= a) return { ok: false, error: "No JSON found in the answer. Paste the whole reply of your AI, starting with «{»." };
  let data: unknown;
  try {
    data = JSON.parse(raw.slice(a, b + 1));
  } catch {
    return { ok: false, error: "The answer is not valid JSON. Ask your AI to reply with the JSON only, then paste it again." };
  }
  // what chat AIs do all the time (real answers, 2026-11-18): numbers without quotes, "" or null for «not given»
  const d = tidy(data) as Record<string, unknown> | undefined;
  const core = z.object({ title: text(200), conclusion: text(400) }).safeParse(d ?? {});
  if (!core.success) {
    const first = core.error.issues.slice(0, 2).map((i) => `${i.path.join(".") || "answer"}: ${i.message}`);
    return { ok: false, error: `The answer is missing something — ${first.join("; ")}.` };
  }
  // one part that does not fit (a table too long, a centre with a stray character) is left out with its reason,
  // not the whole answer: dropping a part never puts an unchecked value on the page
  const skipped: string[] = [];
  const parts = {} as { [K in keyof Parts]: z.infer<Parts[K]["item"]>[] };
  for (const [key, p] of Object.entries(PARTS) as [keyof Parts, Parts[keyof Parts]][]) {
    const raw = d?.[key];
    if (raw !== undefined && !Array.isArray(raw)) skipped.push(`${p.name}s: not a list`);
    const list: unknown[] = Array.isArray(raw) ? raw : [];
    const kept: unknown[] = [];
    list.forEach((x, i) => {
      const r = p.item.safeParse(x);
      const name = `${p.name} ${i + 1}${itemName(x) ? ` «${itemName(x)}»` : ""}`;
      if (!r.success) skipped.push(`${name}: ${r.error.issues.slice(0, 2).map((e) => `${e.path.join(".") || "it"} — ${e.message}`).join("; ")}`);
      else if (kept.length >= p.max) skipped.push(`${name}: only ${p.max} kept`);
      else kept.push(r.data);
    });
    (parts as Record<string, unknown[]>)[key] = kept;
  }
  return { ok: true, answer: { ...core.data, ...parts }, skipped };
}

/** The instructions the team pastes into its own AI chat, with the PDF attached. */
export function instructionsFor(kind: MaterialKind, source: DocSource = "pdf"): string {
  const D = source === "pdf" ? "the PDF" : "the text";
  const passport =
    kind === "study"
      ? `- "passport": up to 8 rows about the study: Design, Regulation, Patients, Centers, Enrollment period, Assessment (who evaluated the results), Registry (NCT number). Only rows the document states.\n`
      : `- "passport": [] (leave empty for this kind).\n`;
  const groups =
    kind === "study" || kind === "publication"
      ? `- "comparisons" (optional, only if the document compares groups, e.g. treatment vs control): up to 2, each { "title", "endpoint" (what is measured), "unit" ("%" or ""), "pValue", "pQuote" (the sentence with the p-value), "groups": [{ "label", "value", "n", "quote" }] }. The group's quote must contain its value and its n.
- "matrices" (optional, for "N of M patients" results): up to 2, each { "title", "caption" (what one dot means), "groups": [{ "label", "count", "total", "quote" }] }.
- "distributions" (optional, for shares on a scale at time points, e.g. mRS 0–6 at 90 days or occlusion grades over follow-up): up to 2, each { "title", "caption" (what the scale is), "scale": ["category", ...], "series": [{ "label" (e.g. "All patients" or a group), "points": [{ "label" (time point), "n", "values": ["% for each scale category, in the scale's order"], "quote" }] }] }. One point's values and its n must be in its quote.
- "tables" (optional, a results table as in the document): up to 2, each { "title", "caption", "columns": [{ "label", "n", "quote" (the sentence or header with that n) }], "rows": [{ "label", "cells": ["one per column"], "quote" (the row as it is in the document) }] }.
`
      : `- "comparisons": [], "matrices": [], "distributions": [] and "tables": [] (leave empty for this kind).
`;
  const centres =
    kind === "study"
      ? `- "centres" (optional): the study's centres as the document lists them, each { "name", "city", "country" }. Only centres named in the document.\n`
      : `- "centres": [] (leave empty for this kind).\n`;
  return `You help publish a ${kind === "news" ? "press release" : kind === "case" ? "clinical case" : kind === "study" ? "clinical study" : "journal publication"} ${source === "pdf" ? "from the attached PDF" : "from the text pasted after these instructions"} on a medical device company's website. Every fact must be checkable against ${D}.

Reply with JSON only, no other text:
{
  "title": "...",
  "conclusion": "...",
  "figures": [{ "value": "...", "label": "...", "quote": "..." }],
  "passport": [{ "label": "...", "value": "...", "quote": "..." }],
  "comparisons": [],
  "matrices": [],
  "distributions": [],
  "tables": [],
  "centres": []
}

- "title": the document's own title, shortened only if longer than 120 characters.
- "conclusion": the main finding in one sentence, in the document's own words where possible.
- "figures": 3 or 4 key results, most important first. "value" is the number as written (e.g. "95%", "0", "149"); "label" says what it measures in a few words.
${passport}${groups}${centres}- "quote" (in every figure, passport row, group, point and row): one sentence copied exactly from ${D}, character for character, that contains the value. Do not paraphrase, shorten or fix it.
- Use only what ${D} says. If something is not in ${D}, leave it out. Never estimate, round or combine numbers.`;
}

/* ------------------------------------------------------------------ */
/*  Checks                                                             */
/* ------------------------------------------------------------------ */

export type CheckItem = {
  id: string;
  /** which list of the page it belongs to */
  part: "figures" | "passport" | "comparison" | "matrix" | "distribution" | "table" | "centres";
  /** the page block it is in (an infographic) and the fields of its data it covers — the editor outlines those */
  block?: string;
  fields?: string[];
  label: string;
  value: string;
  quote: string;
  /** ok — found by the site; check — a person must look; confirmed — a person said it is right */
  status: "ok" | "check" | "confirmed";
  reason?: string;
  confirmedBy?: string;
  confirmedAt?: string;
};

/** One quoted value checked against the document. */
export function checkQuoted(text: string, part: CheckItem["part"], i: number, x: { label: string; value: string; quote: string }, src: DocSource = "pdf"): CheckItem {
  const base = { id: `${part}-${i}`, part, label: x.label, value: x.value, quote: x.quote };
  const q = compact(x.quote);
  if (q.length < 6) return { ...base, status: "check", reason: `The quote is too short to check — look at ${sourceName(src)}` };
  if (!quoteFound(text, x.quote)) {
    const many = q.length < 12 && compact(text).includes(q);
    return { ...base, status: "check", reason: many ? `The quote is too short to tell where it stands — look at ${sourceName(src)}` : `The quote is not in ${sourceName(src)}` };
  }
  if (!valueInQuote(x.value, x.quote)) return { ...base, status: "check", reason: "The number is not in the quote" };
  return { ...base, status: "ok" };
}

/**
 * The infographics of the page checked against the document: every number a block shows is a check of its own, tied to
 * its block and to the fields it covers (the editor outlines exactly those).
 */
export function checkGroups(text: string, answer: Answer, blocks: StoredBlock[], src: DocSource = "pdf"): CheckItem[] {
  const of = (type: string) => blocks.filter((b) => b.type === type);
  const [comps, mats, dists, tabs, maps] = [of("comparison"), of("dotMatrix"), of("distribution"), of("dataTable"), of("centresMap")];
  const at = (it: CheckItem, id: string, block: string | undefined, fields: string[], value = it.value): CheckItem => ({ ...it, id, block, fields, value });
  const noQuote = (part: CheckItem["part"], label: string, value: string, what: string): CheckItem => ({ id: "", part, label, value, quote: "", status: "check", reason: `No quote for ${what} — look at ${sourceName(src)}` });
  return [
    // the value (with its «%»), n, the p-value
    ...answer.comparisons.flatMap((c, i) => {
      const block = comps[i]?.id;
      const pct = comparisonUnit(c) === "%";
      const items: CheckItem[] = c.groups.flatMap((g, j) => {
        const label = `${c.title} — ${g.label}`;
        let v = checkQuoted(text, "comparison", j, { label, value: g.value, quote: g.quote }, src);
        if (v.status === "ok" && pct && !g.value.includes("%") && !percentInQuote(g.value, g.quote)) v = { ...v, status: "check", reason: "The quote does not give it in %" };
        const out = [at(v, `comparison-${i}-${j}`, block, [`groups.${j}.value`], pct && !g.value.includes("%") ? `${g.value}%` : g.value)];
        if (g.n) out.push(at(checkQuoted(text, "comparison", j, { label: `${label} — n`, value: g.n, quote: g.quote }, src), `comparison-${i}-${j}-n`, block, [`groups.${j}.n`]));
        return out;
      });
      if (c.pValue) {
        const label = `${c.title} — p-value`;
        const p = c.pQuote ? checkQuoted(text, "comparison", 0, { label, value: c.pValue, quote: c.pQuote }, src) : noQuote("comparison", label, c.pValue, "the p-value");
        items.push(at(p, `comparison-${i}-p`, block, ["pValue"]));
      }
      return items;
    }),
    ...answer.matrices.flatMap((m, i) => m.groups.map((g, j) =>
      at(checkQuoted(text, "matrix", j, { label: `${m.title} — ${g.label}`, value: `${g.count} of ${g.total}`, quote: g.quote }, src), `matrix-${i}-${j}`, mats[i]?.id, [`groups.${j}.count`, `groups.${j}.total`]))),
    // a point: its shares in one quote, given in %, adding up to 100; its n
    ...answer.distributions.flatMap((d, i) => d.series.flatMap((s, si) => s.points.flatMap((pt, pi) => {
      const block = dists[i]?.id;
      const base = `series.${si}.points.${pi}`;
      const label = `${d.title} — ${s.label}, ${pt.label}`;
      const shown = pt.values.map((v) => (v.includes("%") ? v : `${v}%`)).join(" · ");
      let v = checkQuoted(text, "distribution", pi, { label, value: pt.values.join(" "), quote: pt.quote }, src);
      const sum = pt.values.reduce((a, x) => a + (Number(x.replace(",", ".").replace(/[^\d.]/g, "")) || 0), 0);
      if (v.status === "ok" && pt.values.some((x) => !x.includes("%") && !percentInQuote(x, pt.quote))) v = { ...v, status: "check", reason: "The quote does not give them in %" };
      if (v.status === "ok" && Math.abs(sum - 100) > 1.5) v = { ...v, status: "check", reason: `The shares add up to ${Math.round(sum * 10) / 10}%, not 100%` };
      const out = [at(v, `distribution-${i}-${si}-${pi}`, block, pt.values.map((_, k) => `${base}.values.${k}`), shown)];
      if (pt.n) out.push(at(checkQuoted(text, "distribution", pi, { label: `${label} — n`, value: pt.n, quote: pt.quote }, src), `distribution-${i}-${si}-${pi}-n`, block, [`${base}.n`]));
      return out;
    }))),
    // a row: every number of its cells in its quote; a column's n in the column's quote
    ...answer.tables.flatMap((t, i) => {
      const block = tabs[i]?.id;
      const cols = t.columns.flatMap((c, j) => {
        if (!c.n) return [];
        const label = `${t.title} — ${c.label}, n`;
        return [at(c.quote ? checkQuoted(text, "table", j, { label, value: c.n, quote: c.quote }, src) : noQuote("table", label, c.n, "this n"), `table-${i}-col-${j}`, block, [`columns.${j}.n`])];
      });
      const rows = t.rows.map((r, j) =>
        at(checkQuoted(text, "table", j, { label: `${t.title} — ${r.label}`, value: r.cells.join(" "), quote: r.quote }, src), `table-${i}-row-${j}`, block, r.cells.map((_, k) => `rows.${j}.cells.${k}`), r.cells.join(" · ")));
      return [...cols, ...rows];
    }),
    // a centre (no quote: a list of centres has no sentence): its name as whole words in the document, and its city or
    // country there too — what the map shows is checked as well
    ...answer.centres.flatMap((c, j): CheckItem[] => {
      const where = [c.city, c.country].filter(Boolean).join(", ");
      const short = c.name.normalize("NFKD").replace(/[^A-Za-z0-9]/g, "").length < 6;
      const named = !short && wordsIn(text, c.name, 6);
      const placed = (!!c.city && wordsIn(text, c.city, 3)) || (!!c.country && wordsIn(text, c.country, 3));
      const item = (id: string, value: string, ok: boolean, reason: string, fields: string[]): CheckItem =>
        ({ id, part: "centres", label: `${c.name} — ${where}`, value, quote: "", status: ok ? "ok" : "check", ...(ok ? {} : { reason }), block: maps[0]?.id, fields });
      return [
        item(`centres-${j}`, c.name, named, short ? `The name is too short to check — look at ${sourceName(src)}` : `The name is not in ${sourceName(src)}`, [`centres.${j}.name`]),
        item(`centres-${j}-place`, where || "—", placed, where ? `Neither the city nor the country is in ${sourceName(src)}` : "No city or country given", [`centres.${j}.name`]),
      ];
    }),
  ];
}

/** The words are in the text as whole words (case, accents and punctuation aside); shorter than `min` letters — no. */
function wordsIn(text: string, words: string, min: number): boolean {
  const norm = (s: string) => ` ${s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  const w = norm(words);
  return w.trim().replace(/ /g, "").length >= min && norm(text).includes(w);
}

/** «45» on a % scale: the quote says «45%» (the number itself, not part of a bigger one). */
function percentInQuote(value: string, quote: string): boolean {
  return numbers(value).every((n) => new RegExp(`(^|[^\\d.,])${n.replace(".", "[.,]")}\\s*%`).test(quote));
}

/** The scale of a comparison: as the answer says; when it says nothing — % only if every value is written with «%». */
export const comparisonUnit = (c: Answer["comparisons"][number]) => c.unit ?? (c.groups.every((g) => g.value.includes("%")) ? "%" : "");

export const unchecked = (items: CheckItem[] | null | undefined) => (items ?? []).filter((c) => c.status === "check");

/* ------------------------------------------------------------------ */
/*  Passport: the document first, the registry fills gaps              */
/* ------------------------------------------------------------------ */

export type RegistryRow = { key: "design" | "patients" | "centers" | "period" | "status" | "registry"; label: string; value: string };

const KEY: [RegistryRow["key"], RegExp][] = [
  ["centers", /center|centre|site/i],
  ["patients", /patient|enrol+ed|subject|randomi|participants/i],
  ["period", /period|dates|enrollment (?:period|window)/i],
  ["design", /design/i],
  ["registry", /registry|nct/i],
  ["status", /status/i],
];
export const keyOf = (label: string) => KEY.find(([, re]) => re.test(label))?.[0] ?? null;
const firstNumber = (s: string) => numbers(s)[0] ?? null;

/**
 * The passport rows: every row of the document, then the registry's rows the document does not have. A registry number
 * that differs from the document's (SUCCESS: 17 centres in the article, 8 in the registry) → «Check» on the document's row;
 * the page keeps the document's value (decision 2026-11-18).
 */
export function mergePassport(doc: { label: string; value: string }[], registry: RegistryRow[]): { rows: { label: string; value: string }[]; conflicts: { index: number; registry: string }[] } {
  const rows = doc.map((r) => ({ label: r.label, value: r.value }));
  const conflicts: { index: number; registry: string }[] = [];
  for (const g of registry) {
    const i = doc.findIndex((r) => keyOf(r.label) === g.key);
    if (i < 0) {
      rows.push({ label: g.label, value: g.value });
      continue;
    }
    const a = firstNumber(doc[i].value);
    const b = firstNumber(g.value);
    if (a && b && a !== b && g.key !== "period") conflicts.push({ index: i, registry: g.value });
  }
  return { rows, conflicts };
}

/* ------------------------------------------------------------------ */
/*  The page                                                           */
/* ------------------------------------------------------------------ */

export type FullTextMode = "copy" | "embed" | "link";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The PDF's text as paragraphs (pages split by \f; a blank line or a page ends a paragraph; «Wide-\nnecked» joined). */
export function textToHtml(t: string): string {
  return t
    .split(/\f|\n\s*\n/)
    .map((p) => p.replace(/(\w)-\n(\w)/g, "$1$2").replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("\n");
}

const KIND_EYEBROW: Record<MaterialKind, string> = { study: "Study", publication: "Publication", news: "News", case: "Clinical case", document: "Document" };

let seq = 0;
const blockId = () => `doc${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * The material's page from the document (DESIGN.md → Страница из документа): the conclusion under the title, key figures
 * (each with its quote), the passport (a study), the document itself in the chosen full-text mode. A document (IFU) is the
 * PDF only — no summary.
 */
export function documentBlocks(o: {
  kind: MaterialKind;
  title: string;
  product?: string | null;
  answer: Answer | null;
  passport: { label: string; value: string }[];
  passportSource: { label: string; href?: string | null } | null;
  /** the PDF; null for a web page (its pasted text comes in `text`) */
  pdf: { url: string; text: string } | null;
  text?: string;
  original?: string | null;
  mode: FullTextMode;
}): StoredBlock[] {
  const text = o.text ?? o.pdf?.text ?? "";
  const eyebrow = [KIND_EYEBROW[o.kind], o.product].filter(Boolean).join(" · ");
  const out: StoredBlock[] = [{ id: blockId(), type: "hero", variant: "page", data: { eyebrow, title: o.title, body: o.answer?.conclusion ?? "" } }];
  if (o.answer?.figures.length) out.push({ id: blockId(), type: "keyNumbers", variant: "figures", data: { items: o.answer.figures.map((f) => ({ value: f.value, label: f.label, note: f.quote })) } });
  for (const c of o.answer?.comparisons ?? [])
    out.push({ id: blockId(), type: "comparison", variant: "default", data: { title: c.title, endpoint: c.endpoint ?? null, unit: comparisonUnit(c), pValue: c.pValue ?? null, groups: c.groups.map(({ label, value, n, quote }) => ({ label, value, n, quote })) } });
  for (const d of o.answer?.distributions ?? [])
    out.push({ id: blockId(), type: "distribution", variant: "default", data: { title: d.title, caption: d.caption ?? null, scale: d.scale, series: d.series } });
  for (const m of o.answer?.matrices ?? [])
    out.push({ id: blockId(), type: "dotMatrix", variant: "default", data: { title: m.title, caption: m.caption ?? null, groups: m.groups } });
  for (const t of o.answer?.tables ?? [])
    out.push({ id: blockId(), type: "dataTable", variant: "default", data: { title: t.title, caption: t.caption ?? null, columns: t.columns.map(({ label, n }) => ({ label, n: n ?? null })), rows: t.rows.map(({ label, cells }) => ({ label, cells })) } });
  if (o.passport.length) out.push({ id: blockId(), type: "passport", variant: "default", data: { title: "Study at a glance", rows: o.passport, source: o.passportSource } });
  if (o.answer?.centres.length) out.push({ id: blockId(), type: "centresMap", variant: "default", data: { title: "Where the study ran", caption: null, centres: o.answer.centres.map(({ name, city, country }) => ({ name, city: city ?? null, country: country ?? null })) } });
  // a page has no PDF to show: its text is copied or it is linked
  const mode: FullTextMode = !o.pdf ? (o.mode === "link" ? "link" : "copy") : o.kind === "document" ? "embed" : o.mode;
  const links = [
    ...(o.pdf && mode !== "link" ? [{ label: "Download PDF", href: o.pdf.url }] : []),
    ...(o.original ? [{ label: "Open the original ↗", href: o.original }] : []),
  ];
  out.push({
    id: blockId(),
    type: "richText",
    variant: "document",
    data: {
      html: mode === "copy" ? textToHtml(text) : "",
      meta: [],
      links,
      pdf: mode === "embed" && o.pdf ? { href: o.pdf.url, title: `${o.title} — full document` } : null,
    },
  });
  return out;
}
