"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { safeLocalPath } from "@/lib/safe-path";
import type { PageFile } from "@/admin/page-screen";

/**
 * Files of a page with previews (docs/screens/admin-sections.md → «Экран страницы» → Files): PDFs as rows with Preview,
 * pictures and videos as a grid of thumbnails; a click opens the file large over the screen. Admin chrome palette.
 */

export type Previewed = { url: string; kind: "image" | "video" | "pdf"; name: string };

/** The file large, over the screen: a picture, a playing video or the PDF itself. Esc or a click outside closes it. */
export function PreviewModal({ file, onClose }: { file: Previewed | null; onClose: () => void }) {
  useEffect(() => {
    if (!file) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [file, onClose]);
  if (!file) return null;
  // what may be opened: a file of the site itself (shown in the window) or an https address (a link only)
  const local = !!safeLocalPath(file.url, "");
  const safe = local || (/^https:\/\//i.test(file.url) && !/[\\\u0000-\u001f\u007f\s]/.test(file.url));
  return (
    <div role="dialog" aria-modal="true" aria-label={`Preview: ${file.name}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
          {safe && <a href={file.url} target="_blank" rel="noreferrer noopener" className="underline">Open in a new tab ↗</a>}
          <button type="button" onClick={onClose} aria-label="Close preview" className="rounded px-2 py-1 text-lg leading-none hover:bg-neutral-100">×</button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-100">
          {!safe && <p className="p-8 text-sm text-neutral-600">This address cannot be previewed.</p>}
          {safe && file.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element -- a library file shown as it is, at any size
            <img src={file.url} alt="" className="max-h-[80vh] max-w-full object-contain" />
          )}
          {safe && file.kind === "video" && <video src={file.url} controls autoPlay muted className="max-h-[80vh] max-w-full" />}
          {local && file.kind === "pdf" && <iframe src={file.url} title={file.name} referrerPolicy="no-referrer" className="h-[80vh] w-full bg-white" />}
          {safe && !local && file.kind === "pdf" && <p className="p-8 text-sm text-neutral-600">An outside PDF: open it in a new tab.</p>}
        </div>
      </div>
    </div>
  );
}

const FIRST = 12;

export function FilesOnPage({ files }: { files: PageFile[] }) {
  const [open, setOpen] = useState<Previewed | null>(null);
  const [all, setAll] = useState(false);
  if (!files.length) return <p className="text-sm text-neutral-500">No files from the media library on this page.</p>;
  const docs = files.filter((f) => f.kind === "PDF" || f.kind === "File");
  const pics = files.filter((f) => f.kind === "Picture" || f.kind === "Video");
  const shown = all ? pics : pics.slice(0, FIRST);

  return (
    <div className="space-y-3">
      {docs.length > 0 && (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {docs.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <span aria-hidden className="flex h-10 w-8 shrink-0 items-center justify-center rounded-sm border border-neutral-300 bg-white text-[9px] font-bold text-red-700">PDF</span>
              <span className="min-w-0 flex-1 basis-40 truncate">{f.filename}</span>
              {f.kind === "PDF" && <span className="shrink-0 text-xs text-neutral-500">opened {f.opens}× in 30 days</span>}
              {f.kind === "PDF" && <button type="button" onClick={() => setOpen({ url: f.url, kind: "pdf", name: f.filename })} className="shrink-0 rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-50">Preview</button>}
              <Link href={`/admin/media?id=${f.id}`} className="shrink-0 text-xs underline">Open · Replace</Link>
            </li>
          ))}
        </ul>
      )}
      {pics.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white p-3">
          <ul aria-label="Pictures and videos" className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {shown.map((f) => (
              <li key={f.id} className="min-w-0">
                <button type="button" onClick={() => setOpen({ url: f.url, kind: f.kind === "Video" ? "video" : "image", name: f.filename })} title={f.filename} className="group relative block aspect-[4/3] w-full overflow-hidden rounded border border-neutral-200 bg-neutral-100 hover:border-neutral-900">
                  {f.thumb ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={f.thumb} alt="" loading="lazy" className="h-full w-full object-contain" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-xs text-neutral-500">{f.kind}</span>
                  )}
                  {f.kind === "Video" && <span aria-hidden className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] text-white">▶ video</span>}
                </button>
                <Link href={`/admin/media?id=${f.id}`} className="mt-1 block truncate text-[11px] text-neutral-600 underline decoration-neutral-300" title={`${f.filename} — open in the media library`}>{f.filename}</Link>
              </li>
            ))}
          </ul>
          {pics.length > FIRST && (
            <button type="button" onClick={() => setAll((a) => !a)} className="mt-3 text-sm underline">{all ? "Show fewer" : `Show all (${pics.length})`}</button>
          )}
        </div>
      )}
      <PreviewModal file={open} onClose={() => setOpen(null)} />
    </div>
  );
}
