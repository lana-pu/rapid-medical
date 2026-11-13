import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Storage drivers.
 *   STORAGE_DRIVER=local  → public/uploads/<yyyy-mm>/…   (single server / dev)
 *   STORAGE_DRIVER=s3     → any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze, MinIO)
 *                           needs S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 *                           optional S3_ENDPOINT (R2/MinIO) and S3_PUBLIC_URL (CDN in front of the bucket)
 */

export type StoredFile = { url: string; key: string; size: number; mime: string };

export function safeName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
  return `${base}-${crypto.randomBytes(4).toString("hex")}${ext}`;
}

function driver() {
  return (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
}

let s3: S3Client | null = null;
function client() {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
    });
  }
  return s3;
}

/** Store raw bytes under a key like "2026-11/name-ab12.webp". */
export async function putObject(key: string, body: Buffer, mime: string): Promise<StoredFile> {
  if (driver() === "s3") {
    // an SVG opened on its own from the bucket must not run anything (pictures in <img> ignore these)
    const svg = mime === "image/svg+xml" ? { ContentDisposition: "attachment" } : {};
    await client().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: body, ContentType: mime, CacheControl: "public, max-age=31536000, immutable", ...svg }));
    const base = (process.env.S3_PUBLIC_URL ?? `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`).replace(/\/$/, "");
    return { url: `${base}/${key}`, key, size: body.length, mime };
  }
  const file = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
  return { url: `/uploads/${key}`, key, size: body.length, mime };
}

export async function deleteObject(key: string): Promise<void> {
  if (driver() === "s3") {
    await client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    return;
  }
  await unlink(path.join(process.cwd(), "public", "uploads", key)).catch(() => {});
}
