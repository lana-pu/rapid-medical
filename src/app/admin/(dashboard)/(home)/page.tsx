import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { attention, recentActivity, summary, type AttentionKind } from "@/admin/home";
import { unreadCount } from "@/admin/inbox";
import { analyticsReport } from "@/admin/analytics";
import { Notice, formatDate } from "@/components/admin/ui";

/**
 * The dashboard — above the projects (docs/admin-ia.md → «Уточнения 2026-11-15»): choose a project; for the website,
 * what needs someone (everything that is not a message), the team's recent actions and a few numbers.
 */

const KIND: Partial<Record<AttentionKind, string>> = { publish: "To publish", media: "Pictures", links: "Broken links" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [all, activity, sum, unread, week] = await Promise.all([attention(user), recentActivity(), summary(), unreadCount(), analyticsReport(7)]);
  const todo = all.filter((t) => t.kind !== "request" && t.kind !== "comment"); // messages live in the Inbox
  const first = user.name.split(/\s+/)[0] || user.name;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Hello, {first}</h1>
      <p className="mt-1 text-sm text-neutral-500">Rapid Medical — your projects and what needs someone.</p>
      {sp.error === "forbidden" && <div className="mt-4"><Notice kind="error">That area is for admins.</Notice></div>}

      <section aria-label="Projects" className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Projects</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/page" className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:border-neutral-900">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-lg text-white">🌐</span>
              <div>
                <div className="font-semibold">Website</div>
                <div className="text-xs text-neutral-500">rapid-medical.com · three regions</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-neutral-600">
              {todo.length ? `${todo.length} thing${todo.length > 1 ? "s" : ""} to look at` : "Everything is live"}
              {unread ? ` · ${unread} unread message${unread > 1 ? "s" : ""}` : ""}
            </p>
            <span className="mt-3 inline-block text-sm font-medium underline decoration-neutral-300 group-hover:decoration-neutral-900">Open the website →</span>
          </Link>
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white/60 p-5 text-neutral-500">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-lg">🎓</span>
              <div>
                <div className="font-semibold text-neutral-700">Training tool</div>
                <div className="text-xs">TIGERTRIEVER courses, stages and videos</div>
              </div>
            </div>
            <p className="mt-4 text-sm">Not built yet.</p>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <section aria-label="Needs your attention">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Website — needs your attention</h2>
          {unread > 0 && (
            <Link href="/admin/inbox" className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm hover:border-blue-400">
              <span aria-hidden>✉</span>
              <span className="flex-1 font-medium">{unread} unread message{unread > 1 ? "s" : ""} in the Inbox</span>
              <span className="text-xs underline">Open Inbox</span>
            </Link>
          )}
          {todo.length === 0 ? (
            <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">Nothing waiting. Everything is live.</p>
          ) : (
            <ul className="space-y-2">
              {todo.map((t) => (
                <li key={t.key} className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{KIND[t.kind] ?? t.kind}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{t.text}</span>
                    {(t.by || t.at) && (
                      <span className="block text-xs text-neutral-500">
                        {t.by ? `by ${t.by}` : ""}
                        {t.by && t.at ? " · " : ""}
                        {t.at ? formatDate(t.at, { dateStyle: "medium", timeStyle: "short" }) : ""}
                      </span>
                    )}
                  </span>
                  <a href={t.href} className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">{t.action}</a>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-wide text-neutral-500">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-neutral-500">No activity yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.map((a) => (
                <li key={a.id}>
                  <b>{a.who}</b> {a.href ? <Link href={a.href} className="underline decoration-neutral-300 hover:decoration-neutral-900">{a.text}</Link> : a.text}
                  <span className="text-neutral-500"> · {a.ago}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/activity" className="mt-3 inline-block text-sm underline">All activity</Link>
        </section>

        <section aria-label="Numbers" className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Website this week</h2>
          <Link href="/admin/analytics?days=7" className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400" aria-label="This week — open analytics">
            <div className="flex gap-6">
              <div><div className="text-2xl font-semibold tabular-nums">{week.tiles.visits[0]}</div><div className="text-xs text-neutral-500">visits</div></div>
              <div><div className="text-2xl font-semibold tabular-nums">{week.tiles.leads[0]}</div><div className="text-xs text-neutral-500">requests ({week.tiles.leads[0] - week.tiles.leads[1] >= 0 ? "+" : ""}{week.tiles.leads[0] - week.tiles.leads[1]} vs last week)</div></div>
            </div>
            {week.headline && <p className="mt-2 text-xs text-neutral-600">{week.headline}.</p>}
            <span className="mt-2 inline-block text-xs underline">Open analytics</span>
          </Link>
          <h2 className="pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Website in numbers</h2>
          <Stat href="/admin/publications" value={sum.studies} label="studies on Evidence" note={sum.lastStudy ? `last added ${sum.lastStudy}` : undefined} />
          <Stat href="/admin/media" value={sum.files} label="files in the media library" note={sum.filesNoAlt ? `${sum.filesNoAlt} without a description` : undefined} />
          {user.role === "admin" && <Stat href="/admin/users" value={sum.people} label="people in the admin" note={sum.peopleWithout2fa ? `${sum.peopleWithout2fa} without two-step sign-in` : "two-step sign-in on for everyone"} />}
        </section>
      </div>
    </div>
  );
}

function Stat({ href, value, label, note }: { href: string; value: number; label: string; note?: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-neutral-600">{label}</div>
      {note && <div className="mt-1 text-xs text-neutral-500">{note}</div>}
    </Link>
  );
}
