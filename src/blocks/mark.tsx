import { isEditing } from "@/lib/editing";

/**
 * Invisible mark before a stored section, read by the page editor (no wrappers: the layout stays as visitors see it).
 * A section spans from its mark to the next mark of the same list (`l`: "" — the page, or a list inside a
 * Product details tab); every list ends with an `end` mark.
 */
export type MarkInfo = { t?: string; v?: string; n?: string; p?: boolean };

export async function Mark({ i, uid, l = "", info = {} }: { i: number; uid?: string; l?: string; info?: MarkInfo }) {
  if (!uid || !(await isEditing())) return null;
  return <i hidden data-rm-b={JSON.stringify({ i, id: uid, ...(l ? { l } : {}), ...info })} />;
}

/** The list a section inside a tab belongs to: its address without the last position. */
export const listOf = (uid: string) => uid.slice(0, uid.lastIndexOf("/"));
