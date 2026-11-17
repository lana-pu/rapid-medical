import "server-only";
import { cache } from "react";
import { eq, inArray } from "drizzle-orm";
import { db, media, type DocPage } from "@/db";

export type MediaInfo = { url: string; srcSet: string | null; width: number | null; height: number | null; placeholder: string | null; posterUrl: string | null; alt: string };

/**
 * Resolves library metadata (responsive variants, poster, placeholder) for
 * a set of URLs in one query. Unknown URLs (external, legacy) come back as-is.
 * Cached per request.
 */
export const lookupMedia = cache(async (urls: (string | null | undefined)[]): Promise<Map<string, MediaInfo>> => {
  const wanted = [...new Set(urls.filter((u): u is string => !!u))];
  const out = new Map<string, MediaInfo>();
  if (!wanted.length) return out;
  const rows = await db.select().from(media).where(inArray(media.url, wanted));
  for (const r of rows) {
    out.set(r.url, {
      url: r.url,
      srcSet: r.variants.length ? r.variants.map((v) => `${v.url} ${v.w}w`).join(", ") : null,
      width: r.width,
      height: r.height,
      placeholder: r.placeholder,
      posterUrl: r.posterUrl,
      alt: r.alt,
    });
  }
  return out;
});

export type DocumentInfo = { url: string; size: number; pages: DocPage[]; text: string; pageCount: number };

/** A library PDF with its pages as pictures and text (screens/material.md → «Документ на странице»). Cached per request. */
export const lookupDocument = cache(async (url: string): Promise<DocumentInfo | null> => {
  const row = await db.query.media.findFirst({ where: eq(media.url, url), columns: { url: true, size: true, pages: true, text: true, pageCount: true } });
  return row ?? null;
});
