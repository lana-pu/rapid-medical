import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { analyticsReport } from "@/admin/analytics";
import { BarList } from "@/components/admin/Charts";
import { MetricChart, Panel } from "@/components/admin/AnalyticsBlocks";
import { PageHeader } from "@/components/admin/ui";

/**
 * Analytics — requests from our database and the site's own counter without cookies (docs/screens/admin-analytics.md):
 * the numbers as the tabs of one chart, then four panels — where people come from, requests, pages, countries.
 */
const PERIODS = [7, 30, 90];

export default async function Analytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const [r, integrations] = await Promise.all([analyticsReport(days), getSetting<{ gaMeasurementId?: string }>("integrations")]);
  const rate = (v: number, l: number) => (v ? Math.round((l / v) * 1000) / 10 : null);
  const noVisits = "No visits recorded yet.";
  const noRequests = "No requests in this period.";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Analytics"
        subtitle="Visits counted by the site itself, without cookies, and the requests people sent. Your team's own visits are not counted."
        note={r.headline ? <>In the last {days} days, <b className="font-semibold">{r.headline}</b>.</> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Period" className="flex shrink-0 overflow-hidden whitespace-nowrap rounded-lg border border-neutral-300 text-sm">
              {PERIODS.map((d) => (
                <Link key={d} href={`/admin/analytics?days=${d}`} aria-current={d === days ? "page" : undefined} className={`px-3 py-1.5 ${d === days ? "bg-neutral-900 text-white" : "bg-white hover:bg-neutral-100"}`}>
                  {d} days
                </Link>
              ))}
            </nav>
            {integrations.gaMeasurementId && <a href="https://analytics.google.com/" target="_blank" rel="noreferrer" className="text-sm underline decoration-neutral-300 underline-offset-[3px] hover:decoration-neutral-900">Google Analytics ↗</a>}
          </div>
        }
      />

      {r.truncated && <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">There were more visits than this screen reads at once; the oldest days of the period are left out. Choose a shorter period.</p>}

      <MetricChart
        days={days}
        metrics={[
          { key: "visits", label: "Visits", value: r.tiles.visits[0], prev: r.tiles.visits[1], series: r.visitsByDay, empty: noVisits },
          { key: "views", label: "Pages viewed", value: r.tiles.views[0], prev: r.tiles.views[1], series: r.viewsByDay, empty: noVisits },
          { key: "requests", label: "Requests", value: r.tiles.leads[0], prev: r.tiles.leads[1], series: r.leadsByDay, empty: noRequests },
          { key: "rate", label: "Requests per 100 visits", value: rate(r.tiles.visits[0], r.tiles.leads[0]), prev: rate(r.tiles.visits[1], r.tiles.leads[1]) },
        ]}
      />

      <div className="grid items-start gap-5 @4xl:grid-cols-2">
        <Panel
          title="Where people come from"
          tabs={[
            { label: "Sources", content: <BarList rows={r.sources} valueLabel="Visits" extraLabel="Requests" empty={noVisits} note="Links with UTM tags (e.g. in LinkedIn posts) are named by their source." /> },
            { label: "LinkedIn posts & campaigns", content: <BarList rows={r.campaigns} valueLabel="Visits" extraLabel="Requests" empty="No visits from tagged links yet." note="By the utm_campaign of the link." /> },
          ]}
        />
        <Panel
          title="Requests"
          tabs={[
            { label: "What they ask for", content: <BarList rows={r.leadForms} valueLabel="Requests" empty={noRequests} note="Contact Us by its topic; the other forms as one line each — which webinar or job is in the Inbox." /> },
            { label: "Region", content: <BarList rows={r.leadRegions} valueLabel="Requests" empty={noRequests} /> },
            { label: "Page before the form", content: <BarList rows={r.leadPages} valueLabel="Requests" empty={noRequests} note="The page a visitor was on just before the form." /> },
          ]}
        />
        <Panel
          title="Pages"
          tabs={[
            { label: "Most visited", content: <BarList rows={r.topPages} valueLabel="Views" empty={noVisits} /> },
            { label: "PDFs opened", content: <BarList rows={r.downloads} valueLabel="Opens" empty="No PDFs opened yet." note="PDFs opened from the site's pages." /> },
          ]}
        />
        <Panel title="Countries" tabs={[{ label: "Countries", content: <BarList rows={r.countries} valueLabel="Visits" extraLabel="Requests" empty="No country known yet." note="From the visitor's network; unknown on the local build." /> }]} />
      </div>
    </div>
  );
}
