import type { SpecTable } from "@/db/schema";
import { Section, Img } from "@/components/site/primitives";
import { SpecTableView } from "@/components/site/SpecTable";
import { F, FM } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type SpecTableVariant = "table" | "images";

export type SpecTableData = {
  table?: SpecTable | null;
  /** `images`, old format: screenshots of the spec table. */
  images?: string[];
  note?: string | null;
};

function SpecTableBlock({ variant, data: d, edit: e, nested }: BlockProps<"specTable">) {
  let inner;
  if (variant === "table") {
    if (!d.table || d.table.columns.length === 0) return null;
    inner = (
      <>
        <SpecTableView t={d.table} />
        {d.note && <p className="mt-2 text-xs italic text-muted">*<F e={e} k="note">{d.note}</F></p>}
      </>
    );
  } else {
    inner = (
      <>
        {(d.images ?? []).map((u, j) => <FM key={u} e={e} k={`images.${j}`} className="mt-4"><Img src={u} className="w-full rounded border border-border" /></FM>)}
        {d.note && <p className="mt-2 text-xs italic text-muted"><F e={e} k="note">{d.note}</F></p>}
      </>
    );
  }
  return nested ? inner : <Section>{inner}</Section>;
}

export const specTable: BlockDef<"specTable"> = {
  type: "specTable",
  name: "Spec table",
  description: "Device specifications as a table.",
  category: "content",
  nestable: true,
  variants: [
    { id: "table", label: "Table", description: "Columns and rows, paste from Excel" },
    { id: "images", label: "Images (old format)", description: "Screenshots of the table from Duda, until it is retyped as a table" },
  ],
  fields: [
    { key: "table", label: "Table: caption, columns, rows", kind: "table" },
    { key: "images", label: "Images (old format)", kind: "media" },
    { key: "note", label: "Footnote", kind: "text" },
  ],
  example: {
    table: {
      columns: ["Model", "Diameter", "Length", "Microcatheter"],
      rows: [
        ["Sample model A", "1.0–2.0 mm", "10 mm", "0.010″"],
        ["Sample model B", "2.0–3.0 mm", "20 mm", "0.020″"],
      ],
    },
    note: "Sample values, not product data.",
  },
  examples: {
    images: { images: ["/uploads/features/tt-visibility.jpg"], note: "Sample image, not product data." },
  },
  Component: SpecTableBlock,
};
