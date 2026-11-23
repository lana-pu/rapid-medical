import type { Event, Job, NewsItem, Product, Publication, Stat, Webinar } from "@/db/schema";
import { formatEventDates, registrationOpen, splitEvents, day } from "@/lib/events";
import type { EventCard } from "./events";
import { REGION_CHOICES, REGION_FORM_VALUE, REGION_LABELS, type Region } from "@/lib/regions";
import type { Block } from "./types";
import { groupTherapies } from "@/lib/therapy-groups";
import type { NewsCard } from "./news";
import type { JobRow } from "./jobs";
import { newsHref } from "@/lib/material";
import { DEMO, withBase } from "@/lib/demo";
import type { PublicationCard, PublicationGroup } from "./publications";

/**
 * Block lists for the pages stored in site settings and in lists of records:
 * home, Careers, Evidence, therapies index, News & Events, Webinars, region chooser, jobs.
 * Storage does not change; the lists are built on render. Specs: docs/screens/.
 */

const record = (r: string, id: number) => ({ r, id, prefix: "" });

export const newsCard = (n: NewsItem): NewsCard => ({ id: n.id, title: n.title, url: n.url ?? newsHref(n), href: newsHref(n), imageUrl: n.imageUrl, publishedOn: n.publishedOn, source: n.source, edit: record("materials", n.id) });

export const publicationCard = (p: Publication): PublicationCard => ({ id: p.id, title: p.title, journal: p.journal, authors: p.authors, publishedOn: p.publishedOn, imageUrl: p.imageUrl, url: p.url, pdfUrl: p.pdfUrl, doi: p.doi, edit: record("materials", p.id) });

export type HomeSettings = {
  heroLine1?: string; heroLine2?: string; heroSub?: string; heroBody?: string;
  heroCtaLabel?: string; heroCtaHref?: string; heroVideoUrl?: string;
  problemTitle?: string; problemVideoUrl?: string; problemImageUrl?: string; stats?: Stat[]; solutionLine?: string;
  engineeredTitle?: string; engineeredBody?: string; engineeredImageUrl?: string; newsTitle?: string;
};

export function homeToBlocks({ home, news, region }: { home: HomeSettings; news: NewsItem[]; region: Region | null }): Block[] {
  const r = "settings:home";
  const blocks: Block[] = [
    {
      type: "hero",
      variant: "banner",
      data: {
        title: home.heroLine1 ?? "EXPAND",
        title2: home.heroLine2 ?? "WHAT’S POSSIBLE",
        subtitle: home.heroSub,
        body: home.heroBody,
        cta: { label: home.heroCtaLabel || "Explore Our Therapies", href: home.heroCtaHref || (region ? `/${region}/therapies` : "/choose-your-location") },
        videoUrl: home.heroVideoUrl,
      },
      edit: { r, map: { title: "heroLine1", title2: "heroLine2", subtitle: "heroSub", body: "heroBody", "cta.label": "heroCtaLabel", "cta.href": "heroCtaHref" } },
    },
    {
      type: "textMedia",
      variant: "statement",
      data: {
        title: home.problemTitle ?? "",
        videoUrl: home.problemVideoUrl,
        imageUrl: home.problemImageUrl,
        stats: home.stats,
        body: home.solutionLine,
        link: { label: "Request a demo", href: region ? `/contact-us?region=${region}&topic=demo` : "/contact-us?topic=demo" },
      },
      edit: { r, map: { title: "problemTitle", videoUrl: "problemVideoUrl", imageUrl: "problemImageUrl", stats: "stats", body: "solutionLine" } },
    },
  ];
  if (home.engineeredTitle || home.engineeredBody) {
    blocks.push({ type: "text", variant: "dark", data: { title: home.engineeredTitle, body: home.engineeredBody, imageUrl: home.engineeredImageUrl }, edit: { r, map: { title: "engineeredTitle", body: "engineeredBody" } } });
  }
  blocks.push({
    type: "news",
    variant: "cards",
    data: { title: home.newsTitle ?? "At the forefront of advancing stroke intervention", items: news.map(newsCard), allHref: "/news-events", allLabel: "View all news ›" },
    edit: { r, map: { title: "newsTitle" } },
  });
  return blocks;
}

export type CareersSettings = {
  heroTitle?: string; heroSub?: string; heroBody?: string; heroImageUrl?: string; heroVideoUrl?: string;
  quotes?: { quote: string; author?: string; imageUrl?: string }[];
  principlesTitle?: string; principlesBody?: string; principlesImageUrl?: string; principles?: { title: string; body: string }[]; eeoStatement?: string;
};

/** The Careers hero button: down to the roles, or — with none open — down to the general application (DESIGN.md → Careers). */
export function careersCta(jobCount: number) {
  return jobCount ? { label: "See open positions ↓", href: "#open-positions" } : { label: "Send us your details ↓", href: "#general-interest" };
}

