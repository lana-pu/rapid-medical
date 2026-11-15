import { safeHref } from "@/lib/safe-path";

/** A PDF can be shown on the page only from our own storage (journals and other sites forbid being framed). */
export function isLocalPdf(u: string | null | undefined): boolean {
  return !!u && /^\/uploads\/[^?#]+\.pdf(?:[?#].*)?$/i.test(u);
}

/**
 * «Embed the PDF» mode of «page from a document» (DESIGN.md): the browser's own viewer — pages, zoom, download — with a
 * link when the browser cannot show it. Only for our own files (`isLocalPdf`).
 */
export function PdfViewer({ href, title, caption }: { href: string; title: string; caption?: string | null }) {
  const src = safeHref(href);
  return (
    <figure>
      <object data={src} type="application/pdf" aria-label={`${title} (PDF)`} className="h-[80vh] w-full rounded border border-border">
        <p className="p-6 text-sm">This browser cannot show the PDF here. <a href={src} className="underline">Download PDF</a></p>
      </object>
      {caption && <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption>}
    </figure>
  );
}
