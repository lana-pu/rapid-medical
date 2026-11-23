"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { DocPage } from "@/db/schema";
import { zoomWidth } from "@/lib/document-view";
import { Button } from "./ui";

/** The column is ~620 px from md up (7 of 12 columns), the full width below. */
const SIZES = "(min-width: 768px) 620px, 100vw";

/**
 * The pages of `DocumentPages`: plain pictures, a thin line with «Page N of M» between them, «Show all N pages» after
 * the first ones, and a click opening a page large in a window over the page (its own scroll; Close, Esc, backdrop).
 */
export function DocumentPagesView({ pages, first, title }: { pages: DocPage[]; first: number; title: string }) {
  const [all, setAll] = useState(first >= pages.length);
  const [zoom, setZoom] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const shown = all ? pages : pages.slice(0, first);
  const n = pages.length;

  useEffect(() => {
    if (zoom !== null && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [zoom]);

  const big = zoom !== null ? pages[zoom] : null;
  const top = big?.variants[big.variants.length - 1];

  return (
    <>
      {shown.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <div className="my-7 flex items-center gap-3 text-xs tabular-nums text-muted" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              Page {i + 1} of {n}
            </div>
          )}
          <button type="button" onClick={() => setZoom(i)} className="block w-full cursor-zoom-in" aria-label={`Enlarge page ${i + 1} of ${n}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pictures of our own storage with their own srcset */}
            <img
              src={p.variants[0].url}
              srcSet={p.variants.map((v) => `${v.url} ${v.w}w`).join(", ")}
              sizes={SIZES}
              width={p.w}
              height={p.h}
              alt={`${title}, page ${i + 1} of ${n}`}
              loading={i === 0 ? "eager" : "lazy"}
              className="block h-auto w-full"
            />
          </button>
        </Fragment>
      ))}
      {!all && (
        <Button variant="secondary" size="lg" block onClick={() => setAll(true)} className="mt-7">
          Show all {n} pages
        </Button>
      )}
      <dialog
        ref={dialog}
        aria-label={zoom !== null ? `${title}, page ${zoom + 1} of ${n}` : undefined}
        onClose={() => setZoom(null)}
        onClick={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.backdrop) dialog.current?.close(); }}
        className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-foreground/80"
      >
        {big && top && (
          <div data-backdrop="1" className="h-full w-full overflow-auto p-4 md:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={top.url} width={big.w} height={big.h} alt={`${title}, page ${zoom! + 1} of ${n}`} style={{ width: zoomWidth(big) }} className="mx-auto block h-auto max-w-none bg-background" />
          </div>
        )}
        <button type="button" onClick={() => dialog.current?.close()} className="fixed right-4 top-4 rounded bg-background px-3 py-1.5 text-sm">
          Close
        </button>
      </dialog>
    </>
  );
}
