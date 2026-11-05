import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ingestFile } from "@/lib/media";
import { audit } from "@/lib/audit";

const MAX = 200 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|gif|svg\+xml)|application\/pdf|video\/(mp4|webm))$/;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File too large (max 200 MB)" }, { status: 400 });
  if (!ALLOWED.test(file.type)) return NextResponse.json({ error: `Unsupported type ${file.type}` }, { status: 400 });

  if ((process.env.STORAGE_DRIVER ?? "local") === "local" && process.env.VERCEL)
    return NextResponse.json({ error: "Uploads are not available on this host yet: configure S3 storage (STORAGE_DRIVER=s3) — see README › Media." }, { status: 503 });
  let row;
  try {
    row = await ingestFile(file, String(fd.get("alt") ?? ""));
  } catch (e) {
    return NextResponse.json({ error: `Upload failed: ${(e as Error).message}` }, { status: 500 });
  }
  await audit(session, "media", { recordId: row.id, label: row.filename, meta: { size: row.size, variants: row.variants.length } });
  return NextResponse.json({ url: row.url, id: row.id, variants: row.variants, posterUrl: row.posterUrl });
}
