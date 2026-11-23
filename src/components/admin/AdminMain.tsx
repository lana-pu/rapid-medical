import { DEMO } from "@/lib/demo";
import { MAIN_PAD } from "./chrome";

/**
 * The working area right of the space's column. A size container: what is inside lays out by the area's own width,
 * not the window's — the rail and the column take part of it (docs/admin-ia.md → «Адаптив»).
 */
export function AdminMain({ children }: { children: React.ReactNode }) {
  return (
    <main className={`@container min-w-0 flex-1 ${MAIN_PAD}`}>
      {DEMO && <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Admin preview (demo): everything is clickable, but Save / Publish only show a confirmation — nothing is stored.</div>}
      {children}
    </main>
  );
}
