import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { attention, comingUp, health, lastPublished, myRecent, recentActivity, type Health } from "@/admin/home";
import { unreadCount } from "@/admin/inbox";
import { analyticsReport, countingSince } from "@/admin/analytics";
import { countingStartedWithin } from "@/lib/analytics";
import { DEMO, withBase } from "@/lib/demo";
import { Calm, Notice, SectionHead as Head, Tip, formatDate, quietLink as quiet } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/admin/icons";
import { MiniBars, Meter, ShareBar } from "@/components/admin/Charts";

/**
 * The Website dashboard (docs/screens/admin-home.md → «Иерархия»): three levels instead of six equal blocks — the site
 * and its state; what waits and the site's health, with numbers; the week, where I left off, the team's actions and
 * what is coming up. Icons and numbers carry tooltips. Admin chrome: its own neutral palette.
 */

const KIND: Record<string, { label: string; icon: IconName; tag: string }> = {
  publish: { label: "To publish", icon: "publish", tag: "bg-amber-100 text-amber-900" },
  links: { label: "Broken link", icon: "brokenLink", tag: "bg-red-100 text-red-900" },
};
const QUICK: { href: string; label: string; icon: IconName; tip: string }[] = [
  { href: "/admin/editor?new=1", label: "Page", icon: "page", tip: "A new page from a template" },
  { href: "/admin/news/new", label: "News item", icon: "news", tip: "News & Events → News" },
  { href: "/admin/events/new", label: "Event", icon: "event", tip: "A congress or a meeting, with registration" },
  { href: "/admin/publications/new", label: "Publication", icon: "study", tip: "A study for Evidence" },
  { href: "/admin/media", label: "Upload files", icon: "upload", tip: "Pictures, videos and PDFs into the media library" },
];
const HEALTH_ICON: Record<Health["key"], IconName> = { alt: "image", seo: "search", "2fa": "shield", news: "news", studies: "study" };
const card = "rounded-xl border border-neutral-200 bg-white";
const tz = "Asia/Jerusalem";

