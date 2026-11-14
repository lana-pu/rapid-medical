import { isEditing } from "@/lib/editing";

/**
 * In the page editor, a section hidden on the site (docs/screens/on-page-editor.md → «Скрытые секции») folds into this
 * strip; its «Show» is handled by the editor overlay. Visitors never get the section or the strip.
 * Editor chrome over the site: the editor's own neutral palette, not the site's tokens (as editor-ui.tsx).
 */
export async function HiddenStrip({ uid, name }: { uid?: string; name: string }) {
  if (!uid || !(await isEditing())) return null;
  return (
    <div data-rm-hidden={uid} className="mx-auto my-2 flex max-w-6xl items-center gap-3 rounded border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
      <span className="min-w-0 flex-1 truncate">Hidden on the site · {name}</span>
      <button type="button" data-rm-show={uid} className="rounded border border-neutral-300 bg-white px-2 py-0.5 font-medium text-neutral-800 hover:bg-neutral-100">
        Show
      </button>
    </div>
  );
}
