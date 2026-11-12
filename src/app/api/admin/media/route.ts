import { NextResponse } from "next/server";
import { desc, ilike, or, sql, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db, media } from "@/db";
import { findMediaUsage } from "@/lib/media-usage";
import { removeMedia } from "@/lib/media";

/** A signed-in admin user who passed the second factor. */
async function signedIn() {
  const s = await getSession();
  return s && !s.totpPending ? s : null;
}

/** GET /api/admin/media?q=&type=image|video|pdf&page=1 — media library listing for the picker. */
export async function GET(req: Request) {
  if (!(await signedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const type = url.searchParams.get("type") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const per = 48;

  const conds = [];
  if (q) conds.push(or(ilike(media.filename, `%${q}%`), ilike(media.alt, `%${q}%`)));
  if (type === "image") conds.push(ilike(media.mime, "image/%"));
  if (type === "video") conds.push(ilike(media.mime, "video/%"));
  if (type === "pdf") conds.push(eq(media.mime, "application/pdf"));
  if (type === "noalt") conds.push(sql`${media.mime} like 'image/%' and ${media.alt} = ''`);
  const where = conds.length ? sql.join(conds, sql` AND `) : undefined;

  const [rows, [{ n }]] = await Promise.all([
    db.select().from(media).where(where).orderBy(desc(media.createdAt)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(media).where(where),
  ]);
  return NextResponse.json({ items: rows, total: n, page, per });
}

/** PATCH /api/admin/media — update alt text. */
export async function PATCH(req: Request) {
  if (!(await signedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, alt } = (await req.json()) as { id: number; alt: string };
  await db.update(media).set({ alt: String(alt ?? "").replace(/\s+/g, " ").trim().slice(0, 300) }).where(eq(media.id, Number(id)));
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/media?id= — refuses when the file is still referenced. */
export async function DELETE(req: Request) {
  if (!(await signedIn())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  const row = await db.query.media.findFirst({ where: eq(media.id, id) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const usage = await findMediaUsage(row.url);
  if (usage.length) return NextResponse.json({ error: "File is in use", usage }, { status: 409 }); // drafts included
  await removeMedia(row);
  await db.delete(media).where(eq(media.id, id));
  return NextResponse.json({ ok: true });
}
