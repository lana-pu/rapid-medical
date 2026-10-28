import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, contactSubmissions } from "@/db";
import { PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const q = db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).$dynamic();
  const rows = await (sp.status ? q.where(eq(contactSubmissions.status, sp.status as "new")) : q).limit(500);
  const tabs = ["", "new", "in_progress", "done", "spam"];

  return (
    <>
      <PageHeader title="Form submissions" subtitle={`${rows.length} shown`} />
      <div className="mb-4 flex gap-1 border-b border-neutral-200">
        {tabs.map((t) => (
          <Link key={t} href={t ? `/admin/submissions?status=${t}` : "/admin/submissions"} className={`-mb-px border-b-2 px-3 py-2 text-sm ${(sp.status ?? "") === t ? "border-neutral-900 font-medium" : "border-transparent text-neutral-500"}`}>
            {t || "all"}
          </Link>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Form</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Topic</th><th className="px-3 py-2">Region</th><th className="px-3 py-2">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-3 py-2 text-neutral-500">{formatDate(s.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-3 py-2">{s.form}</td>
                <td className="px-3 py-2"><Link href={`/admin/submissions/${s.id}`} className="font-medium hover:underline">{s.firstName} {s.lastName}</Link></td>
                <td className="px-3 py-2">{s.email}</td>
                <td className="px-3 py-2">{s.topic}</td>
                <td className="px-3 py-2">{s.region}</td>
                <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-neutral-400">No submissions.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
