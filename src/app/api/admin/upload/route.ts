import { NextResponse } from "next/server";
import { getSession, isReady } from "@/lib/auth";
import { ingestFile } from "@/lib/media";
import { audit } from "@/lib/audit";
import { sniffType, svgIsSafe } from "@/lib/file-type";

const MAX = 200 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getSession();
  if (!isReady(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File too large (max 200 MB)" }, { status: 400 });
  // the type from the file's own bytes, never from its name or the browser (security check 2026-11-13)
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniffType(buf);
  if (!kind) return NextResponse.json({ error: "Upload a PNG, JPEG, WebP, GIF, SVG, MP4, WebM or PDF file" }, { status: 400 });
  if (kind.mime === "image/svg+xml" && !svgIsSafe(buf)) return NextResponse.json({ error: "This SVG contains scripts" }, { status: 400 });

  if ((process.env.STORAGE_DRIVER ?? "local") === "local" && process.env.VERCEL)
    return NextResponse.json({ error: "Uploads are not available on this host yet: configure S3 storage (STORAGE_DRIVER=s3) — see README › Media." }, { status: 503 });
  let row;
  try {
    row = await ingestFile({ name: file.name, buf, ...kind }, String(fd.get("alt") ?? ""));
  } catch (e) {
    return NextResponse.json({ error: `Upload failed: ${(e as Error).message}` }, { status: 500 });
  }
  await audit(session, "media", { recordId: row.id, label: row.filename, meta: { size: row.size, variants: row.variants.length } });
  return NextResponse.json({ url: row.url, id: row.id, variants: row.variants, posterUrl: row.posterUrl });
}
