"use client";

import { useEffect, useMemo, useState } from "react";
import { withBase } from "@/lib/demo";
import type { LabFile } from "./render";

/**
 * The media library in the blocks sandbox: the site's real files (images, videos, PDFs) — tabs by kind with counts,
 * search by name and description, a grid of previews, the chosen file's card (preview, description, size, format)
 * and «Use». Uploading needs the server, so it is not here; the admin's library (/admin/media) uploads.
 */

type Kind = LabFile["kind"] | "all";
const KINDS: { id: Kind; label: string }[] = [{ id: "all", label: "Все" }, { id: "image", label: "Картинки" }, { id: "video", label: "Видео" }, { id: "document", label: "Документы" }];
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(n / 1024))} КБ`);
const ext = (f: LabFile) => (f.filename.split(".").pop() ?? f.mime).toUpperCase();

export function Preview({ f, className = "" }: { f: LabFile; className?: string }) {
  if (f.kind === "video" && !f.thumb)
    return <video src={withBase(f.url)} muted playsInline preload="metadata" className={`h-full w-full bg-inverse object-cover ${className}`} />;
  if (f.thumb)
    return (
      <span className={`relative block h-full w-full ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={withBase(f.thumb)} alt="" loading="lazy" className={`h-full w-full ${f.kind === "image" ? "object-contain" : "object-cover"}`} />
        {f.kind === "video" && <span className="absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-xs text-foreground">▶</span>}
      </span>
    );
  return <span className={`flex h-full w-full items-center justify-center text-xs text-muted ${className}`}>{ext(f)}</span>;
}

export function MediaLibrary({ files, want, current, onPick, onClose }: { files: LabFile[]; /** only this kind may be chosen (a picture for a photo, a video for a poster…) */ want?: LabFile["kind"]; current?: string; onPick: (f: LabFile) => void; onClose: () => void }) {
  const [kind, setKind] = useState<Kind>(want ?? "all");
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState<LabFile | null>(() => files.find((f) => f.url === current) ?? null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopImmediatePropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const counts = useMemo(() => Object.fromEntries(KINDS.map((k) => [k.id, files.filter((f) => k.id === "all" || f.kind === k.id).length])), [files]);
  const shown = files.filter((f) => (kind === "all" || f.kind === kind) && (!q || `${f.filename} ${f.alt}`.toLowerCase().includes(q.toLowerCase())));
  const allowed = (f: LabFile) => !want || f.kind === want;

  return (
    <div data-lab-modal className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-4" onClick={onClose} role="dialog" aria-modal aria-label="Медиатека">
      <div className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold">Медиатека</h2>
          <div role="tablist" className="flex gap-1">
            {KINDS.filter((k) => !want || k.id === want).map((k) => (
              <button key={k.id} role="tab" type="button" aria-selected={kind === k.id} onClick={() => setKind(k.id)}
                className={`rounded-full px-3 py-1 text-sm ${kind === k.id ? "bg-foreground text-background" : "text-muted hover:bg-surface hover:text-foreground"}`}>
                {k.label} <span className="tabular-nums opacity-70">{counts[k.id]}</span>
              </button>
            ))}
          </div>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по названию или описанию" aria-label="Поиск" autoFocus className="ml-auto h-8 w-64 rounded-md border border-border px-2.5 text-sm" />
          <button type="button" onClick={onClose} aria-label="Закрыть" className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground">✕</button>
        </header>
        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-h-0 overflow-auto p-4">
            {!shown.length && <p className="py-16 text-center text-sm text-muted">Ничего не нашлось. Измените поиск или вкладку.</p>}
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
              {shown.map((f) => (
                <li key={f.id}>
                  <button type="button" onClick={() => setFocus(f)} onDoubleClick={() => allowed(f) && onPick(f)} aria-pressed={focus?.id === f.id}
                    className={`grid w-full gap-1.5 rounded-md p-1.5 text-left ${focus?.id === f.id ? "bg-surface ring-2 ring-foreground" : "hover:bg-surface"} ${f.url === current ? "outline outline-1 outline-accent" : ""}`}>
                    <span className="block aspect-[4/3] overflow-hidden rounded bg-surface"><Preview f={f} /></span>
                    <span className="truncate text-xs">{f.filename}</span>
                    <span className="text-[11px] text-muted">{ext(f)} · {f.kind === "document" && f.pages ? `${f.pages} стр.` : f.width ? `${f.width}×${f.height}` : kb(f.size)}{f.kind === "image" && !f.alt ? " · без описания" : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <aside className="hidden min-h-0 flex-col gap-3 overflow-auto border-l border-border p-4 md:flex" aria-label="Файл">
            {focus ? (
              <>
                <div className="aspect-[4/3] overflow-hidden rounded-md bg-surface">
                  {focus.kind === "video" ? <video src={withBase(focus.url)} poster={focus.poster ? withBase(focus.poster) : undefined} controls muted className="h-full w-full bg-inverse object-contain" /> : <Preview f={focus} />}
                </div>
                <div className="break-all text-sm font-medium">{focus.filename}</div>
                <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-xs">
                  <dt className="text-muted">Формат</dt><dd>{ext(focus)}</dd>
                  <dt className="text-muted">Размер</dt><dd>{focus.width ? `${focus.width}×${focus.height} · ` : ""}{kb(focus.size)}</dd>
                  {focus.kind === "document" && <><dt className="text-muted">Страниц</dt><dd>{focus.pages || "—"}</dd></>}
                  {focus.kind === "video" && <><dt className="text-muted">Обложка</dt><dd>{focus.poster ? "есть" : "нет"}</dd></>}
                  <dt className="text-muted">Загружен</dt><dd>{focus.created}</dd>
                  <dt className="text-muted">Описание</dt><dd className={focus.alt ? "" : "text-danger"}>{focus.alt || (focus.kind === "image" ? "нет — нужно для незрячих и поиска" : "—")}</dd>
                </dl>
                <button type="button" disabled={!allowed(focus)} onClick={() => onPick(focus)} className="mt-auto h-9 rounded-md bg-foreground text-sm font-medium text-background disabled:opacity-40">
                  {allowed(focus) ? "Использовать" : "Здесь нужен другой тип файла"}
                </button>
              </>
            ) : <p className="text-sm text-muted">Выберите файл, чтобы увидеть его описание и размеры. Двойной клик — сразу использовать.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}
