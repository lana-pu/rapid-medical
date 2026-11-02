"use client";

import { useState } from "react";
import type { SpecTable } from "@/db/schema";
import { inputCls } from "./ui";

/**
 * Structured table editor (used for product specifications).
 * Supports paste from Excel/Sheets (tab-separated) to fill the whole table.
 */
export function TableEditor({ name, initial }: { name: string; initial: SpecTable | null }) {
  const [t, setT] = useState<SpecTable>(initial ?? { caption: "", columns: [], rows: [], note: "" });
  const empty = t.columns.length === 0;

  const set = (next: SpecTable) => setT(next);
  const setCol = (i: number, v: string) => set({ ...t, columns: t.columns.map((c, idx) => (idx === i ? v : c)) });
  const setCell = (r: number, c: number, v: string) => set({ ...t, rows: t.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)) });
  const addCol = () => set({ ...t, columns: [...t.columns, `Column ${t.columns.length + 1}`], rows: t.rows.map((r) => [...r, ""]) });
  const delCol = (i: number) => set({ ...t, columns: t.columns.filter((_, idx) => idx !== i), rows: t.rows.map((r) => r.filter((_, idx) => idx !== i)) });
  const addRow = () => set({ ...t, rows: [...t.rows, t.columns.map(() => "")] });
  const delRow = (i: number) => set({ ...t, rows: t.rows.filter((_, idx) => idx !== i) });
  const moveRow = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= t.rows.length) return;
    const rows = [...t.rows];
    [rows[i], rows[j]] = [rows[j], rows[i]];
    set({ ...t, rows });
  };
  const start = () => set({ ...t, columns: ["Model", "Diameter", "Length"], rows: [["", "", ""]] });

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text/plain");
    if (!/\t/.test(text) && !/\n/.test(text)) return; // single cell – let the input handle it
    e.preventDefault();
    const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
    const grid = lines.map((l) => l.split("\t"));
    const width = Math.max(...grid.map((r) => r.length));
    const norm = grid.map((r) => [...r, ...Array(width - r.length).fill("")]);
    set({ ...t, columns: norm[0], rows: norm.slice(1) });
  }

  return (
    <div className="space-y-2 rounded border border-neutral-200 bg-neutral-50 p-3" onPaste={onPaste}>
      <input type="hidden" name={name} value={empty ? "" : JSON.stringify(t)} readOnly />
      <input placeholder="Caption (optional)" value={t.caption ?? ""} onChange={(e) => set({ ...t, caption: e.target.value })} className={inputCls} />
      {empty ? (
        <div className="flex items-center gap-3 text-sm text-neutral-600">
          <button type="button" onClick={start} className="rounded border border-neutral-400 bg-white px-3 py-1">Create table</button>
          <span>or paste cells from Excel / Google Sheets anywhere in this box.</span>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-8" />
                {t.columns.map((c, i) => (
                  <th key={i} className="border border-neutral-300 bg-white p-1">
                    <div className="flex items-center gap-1">
                      <input value={c} onChange={(e) => setCol(i, e.target.value)} className="w-full border-0 bg-transparent font-semibold focus:outline-none" />
                      <button type="button" onClick={() => delCol(i)} className="text-red-500" title="Delete column">✕</button>
                    </div>
                  </th>
                ))}
                <th className="p-1"><button type="button" onClick={addCol} className="rounded border border-neutral-400 bg-white px-2" title="Add column">+</button></th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row, r) => (
                <tr key={r}>
                  <td className="p-1 text-neutral-400">
                    <button type="button" onClick={() => moveRow(r, -1)} title="Up">↑</button>
                    <button type="button" onClick={() => moveRow(r, 1)} title="Down">↓</button>
                  </td>
                  {row.map((cell, c) => (
                    <td key={c} className="border border-neutral-300 bg-white p-0">
                      <input value={cell} onChange={(e) => setCell(r, c, e.target.value)} className="w-full border-0 px-1 py-1 focus:bg-blue-50 focus:outline-none" />
                    </td>
                  ))}
                  <td className="p-1"><button type="button" onClick={() => delRow(r)} className="text-red-500" title="Delete row">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex gap-3 text-xs">
            <button type="button" onClick={addRow} className="rounded border border-neutral-400 bg-white px-2 py-1">+ Row</button>
            <button type="button" onClick={() => set({ ...t, columns: [], rows: [] })} className="text-red-600">Clear table</button>
            <span className="text-neutral-500">Tip: paste a range from Excel to replace the whole table.</span>
          </div>
        </div>
      )}
      <input placeholder="Note under the table (optional)" value={t.note ?? ""} onChange={(e) => set({ ...t, note: e.target.value })} className={inputCls} />
    </div>
  );
}
