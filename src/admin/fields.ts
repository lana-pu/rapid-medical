/**
 * Declarative field definitions used to render admin forms,
 * validate submissions and map them onto Drizzle tables.
 */
export type FieldType =
  | "text"
  | "slug"
  | "textarea"
  | "markdown"
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
  | "stringList"; // array of strings → jsonb

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
};

export type ListColumn = {
  name: string;
  label: string;
  /** Render helper for special columns */
  kind?: "status" | "date" | "region" | "regions" | "product" | "boolean";
};
