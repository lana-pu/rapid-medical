import { isEditing } from "@/lib/editing";

/**
 * Tells the page editor which record holds this page (pages stored as block lists, ADR-007).
 * Rendered only in editor mode: an invisible element the client reads on load.
 */
export async function PageMark({ r, id }: { r: string; id: number }) {
  if (!(await isEditing())) return null;
  return <i hidden data-rm-page={JSON.stringify({ r, id })} />;
}
