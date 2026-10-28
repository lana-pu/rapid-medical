import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type StoredFile = { url: string; filename: string; size: number; mime: string };

/**
 * Minimal storage abstraction. "local" writes to public/uploads (fine for a
 * single server / dev). Swap in an S3 driver for multi-instance hosting.
 */
export async function storeFile(file: File): Promise<StoredFile> {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver !== "local") throw new Error(`Storage driver "${driver}" not implemented yet`);

  const ext = path.extname(file.name).toLowerCase() || "";
  const base = path
    .basename(file.name, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const stamp = new Date().toISOString().slice(0, 7); // yyyy-mm
  const filename = `${base || "file"}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", stamp);
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buf);
  return { url: `/uploads/${stamp}/${filename}`, filename, size: buf.length, mime: file.type };
}
