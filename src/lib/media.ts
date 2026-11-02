import "server-only";
import { db, media, type Media } from "@/db";
import { processImage, videoPoster } from "./images";
import { storeFile, deleteObject } from "./storage";

const PREFIX = () => new Date().toISOString().slice(0, 7);

/** Ingest an uploaded file: optimise images, poster videos, register in the library. */
export async function ingestFile(file: File, alt = ""): Promise<Media> {
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const prefix = PREFIX();

  if (mime.startsWith("image/")) {
    const p = await processImage(file.name, buf, mime, prefix);
    const [row] = await db
      .insert(media)
      .values({ url: p.original.url, key: p.original.key, filename: p.original.key.split("/").pop()!, mime, size: p.original.size, width: p.width, height: p.height, variants: p.variants, placeholder: p.placeholder, alt })
      .returning();
    return row;
  }

  const stored = await storeFile(file, prefix);
  let posterUrl: string | null = null;
  if (mime.startsWith("video/")) posterUrl = (await videoPoster(file.name, buf, prefix))?.url ?? null;
  const [row] = await db.insert(media).values({ url: stored.url, key: stored.key, filename: stored.key.split("/").pop()!, mime, size: stored.size, posterUrl, alt }).returning();
  return row;
}

/** Remove a library entry and its files (original + variants + poster). */
export async function removeMedia(row: Media): Promise<void> {
  const keys = [row.key, ...row.variants.map((v) => keyFromUrl(v.url)), row.posterUrl ? keyFromUrl(row.posterUrl) : null].filter((k): k is string => !!k);
  for (const k of keys) await deleteObject(k).catch(() => {});
}

function keyFromUrl(url: string): string | null {
  const m = /\/uploads\/(.+)$/.exec(url);
  if (m) return m[1];
  const base = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  if (base && url.startsWith(base + "/")) return url.slice(base.length + 1);
  return null;
}

/** `srcset` string for a library image, or null when no variants exist. */
export function srcSet(row: Pick<Media, "variants">): string | null {
  return row.variants.length ? row.variants.map((v) => `${v.url} ${v.w}w`).join(", ") : null;
}