/** A job record as a row of the open positions: its page, and «Apply ↗» to the application link or email. */
export function jobRow(j: Pick<Job, "title" | "slug" | "department" | "location" | "applyUrl" | "applyEmail">): JobRow {
  const applyHref = j.applyUrl || (j.applyEmail ? `mailto:${j.applyEmail}?subject=${encodeURIComponent(j.title)}` : null);
  return { title: j.title, href: `/open-positions/${j.slug}`, department: j.department, location: j.location, applyHref };
}

export function careersToBlocks({ c, jobCount, jobs = [] }: { c: CareersSettings; jobCount: number; jobs?: JobRow[] }): Block[] {
  const r = "settings:careers";
  const blocks: Block[] = [
    {
      type: "hero",
      variant: "bannerCompact",
      data: { title: c.heroTitle ?? "Unlock your potential", subtitle: c.heroSub, body: c.heroBody, videoUrl: c.heroVideoUrl, imageUrl: c.heroImageUrl, cta: careersCta(jobCount) },
      edit: { r, map: { title: "heroTitle", subtitle: "heroSub", body: "heroBody" } },
    },
  ];
  if (c.quotes?.length) blocks.push({ type: "gallery", variant: "quotes", data: { items: c.quotes }, edit: { r, map: { items: "quotes" } } });
  blocks.push({
    type: "columns",
    variant: "principles",
    data: { title: c.principlesTitle ?? "Our guiding principles", intro: c.principlesBody, imageUrl: c.principlesImageUrl, items: c.principles ?? [] },
    edit: { r, map: { title: "principlesTitle", intro: "principlesBody", imageUrl: "principlesImageUrl", items: "principles" } },
  });
  blocks.push({ type: "jobs", variant: "roles", data: { anchor: "open-positions", title: "Open positions", note: "Applications go through Spark Hire.", generalHref: "#general-interest", items: jobs } });
  blocks.push({
    type: "form",
    variant: "split",
    data: { anchor: "general-interest", title: "Submit general interest", note: c.eeoStatement, form: "careers", topics: ["General interest", "Internship", "Other"] },
    edit: { r, map: { note: "eeoStatement" } },
  });
  return blocks;
}

export type EvidenceSettings = {
  title?: string; intro?: string; heroVideoUrl?: string; statImageUrl?: string; statValue?: string; statLabel?: string; statIconUrl?: string;
  forefrontText?: string; forefrontImageUrl?: string; forefrontImage2Url?: string; featuredTitle?: string; browseTitle?: string;
};

export type PublicationRow = Publication & { product?: Pick<Product, "slug" | "family"> | null };
export type EvidenceLists = { all: PublicationRow[]; featured: Publication[]; products: Pick<Product, "slug" | "name" | "fullName">[] };

/** What the Evidence page lists: latest with pictures, and per-product tabs (also used by the stored page's sources). */
export function evidenceLists({ all, products }: EvidenceLists): { latest: PublicationRow[]; groups: PublicationGroup[] } {
  const latest = all.filter((p) => p.imageUrl).slice(0, 3);
  // A family tab (e.g. TIGERTRIEVER™) also lists sub-products that have no tab of their own in this region.
  const tabbed = new Set(products.map((p) => p.slug));
  const listFor = (slug: string) => all.filter((p) => p.product?.slug === slug || (p.product?.family === slug && !tabbed.has(p.product.slug)));
  const groups: PublicationGroup[] = products
    .map((prod) => ({ prod, list: listFor(prod.slug) }))
    .filter((t) => t.list.length > 0)
    .map(({ prod, list }) => ({
      id: prod.slug,
      label: prod.name,
      sublabel: prod.fullName.replace(prod.name, "").replace(/^[\s™®–-]+/, "") || undefined,
      fullName: prod.fullName,
      items: list.map(publicationCard),
    }));
  return { latest, groups };
}

export function evidenceToBlocks({ region, cfg, all, featured, products }: { region: Region; cfg: EvidenceSettings } & EvidenceLists): Block[] {
  const r = "settings:evidence";
  const { latest, groups } = evidenceLists({ all, featured, products });

  const blocks: Block[] = [
    {
      type: "hero",
      variant: "bannerCompact",
      data: { eyebrow: REGION_LABELS[region], title: cfg.title ?? "Evidence", body: cfg.intro, videoUrl: cfg.heroVideoUrl },
      edit: { r, map: { title: "title", body: "intro" } },
    },
    {
      // DESIGN.md → Evidence: the region's publications counted per product, the line, the featured ones
      type: "publications",
      variant: "overview",
      data: { region, stat: { value: cfg.statValue || `${all.length}+`, label: cfg.statLabel || "clinical publications", iconUrl: cfg.statIconUrl }, line: cfg.forefrontText, items: featured.map(publicationCard), groups },
      edit: { r, map: { "stat.label": "statLabel", line: "forefrontText" } },
    },
    {
      type: "publications",
      variant: "library",
      data: { region, anchor: "browse-by-product", title: cfg.browseTitle ?? "Browse by product", groups, anchors: products.map((p) => p.slug) },
      edit: { r, map: { title: "browseTitle" } },
    },
  ];
  // «Featured publications» (the latest three with a picture) is gone — it repeated the featured ones (decision 2026-11-15)
  void latest;
  return blocks;
}

