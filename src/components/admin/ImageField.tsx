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
  large = false,
}: {
  name: string;
  defaultValue: string;
  onChange?: (url: string) => void;
  detached?: boolean;
  kind?: MediaKind;
  /** A record form's picture (docs/screens/admin-record-edit.md → «Иерархия»): a 150 px preview, buttons, the address small under them */
  large?: boolean;
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
  const accept = kind === "video" ? "video/mp4,video/webm" : kind === "pdf" ? ".pdf" : kind === "image" ? "image/*" : "image/*,video/mp4,.pdf";
  const picker = open && <MediaPicker kind={kind} onPick={(m) => { set(m.url); setOpen(false); }} onClose={() => setOpen(false)} />;

  if (large) {
    const btn = "rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-[13px] font-medium text-neutral-800 hover:bg-neutral-50";
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 @xl:grid-cols-[150px_minmax(0,1fr)]">
        <div className="aspect-[16/10] w-full max-w-[220px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 @xl:max-w-none">
          {url ? (
            isVideo ? (
              <video src={url} muted playsInline preload="metadata" className="h-full w-full bg-neutral-900 object-cover" />
            ) : isPdf ? (
              <div className="flex h-full items-center justify-center text-xs font-semibold text-red-700">PDF</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-contain" />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400">No picture</div>
          )}
        </div>
        <div className="grid min-w-0 content-start gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(true)} className={btn}>Choose from library</button>
            <label className={`${btn} cursor-pointer`}>
              {busy ? "Uploading…" : "Upload"}
              <input type="file" accept={accept} className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            {url && <button type="button" onClick={() => set("")} className={`${btn} text-red-700`}>Remove</button>}
          </div>
          <input name={detached ? undefined : name} id={detached ? undefined : name} value={url} onChange={(e) => set(e.target.value)} placeholder="https://… or choose from library" aria-label="Address of the file" className="w-full truncate rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono text-xs text-neutral-600 focus:border-neutral-900 focus:bg-white focus:outline-none" />
          {err && <span className="text-xs text-red-600">{err}</span>}
        </div>
        {picker}
      </div>
    );
  }

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
            <input type="file" accept={accept} className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {url && <button type="button" onClick={() => set("")} className="text-red-600">clear</button>}
          {err && <span className="text-red-600">{err}</span>}
        </div>
      </div>
      {picker}
    </div>
  );
}
