import { Section, SharedLine } from "@/components/site/primitives";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type DotMatrixVariant = "default";

/** DESIGN.md → Набор инфографики → Матрица точек: one dot per patient (or per a few above 100), N of M per group. */
export type DotMatrixData = {
  title?: string | null;
  /** what one dot means */
  caption?: string | null;
  groups: { label: string; count: string; total: string; quote?: string | null }[];
};

const int = (v: string) => Math.max(0, Math.round(Number(String(v).replace(/[^\d.]/g, "")) || 0));

function Dots({ count, total }: { count: number; total: number }) {
  const per = total > 100 ? Math.ceil(total / 100) : 1;
  const dots = Math.ceil(total / per);
  const filled = Math.round(count / per);
  return (
    <div className="grid w-fit grid-cols-10 gap-1.5" role="img" aria-label={`${count} of ${total}`}>
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} className={`h-3 w-3 rounded-full ${i < filled ? "bg-accent" : "border border-muted"}`} />
      ))}
    </div>
  );
}

function DotMatrix({ data: d, edit: e, nested }: BlockProps<"dotMatrix">) {
  const groups = (d.groups ?? []).filter((g) => g.label && int(g.total) > 0);
  if (!groups.length) return null;
  const per = Math.max(...groups.map((g) => (int(g.total) > 100 ? Math.ceil(int(g.total) / 100) : 1)));
  const inner = (
    <SharedLine title={<F e={e} k="title">{d.title || "Patients"}</F>} className="mt-16">
      <ul className="flex flex-wrap gap-10">
        {groups.map((g, j) => (
          <li key={j}>
            <Dots count={int(g.count)} total={int(g.total)} />
            <div className="mt-3 text-2xl font-semibold tabular-nums">
              <F e={e} k={`groups.${j}.count`}>{g.count}</F> of <F e={e} k={`groups.${j}.total`}>{g.total}</F>
            </div>
            <div className="text-sm text-muted"><F e={e} k={`groups.${j}.label`}>{g.label}</F></div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-muted">
        {d.caption ? <F e={e} k="caption">{d.caption}</F> : null}
        {per > 1 ? `${d.caption ? " · " : ""}One dot = ${per} patients.` : ""}
      </p>
    </SharedLine>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const dotMatrix: BlockDef<"dotMatrix"> = {
  type: "dotMatrix",
  name: "Dot matrix",
  description: "One dot per patient: N of M for each group, side by side — values from the approved document.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Shared line: the title on the left, a matrix per group on the right" }],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "groups", label: "Groups: label, count, total (required)", kind: "items", required: true },
    { key: "caption", label: "What one dot means", kind: "text" },
  ],
  example: {
    title: "Excellent outcome at 90 days",
    caption: "Each dot is one patient in ten.",
    groups: [{ label: "Treatment", count: "4", total: "10" }, { label: "Control", count: "3", total: "10" }],
  },
  Component: DotMatrix,
};
