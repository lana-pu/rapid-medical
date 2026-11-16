"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * The media library's grid (docs/screens/admin-media.md → «Порядок в медиатеке»): a preview, the name and where the file
 * is used; description and deletion live on the file's own page. In «Not used» files can be selected and deleted — after
 * a list of what goes. Admin chrome: its own neutral palette.
 */
export type GridItem = { id: number; url: string; filename: string; mime: string; size: number; alt: string; thumb: string | null; used: string | null };

export function MediaGrid({ items, upload: canUpload = true, selectable = false }: { items: GridItem[]; upload?: boolean; selectable?: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [confirming, setConfirming] = useState(false);
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
      {canUpload && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm"
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded bg-neutral-900 px-3 py-1.5 text-white" disabled={busy}>{busy ? "Uploading…" : "Upload files"}</button>
          <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,video/mp4,.pdf" onChange={(e) => upload(e.target.files)} />
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
              <span className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded bg-neutral-100">
                {m.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.thumb} alt="" loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[11px] font-semibold text-neutral-500">{m.mime === "application/pdf" ? "PDF" : m.mime.startsWith("video/") ? "▶ video" : m.mime}</span>
                )}
              </span>
              <span className="mt-1.5 block truncate font-medium text-neutral-900" title={m.filename}>{m.filename}</span>
            </Link>
            <span className={`mt-0.5 block truncate ${m.used ? "text-neutral-600" : "text-neutral-400"}`} title={m.used ?? "Not used anywhere"}>{m.used ? `On ${m.used}` : "Not used"}</span>
            <span className="mt-0.5 flex items-center gap-1 text-neutral-400">
              {(m.size / 1024).toFixed(0)} KB
              {m.mime.startsWith("image/") && !m.alt && <span className="rounded bg-amber-50 px-1 text-[10px] text-amber-900">No description</span>}
            </span>
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
