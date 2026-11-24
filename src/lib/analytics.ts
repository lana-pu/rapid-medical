import { sourceOf } from "./source";

/**
 * The numbers of the Analytics screen (docs/screens/admin-analytics.md), from the requests and the visit counter.
 * Pure: rows in, report out — so it is tested without a database.
 */
export type ViewRow = { at: Date; kind: string; path: string; visit: boolean; region: string | null; country: string | null; source: string | null; utmCampaign: string | null; file: string | null };
export type LeadRow = { at: Date; form: string; topic: string | null; region: string | null; country: string | null; meta: Record<string, string> };
export type Count = { label: string; value: number; extra?: number };
export type Report = {
  days: number;
  tiles: { visits: [number, number]; views: [number, number]; leads: [number, number] };
  visitsByDay: { day: string; value: number }[];
  viewsByDay: { day: string; value: number }[]; // pages viewed, as visitsByDay (the chart's «Pages viewed» tab)
  leadsByDay: { day: string; value: number }[]; // requests without spam, as visitsByDay (the dashboard's «This week»)
  sources: Count[]; // value: visits, extra: leads
  leadPages: Count[];
  topPages: Count[];
  leadForms: Count[]; // what people ask for: a Contact Us topic, or the form (docs/screens/admin-analytics.md)
  leadRegions: Count[];
  countries: Count[]; // value: visits, extra: leads
  downloads: Count[];
  campaigns: Count[]; // value: visits, extra: leads
  headline: string | null;
};

const DAY = 86_400_000;
const top = (m: Map<string, { v: number; e?: number }>, n = 10): Count[] =>
  [...m.entries()].map(([label, x]) => ({ label, value: x.v, ...(x.e !== undefined ? { extra: x.e } : {}) })).sort((a, b) => b.value - a.value || (b.extra ?? 0) - (a.extra ?? 0)).slice(0, n);
const bump = (m: Map<string, { v: number; e?: number }>, k: string | null | undefined, field: "v" | "e" = "v") => {
  if (!k) return;
  const x = m.get(k) ?? { v: 0 };
  x[field] = (x[field] ?? 0) + 1;
  m.set(k, x);
};
const clean = (p: string | undefined) => (p ? p.split(/[?#]/)[0] : undefined);
/** A stored file name may carry a broken %-escape: show it as it is rather than fail the report (security review). */
const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function buildReport(input: { days: number; now: Date; views: ViewRow[]; leads: LeadRow[]; pageTitle: (path: string) => string; formLabel: (form: string) => string; regionLabel: (r: string) => string }): Report {
  const { days, now, pageTitle } = input;
  const from = now.getTime() - days * DAY;
  const cur = <T extends { at: Date }>(r: T) => r.at.getTime() >= from;
  const prev = <T extends { at: Date }>(r: T) => r.at.getTime() < from && r.at.getTime() >= from - days * DAY;
  const views = input.views.filter(cur);
  const leads = input.leads.filter(cur);
  const n = (rows: ViewRow[], f: (r: ViewRow) => boolean) => rows.filter(f).length;

  const byDay = new Map<string, number>();
  for (let t = from; t <= now.getTime(); t += DAY) byDay.set(new Date(t).toISOString().slice(0, 10), 0);
  const viewDays = new Map([...byDay.keys()].map((d) => [d, 0]));
  const leadDays = new Map([...byDay.keys()].map((d) => [d, 0]));
  for (const v of views) {
    const d = v.at.toISOString().slice(0, 10);
    if (v.visit) byDay.set(d, (byDay.get(d) ?? 0) + 1);
    if (v.kind === "view") viewDays.set(d, (viewDays.get(d) ?? 0) + 1);
  }
  for (const l of leads) leadDays.set(l.at.toISOString().slice(0, 10), (leadDays.get(l.at.toISOString().slice(0, 10)) ?? 0) + 1);

  const sources = new Map<string, { v: number; e?: number }>();
  const campaigns = new Map<string, { v: number; e?: number }>();
  const countries = new Map<string, { v: number; e?: number }>();
  const topPages = new Map<string, { v: number }>();
  const downloads = new Map<string, { v: number }>();
  for (const v of views) {
    if (v.kind === "view") bump(topPages, pageTitle(v.path));
    if (v.kind === "download") bump(downloads, v.file ? safeDecode(v.file.split("/").pop() ?? v.file) : null);
    if (!v.visit) continue;
    bump(sources, v.source ?? "Direct");
    bump(campaigns, v.utmCampaign);
    bump(countries, v.country);
  }
  const leadPages = new Map<string, { v: number }>();
  const forms = new Map<string, { v: number }>();
  const regions = new Map<string, { v: number }>();
  for (const l of leads) {
    const m = l.meta ?? {};
    const src = sourceOf({ referrer: m.referrer, utm_source: m.utm_source, utm_medium: m.utm_medium });
    for (const [map, key] of [[sources, src], [campaigns, m.utm_campaign], [countries, l.country]] as const) {
      if (!key) continue;
      const x = map.get(key) ?? { v: 0 };
      x.e = (x.e ?? 0) + 1;
      map.set(key, x);
    }
    const led = clean(m.previous_page) ?? clean(m.landing_page);
    bump(leadPages, led ? pageTitle(led) : "Unknown");
    // Contact Us — by its topic (demo, IFU, support…); the other forms as one line each: which webinar or job is in the Inbox
    bump(forms, l.form === "contact" && l.topic ? l.topic : input.formLabel(l.form));
    bump(regions, l.region ? input.regionLabel(l.region) : "No region");
  }
  const srcList = top(sources, 12);
  // the main source: most visits, then most requests; none without visits
  const lead = [...srcList].filter((x) => x.value > 0).sort((a, b) => b.value - a.value || (b.extra ?? 0) - (a.extra ?? 0))[0];
  return {
    days,
    tiles: {
      visits: [n(views, (r) => r.visit), n(input.views.filter(prev), (r) => r.visit)],
      views: [n(views, (r) => r.kind === "view"), n(input.views.filter(prev), (r) => r.kind === "view")],
      leads: [leads.length, input.leads.filter(prev).length],
    },
    visitsByDay: [...byDay.entries()].map(([day, value]) => ({ day, value })),
    viewsByDay: [...viewDays.entries()].map(([day, value]) => ({ day, value })),
    leadsByDay: [...leadDays.entries()].map(([day, value]) => ({ day, value })),
    sources: srcList,
    leadPages: top(leadPages),
    topPages: top(topPages),
    leadForms: top(forms),
    leadRegions: top(regions),
    countries: top(countries),
    downloads: top(downloads),
    campaigns: top(campaigns),
    headline: lead ? `${lead.label} brought ${lead.value} visit${lead.value === 1 ? "" : "s"} and ${lead.extra ?? 0} request${(lead.extra ?? 0) === 1 ? "" : "s"}` : null,
  };
}

/** Did the site's counter start inside this period? Then the visits are «since {date}» and have nothing to compare with. */
export function countingStartedWithin(input: { countingSince: Date | null; now: Date; days: number }): boolean {
  if (!input.countingSince) return true;
  return input.now.getTime() - input.countingSince.getTime() < input.days * 86_400_000;
}
