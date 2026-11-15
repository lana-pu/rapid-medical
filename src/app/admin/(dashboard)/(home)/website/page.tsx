import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { attention, comingUp, health, lastPublished, myRecent, recentActivity } from "@/admin/home";
import { unreadCount } from "@/admin/inbox";
import { analyticsReport } from "@/admin/analytics";
import { DEMO, withBase } from "@/lib/demo";
import { Notice, formatDate } from "@/components/admin/ui";

/**
 * The Website dashboard (docs/screens/admin-home.md): what waits, quick actions, where I left off, what is coming up,
 * the week, the site's health and the team's actions. Admin chrome: its own neutral palette.
 */

const KIND: Record<string, string> = { publish: "To publish", links: "Broken links" };
const QUICK = [
  { href: "/admin/editor?new=1", label: "+ Page" },
  { href: "/admin/news/new", label: "+ News item" },
  { href: "/admin/events/new", label: "+ Event" },
  { href: "/admin/publications/new", label: "+ Publication" },
  { href: "/admin/media", label: "Upload files" },
];
const h2 = "mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500";
const card = "rounded-lg border border-neutral-200 bg-white";

export default async function WebsiteHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [all, activity, unread, week, last, mine, upcoming, checks] = await Promise.all([
    attention(user),
    recentActivity(),
    unreadCount(),
    analyticsReport(7).catch(() => null),
    lastPublished(),
    myRecent(user.id),
    comingUp(),
    health(user),
  ]);
  const todo = all.filter((t) => t.kind === "publish" || t.kind === "links"); // messages live in the Inbox

  return (
    <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Website</h1>
            <p className="mt-1 text-sm text-neutral-500">rapid-medical.com{last ? ` · last published ${last.what} by ${last.who}, ${last.ago}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <a href={DEMO ? withBase("/") : "/api/editor?on=1&redirect=%2F"} className="rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-700">Edit the site</a>
            <a href="/" target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium hover:bg-neutral-50">View site ↗</a>
          </div>
        </div>
        {sp.error === "forbidden" && <div className="mt-4"><Notice kind="error">That area is for admins.</Notice></div>}

        <nav aria-label="Quick actions" className="mt-6 flex flex-wrap gap-2">
          {QUICK.map((q) => <Link key={q.href} href={q.href} className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:border-neutral-900">{q.label}</Link>)}
        </nav>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-10">
            <section aria-label="Needs your attention">
              <h2 className={h2}>Needs your attention</h2>
              {unread > 0 && (
                <Link href="/admin/inbox" className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm hover:border-blue-400">
                  <span aria-hidden>✉</span>
                  <span className="flex-1 font-medium">{unread} unread message{unread > 1 ? "s" : ""} in the Inbox</span>
                  <span className="text-xs underline">Open Inbox</span>
                </Link>
              )}
              {todo.length === 0 ? (
                <p className={`${card} p-6 text-sm text-neutral-600`}>Nothing waiting. Everything is live.</p>
              ) : (
                <ul className="space-y-2">
                  {todo.map((t) => (
                    <li key={t.key} className={`${card} flex flex-wrap items-center gap-3 px-4 py-3 text-sm`}>
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{KIND[t.kind] ?? t.kind}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{t.text}</span>
                        {(t.by || t.at) && (
                          <span className="block text-xs text-neutral-500">
                            {[t.by ? `by ${t.by}` : "", t.at ? formatDate(t.at, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jerusalem" }) : ""].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </span>
                      <a href={t.href} className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">{t.action}</a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {mine.length > 0 && (
              <section aria-label="Continue where you left off">
                <h2 className={h2}>Continue where you left off</h2>
                <ul className={`${card} divide-y divide-neutral-100`}>
                  {mine.map((m) => (
                    <li key={m.key}>
                      <Link href={m.href} className="flex items-baseline gap-3 px-4 py-2.5 text-sm hover:bg-neutral-50">
                        <span className="min-w-0 flex-1 truncate font-medium">{m.text}</span>
                        <span className="shrink-0 text-xs text-neutral-500">{m.ago}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-label="Recent activity">
              <h2 className={h2}>Recent activity</h2>
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
          </div>

          <aside className="space-y-10">
            {week && (
              <section aria-label="This week">
                <h2 className={h2}>This week</h2>
                <Link href="/admin/analytics?days=7" className={`${card} block p-4 hover:border-neutral-400`} aria-label="This week — open analytics">
                  <div className="flex gap-6">
                    <div><div className="text-2xl font-semibold tabular-nums">{week.tiles.visits[0]}</div><div className="text-xs text-neutral-500">visits</div></div>
                    <div><div className="text-2xl font-semibold tabular-nums">{week.tiles.leads[0]}</div><div className="text-xs text-neutral-500">requests ({week.tiles.leads[0] - week.tiles.leads[1] >= 0 ? "+" : ""}{week.tiles.leads[0] - week.tiles.leads[1]} vs last week)</div></div>
                  </div>
                  {week.headline && <p className="mt-2 text-xs text-neutral-600">{week.headline}.</p>}
                  <span className="mt-2 inline-block text-xs underline">Open analytics</span>
                </Link>
              </section>
            )}

            <section aria-label="Coming up">
              <h2 className={h2}>Coming up</h2>
              {upcoming.length === 0 ? (
                <p className={`${card} p-4 text-sm text-neutral-500`}>Nothing scheduled.</p>
              ) : (
                <ul className={`${card} divide-y divide-neutral-100`}>
                  {upcoming.map((u) => (
                    <li key={u.key}>
                      <Link href={u.href} className="block px-4 py-2.5 text-sm hover:bg-neutral-50">
                        <span className="text-xs font-medium text-neutral-500">{u.when}</span>
                        <span className="block font-medium">{u.text}</span>
                        <span className="block text-xs text-neutral-500">{u.note}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Site health">
              <h2 className={h2}>Site health</h2>
              <ul className={`${card} divide-y divide-neutral-100`}>
                {checks.map((c) => (
                  <li key={c.key} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                    <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${c.ok ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span className="min-w-0 flex-1">{c.text}</span>
                    {c.action && c.href && <Link href={c.href} className="shrink-0 text-xs underline">{c.action}</Link>}
                  </li>
                ))}
                {!checks.some((c) => !c.ok) && <li className="px-4 py-2.5 text-sm text-neutral-500">All good.</li>}
              </ul>
            </section>
          </aside>
      </div>
    </div>
  );
}
