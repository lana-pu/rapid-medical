import type { SpecTable } from "@/db/schema";

export function SpecTableView({ t }: { t: SpecTable }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {t.caption && <caption className="mb-2 text-left font-medium">{t.caption}</caption>}
        <thead>
          <tr>{t.columns.map((c, i) => <th key={i} className="border-b-2 border-foreground px-3 py-2 text-left font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody>
          {t.rows.map((r, ri) => (
            <tr key={ri} className="odd:bg-surface">
              {r.map((cell, ci) => <td key={ci} className="border-b border-border px-3 py-2 align-top">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
