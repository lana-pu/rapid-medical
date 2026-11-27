/**
 * Declarative field definitions used to render admin forms,
 * validate submissions and map them onto Drizzle tables.
 */
export type FieldType =
  | "text"
  | "slug"
  | "textarea"
  | "markdown" // rich text (stored as HTML)
  | "json" // raw JSON textarea → object
  | "link" // {label, href}
  | "table" // SpecTable {columns, rows}
  | "number"
  | "boolean"
  | "select"
  | "date"
  | "month" // month and year → date (the 1st of that month)
  | "image"
  | "url"
  | "regions" // multi-select of regions → jsonb Region[]
  | "region" // single region enum
  | "product" // FK to products
  | "status"
  | "repeater" // array of objects → jsonb
  | "stringList" // array of strings → jsonb
  | "blocks"; // the page as a block list (ADR-007) — edited on the page only

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** For repeater: sub-fields of each item */
  fields?: FieldDef[];
  /** Group fields into a titled section in the form */
  section?: string;
  /** Narrow column (half width) */
  half?: boolean;
  rows?: number;
  /** A recommended length: the form counts characters «42 / 60» beside the label (docs/screens/admin-record-edit.md) */
  max?: number;
  /** Edited on the page (ADR-007): not in the form; a form save keeps the current value. */
  onPage?: boolean;
  /** Repeater: items start folded; `summary` — the fields shown on a folded item, joined by « · » */
  folded?: boolean;
  summary?: string[];
  /** Repeater sub-field: shown inside a folded «{fold}» part of the item (an office's map pin) */
  fold?: string;
  /** A list of email addresses separated by commas: checked on save (Where requests go) */
  emails?: boolean;
  /** Set when the record is created, then shown as text (a page's region: another region is a copy of the page). */
  fixedAfterCreate?: boolean;
};

export type ListColumn = {
  name: string;
  label: string;
  /**
   * Render helper for special columns. Columns without a kind (and region, regions, product) are secondary: the list
   * shows them in the line under the name (docs/screens/admin-list.md → «Иерархия»); a `number` keeps its own column.
   */
  kind?: "status" | "date" | "region" | "regions" | "product" | "boolean" | "eventWhen" | "number" | "to";
};
