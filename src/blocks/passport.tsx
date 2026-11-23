import { Section, KeyValue, SharedLine } from "@/components/site/primitives";
import { safeHref } from "@/lib/safe-path";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type PassportVariant = "default";

/**
 * Study at a glance (DESIGN.md → Набор инфографики → Паспорт исследования): design, regulation, patients, centres,
 * dates, who assessed, NCT — only values found in the approved document, which is named under the table.
 */
export type PassportData = {
  title?: string | null;
  rows: { label: string; value: string }[];
  /** where the values come from (the document; ClinicalTrials.gov for an NCT) */
  source?: { label: string; href?: string | null } | null;
};

function Passport({ data: d, edit: e, nested }: BlockProps<"passport">) {
  const rows = (d.rows ?? []).filter((r) => r.label && r.value);
  if (!rows.length) return null;
  // the source's name and address (a document without an address can get one here)
  const source = d.source?.label ? <F e={e} k="source.label" kh="source.href" kind="link">{d.source.label}</F> : null;
  const inner = (
    <SharedLine title={<F e={e} k="title">{d.title || "Study at a glance"}</F>} className="mt-16">
      <KeyValue rows={rows.map((r, i) => ({ label: <F e={e} k={`rows.${i}.label`}>{r.label}</F>, value: <F e={e} k={`rows.${i}.value`}>{r.value}</F> }))} />
      {d.source?.label && (
        <p className="mt-3 text-xs text-muted">
          Source: {d.source.href ? <a href={safeHref(d.source.href)} target="_blank" rel="noopener noreferrer" className="underline">{source}</a> : source}
        </p>
      )}
    </SharedLine>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const passport: BlockDef<"passport"> = {
  type: "passport",
  name: "Study at a glance",
  description: "A study's passport: design, patients, centres, dates — only values from the approved document, with the source named.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Shared line: the name on the left, key — value rows and the source on the right" }],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "rows", label: "Rows (label — value)", kind: "items" },
  ],
  example: {
    rows: [
      { label: "Design", value: "Sample design" },
      { label: "Patients", value: "00" },
      { label: "Centres", value: "00 sample centres" },
    ],
    source: { label: "Sample document" },
  },
  Component: Passport,
  flow: () => true,
};
