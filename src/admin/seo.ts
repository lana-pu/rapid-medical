import "server-only";
import { inArray, sql } from "drizzle-orm";
import { db, drafts, pages, sitePages, solutions } from "@/db";
import { listEditorPages } from "./pages-index";
import { pageKey } from "./page-tree";
import { getLiveSetting } from "@/lib/settings";
import { REGION_CHOICES } from "@/lib/regions";
import type { Region } from "@/db/schema";
import { seoProblems } from "@/lib/seo";

/**
 * Search & sharing (docs/screens/admin-seo.md): every page of the site with its Google title and description, read from
 * the one place each page keeps them — its own record (pending changes over the live row) or Settings → `seo` for the
 * pages built from lists. Editing here and in the page's own Settings is the same field.
 */

export type SeoTarget = { kind: "record"; r: string; id: number } | { kind: "setting"; title: string; description: string };
export type SeoVersion = {
  key: string;
  region: Region | null;
  label: string;
  path: string;
  target: SeoTarget;
  title: string;
  description: string;
  /** what Google shows while the title is empty */
  fallbackTitle: string;
  /** a record with unpublished changes */
  pending: boolean;
  problems: string[];
};
export type SeoPage = { key: string; name: string; section: string; versions: SeoVersion[]; problems: number };

/** Sections of the list, in the order of the site tree. */
export const SECTIONS = ["Home", "Therapies", "Evidence", "Webinars", "News & Events", "About Us", "Careers", "Contact Us", "Other pages"] as const;
const sectionOf = (key: string): string =>
  key === "/" ? "Home"
  : key.startsWith("/therapies") ? "Therapies"
  : key.startsWith("/evidence") ? "Evidence"
  : key.startsWith("/webinars") ? "Webinars"
  : key.startsWith("/news-events") ? "News & Events"
  : key.startsWith("/about-us") ? "About Us"
  : key.startsWith("/careers") || key.startsWith("/open-positions") ? "Careers"
  : key.startsWith("/contact-us") ? "Contact Us"
  : "Other pages";

const regionLabel = (r: Region | null) => (r ? (REGION_CHOICES.find((c) => c.region === r)?.label ?? r) : "All regions");
const regionOrder = (r: Region | null) => (r ? REGION_CHOICES.findIndex((c) => c.region === r) : -1);

/** The pages built from lists: their Google texts live in Settings → seo. */
const LIST_PAGES: { key: string; name: string; versions: { region: Region | null; path: string; title: string; description: string }[] }[] = [
  { key: "/webinars", name: "Webinars", versions: [{ region: null, path: "/us/webinars", title: "webinarsTitle", description: "webinarsDescription" }] },
  { key: "/news-events", name: "News & Events", versions: [{ region: null, path: "/news-events", title: "newsTitle", description: "newsDescription" }] },
  {
    key: "/contact-us",
    name: "Contact Us",
    versions: [
      { region: null, path: "/contact-us", title: "contactTitle", description: "contactDescription" },
      { region: "us", path: "/contact-us?region=us", title: "contactTitleUs", description: "contactDescriptionUs" },
      { region: "ous", path: "/contact-us?region=ous", title: "contactTitleOus", description: "contactDescriptionOus" },
      { region: "apac", path: "/contact-us?region=apac", title: "contactTitleApac", description: "contactDescriptionApac" },
    ],
  },
];
/** The Settings keys that may be written from Search & sharing (and nothing else). */
export const SEO_SETTING_KEYS = new Set(LIST_PAGES.flatMap((p) => p.versions.flatMap((v) => [v.title, v.description])));

