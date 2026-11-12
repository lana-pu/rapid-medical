"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { replaceEverywhere, setMediaAlt, type ReplaceResult } from "@/admin/media-actions";
import { DEMO, editorHref, withBase } from "@/lib/demo";
import { MediaPicker, Thumb, type MediaItem, type MediaKind } from "./MediaPicker";
import { Button, inputCls } from "./ui";

/** Media library tools (docs/screens/admin-media.md): description, replace everywhere, describe queue. */

const editHref = editorHref;

export function AltField({ id, alt, label = "Description (alt text)" }: { id: number; alt: string; label?: string }) {
  const [value, setValue] = useState(alt);
  const [saved, setSaved] = useState(alt);
  const [msg, setMsg] = useState<string | null>(null);
  const save = async () => {
    if (value.trim() === saved) return;
    const r = await setMediaAlt(id, value);
    if ("error" in r) return setMsg(`Not saved: ${r.error}`);
    setSaved(value.trim());
    setMsg("Saved");
  };
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      <input value={value} onChange={(e) => { setValue(e.target.value); setMsg(null); }} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} maxLength={300} placeholder="What is in the picture, for people who cannot see it" className={inputCls} />
      {msg && <span className="mt-1 block text-xs text-neutral-500">{msg}</span>}
    </label>
  );
}

type FileInfo = { id: number; url: string; filename: string; mime: string };
const mediaKind = (mime: string): MediaKind => (mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime === "application/pdf" ? "pdf" : "any");

