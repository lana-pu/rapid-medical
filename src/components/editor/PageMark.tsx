import { isEditing } from "@/lib/editing";
import { DEMO } from "@/lib/demo";
import { PRESETS } from "@/blocks/templates";

/**
 * Tells the page editor which record holds this page (pages stored as block lists, ADR-007).
 * Rendered only in editor mode: an invisible element the client reads on load.
 */
export async function PageMark({ r, id }: { r: string; id: number }) {
  if (!(await isEditing())) return null;
  // the static demo has no server to ask for the section presets: they come with the page
  return <i hidden data-rm-page={JSON.stringify({ r, id })} data-rm-presets={DEMO ? JSON.stringify(PRESETS) : undefined} />;
}
