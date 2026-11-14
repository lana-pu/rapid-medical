"use client";

import { useCallback, useEffect, useState } from "react";
import type { RegionColumn } from "@/admin/page-editor";
import type { RegionRow } from "@/blocks/region-table";

/**
 * ⇄ Regions: this page's texts in every region that has it, as rows × regions (on-page-editor.md → «Тексты по регионам»,
 * like Framer's localization table). A cell saves like a field on the page — into that region's draft.
 * Editor chrome: the editor's own neutral palette (as editor-ui.tsx).
 */
type Load = () => Promise<{ regions: RegionColumn[]; rows: RegionRow[] } | { error: string }>;
type Save = (col: RegionColumn, f: string, value: string) => Promise<boolean>;

export function RegionsTable({ load, save, compare, compareLabel, onCompare }: { load: Load; save: Save; compare: boolean; compareLabel: string | null; onCompare: (region: string) => void }) {
  const [data, setData] = useState<{ regions: RegionColumn[]; rows: RegionRow[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diffOnly, setDiffOnly] = useState(false);
  const [editing, setEditing] = useState<{ row: string; col: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const take = useCallback((r: Awaited<ReturnType<Load>>) => {
    if ("error" in r) setError(r.error);
    else {
      setError(null);
      setData(r);
    }
  }, []);
  const reload = useCallback(async () => take(await load()), [load, take]);
  useEffect(() => {
    let alive = true;
    void load().then((r) => alive && take(r));
    return () => {
      alive = false;
    };
  }, [load, take]);

  if (error) return <p className="p-4 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="p-4 text-sm text-neutral-500">Loading…</p>;
  const rows = diffOnly ? data.rows.filter((r) => r.differs) : data.rows;
  const nDiff = data.rows.filter((r) => r.differs).length;

  const commit = async (row: RegionRow, col: number, value: string) => {
    setEditing(null);
    const cell = row.cells[col];
    if (!cell || value === cell.value) return;
    setBusy(true);
    try {
      if (await save(data.regions[col], cell.f, value)) await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-2 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
          Only differences ({nDiff})
        </label>
        {compare && (
          <select aria-label="Compare with" className="rounded border border-neutral-300 px-2 py-1 text-sm" value="" onChange={(e) => onCompare(e.target.value)}>
            <option value="">{compareLabel ? `Outlined on the page: differs from ${compareLabel}` : "Outline differences on the page…"}</option>
            {data.regions.filter((c) => !c.current).map((c) => <option key={c.region} value={c.region}>{c.label}</option>)}
            {compareLabel && <option value="off">Stop outlining</option>}
          </select>
        )}
        <span className="text-xs text-neutral-500">A change is saved in that region as unpublished; publish it there.</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-50">
            <tr>
              <th className="w-64 border-b border-neutral-200 px-3 py-2 text-left font-medium text-neutral-600">Text</th>
              {data.regions.map((c) => (
                <th key={c.region} className="border-b border-l border-neutral-200 px-3 py-2 text-left font-medium">
                  {c.label}
                  {c.current && <span className="ml-1 text-xs font-normal text-neutral-500">(this page)</span>}
                  {!c.current && c.pending && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-normal text-amber-900">unpublished changes</span>}
                  {!c.current && c.path && <a href={c.path} className="ml-2 text-xs font-normal underline">Open</a>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const head = i === 0 || rows[i - 1].section !== row.section || rows[i - 1].onlyIn !== row.onlyIn;
              return [
                head && (
                  <tr key={`s-${row.key}`}>
                    <td colSpan={data.regions.length + 1} className="bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                      {row.section}
                      {row.hidden && " · hidden on the site"}
                      {row.onlyIn !== undefined && ` · only in ${data.regions[row.onlyIn].label}`}
                    </td>
                  </tr>
                ),
                <tr key={row.key} className={row.differs ? "bg-amber-50/60" : ""}>
                  <td className="border-b border-neutral-100 px-3 py-2 align-top text-xs text-neutral-500">{row.field}</td>
                  {row.cells.map((cell, col) => (
                    <td key={col} className="border-b border-l border-neutral-100 px-3 py-2 align-top">
                      {!cell ? (
                        <span className="text-neutral-300">—</span>
                      ) : cell.rich ? (
                        <span className="line-clamp-3 text-neutral-600" title="Formatted text: edit it on the page">{cell.value.replace(/<[^>]+>/g, " ")}</span>
                      ) : editing?.row === row.key && editing.col === col ? (
                        <textarea
                          autoFocus
                          aria-label={`${row.field} in ${data.regions[col].label}`}
                          defaultValue={cell.value}
                          rows={Math.min(6, Math.max(1, Math.ceil(cell.value.length / 48)))}
                          disabled={busy}
                          className="w-full resize-y rounded border border-blue-500 px-1.5 py-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Escape") setEditing(null);
                            else if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void commit(row, col, e.currentTarget.value);
                            }
                          }}
                          onBlur={(e) => void commit(row, col, e.currentTarget.value)}
                        />
                      ) : (
                        <button type="button" disabled={busy} onClick={() => setEditing({ row: row.key, col })} className="w-full whitespace-pre-wrap rounded px-1 py-0.5 text-left hover:bg-blue-50">
                          {cell.value}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>,
              ];
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-4 text-sm text-neutral-500">{diffOnly ? "The texts are the same in every region." : "No texts on this page."}</p>}
      </div>
    </div>
  );
}
