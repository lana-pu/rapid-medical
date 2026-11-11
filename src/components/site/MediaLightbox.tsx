"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO = /\.(mp4|webm|mov)$/i;
const IMAGE = /\.(jpe?g|png|webp|gif)$/i;

/** Media kind of a link target, or null for anything else. Exported for tests. */
export function mediaKind(href: string): "video" | "image" | null {
  let path: string;
  try {
    path = new URL(href, "https://x.invalid").pathname;
  } catch {
    return null;
  }
  return VIDEO.test(path) ? "video" : IMAGE.test(path) ? "image" : null;
}

/**
 * Links to a video or a picture open in a window over the page instead of a separate page
 * (decision 2026-11-10: the Duda one-video "wrapper" pages are gone). DESIGN.md → MediaLightbox.
 * Without JS the link simply opens the file.
 */
export function MediaLightbox() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [media, setMedia] = useState<{ kind: "video" | "image"; src: string; label: string } | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.hasAttribute("download") || a.closest("[data-editing]")) return;
      const kind = mediaKind(a.getAttribute("href") ?? "");
      if (!kind) return;
      e.preventDefault();
      e.stopPropagation();
      setMedia({ kind, src: a.href, label: a.textContent?.trim() || "Media" });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (media && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [media]);

  return (
    <dialog
      ref={dialog}
      aria-label={media?.label}
      onClose={() => setMedia(null)}
      onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
      className="m-auto max-h-[90vh] w-full max-w-5xl bg-transparent p-0 backdrop:bg-foreground/80"
    >
      {media && (
        <div className="flex flex-col items-end gap-2">
          <button type="button" onClick={() => dialog.current?.close()} className="rounded bg-background px-3 py-1 text-sm">Close</button>
          {media.kind === "video" ? (
            <video src={media.src} controls autoPlay playsInline className="aspect-video max-h-[80vh] w-full rounded bg-foreground" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.src} alt={media.label} className="max-h-[80vh] w-auto rounded bg-background" />
          )}
        </div>
      )}
    </dialog>
  );
}