export function ReplaceButton({ file, places }: { file: FileInfo; places: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [next, setNext] = useState<FileInfo | null>(null);
  const [mode, setMode] = useState<"draft" | "publish">("draft");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<ReplaceResult | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const kind = mediaKind(file.mime);

  const upload = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Upload failed");
      setNext({ id: j.id, url: j.url, filename: f.name, mime: f.type });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const replace = async () => {
    if (!next) return;
    setBusy(true);
    setErr(null);
    const r = await replaceEverywhere(file.id, next.id, mode);
    setBusy(false);
    if ("error" in r) return setErr(r.error);
    setDone(r);
    router.refresh();
  };

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} disabled={DEMO} title={DEMO ? "Replacing files needs the server; not in the demo" : undefined}>
        Replace everywhere
      </Button>
    );
  }
  const accept = kind === "image" ? "image/*" : kind === "video" ? "video/mp4,video/webm" : kind === "pdf" ? ".pdf" : undefined;
  const preview = (f: FileInfo) =>
    f.mime.startsWith("image/") ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={withBase(f.url)} alt="" className="h-40 w-full rounded border border-neutral-200 object-contain" />
    ) : f.mime.startsWith("video/") ? (
      <video src={withBase(f.url)} className="h-40 w-full rounded border border-neutral-200" muted controls />
    ) : (
      <div className="flex h-40 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-500">{f.filename}</div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16" onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
      <div role="dialog" aria-label={`Replace ${file.filename}`} className="w-full max-w-xl space-y-4 rounded-lg bg-white p-5 shadow-2xl">
        <h2 className="text-lg font-semibold">Replace {file.filename}</h2>
        {done ? (
          <>
            <p className="text-sm">
              {done.places.every((p) => p.live) ? `Replaced and published in ${done.places.length} place${done.places.length > 1 ? "s" : ""}.` : `Replaced in ${done.places.length} place${done.places.length > 1 ? "s" : ""} as unpublished changes — publish each page to put it live.`}
            </p>
            <ul className="space-y-1 text-sm">
              {done.places.map((p) => (
                <li key={p.href} className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${p.live ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{p.live ? "Live" : "Not live yet"}</span>
                  <span className="flex-1 truncate">{p.label}</span>
                  {p.pagePath && <a href={editHref(p.pagePath)} className="underline">Open on page</a>}
                  <a href={withBase(p.href)} className="underline">Admin</a>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button type="button" onClick={() => { setOpen(false); setDone(null); setNext(null); }}>Close</Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-500">
              <div>
                <div className="mb-1">Now</div>
                {preview(file)}
              </div>
              <div>
                <div className="mb-1">New</div>
                {next ? preview(next) : <div className="flex h-40 items-center justify-center rounded border border-dashed border-neutral-300">Choose a file</div>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>{busy && !next ? "Uploading…" : "Upload a new file"}</Button>
              <input ref={input} type="file" className="hidden" accept={accept} onChange={(e) => upload(e.target.files?.[0])} />
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setPicker(true)}>Choose from the library</Button>
            </div>
            <p className="text-sm">The new file takes its place in {places} place{places > 1 ? "s" : ""}. The description stays.</p>
            <fieldset className="space-y-1 text-sm">
              <label className="flex gap-2"><input type="radio" checked={mode === "draft"} onChange={() => setMode("draft")} /> Add as unpublished changes — publish the pages yourself</label>
              <label className="flex gap-2">
                <input type="radio" checked={mode === "publish"} onChange={() => setMode("publish")} /> Replace and publish now
              </label>
            </fieldset>
            {err && <p className="text-sm text-red-700">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" disabled={!next || busy} onClick={replace}>{busy && next ? "Replacing…" : "Replace"}</Button>
            </div>
          </>
        )}
      </div>
      {picker && (
        <MediaPicker
          kind={kind}
          onClose={() => setPicker(false)}
          onPick={(m) => {
            setPicker(false);
            if (m.id === file.id) return setErr("Choose a different file");
            setNext({ id: m.id, url: m.url, filename: m.filename, mime: m.mime });
          }}
        />
      )}
    </div>
  );
}

export type DescribeItem = MediaItem & { places: { label: string; pagePath: string | null }[] };

const fromName = (f: string) =>
  f
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\d{2,}x\d{2,}\b|\b[0-9a-f]{6,}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

/** Pictures without a description, one row each: Enter saves and moves to the next. */
export function DescribeQueue({ items }: { items: DescribeItem[] }) {
  const [done, setDone] = useState<Record<number, string>>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [err, setErr] = useState<Record<number, string>>({});
  const refs = useRef<Record<number, HTMLInputElement | null>>({});
  const left = items.filter((m) => !done[m.id]);

  const save = async (m: DescribeItem, i: number) => {
    const v = (values[m.id] ?? "").trim();
    if (!v) return;
    const r = await setMediaAlt(m.id, v);
    if ("error" in r) return setErr({ ...err, [m.id]: r.error });
    setDone((d) => ({ ...d, [m.id]: v }));
    const nextItem = items.slice(i + 1).find((x) => !done[x.id]);
    if (nextItem) refs.current[nextItem.id]?.focus();
  };

  if (!items.length) return <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm">Every picture has a description.</p>;
  return (
    <>
      <p className="mb-4 text-sm text-neutral-600" role="status">{left.length ? `${left.length} left` : "All done — every picture in this list has a description."}</p>
      <ol className="space-y-3">
        {items.map((m, i) => {
          const suggestions = [...new Set([fromName(m.filename), ...m.places.map((p) => p.label)].filter((s) => s && s.length > 2))].slice(0, 4);
          return (
            <li key={m.id} className={`grid gap-4 rounded-lg border bg-white p-3 sm:grid-cols-[160px_1fr] ${done[m.id] ? "border-emerald-200 opacity-60" : "border-neutral-200"}`}>
              <Thumb m={m} className="h-28" />
              <div className="min-w-0 space-y-2 text-sm">
                <div className="truncate font-medium" title={m.filename}>{m.filename}</div>
                <div className="text-xs text-neutral-500">{m.places.length ? `Used in: ${m.places.map((p) => p.label).join(" · ")}` : "Not used on the site"}</div>
                {done[m.id] ? (
                  <div className="text-emerald-800">✓ {done[m.id]}</div>
                ) : (
                  <>
                    <input
                      ref={(el) => { refs.current[m.id] = el; }}
                      aria-label={`Description of ${m.filename}`}
                      value={values[m.id] ?? ""}
                      onChange={(e) => setValues({ ...values, [m.id]: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && save(m, i)}
                      maxLength={300}
                      placeholder="What is in the picture — Enter to save and go to the next"
                      className={inputCls}
                    />
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      {suggestions.map((s) => (
                        <button key={s} type="button" onClick={() => { setValues({ ...values, [m.id]: s }); refs.current[m.id]?.focus(); }} className="rounded-full border border-neutral-300 px-2 py-0.5 hover:bg-neutral-100">
                          {s}
                        </button>
                      ))}
                      <span className="flex-1" />
                      <Button type="button" variant="secondary" onClick={() => save(m, i)} disabled={!(values[m.id] ?? "").trim()}>Save</Button>
                    </div>
                    {err[m.id] && <div className="text-xs text-red-700">{err[m.id]}</div>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
