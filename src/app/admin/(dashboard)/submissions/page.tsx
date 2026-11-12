import Link from "next/link";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { db, contactSubmissions, users } from "@/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, formatDate, inputCls } from "@/components/admin/ui";
import { FORM_LABEL, STATUS_LABEL, formLabel } from "@/admin/request-labels";

type SP = { status?: string; form?: string; region?: string; mine?: string };

/** Requests: one inbox, who answers (docs/screens/admin-requests.md). */
export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const status = sp.status ?? "new";
  const base: SQL[] = [];
  if (sp.form && FORM_LABEL[sp.form]) base.push(eq(contactSubmissions.form, sp.form));
  if (sp.region) base.push(eq(contactSubmissions.region, sp.region));
  if (sp.mine) base.push(eq(contactSubmissions.assignedToId, me.id));
  const where = [...base, ...(status !== "all" && STATUS_LABEL[status] ? [eq(contactSubmissions.status, status as "new")] : [])];
  const [rows, counts, regions] = await Promise.all([
    db
      .select({ s: contactSubmissions, owner: users.name })
      .from(contactSubmissions)
      .leftJoin(users, eq(users.id, contactSubmissions.assignedToId))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(500),
    db.select({ status: contactSubmissions.status, n: count() }).from(contactSubmissions).where(base.length ? and(...base) : undefined).groupBy(contactSubmissions.status),
    db.selectDistinct({ region: contactSubmissions.region }).from(contactSubmissions).orderBy(contactSubmissions.region),
  ]);
  const n = (s: string) => (s === "all" ? counts.reduce((a, c) => a + c.n, 0) : counts.find((c) => c.status === s)?.n ?? 0);
  const href = (patch: Partial<SP>) => {
    const q = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/submissions${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Requests" subtitle="Everything people send through the forms on the site" actions={<a href="/api/admin/submissions.csv" className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Export CSV</a>} />
      <div className="mb-3 flex flex-wrap gap-1 border-b border-neutral-200" role="tablist" aria-label="Status">
        {["new", "in_progress", "done", "spam", "all"].map((t) => (
          <Link key={t} href={href({ status: t })} role="tab" aria-selected={status === t} className={`-mb-px border-b-2 px-3 py-2 text-sm ${status === t ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500"}`}>
            {t === "all" ? "All" : STATUS_LABEL[t]} <span className="text-neutral-400">{n(t)}</span>
          </Link>
        ))}
      </div>
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <input type="hidden" name="status" value={status} />
        <select name="form" defaultValue={sp.form ?? ""} aria-label="Form" className={`${inputCls} w-auto`}>
          <option value="">All forms</option>
          {Object.entries(FORM_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="region" defaultValue={sp.region ?? ""} aria-label="Region" className={`${inputCls} w-auto`}>
          <option value="">All regions</option>
          {regions.filter((r) => r.region).map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="mine" value="1" defaultChecked={!!sp.mine} /> Mine</label>
        <button className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm">Apply</button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">No requests here.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
          {rows.map(({ s, owner }) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
              <Link href={`/admin/submissions/${s.id}`} className="min-w-0 flex-1">
                <span className="block font-medium hover:underline">{formLabel(s.form)}{s.topic ? ` · ${s.topic}` : ""}</span>
                <span className="block text-neutral-600">{s.firstName} {s.lastName}{s.organization ? `, ${s.organization}` : ""}</span>
              </Link>
              <span className="w-36 text-neutral-500">{s.region || "—"}</span>
              <span className="w-40 text-neutral-500">{formatDate(s.createdAt, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" })}</span>
              <span className="w-28" title="Who answers">{owner ?? <span className="text-neutral-400">—</span>}</span>
              <span className="w-24 text-xs font-medium">{STATUS_LABEL[s.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
