import crypto from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import type { DocPage } from "@/db/schema";
import { putObject } from "./storage";

/**
 * «The document on the page» (decision 2026-11-16, screens/material.md): a PDF is drawn once, page by page, into WebP
 * pictures, and its text is taken out. The site then shows plain pages instead of the browser's PDF viewer.
 * Used by `ingestFile` (upload) and `scripts/document-pages.ts` (files already on the site).
 */

/** Widths every page is stored at (the column is ~700 px; 1600 covers a sharp screen). */
export const PAGE_WIDTHS = [800, 1600] as const;
/** A large page (poster) gets one more variant, ~150 dpi, for the enlarged view (when ≥ 1.5 × 1600) — never wider than this. */
export const ZOOM_MAX = 4000;
/** Pages drawn at most; a longer file is shown up to here, the rest is in «Download PDF». */
export const MAX_PAGES = 100;
const MAX_HEIGHT = 16000; // a very tall page is drawn smaller rather than as a giant picture
const QUALITY = 72;

/** Variant widths for a page `pt` points wide (1 pt = 1/72 in), ascending. Exported for tests. */
export function variantWidths(pt: number): number[] {
  const zoom = Math.min(ZOOM_MAX, Math.round((pt * 150) / 72));
  // only when it is really larger: a landscape slide (~1750 px) reads fine at 1600
  return zoom >= PAGE_WIDTHS[PAGE_WIDTHS.length - 1] * 1.5 ? [...PAGE_WIDTHS, zoom] : [...PAGE_WIDTHS];
}

type Drawn = { pages: { w: number; h: number; images: { w: number; buf: Buffer }[] }[]; text: string; total: number };

/** pdfjs is loaded on demand: the upload of a picture does not pay for it. */
async function pdfjs() {
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

const assets = (dir: string) => path.join(process.cwd(), "node_modules", "pdfjs-dist", dir) + path.sep;

/** Draws every page (up to MAX_PAGES) of a PDF into WebP pictures and takes out its text. */
export async function drawPdf(buf: Buffer): Promise<Drawn> {
  const { getDocument } = await pdfjs();
  const { createCanvas } = await import("@napi-rs/canvas");
  const task = getDocument({
    data: new Uint8Array(buf),
    standardFontDataUrl: assets("standard_fonts"),
    cMapUrl: assets("cmaps"),
    cMapPacked: true,
    verbosity: 0,
  });
  const doc = await task.promise;
  try {
    const pages: Drawn["pages"] = [];
    const texts: string[] = [];
    const n = Math.min(doc.numPages, MAX_PAGES);
    for (let i = 1; i <= n; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const widths = variantWidths(base.width);
      let top = widths[widths.length - 1];
      if ((top * base.height) / base.width > MAX_HEIGHT) top = Math.floor((MAX_HEIGHT * base.width) / base.height);
      const vp = page.getViewport({ scale: top / base.width });
      const canvas = createCanvas(Math.round(vp.width), Math.round(vp.height));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // @napi-rs/canvas is what pdfjs uses in Node itself; its types differ from the DOM's
      await page.render({ canvas: canvas as never, canvasContext: ctx as never, viewport: vp }).promise;
      const png = await canvas.encode("png");
      const images: { w: number; buf: Buffer }[] = [];
      for (const w of widths.filter((x) => x <= top).concat(widths.some((x) => x > top) ? [top] : [])) {
        images.push({ w, buf: await sharp(png).resize({ width: w }).webp({ quality: QUALITY }).toBuffer() });
      }
      pages.push({ w: canvas.width, h: canvas.height, images });

      const content = await page.getTextContent();
      texts.push(
        content.items
          .map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : "") : ""))
          .join("")
          .replace(/[ \t]+/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
      );
      page.cleanup();
    }
    // a scanned file has no text: keep it empty rather than a row of page breaks
    const text = texts.some(Boolean) ? texts.join("\f") : "";
    return { pages, text, total: doc.numPages };
  } finally {
    await task.destroy();
  }
}

/**
 * Draws a library PDF and stores its pages under `pages/{id}-{hash}/` (the hash of the file's bytes: a replaced file
 * never shows a cached old page). Returns what goes into `media.pages` / `media.text`.
 */
export async function storeDocumentPages(id: number, buf: Buffer): Promise<{ pages: DocPage[]; text: string }> {
  const drawn = await drawPdf(buf);
  const dir = `pages/${id}-${crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8)}`;
  const pages: DocPage[] = [];
  for (const [i, p] of drawn.pages.entries()) {
    const variants: DocPage["variants"] = [];
    for (const img of p.images) {
      const stored = await putObject(`${dir}/p${i + 1}-${img.w}.webp`, img.buf, "image/webp");
      variants.push({ w: img.w, url: stored.url });
    }
    pages.push({ w: p.w, h: p.h, variants });
  }
  return { pages, text: drawn.text };
}
