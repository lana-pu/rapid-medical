import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, solutions, publications, newsItems, webinars, jobs, pages, contactSubmissions, teamMembers } from "@/db";
import { PageHeader, StatusBadge, formatDate } from "@/components/admin/ui";
import { pendingDrafts } from "@/admin/workflow";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const [[sol], [pub], [news], [web], [job], [pg], [team], [newSub]] = await Promise.all([
    db.select({ n: count() }).from(solutions),
    db.select({ n: count() }).from(publications),
    db.select({ n: count() }).from(newsItems),
    db.select({ n: count() }).from(webinars),
    db.select({ n: count() }).from(jobs),
    db.select({ n: count() }).from(pages),
    db.select({ n: count() }).from(teamMembers),
    db.select({ n: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new")),
  ]);
  const [latest, pending] = await Promise.all([db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(8), pendingDrafts()]);
  const REVIEW: Record<string, string> = { editing: "Editing", in_review: "In review", changes_requested: "Changes requested", approved: "Approved" };

  const cards = [
    { href: "/admin/solutions", label: "Therapy pages", n: sol.n },
    { href: "/admin/publications", label: "Publications", n: pub.n },
    { href: "/admin/news", label: "News items", n: news.n },
    { href: "/admin/webinars", label: "Webinars", n: web.n },
    { href: "/admin/team", label: "Team members", n: team.n },
    { href: "/admin/jobs", label: "Open positions", n: job.n },
    { href: "/admin/pages", label: "Pages", n: pg.n },
    { href: "/admin/submissions", label: "New submissions", n: newSub.n },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      {sp.error === "forbidden" && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">That area requires the admin role.</p>}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400">
            <div className="text-3xl font-semibold">{c.n}</div>
            <div className="text-sm text-neutral-600">{c.label}</div>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Pending changes &amp; scheduled publications</h2>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr><th className="px-3 py-2">Record</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Changed by</th><th className="px-3 py-2">Review</th><th className="px-3 py-2">Scheduled</th><th className="px-3 py-2">Updated</th></tr>
          </thead>
          <tbody>
            {pending.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-neutral-400">Nothing pending — everything is live.</td></tr>}
            {pending.map((d) => (
              <tr key={d.id} className="border-t border-neutral-100">
                <td className="px-3 py-2"><Link href={`/admin/${d.resource}/${d.recordId}`} className="font-medium underline">{d.label}</Link></td>
                <td className="px-3 py-2 text-neutral-600">{d.resourceTitle}</td>
                <td className="px-3 py-2">{d.updatedByName}</td>
                <td className="px-3 py-2">{d.data ? <span className={`rounded px-1.5 py-0.5 text-xs ${d.reviewStatus === "approved" ? "bg-green-100 text-green-800" : d.reviewStatus === "in_review" ? "bg-blue-100 text-blue-800" : d.reviewStatus === "changes_requested" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{REVIEW[d.reviewStatus]}</span> : <span className="text-neutral-400">—</span>}</td>
                <td className="px-3 py-2 text-neutral-600">{d.publishAt ? formatDate(d.publishAt, { dateStyle: "medium", timeStyle: "short" }) : ""}</td>
                <td className="px-3 py-2 text-neutral-500">{formatDate(d.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold">Latest form submissions</h2>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Form</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Topic</th><th className="px-3 py-2">Status</th></tr>
          </thead>
          <tbody>
            {latest.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-neutral-400">No submissions yet.</td></tr>}
            {latest.map((s) => (
              <tr key={s.id} className="border-t border-neutral-100">
                <td className="px-3 py-2 text-neutral-500">{formatDate(s.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-3 py-2">{s.form}</td>
                <td className="px-3 py-2"><Link href={`/admin/submissions/${s.id}`} className="underline">{s.firstName} {s.lastName}</Link></td>
                <td className="px-3 py-2">{s.topic}</td>
                <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
