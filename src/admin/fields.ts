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
  /** Edited on the page (ADR-007): not in the form; a form save keeps the current value. */
  onPage?: boolean;
};

export type ListColumn = {
  name: string;
  label: string;
  /** Render helper for special columns */
  kind?: "status" | "date" | "region" | "regions" | "product" | "boolean" | "eventWhen";
};
