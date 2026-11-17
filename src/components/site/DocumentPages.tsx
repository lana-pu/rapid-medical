import { safeHref } from "@/lib/safe-path";
import { lookupDocument } from "@/lib/media-lookup";
import { fileSize, initialPages, textPages } from "@/lib/document-view";
import { DocumentPagesView } from "./DocumentPagesView";

/** A PDF can be shown on the page only from our own storage (journals and other sites forbid being framed). */
export function isLocalPdf(u: string | null | undefined): boolean {
  return !!u && /^\/uploads\/[^?#]+\.pdf(?:[?#].*)?$/i.test(u);
}

/**
 * «The document on the page» (decision 2026-11-16, screens/material.md, DESIGN.md → DocumentPages): the PDF's pages as
 * pictures one under another — no browser viewer, frame or toolbar; the first pages, then «Show all»; a click enlarges
 * a page. Under them, folded, the document's text. Not drawn (yet) → a download line.
 */
export async function DocumentPages({ href, title, caption }: { href: string; title: string; caption?: string | null }) {
  const src = safeHref(href);
  const doc = isLocalPdf(src) ? await lookupDocument(src.replace(/[?#].*$/, "")) : null;

  if (!doc?.pages.length) {
    return (
      <figure>
        <p className="text-sm">
          <a href={src} target="_blank" rel="noopener noreferrer" className="underline">Download PDF</a>
          {doc && <span className="text-muted"> · {fileSize(doc.size)}</span>}
        </p>
        {caption && <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption>}
      </figure>
    );
  }

  const text = textPages(doc.text);
  return (
    <figure data-document>
      <DocumentPagesView pages={doc.pages} first={initialPages(doc.pages)} title={title} />
      {doc.pageCount > doc.pages.length && (
        // the limits stopped the drawing: say so, the whole file is one click away (screens/material.md)
        <p className="mt-4 text-sm">
          The first {doc.pages.length} of {doc.pageCount} pages are shown.{" "}
          <a href={src} target="_blank" rel="noopener noreferrer" className="underline">Download PDF</a> for the whole document.
        </p>
      )}
      {caption && <figcaption className="mt-4 text-xs text-muted">{caption}</figcaption>}
      {text.some(Boolean) && (
        <details className="mt-8 border-t border-border pt-4 text-sm">
          <summary className="cursor-pointer font-medium">Text of this document</summary>
          <div className="mt-2 max-w-prose">
            {text.map((t, i) =>
              t ? (
                <section key={i} aria-label={`Page ${i + 1}`}>
                  <h3 className="mt-6 text-xs text-muted">Page {i + 1}</h3>
                  <p className="mt-2 whitespace-pre-line leading-relaxed">{t}</p>
                </section>
              ) : null,
            )}
          </div>
        </details>
      )}
    </figure>
  );
}
