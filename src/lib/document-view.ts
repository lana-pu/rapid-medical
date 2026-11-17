import type { DocPage } from "@/db/schema";

/**
 * How a PDF drawn into pictures is shown (screens/material.md → «Документ на странице»). Plain functions: used by the
 * page (server) and its viewer (browser).
 */

/** How many pages are visible before «Show all»: 2, landscape 3; all when only one would stay hidden. */
export function initialPages(pages: Pick<DocPage, "w" | "h">[]): number {
  if (!pages.length) return 0;
  const first = pages[0].w > pages[0].h ? 3 : 2;
  return pages.length - first <= 1 ? pages.length : first;
}

/** The stored text split back into pages (pages are separated by «\f»). */
export function textPages(text: string): string[] {
  return text ? text.split("\f").map((t) => t.trim()) : [];
}

/** Width in CSS pixels of a page enlarged: an ordinary page 1200 px, a large one (poster) half its biggest picture. */
export function zoomWidth(page: Pick<DocPage, "variants">): number {
  const w = page.variants[page.variants.length - 1]?.w ?? 0;
  return w > 1600 ? Math.round(w / 2) : 1200;
}

/** «1.5 MB», «280 KB». */
export function fileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