export async function seoPages(): Promise<SeoPage[]> {
  const [cards, sols, pgs, sps, pend, seo] = await Promise.all([
    listEditorPages(),
    db.select({ id: solutions.id, t: solutions.metaTitle, d: solutions.metaDescription }).from(solutions),
    db.select({ id: pages.id, t: pages.metaTitle, d: pages.metaDescription }).from(pages),
    db.select({ id: sitePages.id, t: sitePages.metaTitle, d: sitePages.metaDescription }).from(sitePages),
    db.select().from(drafts).where(inArray(drafts.resource, ["solutions", "pages", "site-pages"])),
    getLiveSetting<Record<string, string>>("seo"),
  ]);
  const live = (r: string, id: number) => (r === "solutions" ? sols : r === "pages" ? pgs : sps).find((x) => x.id === id);
  const byKey = new Map<string, SeoPage>();
  const put = (key: string, name: string, v: SeoVersion) => {
    const page = byKey.get(key) ?? { key, name, section: sectionOf(key), versions: [], problems: 0 };
    page.versions.push(v);
    byKey.set(key, page);
  };

  for (const c of cards) {
    const row = live(c.r, c.id);
    if (!row) continue;
    const d = pend.find((x) => x.resource === c.r && x.recordId === c.id)?.data as Record<string, unknown> | null | undefined;
    const title = String(d?.metaTitle ?? row.t ?? "");
    const description = String(d?.metaDescription ?? row.d ?? "");
    const key = pageKey(c.path);
    put(key, c.title, {
      key: `${c.r}:${c.id}`,
      region: c.region,
      label: regionLabel(c.region),
      path: c.path,
      target: { kind: "record", r: c.r, id: c.id },
      title,
      description,
      fallbackTitle: `${c.title} | Rapid Medical™`,
      pending: !!d,
      problems: seoProblems(title, description),
    });
  }
  for (const p of LIST_PAGES)
    for (const v of p.versions) {
      const title = seo[v.title] ?? "";
      const description = seo[v.description] ?? "";
      put(p.key, p.name, { key: `seo:${v.title}`, region: v.region, label: regionLabel(v.region), path: v.path, target: { kind: "setting", title: v.title, description: v.description }, title, description, fallbackTitle: `${p.name} | Rapid Medical™`, pending: false, problems: seoProblems(title, description) });
    }

  const out = [...byKey.values()];
  for (const p of out) {
    p.versions.sort((a, b) => regionOrder(a.region) - regionOrder(b.region));
    p.problems = p.versions.filter((v) => v.problems.length).length;
  }
  return out.sort((a, b) => SECTIONS.indexOf(a.section as (typeof SECTIONS)[number]) - SECTIONS.indexOf(b.section as (typeof SECTIONS)[number]) || (a.key === sectionKey(a.section) ? -1 : 0) - (b.key === sectionKey(b.section) ? -1 : 0) || a.name.localeCompare(b.name));
}

/** The page a section is named after comes first in it (Therapies overview before the therapies). */
const sectionKey = (section: string) => ({ Home: "/", Therapies: "/therapies", Evidence: "/evidence", Webinars: "/webinars", "News & Events": "/news-events", "About Us": "/about-us", Careers: "/careers", "Contact Us": "/contact-us" })[section] ?? "";

/**
 * How many page versions need a look, cheaply (the Settings overview): the live fields of the pages that keep them, and
 * Settings → seo — without reading the pages themselves. Pending changes are not counted.
 */
export async function seoProblemCount(): Promise<number> {
  const bad = (t: string) => sql.raw(`select count(*)::int as n from ${t} where meta_description = '' or length(meta_title) > 60 or length(meta_description) > 155`);
  const [a, b, c, seo] = await Promise.all([
    db.execute(bad("solutions")),
    db.execute(bad("pages")),
    db.execute(bad("site_pages")),
    getLiveSetting<Record<string, string>>("seo"),
  ]);
  const n = (r: unknown) => Number((r as { n: number }[])[0]?.n ?? 0);
  const lists = LIST_PAGES.flatMap((p) => p.versions).filter((v) => seoProblems(seo[v.title] ?? "", seo[v.description] ?? "").length).length;
  return n(a) + n(b) + n(c) + lists;
}
