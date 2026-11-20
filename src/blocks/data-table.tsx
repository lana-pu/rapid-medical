import { Section, SharedLine } from "@/components/site/primitives";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type DataTableVariant = "default";

/** DESIGN.md → Набор инфографики → Таблица: rows and columns as in the document, n under each column's header. */
export type DataTableData = {
  title?: string | null;
  caption?: string | null;
  columns: { label: string; n?: string | null }[];
  rows: { label: string; cells: string[] }[];
};

function DataTable({ data: d, edit: e, nested }: BlockProps<"dataTable">) {
  const cols = d.columns ?? [];
  // the stored positions survive the filter: field paths (edits, PDF checks) point at the stored data
  const rows = (d.rows ?? []).map((r, ri) => ({ ...r, ri })).filter((r) => r.label);
  if (!cols.length || !rows.length) return null;
  const inner = (
    <SharedLine title={<F e={e} k="title">{d.title || "Results"}</F>} className="mt-16">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${cols.length > 2 ? "min-w-[28rem]" : ""}`}>
          <thead>
            <tr className="border-b border-border text-left align-bottom">
              <th scope="col" className="py-2 pr-4 font-medium"><span className="sr-only">Row</span></th>
              {cols.map((c, j) => (
                <th key={j} scope="col" className="px-3 py-2 text-right font-medium">
                  <F e={e} k={`columns.${j}.label`}>{c.label}</F>
                  {c.n && <div className="text-xs font-normal text-muted">n = <F e={e} k={`columns.${j}.n`}>{c.n}</F></div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ri} className="border-b border-border">
                <th scope="row" className="py-2 pr-4 text-left font-normal"><F e={e} k={`rows.${r.ri}.label`}>{r.label}</F></th>
                {cols.map((_, j) => <td key={j} className="px-3 py-2 text-right tabular-nums"><F e={e} k={`rows.${r.ri}.cells.${j}`}>{r.cells?.[j] ?? ""}</F></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d.caption && <p className="mt-3 text-xs text-muted"><F e={e} k="caption">{d.caption}</F></p>}
    </SharedLine>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const dataTable: BlockDef<"dataTable"> = {
  type: "dataTable",
  name: "Results table",
  description: "A table as in the document: rows, columns with n under each header — values from the approved document.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Shared line: the title on the left, the table on the right; scrolls sideways when wider than the screen" }],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "columns", label: "Columns: label, n (required)", kind: "items", required: true },
    { key: "rows", label: "Rows: label, a cell per column (required)", kind: "items", required: true },
    { key: "caption", label: "Note under the table", kind: "text" },
  ],
  example: {
    title: "Safety outcomes",
    caption: "Sample note: values are % of patients.",
    columns: [{ label: "Treatment", n: "29" }, { label: "Control", n: "36" }],
    rows: [{ label: "Sample outcome A", cells: ["3.4", "5.6"] }, { label: "Sample outcome B", cells: ["0", "2.8"] }],
  },
  Component: DataTable,
};
