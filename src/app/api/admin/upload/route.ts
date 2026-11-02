import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { storeFile } from "@/lib/storage";
import { db, media } from "@/db";

const MAX = 200 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|gif|svg\+xml)|application\/pdf|video\/(mp4|webm))$/;

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "File too large (max 200 MB)" }, { status: 400 });
  if (!ALLOWED.test(file.type)) return NextResponse.json({ error: `Unsupported type ${file.type}` }, { status: 400 });

  const stored = await storeFile(file);
  const [row] = await db
    .insert(media)
    .values({ url: stored.url, filename: stored.filename, mime: stored.mime, size: stored.size, alt: String(fd.get("alt") ?? "") })
    .returning();
  return NextResponse.json({ url: row.url, id: row.id });
}