export type TherapiesLanding = {
  title?: string; intro?: string; heroVideoUrl?: string; note?: string;
  blocks?: { title: string; body: string; imageUrl?: string; links?: { label: string; href: string }[] }[];
  closingTitle?: string; closingBody?: string; metaTitle?: string; metaDescription?: string;
};

export type OverviewTherapy = { slug: string; navLabel: string; heroTitle: string; therapyGroup?: string | null; proofPoint?: string | null; productName?: string | null; productSlug?: string | null; heroImageUrl?: string | null };

/** Publications per Evidence tab of a region (tab = product slug) — the same lists the Evidence page shows. */
export function publicationCounts(lists: EvidenceLists): Record<string, number> {
  return Object.fromEntries(evidenceLists(lists).groups.map((g) => [g.id, g.items.length]));
}

/** Overview cards (also used by the stored page's `therapyGroup` source). `caption`: the group's name goes on the card. */
export function therapyCards(items: OverviewTherapy[], region: Region, { caption, publications }: { caption?: string; publications?: Record<string, number> } = {}) {
  return items.map((s) => {
    const n = s.productSlug ? publications?.[s.productSlug] ?? 0 : 0;
    return {
      eyebrow: [caption, s.productName].filter(Boolean).join(" · ") || undefined,
      title: s.navLabel,
      body: s.heroTitle,
      note: s.proofPoint || undefined,
      // No picture yet: the decision is one 4:3 device render per card (requested from the client, BACKLOG №22);
      // hero images differ (some therapies have a video), so cards would differ in height.
      href: `/${region}/therapies/${s.slug}`,
      // «N publications →» — Evidence on that product's tab; only when the region lists some
      more: n ? { label: `${n} publication${n === 1 ? "" : "s"} →`, href: `/${region}/evidence#${s.productSlug}` } : null,
    };
  });
}

/**
 * The overview's sections (DESIGN.md → Обзор терапий): a group with 2+ therapies keeps its heading; groups of one
 * therapy have no heading of their own — their cards stand in one row (at the first such group), the group's name on
 * the card («Ischemic stroke · TIGERTRIEVER™»).
 */
export function overviewSections(items: OverviewTherapy[], region: Region, publications?: Record<string, number>) {
  const groups = groupTherapies(items);
  const singles = groups.filter((g) => g.items.length === 1);
  const out: { group: string; title: string | null; items: ReturnType<typeof therapyCards> }[] = [];
  for (const g of groups) {
    if (g.items.length > 1) out.push({ group: g.value, title: g.label || null, items: therapyCards(g.items, region, { publications }) });
    else if (g === singles[0]) out.push({ group: g.value, title: null, items: singles.flatMap((x) => therapyCards(x.items, region, { caption: x.label, publications })) });
  }
  return out;
}

/**
 * Regional therapies overview (decision 2026-11-10): one group of link cards per therapy group, built from the
 * therapy records themselves. The landing's own `blocks` texts are no longer shown (kept in settings, not deleted).
 */
export function therapiesToBlocks({ region, landing, items, publications }: { region: Region; landing: TherapiesLanding; items: OverviewTherapy[]; publications?: Record<string, number> }): Block[] {
  const r = `settings:therapies:${region}`;
  const blocks: Block[] = [
    {
      type: "hero",
      variant: "bannerCompact",
      data: { eyebrow: REGION_LABELS[region], title: landing.title ?? "Therapies", body: landing.intro, note: landing.note, videoUrl: landing.heroVideoUrl },
      edit: { r, map: { title: "title", body: "intro", note: "note" } },
    },
  ];
  for (const g of overviewSections(items, region, publications)) blocks.push({ type: "columns", variant: "cards", data: { title: g.title, items: g.items } });
  blocks.push({
    type: "cta",
    variant: "light",
    data: { title: landing.closingTitle ?? "Questions?", body: landing.closingBody ?? "Reach out to learn more about our company and devices.", buttons: [{ label: "Contact us", href: `/contact-us?region=${region}` }] },
    edit: { r, map: { title: "closingTitle", body: "closingBody" } },
  });
  return blocks;
}

