"use client";

import { useState } from "react";
import { inputCls } from "./ui";
import { MediaPicker, type MediaKind } from "./MediaPicker";

/**
 * Media field: URL input + "Choose" (library) + "Upload".
 * `kind` narrows the library filter (image / video / pdf).
 * `detached` = don't emit a form field (used inside Repeater; value is
 * propagated through onChange instead).
 */
export function ImageField({
  name,
  defaultValue,
  onChange,
  detached = false,
  kind = "any",
}: {
  name: string;
  defaultValue: string;
  onChange?: (url: string) => void;
  detached?: boolean;
  kind?: MediaKind;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const set = (v: string) => {
    setUrl(v);
    onChange?.(v);
  };

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      set(json.url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
  const isPdf = /\.pdf(\?|$)/i.test(url);

  return (
    <div className="flex items-start gap-3">
      {url ? (
        isVideo ? (
          <video src={url} muted playsInline preload="metadata" className="h-16 w-24 flex-none rounded border border-neutral-200 bg-neutral-900 object-cover" />
        ) : isPdf ? (
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded border border-neutral-200 bg-neutral-100 text-xs">PDF</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-16 flex-none rounded border border-neutral-200 object-cover" />
        )
      ) : (
        <div className="h-16 w-16 flex-none rounded border border-dashed border-neutral-300" />
      )}
      <div className="flex-1 space-y-1">
        <input name={detached ? undefined : name} value={url} onChange={(e) => set(e.target.value)} placeholder="https://… or choose from library" className={inputCls} />
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setOpen(true)} className="text-neutral-700 underline">Choose from library</button>
          <label className="cursor-pointer text-neutral-700 underline">
            {busy ? "Uploading…" : "Upload"}
            <input type="file" accept={kind === "video" ? "video/mp4,video/webm" : kind === "pdf" ? ".pdf" : kind === "image" ? "image/*" : "image/*,video/mp4,.pdf"} className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {url && <button type="button" onClick={() => set("")} className="text-red-600">clear</button>}
          {err && <span className="text-red-600">{err}</span>}
        </div>
      </div>
      {open && <MediaPicker kind={kind} onPick={(m) => { set(m.url); setOpen(false); }} onClose={() => setOpen(false)} />}
    </div>
  );
}
