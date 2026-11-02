import { desc, eq, ilike, or, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, media } from "@/db";
import { findMediaUsage } from "@/lib/media-usage";
import { PageHeader, formatDate, inputCls, Notice } from "@/components/admin/ui";
import { MediaGrid } from "@/components/admin/MediaGrid";

type SP = { q?: string; type?: string; page?: string; id?: string };

export default async function MediaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  if (sp.id) return <MediaDetail id={Number(sp.id)} />;

  const per = 60;
  const page = Math.max(1, Number(sp.page ?? 1));
  const conds = [];
  if (sp.q) conds.push(or(ilike(media.filename, `%${sp.q}%`), ilike(media.alt, `%${sp.q}%`)));
  if (sp.type === "image") conds.push(ilike(media.mime, "image/%"));
  if (sp.type === "video") conds.push(ilike(media.mime, "video/%"));
  if (sp.type === "pdf") conds.push(eq(media.mime, "application/pdf"));
  const where = conds.length ? sql.join(conds, sql` AND `) : undefined;
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(media).where(where).orderBy(desc(media.createdAt)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(media).where(where),
  ]);
  const pages = Math.max(1, Math.ceil(n / per));

  return (
    <>
      <PageHeader title="Media library" subtitle={`${n} files`} />
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search filename or alt…" className={`${inputCls} max-w-xs`} />
        <select name="type" defaultValue={sp.type ?? ""} className={`${inputCls} w-auto`}>
          <option value="">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="pdf">PDFs</option>
        </select>
        <button className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Apply</button>
      </form>
      <MediaGrid items={rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          {page > 1 && <Link href={`/admin/media?q=${sp.q ?? ""}&type=${sp.type ?? ""}&page=${page - 1}`} className="underline">‹ Prev</Link>}
          <span className="text-neutral-500">Page {page} of {pages}</span>
          {page < pages && <Link href={`/admin/media?q=${sp.q ?? ""}&type=${sp.type ?? ""}&page=${page + 1}`} className="underline">Next ›</Link>}
        </div>
      )}
    </>
  );
}

async function MediaDetail({ id }: { id: number }) {
  const m = await db.query.media.findFirst({ where: eq(media.id, id) });
  if (!m) notFound();
  const usage = await findMediaUsage(m.url);
  return (
    <>
      <PageHeader title={m.filename} subtitle={`${m.mime} · ${(m.size / 1024).toFixed(0)} KB · ${formatDate(m.createdAt, { dateStyle: "medium" })}`} actions={<Link href="/admin/media" className="text-sm underline">← Library</Link>} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border border-neutral-200 bg-white p-4">
          {m.mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt={m.alt} className="max-h-96 w-full object-contain" />
          ) : m.mime.startsWith("video/") ? (
            <video src={m.url} controls className="w-full" />
          ) : (
            <a href={m.url} target="_blank" className="underline">Open file</a>
          )}
          <input readOnly value={m.url} className={`${inputCls} mt-3 font-mono text-xs`} />
          {m.sourceUrl && <p className="mt-1 text-xs text-neutral-500">Migrated from: {m.sourceUrl}</p>}
        </div>
        <div className="rounded border border-neutral-200 bg-white p-4 text-sm">
          <h2 className="font-semibold">Used in {usage.length} place(s)</h2>
          {usage.length === 0 ? (
            <Notice kind="info">Not referenced anywhere — safe to delete.</Notice>
          ) : (
            <ul className="mt-2 space-y-1">
              {usage.map((u, i) => (
                <li key={i}><Link href={u.adminHref} className="underline">{u.label}</Link> <span className="text-neutral-400">({u.table})</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
