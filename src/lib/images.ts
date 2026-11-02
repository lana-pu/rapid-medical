import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, unlink, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { putObject, safeName, type StoredFile } from "./storage";

const run = promisify(execFile);

/** Responsive widths generated for every raster image. */
export const IMAGE_WIDTHS = [480, 960, 1600] as const;
export type Variant = { w: number; url: string };

export type ProcessedImage = {
  original: StoredFile;
  width: number | null;
  height: number | null;
  /** WebP variants, ascending width; empty for SVG/GIF */
  variants: Variant[];
  /** Tiny inline placeholder (data URI) for blur-up */
  placeholder: string | null;
};

/**
 * Stores an image and, for raster formats, WebP variants at IMAGE_WIDTHS
 * (never upscaled) plus a 16px blur placeholder.
 * Animated GIFs and SVGs are stored untouched.
 */
export async function processImage(name: string, buf: Buffer, mime: string, prefix: string, opts: { skipOriginal?: boolean } = {}): Promise<ProcessedImage> {
  const base = safeName(name);
  const stem = base.replace(/\.[^.]+$/, "");
  const original = opts.skipOriginal ? { url: "", key: "", size: buf.length, mime } : await putObject(`${prefix}/${base}`, buf, mime);

  if (mime === "image/svg+xml" || mime === "image/gif") return { original, width: null, height: null, variants: [], placeholder: null };

  const img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  const width = meta.width ?? null;
  const height = meta.height ?? null;

  const variants: Variant[] = [];
  for (const w of IMAGE_WIDTHS) {
    if (width && w >= width && variants.length) break; // don't upscale; keep one variant ≥ original
    const out = await sharp(buf).rotate().resize({ width: Math.min(w, width ?? w), withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const stored = await putObject(`${prefix}/${stem}-${w}w.webp`, out, "image/webp");
    variants.push({ w: Math.min(w, width ?? w), url: stored.url });
    if (width && w >= width) break;
  }
  const tiny = await sharp(buf).rotate().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  const placeholder = `data:image/webp;base64,${tiny.toString("base64")}`;

  return { original, width, height, variants, placeholder };
}

/** First frame of an mp4 as a WebP poster, if ffmpeg is available. */
export async function videoPoster(name: string, buf: Buffer, prefix: string): Promise<StoredFile | null> {
  const dir = await mkdtemp(path.join(tmpdir(), "rm-video-"));
  const input = path.join(dir, "in.mp4");
  const frame = path.join(dir, "frame.png");
  try {
    await writeFile(input, buf);
    await run("ffmpeg", ["-y", "-ss", "0.5", "-i", input, "-frames:v", "1", "-vf", "scale='min(1600,iw)':-2", frame], { timeout: 30000 });
    const png = await readFile(frame);
    const webp = await sharp(png).webp({ quality: 80 }).toBuffer();
    return await putObject(`${prefix}/${safeName(name).replace(/\.[^.]+$/, "")}-poster.webp`, webp, "image/webp");
  } catch {
    return null;
  } finally {
    await unlink(input).catch(() => {});
    await unlink(frame).catch(() => {});
  }
}
