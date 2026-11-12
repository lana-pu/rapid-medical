"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Thumb, type MediaItem } from "./MediaPicker";

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
  async function saveAlt(id: number, alt: string) {
    await fetch("/api/admin/media", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, alt }) });
  }
  async function remove(m: MediaItem) {
    if (!window.confirm(`Delete ${m.filename}?`)) return;
    const res = await fetch(`/api/admin/media?id=${m.id}`, { method: "DELETE" });
    if (res.status === 409) { const j = await res.json(); setMsg(`“${m.filename}” is used in ${j.usage.length} place(s): ${j.usage.map((u: { label: string }) => u.label).join(", ")}. Remove it there first.`); return; }
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm"
        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
        <button type="button" onClick={() => fileRef.current?.click()} className="rounded bg-neutral-900 px-3 py-1.5 text-white" disabled={busy}>{busy ? "Uploading…" : "Upload files"}</button>
        <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,video/mp4,.pdf" onChange={(e) => upload(e.target.files)} />
        <span className="text-neutral-500">or drop files here · images, mp4, PDF · up to 200 MB</span>
      </div>
      {msg && <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{msg}</div>}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-5">
        {items.map((m) => (
          <div key={m.id} className="rounded-lg border border-neutral-200 bg-white p-2 text-xs">
            <Link href={`/admin/media?id=${m.id}`}><Thumb m={m} className="h-28" /></Link>
            <div className="mt-1 truncate font-medium" title={m.filename}>{m.filename}</div>
            <div className="flex items-center gap-1 text-neutral-500">
              {(m.size / 1024).toFixed(0)} KB
              {m.mime.startsWith("image/") && !m.alt && <span className="rounded bg-red-50 px-1 text-[10px] font-medium text-red-700">No description</span>}
            </div>
            <input defaultValue={m.alt} placeholder="Alt text" onBlur={(e) => e.target.value !== m.alt && saveAlt(m.id, e.target.value)} className="mt-1 w-full rounded border border-neutral-200 px-1 py-0.5" />
            <div className="mt-1 flex justify-between">
              <button type="button" onClick={() => navigator.clipboard.writeText(m.url)} className="text-neutral-500 hover:text-neutral-900">copy URL</button>
              <button type="button" onClick={() => remove(m)} className="text-red-600 hover:underline">delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
