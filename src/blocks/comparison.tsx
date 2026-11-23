import { Section, SharedLine } from "@/components/site/primitives";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type ComparisonVariant = "default";

/** DESIGN.md → Набор инфографики → Сравнение групп: groups as bars, each with its n; the endpoint and p-value below. */
export type ComparisonData = {
  title?: string | null;
  /** what is measured (the endpoint's definition), small under the bars */
  endpoint?: string | null;
  /** "%" (a 0–100 scale) or "" (scale to the largest value) */
  unit?: string | null;
  pValue?: string | null;
  groups: { label: string; value: string; n?: string | null; quote?: string | null }[];
};

const num = (v: string) => Number(String(v).replace(",", ".").replace(/[^\d.]/g, "")) || 0;

function Comparison({ data: d, edit: e, nested }: BlockProps<"comparison">) {
  const groups = (d.groups ?? []).filter((g) => g.label && g.value);
  if (!groups.length) return null;
  const pct = (d.unit ?? "%") === "%";
  const max = pct ? 100 : Math.max(...groups.map((g) => num(g.value)), 1);
  const inner = (
    <SharedLine title={<F e={e} k="title">{d.title || "Comparison"}</F>} className="mt-16">
      <ul className="space-y-5">
        {groups.map((g, j) => (
          <li key={j} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-4">
            <div className="text-sm">
              <div className="font-medium"><F e={e} k={`groups.${j}.label`}>{g.label}</F></div>
              {g.n && <div className="text-xs text-muted">n = <F e={e} k={`groups.${j}.n`}>{g.n}</F></div>}
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border" aria-hidden>
              <div className={`h-full rounded-full ${j === 0 ? "bg-accent" : "bg-muted"}`} style={{ width: `${Math.min(100, (num(g.value) / max) * 100)}%` }} />
            </div>
            <div className="text-2xl font-semibold tabular-nums"><F e={e} k={`groups.${j}.value`}>{g.value}</F>{pct && !String(g.value).includes("%") ? "%" : ""}</div>
          </li>
        ))}
      </ul>
      {(d.endpoint || d.pValue) && (
        <p className="mt-5 text-xs text-muted">
          {d.endpoint && <F e={e} k="endpoint">{d.endpoint}</F>}
          {d.endpoint && d.pValue ? " · " : ""}
          {d.pValue && <>p <F e={e} k="pValue">{d.pValue}</F></>}
        </p>
      )}
    </SharedLine>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const comparison: BlockDef<"comparison"> = {
  type: "comparison",
  name: "Comparison of groups",
  description: "Two or more groups as bars, each with its n; the endpoint and p-value under them — values from the approved document.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Shared line: the title on the left, a bar per group on the right" }],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "groups", label: "Groups: label, value (required), n", kind: "items", required: true },
    { key: "unit", label: "Unit (% or empty)", kind: "text" },
    { key: "endpoint", label: "Endpoint (what is measured)", kind: "text" },
    { key: "pValue", label: "p-value", kind: "text" },
  ],
  example: {
    title: "Successful reperfusion at 24 hours",
    unit: "%",
    groups: [{ label: "Treatment", value: "45", n: "29" }, { label: "Control", value: "15", n: "36" }],
    endpoint: "Sample endpoint definition.",
    pValue: "< 0.05",
  },
  Component: Comparison,
};
