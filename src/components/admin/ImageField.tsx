"use client";

import { useState } from "react";
import { inputCls } from "./ui";

/**
 * URL input + upload button. Uploads go to /api/admin/upload which stores
 * the file and registers it in the media library.
 * `detached` = don't emit a form field (used inside Repeater; value is
 * propagated through onChange instead).
 */
export function ImageField({
  name,
  defaultValue,
  onChange,
  detached = false,
}: {
  name: string;
  defaultValue: string;
  onChange?: (url: string) => void;
  detached?: boolean;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  return (
    <div className="flex items-start gap-3">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-16 w-16 flex-none rounded border border-neutral-200 object-cover" />
      ) : (
        <div className="h-16 w-16 flex-none rounded border border-dashed border-neutral-300" />
      )}
      <div className="flex-1 space-y-1">
        <input
          name={detached ? undefined : name}
          value={url}
          onChange={(e) => set(e.target.value)}
          placeholder="https://… or upload"
          className={inputCls}
        />
        <div className="flex items-center gap-3 text-xs">
          <label className="cursor-pointer text-neutral-700 underline">
            {busy ? "Uploading…" : "Upload file"}
            <input type="file" accept="image/*,.pdf" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {url && (
            <button type="button" onClick={() => set("")} className="text-red-600">
              clear
            </button>
          )}
          {err && <span className="text-red-600">{err}</span>}
        </div>
      </div>
    </div>
  );
}
