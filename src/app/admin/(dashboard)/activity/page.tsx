import Link from "next/link";
import { desc, eq, and, ilike, sql } from "drizzle-orm";
import { db, auditLog, users } from "@/db";
import { PageHeader, formatDate, inputCls } from "@/components/admin/ui";
import { getResource } from "@/admin/resources";

const ACTIONS = ["login", "login_failed", "logout", "save", "publish", "unpublish", "delete", "restore", "bulk", "settings", "user", "media", "review", "schedule"];

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ action?: string; user?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const per = 100;
  const page = Math.max(1, Number(sp.page ?? 1));
  const conds = [];
  if (sp.action) conds.push(eq(auditLog.action, sp.action));
  if (sp.user) conds.push(eq(auditLog.userId, Number(sp.user)));
  if (sp.q) conds.push(ilike(auditLog.label, `%${sp.q}%`));
  const where = conds.length ? and(...conds) : undefined;
  const [rows, [{ n }], people] = await Promise.all([
    db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(auditLog).where(where),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  const pages = Math.max(1, Math.ceil(n / per));
  const link = (e: typeof rows[number]) => {
    if (!e.resource) return null;
    const r = getResource(e.resource);
    if (!r || !e.recordId) return null;
    return `/admin/${r.slug}/${e.recordId}`;
  };

  return (
    <>
      <PageHeader title="Activity log" subtitle={`${n} entries`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <select name="action" defaultValue={sp.action ?? ""} className={`${inputCls} w-auto`}>
          <option value="">Any action</option>{ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select name="user" defaultValue={sp.user ?? ""} className={`${inputCls} w-auto`}>
          <option value="">Anyone</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Record label…" className={`${inputCls} max-w-xs`} />
        <button className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Apply</button>
      </form>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Who</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">What</th><th className="px-3 py-2">Details</th><th className="px-3 py-2">IP</th></tr></thead>
          <tbody>
            {rows.map((e) => {
              const href = link(e);
              return (
                <tr key={e.id} className="border-t border-neutral-100">
                  <td className="whitespace-nowrap px-3 py-2 text-neutral-500">{formatDate(e.createdAt, { dateStyle: "short", timeStyle: "medium" })}</td>
                  <td className="px-3 py-2">{e.userName || <span className="text-neutral-400">—</span>}</td>
                  <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-xs ${e.action === "publish" ? "bg-green-100 text-green-800" : e.action === "delete" || e.action === "login_failed" ? "bg-red-100 text-red-800" : "bg-neutral-100"}`}>{e.action}</span></td>
                  <td className="px-3 py-2">{href ? <Link href={href} className="underline">{e.label || `${e.resource} #${e.recordId}`}</Link> : e.label || e.resource || ""}</td>
                  <td className="max-w-md truncate px-3 py-2 font-mono text-[11px] text-neutral-500" title={JSON.stringify(e.meta)}>{Object.keys(e.meta).length ? JSON.stringify(e.meta) : ""}</td>
                  <td className="px-3 py-2 text-neutral-400">{e.ip}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-neutral-400">No activity yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-4 flex justify-center gap-3 text-sm">
          {page > 1 && <Link href={`?action=${sp.action ?? ""}&user=${sp.user ?? ""}&q=${sp.q ?? ""}&page=${page - 1}`} className="underline">‹ Prev</Link>}
          <span className="text-neutral-500">Page {page} of {pages}</span>
          {page < pages && <Link href={`?action=${sp.action ?? ""}&user=${sp.user ?? ""}&q=${sp.q ?? ""}&page=${page + 1}`} className="underline">Next ›</Link>}
        </div>
      )}
    </>
  );
}
