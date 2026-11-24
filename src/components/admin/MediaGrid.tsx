"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./icons";

/**
 * The media library's grid (docs/screens/admin-media.md → «Порядок в медиатеке», «Иерархия»): a preview (a video's
 * poster), the name, where the file is used and its size; description and deletion live on the file's own page. In
 * «Not used» files can be selected and deleted — after a list of what goes. Admin chrome: its own neutral palette.
 */
export type GridItem = { id: number; url: string; filename: string; mime: string; size: number; alt: string; thumb: string | null; poster: string | null; used: string | null };

const ACCEPT = "image/*,video/mp4,video/webm,.pdf";
const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Uploading: the header's button and a drop anywhere on the library share one queue (docs/screens/admin-media.md). */
const Uploads = createContext<{ pick: () => void; busy: boolean } | null>(null);

export function MediaDrop({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg(null);
    try {
      for (const f of Array.from(files)) {
        const fd = new FormData(); fd.append("file", f);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      }
      router.refresh();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <Uploads.Provider value={{ pick: () => fileRef.current?.click(), busy }}>
      <div
        className="relative min-h-full"
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
        onDrop={(e) => { if (!e.dataTransfer.files.length) return; e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}
      >
        <input ref={fileRef} type="file" multiple className="hidden" accept={ACCEPT} aria-label="Files to upload" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        {busy && <p role="status" className="mb-3 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">Uploading…</p>}
        {msg && <p role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</p>}
        {children}
        {over && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-20 grid place-items-center rounded-xl border-2 border-dashed border-neutral-900 bg-white/80 text-sm font-medium text-neutral-900">
            Drop to upload · images, mp4, PDF · up to 200 MB
          </div>
        )}
      </div>
    </Uploads.Provider>
  );
}

/** «Upload» in the header: opens the file choice of the surrounding MediaDrop. */
export function UploadButton() {
  const u = useContext(Uploads);
  return (
    <button type="button" onClick={() => u?.pick()} disabled={u?.busy} className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50">
      {u?.busy ? "Uploading…" : "Upload"}
    </button>
  );
}

/** The sort, applied as soon as it is chosen. */
export function SortSelect({ value, options }: { value: string; options: [string, string][] }) {
  return (
    <select name="sort" defaultValue={value} aria-label="Sort" onChange={(e) => e.currentTarget.form?.requestSubmit()} className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900">
      {options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}

export function MediaGrid({ items, emptyUpload = false, selectable = false }: { items: GridItem[]; /** the empty library: the dashed zone is the way in */ emptyUpload?: boolean; selectable?: boolean }) {
  const router = useRouter();
  const u = useContext(Uploads);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);

  async function removePicked() {
    setBusy(true); setMsg(null);
    const kept: string[] = [];
    for (const id of picked) {
      const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
      if (res.status === 409) kept.push(items.find((m) => m.id === id)?.filename ?? String(id)); // used meanwhile: the server keeps it
    }
    setPicked(new Set()); setConfirming(false); setBusy(false);
    if (kept.length) setMsg(`Kept, because they are used now: ${kept.join(", ")}.`);
    router.refresh();
  }
  const chosen = items.filter((m) => picked.has(m.id));

  return (
    <>
      {emptyUpload && items.length === 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm">
          <button type="button" onClick={() => u?.pick()} className="rounded bg-neutral-900 px-3 py-1.5 text-white">Upload files</button>
          <span className="text-neutral-500">or drop files here · images, mp4, PDF · up to 200 MB</span>
        </div>
      )}
      {selectable && items.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <button type="button" onClick={() => setPicked(picked.size === items.length ? new Set() : new Set(items.map((m) => m.id)))} className="rounded border border-neutral-300 bg-white px-3 py-1.5 hover:bg-neutral-50">{picked.size === items.length ? "Clear selection" : "Select all on this page"}</button>
          {picked.size > 0 && <button type="button" onClick={() => setConfirming(true)} className="rounded border border-red-300 bg-white px-3 py-1.5 text-red-700 hover:bg-red-50">Delete selected ({picked.size})…</button>}
          <span className="text-xs text-neutral-500">These files are not used on any page, list or setting.</span>
        </div>
      )}
      {msg && <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</div>}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
        {items.map((m) => (
          <li key={m.id} className={`relative rounded-lg border bg-white p-2 text-xs ${picked.has(m.id) ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200"}`}>
            {selectable && (
              <input type="checkbox" aria-label={`Select ${m.filename}`} checked={picked.has(m.id)} onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })} className="absolute left-3 top-3 z-10 h-4 w-4" />
            )}
            <Link href={`/admin/media?id=${m.id}`} className="block">
              <span className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded bg-neutral-100">
                {m.thumb || m.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(m.thumb ?? m.poster)!} alt="" loading="lazy" className={`h-full w-full ${m.thumb ? "object-contain" : "object-cover"}`} />
                ) : m.mime === "application/pdf" ? (
                  <Icon name="file" className="h-9 w-9 text-neutral-400" />
                ) : (
                  <span className="text-[11px] font-semibold text-neutral-500">{m.mime.startsWith("video/") ? "Video" : m.mime}</span>
                )}
                {m.mime.startsWith("video/") && <span className="absolute bottom-1.5 left-1.5 rounded bg-black/65 px-1.5 text-[10px] font-medium text-white">▶ Video</span>}
                {m.mime === "application/pdf" && <span className="absolute bottom-1.5 left-1.5 rounded bg-white px-1.5 text-[10px] font-semibold text-neutral-600 ring-1 ring-neutral-200">PDF</span>}
              </span>
              <span className="mt-1.5 block truncate font-medium text-neutral-900" title={m.filename}>{m.filename}</span>
            </Link>
            <span className="mt-0.5 block truncate text-neutral-500" title={m.used ?? "Not used anywhere"}>
              <span className={m.used ? "text-neutral-600" : "text-neutral-400"}>{m.used ? `On ${m.used}` : "Not used"}</span> · {size(m.size)}
            </span>
            {/* only where visitors see the picture (docs/screens/admin-media.md → «Иерархия») */}
            {m.mime.startsWith("image/") && !m.alt && m.used && <span className="mt-1 inline-block rounded bg-amber-50 px-1 text-[10px] text-amber-900">No description</span>}
          </li>
        ))}
      </ul>
      {confirming && (
        <div role="dialog" aria-modal="true" aria-label="Delete files" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={() => setConfirming(false)}>
          <div className="w-full max-w-lg rounded-lg bg-white p-5 text-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold">Delete {chosen.length} file{chosen.length > 1 ? "s" : ""}?</h2>
            <p className="mt-1 text-neutral-600">They are not used anywhere on the site. Deleting cannot be undone.</p>
            <ul className="mt-3 max-h-64 space-y-0.5 overflow-y-auto rounded border border-neutral-200 p-2 font-mono text-xs">
              {chosen.map((m) => <li key={m.id} className="truncate">{m.filename}</li>)}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className="rounded px-3 py-1.5 hover:bg-neutral-100">Cancel</button>
              <button type="button" disabled={busy} onClick={removePicked} className="rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50">{busy ? "Deleting…" : `Delete ${chosen.length}`}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
