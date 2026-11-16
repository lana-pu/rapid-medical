"use client";

import { Fragment, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { diffWords } from "diff";
import type { RegionColumn } from "@/admin/page-editor";
import { regionTexts } from "@/admin/page-editor";
import { saveField } from "@/admin/inline";
import { publishResource } from "@/admin/actions";
import type { RegionCell, RegionRow } from "@/blocks/region-table";
import { PAUSED_REGIONS } from "@/lib/regions";
import { MediaPicker } from "./MediaPicker";
import { PreviewModal, type Previewed } from "./FilePreview";

/**
 * «Differences between regions» (docs/screens/admin-sections.md → «Экран страницы»): what differs between the regional
 * copies of a page — texts, pictures, videos, PDFs — grouped by the section of the page they are in, with a way to see
 * that section on the page; changed words highlighted, edited in place into that region's draft. Labels are quiet,
 * the content is what you read. Admin chrome: its own neutral palette.
 */

type Data = { regions: RegionColumn[]; rows: RegionRow[] };
const plain = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const fileName = (u: string) => decodeURIComponent(u.split(/[?#]/)[0].split("/").pop() ?? u);
const sectionIndex = (c: RegionCell) => (c ? Number(/^blocks\.(\d+)\./.exec(c.f)?.[1] ?? NaN) : NaN);

/**
 * A row's place in words: the path up to the last «›» becomes a sub-heading, the rest the row's name; a cell of a
 * table («Table · rows 2 3») reads «{the row's first cell} · {the column's heading}».
 */
function placeOf(rows: RegionRow[]) {
  const cut = (field: string) => {
    const i = field.lastIndexOf(" › ");
    return i < 0 ? { group: "", name: field } : { group: field.slice(0, i), name: field.slice(i + 3) };
  };
  const firstCell = new Map<string, string>();
  const heading = new Map<string, string>();
  for (const r of rows) {
    const { group, name } = cut(r.field);
    const v = r.cells.find((c) => c && !c.media)?.value;
    if (!v) continue;
    const row = /rows (\d+) 1$/.exec(name);
    if (row) firstCell.set(`${r.section}|${group}|${row[1]}`, plain(v).slice(0, 48));
    const col = /columns (\d+)$/.exec(name);
    if (col) heading.set(`${r.section}|${group}|${col[1]}`, plain(v).slice(0, 48));
  }
  return (r: RegionRow) => {
    const { group, name } = cut(r.field);
    const cell = /^(.*?)\s*·?\s*rows (\d+) (\d+)$/.exec(name);
    if (cell) {
      const [, table, row, col] = cell;
      const product = firstCell.get(`${r.section}|${group}|${row}`);
      const column = heading.get(`${r.section}|${group}|${col}`);
      const where = [group, table].filter(Boolean).join(" › ");
      return { group: where, name: col === "1" ? `Row ${row}${column ? ` · ${column}` : ""}` : `${product ?? `Row ${row}`} · ${column ?? `column ${col}`}` };
    }
    const head = /^(.*?)\s*·?\s*columns (\d+)$/.exec(name);
    if (head) return { group: [group, head[1]].filter(Boolean).join(" › "), name: `Column ${head[2]} heading` };
    return { group, name };
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

/** Regions switched off with the eye: remembered in this browser for every page; at first, the regions not in use. */
const HIDDEN_KEY = "rm_region_diff_hidden";
const listeners = new Set<() => void>();
const readHidden = () => {
  try {
    return localStorage.getItem(HIDDEN_KEY) ?? PAUSED_REGIONS.join(",");
  } catch {
    return PAUSED_REGIONS.join(",");
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const writeHidden = (regions: string[]) => {
  try {
    localStorage.setItem(HIDDEN_KEY, regions.join(","));
  } catch {
    /* storage blocked: the choice lasts until the page is reloaded */
  }
  listeners.forEach((l) => l());
};

function Eye({ off }: { off: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

export function RegionDiff({ initial, ref0, thumbs: thumbs0, editHref, back }: { initial: Data; ref0: { r: string; id: number }; thumbs: Record<string, string>; editHref: Record<number, string>; back: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [thumbs, setThumbs] = useState(thumbs0);
  const [everything, setEverything] = useState(false);
  const [folded, setFolded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<{ row: string; col: number } | null>(null);
  const [picking, setPicking] = useState<{ row: RegionRow; col: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Previewed | null>(null);

  // the eye: switched-off regions leave the table; differences are counted between the regions in view
  const hiddenRaw = useSyncExternalStore(subscribe, readHidden, () => PAUSED_REGIONS.join(","));
  const hidden = new Set(hiddenRaw.split(",").filter(Boolean));
  let visible = data.regions.map((_, i) => i).filter((i) => !hidden.has(data.regions[i].region));
  if (!visible.length) visible = data.regions.map((_, i) => i);
  const base = visible[0];
  const toggle = (region: string) => {
    const next = new Set([...hidden].filter((r) => data.regions.some((c) => c.region === r)));
    if (next.has(region)) next.delete(region);
    else if (visible.length > 1) next.add(region);
    writeHidden([...next]);
  };
  const differsHere = (r: RegionRow) => {
    const cells = visible.map((i) => r.cells[i]);
    const present = cells.filter((c): c is NonNullable<RegionCell> => !!c);
    return present.length !== cells.length || present.some((c) => c.value !== present[0].value);
  };
  const inView = data.rows.filter((r) => visible.some((i) => r.cells[i]));
  const rows = everything ? inView : inView.filter(differsHere);
  const place = placeOf(data.rows);
  const nDiff = inView.filter(differsHere).length;

  // the rows by the section of the page they are in, in page order
  const groups: { key: string; rows: RegionRow[] }[] = [];
  for (const r of rows) {
    const key = `${r.section}|${r.onlyIn ?? ""}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.rows.push(r);
    else groups.push({ key, rows: [r] });
  }

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
    if (!cell) return <span className="text-sm italic text-neutral-400">Not in this region</span>;
    const first = row.cells[base];
    const against = col !== base && first ? (first.rich ? plain(first.value) : first.value) : null;
    if (cell.media) {
      const thumb = cell.media === "image" ? (thumbs[cell.value] ?? cell.value) : thumbs[cell.value];
      return (
        <div className="space-y-1.5">
          <button type="button" onClick={() => setPreview({ url: cell.value, kind: cell.media!, name: fileName(cell.value) })} className="relative flex aspect-[4/3] w-full max-w-[240px] items-center justify-center overflow-hidden rounded border border-neutral-200 bg-neutral-100 hover:border-neutral-900" title="Preview">
            {cell.media === "pdf" ? (
              <span className="flex items-center gap-2 text-sm text-neutral-700"><span aria-hidden className="rounded-sm border border-neutral-300 bg-white px-1.5 py-2 text-[9px] font-bold text-red-700">PDF</span>Preview</span>
            ) : thumb ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={thumb} alt="" loading="lazy" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-neutral-500">▶ video</span>
            )}
            {cell.media === "video" && thumb && <span aria-hidden className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] text-white">▶ video</span>}
          </button>
          <div className="flex max-w-[240px] items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-500" title={fileName(cell.value)}>{fileName(cell.value)}</span>
            <button type="button" disabled={busy} onClick={() => setPicking({ row, col })} className="shrink-0 rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs hover:bg-neutral-50">Replace</button>
          </div>
        </div>
      );
    }
    if (cell.rich)
      return (
        <div>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-900"><Marked text={plain(cell.value)} base={against} /></p>
          <a href={editHref[col]} className="mt-1 inline-block text-xs text-neutral-500 underline" title="Formatted text is edited on the page">Edit on page</a>
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
      <button type="button" disabled={busy} onClick={() => setEditing({ row: row.key, col })} title="Click to edit" className="group w-full whitespace-pre-wrap rounded px-1 py-0.5 text-left text-[15px] leading-relaxed text-neutral-900 hover:bg-blue-50">
        <Marked text={cell.value} base={against} />
        <span aria-hidden className="ml-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100">✎</span>
      </button>
    );
  };

  const label = "sticky left-0 z-[1] border-b border-r border-neutral-200 bg-neutral-50 px-3 align-top";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div role="group" aria-label="Show" className="flex overflow-hidden rounded border border-neutral-300 text-xs">
          <button type="button" aria-pressed={!everything} onClick={() => setEverything(false)} className={`px-3 py-1.5 ${!everything ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}>Only differences ({nDiff})</button>
          <button type="button" aria-pressed={everything} onClick={() => setEverything(true)} className={`px-3 py-1.5 ${everything ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}>Show everything ({inView.length})</button>
        </div>
        <div role="group" aria-label="Regions in the table" className="flex flex-wrap items-center gap-1 text-xs">
          {data.regions.map((c) => {
            const on = visible.includes(data.regions.indexOf(c));
            return (
              <button key={c.region} type="button" aria-pressed={on} onClick={() => toggle(c.region)} title={on ? `Hide ${c.label}` : `Show ${c.label}`} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${on ? "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100" : "border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 line-through hover:text-neutral-700"}`}>
                <Eye off={!on} />
                {c.label}
              </button>
            );
          })}
        </div>
        {busy && <span className="text-xs text-neutral-500">Saving…</span>}
        {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
      </div>
      <p aria-label="Legend" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-1 rounded bg-amber-400" />differs from {data.regions[base]?.label}</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="rounded-sm bg-amber-200/80 px-1 text-neutral-800">word</span>changed words</span>
        <span className="italic">Not in this region</span>
        <span>· Click a text to edit it; a change waits in that region until you publish it.</span>
      </p>

      <div className="max-h-[calc(100vh-14rem)] overflow-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-44" />
            {visible.map((i) => <col key={i} />)}
          </colgroup>
          <thead className="sticky top-0 z-[2]">
            <tr>
              <th className="sticky left-0 z-[3] border-b border-r border-neutral-200 bg-neutral-100 px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-500">On the page</th>
              {visible.map((i) => data.regions[i]).map((c) => (
                <th key={c.region} className="border-b border-l border-neutral-200 bg-white px-4 py-3 text-left align-top">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-neutral-900">{c.label}</span>
                    {visible.length > 1 && (
                      <button type="button" onClick={() => toggle(c.region)} aria-label={`Hide ${c.label}`} title={`Hide ${c.label}`} className="rounded p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-800">
                        <Eye off />
                      </button>
                    )}
                  </div>
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
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const head = g.rows[0];
              const shut = folded.has(g.key);
              const n = g.rows.filter(differsHere).length;
              // where this section is on each region's page: its number there, and a link to it
              const at = visible.map((i) => ({ i, n: sectionIndex(g.rows.find((r) => r.cells[i])?.cells[i] ?? null) }));
              const first = at.find((a) => !Number.isNaN(a.n));
              return (
                <Fragment key={g.key}>
                  <tr>
                    <td colSpan={visible.length + 1} className="border-b border-t border-neutral-200 bg-neutral-100 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <button type="button" aria-expanded={!shut} onClick={() => setFolded((f) => { const s = new Set(f); if (s.has(g.key)) s.delete(g.key); else s.add(g.key); return s; })} className="inline-flex items-center gap-2 text-left text-sm font-semibold text-neutral-800">
                          <span aria-hidden className="text-xs text-neutral-500">{shut ? "▸" : "▾"}</span>
                          {first && <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-neutral-500">Section {first.n + 1}</span>}
                          {head.section}
                        </button>
                        <span className="text-xs text-neutral-500">
                          {n ? `${n} difference${n > 1 ? "s" : ""}` : "same"}
                          {head.hidden && " · hidden on the site"}
                          {head.onlyIn !== undefined && ` · only in ${data.regions[head.onlyIn].label}`}
                        </span>
                        <span className="flex-1" />
                        {at.filter((a) => !Number.isNaN(a.n)).map((a) => (
                          <a key={a.i} href={`${editHref[a.i]}#section-${a.n}`} className="text-xs text-neutral-600 underline decoration-neutral-300 hover:decoration-neutral-900" title={`This section on the ${data.regions[a.i].label} page, in the editor`}>
                            Show on page{visible.length > 1 ? ` · ${data.regions[a.i].label}` : ""} ↗
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                  {!shut &&
                    g.rows.map((row, k) => {
                      const { group, name } = place(row);
                      const sub = group && (k === 0 || place(g.rows[k - 1]).group !== group);
                      return (
                        <Fragment key={row.key}>
                          {sub && (
                            <tr>
                              <td colSpan={visible.length + 1} className="border-b border-neutral-100 bg-white px-3 pb-1 pt-3 text-xs text-neutral-500">{group}</td>
                            </tr>
                          )}
                          <tr aria-label={`${row.section} › ${row.field}`}>
                            <td className={`${label} py-3 text-xs leading-snug text-neutral-500`}>{name}</td>
                            {visible.map((col) => {
                              const cell = row.cells[col];
                              const differs = col !== base && differsHere(row) && cell?.value !== row.cells[base]?.value;
                              return (
                                <td key={col} className={`border-b border-l border-neutral-100 px-4 py-3 align-top ${differs ? "border-l-4 border-l-amber-400 bg-amber-50/40" : ""}`}>
                                  {cellView(row, cell, col)}
                                </td>
                              );
                            })}
                          </tr>
                        </Fragment>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-center text-sm text-neutral-500">{everything ? "No texts or files on this page." : "The regions in view are the same: no differences."}</p>}
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