function Delta({ now, before, young, since }: { now: number; before: number; young?: boolean; since?: string | null }) {
  if (young) return <span className="mt-1 inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600">{since ? `counting since ${since}` : "not counted yet"}</span>;
  const d = now - before;
  const cls = d > 0 ? "bg-emerald-50 text-emerald-800" : d < 0 ? "bg-red-50 text-red-800" : "bg-neutral-100 text-neutral-600";
  return <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${cls}`}>{d > 0 ? "+" : d < 0 ? "−" : "±"}{Math.abs(d)} vs last week</span>;
}

export default async function WebsiteHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [all, activity, unread, week, last, mine, upcoming, checks, since] = await Promise.all([
    attention(user),
    recentActivity(),
    unreadCount(),
    analyticsReport(7).catch(() => null),
    lastPublished(),
    myRecent(user.id),
    comingUp(),
    health(user),
    countingSince().catch(() => null),
  ]);
  // numbers from the first day; while the counter is younger than the week, say since when (docs/screens/admin-home.md)
  const young = countingStartedWithin({ countingSince: since, now: new Date(), days: 7 });
  const sinceText = since ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: tz }).format(since) : null;
  const todo = all.filter((t) => t.kind === "publish" || t.kind === "links"); // messages live in the Inbox
  const nPublish = todo.filter((t) => t.kind === "publish").length;
  const nLinks = todo.filter((t) => t.kind === "links").length;
  const problems = checks.filter((c) => !c.ok);
  const passed = checks.filter((c) => c.ok);
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  // the order on a phone follows importance (docs/screens/admin-home.md → «Телефон»); from 896 px two columns
  const sections = {
    need: (
      <section aria-label="Needs your attention" className="order-1 @4xl:order-none">
        <Head title="Needs your attention" count={unread + todo.length || undefined} />
        {(unread > 0 || todo.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {unread > 0 && (
              <Tip tip="Requests from the site's forms and notes left on pages" align="start">
                <Link href="/admin/inbox" aria-label={`${plural(unread, "unread message", "unread messages")} in the Inbox`} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-3 text-[13px] font-medium hover:border-neutral-400">
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-blue-600 px-1.5 text-xs tabular-nums text-white">{unread}</span>
                  <Icon name="mail" className="h-4 w-4 text-neutral-500" />
                  unread {unread === 1 ? "message" : "messages"}
                </Link>
              </Tip>
            )}
            {nPublish > 0 && (
              <Tip tip="Saved changes that visitors do not see until you publish them">
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-3 text-[13px] font-medium">
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-amber-100 px-1.5 text-xs tabular-nums text-amber-900">{nPublish}</span>
                  <Icon name="publish" className="h-4 w-4 text-neutral-500" />
                  to publish
                </span>
              </Tip>
            )}
            {nLinks > 0 && (
              <Tip tip="Old addresses visitors still come to and get «page not found»">
                <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-3 text-[13px] font-medium">
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-red-100 px-1.5 text-xs tabular-nums text-red-900">{nLinks}</span>
                  <Icon name="brokenLink" className="h-4 w-4 text-neutral-500" />
                  broken {nLinks === 1 ? "link" : "links"}
                </span>
              </Tip>
            )}
          </div>
        )}
        {todo.length === 0 ? (
          <Calm>{unread > 0 ? "Nothing to publish: everything is live." : "Nothing waiting. Everything is live."}</Calm>
        ) : (
          <ul className={`${card} divide-y divide-neutral-100`}>
            {todo.map((t) => {
              const k = KIND[t.kind] ?? { label: t.kind, icon: "info" as IconName, tag: "bg-neutral-100 text-neutral-700" };
              return (
                <li key={t.key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-sm">
                  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${k.tag}`}>
                    <Icon name={k.icon} className="h-3 w-3" />
                    {k.label}
                  </span>
                  <span className="min-w-0 flex-1 basis-48">
                    <span className="block font-medium">{t.text}</span>
                    {(t.by || t.at) && (
                      <span className="block text-xs text-neutral-500">
                        {[t.by ? `by ${t.by}` : "", t.at ? formatDate(t.at, { dateStyle: "medium", timeStyle: "short", timeZone: tz }) : ""].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <a href={t.href} className="whitespace-nowrap rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">{t.action}</a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    ),

    health: (
      <section aria-label="Site health" className="order-2 @4xl:order-none">
        <Head
          title="Site health"
          count={problems.length ? `${problems.length} of ${checks.length} need attention` : undefined}
          tip="Things on the site that cost visitors or Google something, each with the way to fix it"
        />
        {/* one segment per check: amber — needs attention, green — fine */}
        <div className="mb-3 flex gap-1" aria-hidden>
          {[...problems, ...passed].map((c, i, all) => (
            <Tip key={c.key} tip={c.ok ? c.okText : `${c.value} ${c.label}`} align={i === 0 ? "start" : i === all.length - 1 ? "end" : "center"} className="h-1.5 flex-1">
              <span className={`block h-full w-full rounded-full ${c.ok ? "bg-emerald-500" : "bg-amber-500"}`} />
            </Tip>
          ))}
        </div>
        {problems.length === 0 ? (
          <Calm>All good.</Calm>
        ) : (
          <ul className="grid gap-3 @xl:grid-cols-2">
            {problems.map((c) => (
              <li key={c.key} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
                    <Icon name={HEALTH_ICON[c.key]} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-2xl font-semibold leading-tight tabular-nums text-neutral-900">{c.value}</div>
                    <div className="text-sm font-medium text-neutral-800">{c.label}</div>
                  </div>
                </div>
                <div>
                  {/* share: how much is done of all; age: days since the newest against the limit — full and amber past it */}
                  {c.kind === "share"
                    ? <Meter value={c.total - c.value} total={c.total} warn tip={c.scale} />
                    : <Meter value={c.value} total={c.total} warn tip={`${c.value} days since the last one; the limit is ${c.total}`} />}
                  <div className="mt-1 text-xs tabular-nums text-neutral-500">{c.scale}</div>
                </div>
                <p className="text-xs leading-relaxed text-neutral-600">{c.why}</p>
                {c.action && c.href && <Link href={c.href} className="mt-auto self-start rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50">{c.action}</Link>}
              </li>
            ))}
          </ul>
        )}
        {problems.length > 0 && passed.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Checks in order">
            {passed.map((c) => (
              <li key={c.key}>
                <Tip tip={c.why} align="start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">
                    <Icon name="check" className="h-3.5 w-3.5" />
                    {c.okText}
                  </span>
                </Tip>
              </li>
            ))}
          </ul>
        )}
      </section>
    ),

    week: week && (
      <section aria-label="This week" className="order-3 @4xl:order-none">
        <Head title="This week" href="/admin/analytics?days=7" link="Analytics" />
        <div className={card}>
          <Link href="/admin/analytics?days=7" aria-label="This week — open analytics" className="grid grid-cols-2 gap-4 p-4 hover:bg-neutral-50/60">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500"><Icon name="live" className="h-3.5 w-3.5" />Visits</div>
              <div className="text-3xl font-semibold leading-tight tabular-nums">{week.tiles.visits[0]}</div>
              <Delta now={week.tiles.visits[0]} before={week.tiles.visits[1]} young={young} since={sinceText} />
              <MiniBars days={week.visitsByDay.slice(-7)} label="Visits" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500"><Icon name="mail" className="h-3.5 w-3.5" />Requests</div>
              <div className="text-3xl font-semibold leading-tight tabular-nums">{week.tiles.leads[0]}</div>
              <Delta now={week.tiles.leads[0]} before={week.tiles.leads[1]} />
              <MiniBars days={week.leadsByDay.slice(-7)} label="Requests" />
            </div>
          </Link>
          {(week.headline || week.leadForms.length > 0 || week.tiles.visits[0] > 0) && (
            <div className="space-y-4 border-t border-neutral-100 p-4">
              {week.headline && <p className="text-[13px] text-neutral-800">{week.headline}.</p>}
              <ShareBar title="Requests by form" rows={week.leadForms} unit={["request", "requests"]} />
              {week.tiles.visits[0] > 0 && <ShareBar title="Visits by source" rows={week.sources} unit={["visit", "visits"]} />}
            </div>
          )}
          {young && (
            <p className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
              {sinceText ? `Visits counted since ${sinceText}` : "No visits counted yet"} — the new site&apos;s own counter. The old site&apos;s visits are in{" "}
              <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className={quiet}>Google Analytics ↗</a>.
            </p>
          )}
        </div>
      </section>
    ),

    continue: mine.length > 0 && (
      <section aria-label="Continue where you left off" className="order-4 @4xl:order-none">
        <Head title="Continue where you left off" />
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
    ),

    activity: (
      <section aria-label="Recent activity" className="order-5 @4xl:order-none">
        <Head title="Recent activity" href="/admin/activity" link="All activity" />
        {activity.length === 0 ? (
          <p className="text-sm text-neutral-500">No activity yet.</p>
        ) : (
          <ul className={`${card} divide-y divide-neutral-100`}>
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-2.5 text-[13px]">
                <Tip tip={a.who} focusable>
                  <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-700">{a.who.slice(0, 1).toUpperCase()}</span>
                </Tip>
                <span className="min-w-0 flex-1">
                  <b className="font-medium">{a.who}</b> {a.href ? <Link href={a.href} className={quiet}>{a.text}</Link> : a.text}
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs text-neutral-500">{a.ago}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    ),

    soon: (
      <section aria-label="Coming up" className="order-6 @4xl:order-none">
        <Head
          title="Coming up"
          count={upcoming.length || undefined}
          tip="Publications planned for a date and time (Israel time), and the next events on the site with their registrations"
        />
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing scheduled.</p>
        ) : (
          <ul className={`${card} divide-y divide-neutral-100`}>
            {upcoming.map((u) => (
              <li key={u.key}>
                <Link href={u.href} className="flex items-start gap-3 px-4 py-2.5 text-sm hover:bg-neutral-50">
                  <Icon name={u.key.startsWith("e") ? "event" : "clock"} className="mt-0.5 h-4 w-4 text-neutral-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{u.text}</span>
                    <span className="block text-xs text-neutral-500">{u.when} · {u.note}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    ),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {sp.error === "forbidden" && <Notice kind="error">That area is for admins.</Notice>}

      {/* level 1: the site — its state, the one filled button, and what can be created */}
      <section aria-label="The site" className={`${card} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="min-w-0 flex-1 basis-72 space-y-1">
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold text-neutral-900">
              Website
              <Tip tip="The site is open to visitors at rapid-medical.com" focusable>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />On the site
                </span>
              </Tip>
            </h1>
            <p className="text-sm"><a href="/" target="_blank" rel="noreferrer" className={`text-neutral-600 ${quiet}`}>rapid-medical.com ↗</a></p>
            {last && (
              <p className="flex items-center gap-1.5 text-sm text-neutral-600">
                <Icon name="clock" className="h-4 w-4 text-neutral-400" />
                <span>Last published <b className="font-medium text-neutral-900">{last.what}</b> by {last.who} · {last.ago}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={DEMO ? withBase("/") : "/api/editor?on=1&redirect=%2F"} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">Edit the site</a>
            <a href="/" target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50">View site ↗</a>
          </div>
        </div>
        <nav aria-label="Quick actions" className="mt-5 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
          <span className="mr-1 text-[13px] text-neutral-500">Create</span>
          {QUICK.map((q) => (
            <Tip key={q.href} tip={q.tip}>
              <Link href={q.href} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[13px] hover:border-neutral-400 hover:bg-white">
                <Icon name={q.icon} className="h-4 w-4 text-neutral-500" />
                {q.label}
              </Link>
            </Tip>
          ))}
        </nav>
      </section>

      {/* levels 2 and 3: on a phone one column in order of importance; from 896 px the main column and the side */}
      <div className="flex flex-col gap-8 @4xl:grid @4xl:grid-cols-[minmax(0,1fr)_340px] @4xl:items-start">
        <div className="contents @4xl:flex @4xl:min-w-0 @4xl:flex-col @4xl:gap-8">
          {sections.need}
          {sections.health}
          {sections.activity}
        </div>
        <div className="contents @4xl:flex @4xl:flex-col @4xl:gap-8">
          {sections.week}
          {sections.continue}
          {sections.soon}
        </div>
      </div>
    </div>
  );
}
