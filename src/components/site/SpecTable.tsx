import type { ReactNode } from "react";
import type { SpecTable } from "@/db/schema";

/** On a phone the first column (the model) stays in place while the table scrolls sideways (docs/screens/therapy.md). */
const first = (i: number) => (i === 0 ? "sticky left-0 z-10 bg-inherit" : "");

/** `render` wraps a text of the table by its path in it («caption», «columns.1», «rows.0.2») — the editor's text fields. */
export function SpecTableView({ t, render }: { t: SpecTable; render?: (text: string, at: string) => ReactNode }) {
  const text = (v: string, at: string) => (render ? render(v, at) : v);
  return (
    <>
      {t.columns.length > 3 && <p className="mt-4 text-xs text-muted md:hidden">Scroll the table sideways →</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {t.caption && <caption className="mb-2 text-left font-medium">{text(t.caption, "caption")}</caption>}
          <thead>
            <tr className="bg-background">{t.columns.map((c, i) => <th key={i} className={`border-b-2 border-foreground px-3 py-2 text-left font-semibold ${first(i)}`}>{text(c, `columns.${i}`)}</th>)}</tr>
          </thead>
          <tbody>
            {t.rows.map((r, ri) => (
              <tr key={ri} className="odd:bg-surface even:bg-background">
                {r.map((cell, ci) => <td key={ci} className={`border-b border-border px-3 py-2 align-top ${first(ci)}`}>{text(cell, `rows.${ri}.${ci}`)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