const eventCard = (e: Event, now?: string): EventCard => ({
  id: e.id,
  title: e.title,
  href: `/events/${e.slug}`,
  dates: formatEventDates(e),
  year: Number(day(e.startsOn).slice(0, 4)),
  place: [e.venue, e.city].filter(Boolean).join(", ") || null,
  time: e.startTime || null,
  city: e.city || null,
  venue: e.venue || null,
  congress: e.congress || null,
  registrationOpen: registrationOpen(e, now),
  edit: record("events", e.id),
});

/** The four highlights on News & Events: the newest marked ones, then the newest of the rest (ADR-009 «highlights»). */
export function newsHighlights(items: NewsItem[], n = 4): NewsItem[] {
  const marked = items.filter((i) => i.featured);
  return [...marked, ...items.filter((i) => !i.featured)].slice(0, n);
}

/**
 * News & Events (DESIGN.md → News & Events, docs/screens/news-events.md): the title, the highlights, upcoming events
 * (a line when there are none), all news without the highlights, past events. Shared line under the title.
 */
export function newsPageToBlocks(items: NewsItem[], eventItems: Event[] = [], now?: string): Block[] {
  const top = newsHighlights(items);
  const shown = new Set(top.map((i) => i.id));
  const { upcoming, past } = splitEvents(eventItems, now);
  const blocks: Block[] = [{ type: "hero", variant: "page", data: { title: "News & Events" } }];
  if (top.length > 0) blocks.push({ type: "news", variant: "highlights", data: { anchor: "highlights", items: top.map(newsCard) } });
  blocks.push({ type: "events", variant: "next", data: { title: "Upcoming events", anchor: "upcoming-events", items: upcoming.map((e) => eventCard(e, now)), emptyHref: past.length ? "#past-events" : undefined } });
  blocks.push({ type: "news", variant: "feed", data: { title: "All news", anchor: "all-news", items: items.filter((i) => !shown.has(i.id)).map(newsCard) } });
  if (past.length > 0) blocks.push({ type: "events", variant: "past", data: { title: "Past events", anchor: "past-events", items: past.map((e) => eventCard(e, now)) } });
  return blocks;
}

export function webinarsToBlocks({ region, list, product }: { region: Region; list: (Webinar & { product?: Pick<Product, "name" | "slug"> | null })[]; product?: string }): Block[] {
  // coming from a therapy page (?product=…): its first webinar is chosen in the form
  const chosen = product ? list.find((w) => w.product?.slug === product)?.title : undefined;
  return [
    { type: "hero", variant: "page", data: { title: "Webinars", body: "Physician-led webinars are available to view on-demand. To request a recording, please fill in the form below." } },
    { type: "webinars", variant: "cards", data: { items: list.map((w) => ({ id: w.id, title: w.title, speaker: w.speaker, event: w.event, productName: w.product?.name, imageUrl: w.imageUrl, edit: record("webinars", w.id) })) } },
    { type: "form", variant: "compact", data: { form: "webinar", topics: list.length ? list.map((w) => w.title) : ["Webinar recording request"], defaultTopic: chosen, defaultRegion: REGION_FORM_VALUE[region] } },
  ];
}

export function chooserToBlocks({ regional, suggested, next, back, current }: { regional: { chooserTitle?: string; chooserNote?: string }; suggested: Region | null; next?: string; back?: string | null; current?: { label: string; source: "location" | "chosen" | null } | null }): Block[] {
  const target = next && /^[a-z-]+$/.test(next) ? next : "therapies";
  return [
    {
      type: "hero",
      variant: "page",
      data: { title: regional.chooserTitle ?? "Choose your location.", body: regional.chooserNote ?? "Product availability and regulatory information differ by region." },
      edit: { r: "settings:regional", map: { title: "chooserTitle", body: "chooserNote" } },
    },
    {
      type: "regionChooser",
      variant: "default",
      data: {
        // through /api/region: it remembers the choice; `back` returns to the page the visitor came from
        // (the static demo has no API: straight to the region's page)
        options: REGION_CHOICES.map((o) => ({ region: o.region, label: o.label, href: DEMO ? withBase(`/${o.region}/${target}`) : `/api/region?to=${o.region}&back=${encodeURIComponent(back ?? `/${o.region}/${target}`)}`, suggested: suggested === o.region })),
        current: current ?? null,
      },
    },
  ];
}

export function jobsToBlocks(jobs: Job[]): Block[] {
  return [
    { type: "hero", variant: "page", data: { title: "Join us" } },
    { type: "jobs", variant: "list", data: { generalHref: "/careers#general-interest", items: jobs.map((j) => ({ title: j.title, href: `/open-positions/${j.slug}`, department: j.department, location: j.location })) } },
  ];
}
