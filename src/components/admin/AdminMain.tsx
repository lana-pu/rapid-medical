import { DEMO } from "@/lib/demo";

/** The working area right of the space's column. */
export function AdminMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-w-0 flex-1 p-8">
      {DEMO && <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Admin preview (demo): everything is clickable, but Save / Publish only show a confirmation — nothing is stored.</div>}
      {children}
    </main>
  );
}
