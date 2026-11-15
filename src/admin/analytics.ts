import "server-only";
import { and, desc, gte, ne } from "drizzle-orm";
import { contactSubmissions, db, pageViews } from "@/db";
import { buildReport, type Report } from "@/lib/analytics";
import { REGION_CHOICES } from "@/lib/regions";
import { formLabel } from "./request-labels";
import { listEditorPages } from "./pages-index";
import { pageKey } from "./page-tree";

/** The Analytics screen and the dashboard's «This week» (docs/screens/admin-analytics.md). */
const regionLabel = (r: string) => REGION_CHOICES.find((c) => c.region === r)?.label ?? r;
const FIXED: Record<string, string> = { "/news-events": "News & Events", "/contact-us": "Contact Us", "/open-positions": "Open positions", "/careers": "Careers", "/about-us": "About", "/": "Home" };

export async function analyticsReport(days: number): Promise<Report> {
  const now = new Date();
  const since = new Date(now.getTime() - 2 * days * 86_400_000);
  const [views, leads, cards] = await Promise.all([
    // the columns the report needs, newest first, capped: the report's cost does not grow without bound (security review)
    db.select({ at: pageViews.at, kind: pageViews.kind, path: pageViews.path, visit: pageViews.visit, region: pageViews.region, country: pageViews.country, source: pageViews.source, utmCampaign: pageViews.utmCampaign, file: pageViews.file }).from(pageViews).where(gte(pageViews.at, since)).orderBy(desc(pageViews.at)).limit(200_000),
    db.select().from(contactSubmissions).where(and(gte(contactSubmissions.createdAt, since), ne(contactSubmissions.status, "spam"))),
    listEditorPages(),
  ]);
  // page titles in words: «Large vessel stroke (Americas)»
  const titles = new Map<string, string>();
  for (const c of cards) titles.set(c.path, c.region ? `${c.title} (${regionLabel(c.region)})` : c.title);
  const pageTitle = (p: string) => {
    const path = p.split(/[?#]/)[0].replace(/\/$/, "") || "/";
    if (titles.has(path)) return titles.get(path)!;
    const key = pageKey(path);
    const m = /^\/(us|ous|apac)\//.exec(path);
    const base = FIXED[key] ?? (key === "/webinars" ? "Webinars" : path);
    return m && base !== path ? `${base} (${regionLabel(m[1])})` : base;
  };
  return buildReport({
    days,
    now,
    views,
    leads: leads.map((l) => ({ at: l.createdAt, form: l.form, topic: l.topic, region: l.region, country: l.country, meta: l.meta })),
    pageTitle,
    formLabel,
    regionLabel,
  });
}
