"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO, withBase } from "@/lib/demo";

export type MediaItem = { id: number; url: string; filename: string; mime: string; size: number; alt: string; createdAt: string };
export type MediaKind = "image" | "video" | "pdf" | "any";

/**
 * Modal media library: search, filter by kind, upload, pick.
 * Used by ImageField and by the rich-text editor.
 */
export function MediaPicker({ kind = "any", onPick, onClose }: { kind?: MediaKind; onPick: (m: MediaItem) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<MediaKind>(kind);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      if (DEMO) {
        // static demo: the whole library as one JSON file, filtered here
        const all = (await (await fetch(withBase("/demo/media.json"))).json()) as MediaItem[];
        const want = type === "image" ? /^image\// : type === "video" ? /^video\// : type === "pdf" ? /pdf/ : /./;
        const hit = all.filter((m) => want.test(m.mime) && (!q || (m.filename + " " + m.alt).toLowerCase().includes(q.toLowerCase())));
        setItems(hit.slice((page - 1) * 48, page * 48));
        setTotal(hit.length);
        return;
      }
      const res = await fetch(`/api/admin/media?q=${encodeURIComponent(q)}&type=${type === "any" ? "" : type}&page=${page}`);
      const json = await res.json();
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
    } finally {
      setBusy(false);
    }
  }, [q, type, page]);

  useEffect(() => { const t = setTimeout(load, 150); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    try {
      if (DEMO) throw new Error("Demo mode: uploads are not available (no server). Pick an existing file instead.");
      for (const f of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
      }
      setPage(1);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / 48));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="dialog" aria-modal>
      <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Media library</h2>
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search filename or alt…" className="ml-4 w-64 rounded border border-neutral-300 px-2 py-1 text-sm" autoFocus />
          <select value={type} onChange={(e) => { setType(e.target.value as MediaKind); setPage(1); }} className="rounded border border-neutral-300 px-2 py-1 text-sm">
            <option value="any">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="pdf">PDFs</option>
          </select>
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded bg-neutral-900 px-3 py-1 text-sm text-white">Upload</button>
          <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,video/mp4,.pdf" onChange={(e) => upload(e.target.files)} />
          <span className="ml-auto text-xs text-neutral-500">{busy ? "Loading…" : `${total} files`}</span>
          <button type="button" onClick={onClose} className="ml-2 text-neutral-500 hover:text-neutral-900" aria-label="Close">✕</button>
        </div>
        {err && <div className="bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 && !busy && <p className="py-12 text-center text-sm text-neutral-400">Nothing found. Upload a file or change the filter.</p>}
          <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
            {items.map((m) => (
              <button key={m.id} type="button" onClick={() => onPick(m)} className="group rounded border border-neutral-200 p-1 text-left hover:border-neutral-900" title={m.filename}>
                <Thumb m={m} />
                <div className="mt-1 truncate text-[11px] text-neutral-700">{m.filename}</div>
                <div className="text-[10px] text-neutral-400">{(m.size / 1024).toFixed(0)} KB</div>
              </button>
            ))}
          </div>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-neutral-200 py-2 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">‹ Prev</button>
            <span className="text-neutral-500">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Thumb({ m, className = "h-24" }: { m: Pick<MediaItem, "url" | "mime" | "alt">; className?: string }) {
  if (m.mime.startsWith("image/"))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.url} alt={m.alt} className={`${className} w-full rounded bg-neutral-100 object-contain`} loading="lazy" />;
  if (m.mime.startsWith("video/")) return <video src={m.url} muted playsInline preload="metadata" className={`${className} w-full rounded bg-neutral-900 object-cover`} />;
  return <div className={`${className} flex w-full items-center justify-center rounded bg-neutral-100 text-xs text-neutral-500`}>{m.mime === "application/pdf" ? "PDF" : m.mime}</div>;
}
