import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { analyticsReport } from "@/admin/analytics";
import { BarList, DailyBars, Tile } from "@/components/admin/Charts";
import { PageHeader } from "@/components/admin/ui";

/** Analytics — requests from our database and the site's own counter without cookies (docs/screens/admin-analytics.md). */
const PERIODS = [7, 30, 90];

export default async function Analytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const [r, integrations] = await Promise.all([analyticsReport(days), getSetting<{ gaMeasurementId?: string }>("integrations")]);
  const rate = (v: number, l: number) => (v ? Math.round((l / v) * 1000) / 10 : 0);

  const box = (title: string, children: React.ReactNode, note?: string) => (
    <section aria-label={title} className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {note && <p className="mb-2 text-xs text-neutral-500">{note}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Analytics"
        subtitle="Visits counted by the site itself, without cookies, and the requests people sent. Your team's own visits are not counted."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Period" className="flex shrink-0 overflow-hidden whitespace-nowrap rounded border border-neutral-300 text-sm">
              {PERIODS.map((d) => (
                <Link key={d} href={`/admin/analytics?days=${d}`} aria-current={d === days ? "page" : undefined} className={`px-3 py-1.5 ${d === days ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}>
                  {d} days
                </Link>
              ))}
            </nav>
            {integrations.gaMeasurementId && <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="text-sm underline">Google Analytics ↗</a>}
          </div>
        }
      />

      {r.truncated && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">There were more visits than this screen reads at once; the oldest days of the period are left out. Choose a shorter period.</p>}
      {r.headline && <p className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-950">In the last {days} days, <b>{r.headline}</b>.</p>}

      <div className="mb-6 grid gap-4 @lg:grid-cols-2 @4xl:grid-cols-4">
        <Tile label="Visits" value={r.tiles.visits[0]} prev={r.tiles.visits[1]} days={days} />
        <Tile label="Pages viewed" value={r.tiles.views[0]} prev={r.tiles.views[1]} days={days} />
        <Tile label="Requests" value={r.tiles.leads[0]} prev={r.tiles.leads[1]} days={days} />
        <Tile label="Requests per 100 visits" value={rate(r.tiles.visits[0], r.tiles.leads[0])} prev={rate(r.tiles.visits[1], r.tiles.leads[1])} days={days} />
      </div>

      <div className="mb-6">{box("Visits by day", r.tiles.visits[0] ? <DailyBars days={r.visitsByDay} label="Visits by day" /> : <p className="py-3 text-sm text-neutral-500">No visits recorded yet.</p>)}</div>

      <div className="grid gap-6 @4xl:grid-cols-2">
        {box("Where people come from", <BarList rows={r.sources} valueLabel="Visits" extraLabel="Requests" empty="No visits recorded yet." />, "Visits and requests by source. Links with UTM tags (e.g. in LinkedIn posts) are named by their source.")}
        {box("Pages that lead to requests", <BarList rows={r.leadPages} valueLabel="Requests" empty="No requests in this period." />, "The page a visitor was on just before the form.")}
        {box("Most visited pages", <BarList rows={r.topPages} valueLabel="Views" empty="No visits recorded yet." />)}
        {box("Requests by form", <BarList rows={r.leadForms} valueLabel="Requests" empty="No requests in this period." />)}
        {box("Requests by region", <BarList rows={r.leadRegions} valueLabel="Requests" empty="No requests in this period." />)}
        {box("Countries", <BarList rows={r.countries} valueLabel="Visits" extraLabel="Requests" empty="No country known yet." />, "From the visitor's network; unknown on the local build.")}
        {box("Materials opened", <BarList rows={r.downloads} valueLabel="Opens" empty="No PDFs opened yet." />, "PDFs opened from the site's pages.")}
        {box("LinkedIn posts and campaigns", <BarList rows={r.campaigns} valueLabel="Visits" extraLabel="Requests" empty="No visits from tagged links yet." />, "By the utm_campaign of the link.")}
      </div>
    </div>
  );
}
