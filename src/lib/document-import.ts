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
export function findNct(text: string): string | null {
  return /\bNCT\d{8}\b/.exec(text)?.[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Checking a quote against the PDF's text                            */
/* ------------------------------------------------------------------ */

/** Letters, digits and % only, lower case: spaces, line breaks, hyphenation, ligatures and punctuation do not matter. */
export const compact = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^a-z0-9%]/g, "");

/** The quote is in the document, word for word (ignoring spacing and punctuation). Short fragments prove nothing. */
export function quoteFound(text: string, quote: string): boolean {
  const q = compact(quote);
  return q.length >= 12 && compact(text).includes(q);
}

const numbers = (s: string) => (s.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));

/** Every number of the value is in the quote (95% → «… 95% at 6 month follow up»). A value with no number passes. */
export function valueInQuote(value: string, quote: string): boolean {
  const inQuote = new Set(numbers(quote));
  return numbers(value).every((n) => inQuote.has(n));
}

/* ------------------------------------------------------------------ */
/*  The answer of the team's own AI                                    */
/* ------------------------------------------------------------------ */

const text = (max: number) => z.string().trim().min(1).max(max);
const quoted = z.object({ value: text(80), label: text(160), quote: text(600) });

export const AnswerSchema = z.object({
  title: text(200),
  conclusion: text(400),
  figures: z.array(quoted).max(6).default([]),
  passport: z.array(quoted).max(12).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/**
 * The pasted answer → its data, or what is wrong in words. The JSON may come wrapped in a chat's code fence or with a
 * sentence around it: everything from the first «{» to the last «}» is read.
 */
export function parseAnswer(raw: string): { ok: true; answer: Answer } | { ok: false; error: string } {
  const a = raw.indexOf("{");
  const b = raw.lastIndexOf("}");
  if (a < 0 || b <= a) return { ok: false, error: "No JSON found in the answer. Paste the whole reply of your AI, starting with «{»." };
  let data: unknown;
  try {
    data = JSON.parse(raw.slice(a, b + 1));
  } catch {
    return { ok: false, error: "The answer is not valid JSON. Ask your AI to reply with the JSON only, then paste it again." };
  }
  const r = AnswerSchema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues.slice(0, 3).map((i) => `${i.path.join(".") || "answer"}: ${i.message}`);
    return { ok: false, error: `The answer is missing something — ${first.join("; ")}.` };
  }
  return { ok: true, answer: r.data };
}

/** The instructions the team pastes into its own AI chat, with the PDF attached. */
export function instructionsFor(kind: MaterialKind): string {
  const passport =
    kind === "study"
      ? `- "passport": up to 8 rows about the study: Design, Regulation, Patients, Centers, Enrollment period, Assessment (who evaluated the results), Registry (NCT number). Only rows the document states.\n`
      : `- "passport": [] (leave empty for this kind).\n`;
  return `You help publish a ${kind === "news" ? "press release" : kind === "case" ? "clinical case" : kind === "study" ? "clinical study" : "journal publication"} from the attached PDF on a medical device company's website. Every fact must be checkable against the PDF.

Reply with JSON only, no other text:
{
  "title": "...",
  "conclusion": "...",
  "figures": [{ "value": "...", "label": "...", "quote": "..." }],
  "passport": [{ "label": "...", "value": "...", "quote": "..." }]
}

- "title": the document's own title, shortened only if longer than 120 characters.
- "conclusion": the main finding in one sentence, in the document's own words where possible.
- "figures": 3 or 4 key results, most important first. "value" is the number as written (e.g. "95%", "0", "149"); "label" says what it measures in a few words.
${passport}- "quote" (in every figure and passport row): one sentence copied exactly from the PDF, character for character, that contains the value. Do not paraphrase, shorten or fix it.
- Use only what the PDF says. If something is not in the PDF, leave it out. Never estimate, round or combine numbers.`;
}

/* ------------------------------------------------------------------ */
/*  Checks                                                             */
/* ------------------------------------------------------------------ */

export type CheckItem = {
  id: string;
  /** which list of the page it belongs to */
  part: "figures" | "passport";
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
export function checkQuoted(text: string, part: CheckItem["part"], i: number, x: { label: string; value: string; quote: string }): CheckItem {
  const base = { id: `${part}-${i}`, part, label: x.label, value: x.value, quote: x.quote };
  if (!quoteFound(text, x.quote)) return { ...base, status: "check", reason: "The quote is not in the PDF" };
  if (!valueInQuote(x.value, x.quote)) return { ...base, status: "check", reason: "The number is not in the quote" };
  return { ...base, status: "ok" };
}

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
  pdf: { url: string; text: string };
  original?: string | null;
  mode: FullTextMode;
}): StoredBlock[] {
  const eyebrow = [KIND_EYEBROW[o.kind], o.product].filter(Boolean).join(" · ");
  const out: StoredBlock[] = [{ id: blockId(), type: "hero", variant: "page", data: { eyebrow, title: o.title, body: o.answer?.conclusion ?? "" } }];
  if (o.answer?.figures.length) out.push({ id: blockId(), type: "keyNumbers", variant: "figures", data: { items: o.answer.figures.map((f) => ({ value: f.value, label: f.label, note: f.quote })) } });
  if (o.passport.length) out.push({ id: blockId(), type: "passport", variant: "default", data: { title: "Study at a glance", rows: o.passport, source: o.passportSource } });
  const mode: FullTextMode = o.kind === "document" ? "embed" : o.mode;
  const links = [
    ...(mode !== "link" ? [{ label: "Download PDF", href: o.pdf.url }] : []),
    ...(o.original ? [{ label: "Open the original ↗", href: o.original }] : []),
  ];
  out.push({
    id: blockId(),
    type: "richText",
    variant: "document",
    data: {
      html: mode === "copy" ? textToHtml(o.pdf.text) : "",
      meta: [],
      links,
      pdf: mode === "embed" ? { href: o.pdf.url, title: `${o.title} — full document` } : null,
    },
  });
  return out;
}
