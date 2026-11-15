"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { diffWords } from "diff";
import type { RegionColumn } from "@/admin/page-editor";
import { regionTexts } from "@/admin/page-editor";
import { saveField } from "@/admin/inline";
import { publishResource } from "@/admin/actions";
import type { RegionCell, RegionRow } from "@/blocks/region-table";
import { MediaPicker } from "./MediaPicker";
import { PreviewModal, type Previewed } from "./FilePreview";

/**
 * «Differences between regions» (docs/screens/admin-sections.md → «Экран страницы»): what differs between the regional
 * copies of a page — texts, pictures, videos, PDFs — as rows × regions, readable in full, changed words highlighted
 * against the first region, edited in place into that region's draft. Admin chrome: its own neutral palette.
 */

type Data = { regions: RegionColumn[]; rows: RegionRow[] };
const plain = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const fileName = (u: string) => decodeURIComponent(u.split(/[?#]/)[0].split("/").pop() ?? u);

/**
 * A row's place in words: the path up to the last «›» becomes the group's heading, the rest the row's name; a table
 * cell («Table · rows 2 3») reads «Row 2 (its first cell), column 3».
 */
function placeOf(rows: RegionRow[]) {
  const cut = (field: string) => {
    const i = field.lastIndexOf(" › ");
    return i < 0 ? { group: "", name: field } : { group: field.slice(0, i), name: field.slice(i + 3) };
  };
  const firstCell = new Map<string, string>();
  for (const r of rows) {
    const { group, name } = cut(r.field);
    const m = /rows (\d+) 1$/.exec(name);
    const v = r.cells.find((c) => c && !c.media)?.value;
    if (m && v) firstCell.set(`${r.section}|${group}|${m[1]}`, plain(v).slice(0, 40));
  }
  return (r: RegionRow) => {
    const { group, name } = cut(r.field);
    const m = /^(.*?)\s*·?\s*rows (\d+) (\d+)$/.exec(name);
    if (!m) return { group, name };
    const head = firstCell.get(`${r.section}|${group}|${m[2]}`);
    return { group: [group, m[1]].filter(Boolean).join(" › "), name: `Row ${m[2]}${head && m[3] !== "1" ? ` (${head})` : ""}, column ${m[3]}` };
  };
}

/** This region's text, with the words that differ from the first region marked. */
function Marked({ text, base }: { text: string; base: string | null }) {
  if (base === null || base === text) return <>{text}</>;
  return (
    <>
      {diffWords(base, text).map((p, i) => (p.removed ? null : <span key={i} className={p.added ? "rounded-sm bg-amber-200/80" : ""}>{p.value}</span>))}
    </>
  );
}

export function RegionDiff({ initial, ref0, thumbs: thumbs0, editHref, back }: { initial: Data; ref0: { r: string; id: number }; thumbs: Record<string, string>; editHref: Record<number, string>; back: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [thumbs, setThumbs] = useState(thumbs0);
  const [everything, setEverything] = useState(false);
  const [editing, setEditing] = useState<{ row: string; col: number } | null>(null);
  const [picking, setPicking] = useState<{ row: RegionRow; col: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Previewed | null>(null);

  const rows = everything ? data.rows : data.rows.filter((r) => r.differs);
  const place = placeOf(data.rows);
  const nDiff = data.rows.filter((r) => r.differs).length;

  const save = async (row: RegionRow, col: number, kind: "text" | "image" | "video" | "url", value: string) => {
    const cell = row.cells[col];
    const region = data.regions[col];
    if (!cell || value === cell.value) return;
    setBusy(true);
    setError(null);
    try {
      await saveField({ r: region.r, id: region.id, f: cell.f }, kind, value);
      const next = await regionTexts(ref0, true);
      if ("error" in next) setError(next.error);
      else setData(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not saved");
    } finally {
      setBusy(false);
    }
  };

  const cellView = (row: RegionRow, cell: RegionCell, col: number) => {
    if (!cell) return <span className="text-sm text-neutral-400">Not in this region</span>;
    const base = col > 0 ? (row.cells[0] ? (row.cells[0].rich ? plain(row.cells[0].value) : row.cells[0].value) : null) : null;
    if (cell.media) {
      const thumb = cell.media === "image" ? (thumbs[cell.value] ?? cell.value) : thumbs[cell.value];
      return (
        <div className="space-y-1.5">
          <button type="button" onClick={() => setPreview({ url: cell.value, kind: cell.media!, name: fileName(cell.value) })} className="block w-full max-w-[220px] overflow-hidden rounded border border-neutral-200 bg-neutral-100 hover:border-neutral-900" title="Preview">
            {cell.media === "pdf" ? (
              <span className="flex h-24 items-center justify-center gap-2 text-sm text-neutral-700"><span aria-hidden className="rounded-sm border border-neutral-300 bg-white px-1.5 py-2 text-[9px] font-bold text-red-700">PDF</span>Preview</span>
            ) : thumb ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={thumb} alt="" loading="lazy" className="aspect-[4/3] w-full object-contain" />
            ) : (
              <span className="flex aspect-[4/3] items-center justify-center text-xs text-neutral-500">▶ video</span>
            )}
          </button>
          <div className="truncate text-xs text-neutral-600" title={fileName(cell.value)}>{fileName(cell.value)}</div>
          <button type="button" disabled={busy} onClick={() => setPicking({ row, col })} className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs hover:bg-neutral-50">Replace</button>
        </div>
      );
    }
    if (cell.rich)
      return (
        <div>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-900"><Marked text={plain(cell.value)} base={base} /></p>
          <a href={editHref[col]} className="mt-1 inline-block text-xs underline" title="Formatted text is edited on the page">Edit on page</a>
        </div>
      );
    if (editing?.row === row.key && editing.col === col)
      return (
        <textarea
          autoFocus
          aria-label={`${row.field} in ${data.regions[col].label}`}
          defaultValue={cell.value}
          rows={Math.min(8, Math.max(2, Math.ceil(cell.value.length / 40)))}
          disabled={busy}
          className="w-full resize-y rounded border border-blue-500 px-2 py-1.5 text-[15px] leading-relaxed"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(null);
            else if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              setEditing(null);
              void save(row, col, "text", e.currentTarget.value);
            }
          }}
          onBlur={(e) => {
            setEditing(null);
            void save(row, col, "text", e.currentTarget.value);
          }}
        />
      );
    return (
      <button type="button" disabled={busy} onClick={() => setEditing({ row: row.key, col })} title="Click to edit" className="w-full whitespace-pre-wrap rounded px-1 py-0.5 text-left text-[15px] leading-relaxed text-neutral-900 hover:bg-blue-50">
        <Marked text={cell.value} base={base} />
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div role="group" aria-label="Show" className="flex overflow-hidden rounded border border-neutral-300 text-xs">
          <button type="button" aria-pressed={!everything} onClick={() => setEverything(false)} className={`px-3 py-1.5 ${!everything ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}>Only differences ({nDiff})</button>
          <button type="button" aria-pressed={everything} onClick={() => setEverything(true)} className={`px-3 py-1.5 ${everything ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}>Show everything ({data.rows.length})</button>
        </div>
        <span className="text-xs text-neutral-500">Highlighted: words that differ from {data.regions[0]?.label}. Click a text to edit it; a change waits in that region until you publish it.</span>
        {busy && <span className="text-xs text-neutral-500">Saving…</span>}
        {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="w-48 border-b border-neutral-200 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">What</th>
              {data.regions.map((c) => (
                <th key={c.region} className="border-b border-l border-neutral-200 px-4 py-3 text-left align-top">
                  <div className="font-semibold text-neutral-900">{c.label}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-normal">
                    {c.pending && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">unpublished changes</span>}
                    {c.pending && (
                      <form action={publishResource}>
                        <input type="hidden" name="__resource" value={c.r} />
                        <input type="hidden" name="__id" value={c.id} />
                        <input type="hidden" name="__back" value={back} />
                        <button className="rounded border border-neutral-300 bg-white px-2 py-0.5 hover:bg-neutral-50">Publish</button>
                      </form>
                    )}
                    {c.path && <a href={editHref[data.regions.indexOf(c)]} className="underline">Edit on page</a>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const head = i === 0 || rows[i - 1].section !== row.section || rows[i - 1].onlyIn !== row.onlyIn;
              const { group, name } = place(row);
              const sub = group && (head || place(rows[i - 1]).group !== group);
              return [
                head && (
                  <tr key={`s-${row.key}`}>
                    <td colSpan={data.regions.length + 1} className="border-b border-neutral-200 bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-neutral-700">
                      {row.section}
                      {row.hidden && " · hidden on the site"}
                      {row.onlyIn !== undefined && ` · only in ${data.regions[row.onlyIn].label}`}
                    </td>
                  </tr>
                ),
                sub && (
                  <tr key={`g-${row.key}`}>
                    <td colSpan={data.regions.length + 1} className="border-b border-neutral-100 px-4 pb-1 pt-3 text-xs font-medium text-neutral-600">{group}</td>
                  </tr>
                ),
                <tr key={row.key} aria-label={`${row.section} › ${row.field}`}>
                  <td className="border-b border-neutral-100 px-4 py-3 align-top text-sm text-neutral-600">{name}</td>
                  {row.cells.map((cell, col) => {
                    const differs = col > 0 && row.differs && cell?.value !== row.cells[0]?.value;
                    return (
                      <td key={col} className={`border-b border-l border-neutral-100 px-4 py-3 align-top ${differs ? "border-l-4 border-l-amber-400 bg-amber-50/40" : ""}`}>
                        {cellView(row, cell, col)}
                      </td>
                    );
                  })}
                </tr>,
              ];
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-neutral-500">{everything ? "No texts or files on this page." : "The regions are the same: no differences."}</p>}
      </div>

      {picking && (
        <MediaPicker
          kind={picking.row.cells[picking.col]?.media === "video" ? "video" : picking.row.cells[picking.col]?.media === "pdf" ? "pdf" : "image"}
          onClose={() => setPicking(null)}
          onPick={(m) => {
            const { row, col } = picking;
            const kind = row.cells[col]?.media;
            setPicking(null);
            if (kind === "image") setThumbs((t) => ({ ...t, [m.url]: m.url }));
            void save(row, col, kind === "video" ? "video" : kind === "pdf" ? "url" : "image", m.url);
          }}
        />
      )}
      <PreviewModal file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
