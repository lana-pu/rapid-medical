/**
 * Links block fields to the stored record for the on-page editor.
 * A block field key ("title", "items.0.body") becomes a record path:
 *  - `map[head]` when the first segment is mapped (`null` = not editable on the page);
 *  - otherwise `prefix + key` when a prefix is set ("benefits.2." → "benefits.2.title");
 *  - otherwise not editable.
 * When pages are stored as block lists the binding becomes `{ prefix: "blocks.{n}.data." }`.
 */
export type EditBinding = { r: string; id?: number; prefix?: string; map?: Record<string, string | null> };

export function fieldPath(e: EditBinding | undefined, key: string): string | null {
  if (!e) return null;
  const dot = key.indexOf(".");
  const head = dot < 0 ? key : key.slice(0, dot);
  const rest = dot < 0 ? "" : key.slice(dot);
  if (e.map && Object.hasOwn(e.map, head)) {
    const to = e.map[head];
    return to === null ? null : to + rest;
  }
  return e.prefix !== undefined ? e.prefix + key : null;
}
