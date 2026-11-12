import type { Event, Job, NewsItem, Product, Publication, Stat, Webinar } from "@/db/schema";
import { formatEventDates, registrationOpen, splitEvents, day } from "@/lib/events";
import type { EventCard } from "./events";
import { REGION_CHOICES, REGION_FORM_VALUE, REGION_LABELS, type Region } from "@/lib/regions";
import type { Block } from "./types";
import { groupTherapies } from "@/lib/therapy-groups";
import type { NewsCard } from "./news";
import type { PublicationCard, PublicationGroup } from "./publications";

/**
 * Block lists for the pages stored in site settings and in lists of records:
 * home, Careers, Evidence, therapies index, News & Events, Webinars, region chooser, jobs.
 * Storage does not change; the lists are built on render. Specs: docs/screens/.
 */

const record = (r: string, id: number) => ({ r, id, prefix: "" });

export const newsCard = (n: NewsItem): NewsCard => ({ id: n.id, title: n.title, url: n.url, imageUrl: n.imageUrl, publishedOn: n.publishedOn, source: n.source, edit: record("news", n.id) });

export const publicationCard = (p: Publication): PublicationCard => ({ id: p.id, title: p.title, journal: p.journal, authors: p.authors, publishedOn: p.publishedOn, imageUrl: p.imageUrl, url: p.url, pdfUrl: p.pdfUrl, doi: p.doi, edit: record("publications", p.id) });

export type HomeSettings = {
  heroLine1?: string; heroLine2?: string; heroSub?: string; heroBody?: string;
  heroCtaLabel?: string; heroCtaHref?: string; heroVideoUrl?: string;
  problemTitle?: string; problemVideoUrl?: string; stats?: Stat[]; solutionLine?: string;
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
        stats: home.stats,
        body: home.solutionLine,
        link: { label: "Request a demo", href: region ? `/contact-us?region=${region}&topic=demo` : "/contact-us?topic=demo" },
      },
      edit: { r, map: { title: "problemTitle", videoUrl: "problemVideoUrl", stats: "stats", body: "solutionLine" } },
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

export function careersToBlocks({ c, jobCount }: { c: CareersSettings; jobCount: number }): Block[] {
  const r = "settings:careers";
  const blocks: Block[] = [
    {
      type: "hero",
      variant: "bannerCompact",
      data: { title: c.heroTitle ?? "Unlock your potential", subtitle: c.heroSub, body: c.heroBody, videoUrl: c.heroVideoUrl, imageUrl: c.heroImageUrl, cta: { label: `View open positions${jobCount ? ` (${jobCount})` : ""}`, href: "/open-positions" } },
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
  blocks.push({
    type: "form",
    variant: "section",
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
      type: "publications",
      variant: "spotlight",
      data: { stat: { value: cfg.statValue || `${all.length}+`, label: cfg.statLabel || "clinical publications", iconUrl: cfg.statIconUrl }, line: cfg.forefrontText, items: featured.map(publicationCard) },
      edit: { r, map: { "stat.value": "statValue", "stat.label": "statLabel", line: "forefrontText" } },
    },
  ];
  if (latest.length > 0) {
    blocks.push({ type: "publications", variant: "cards", data: { title: cfg.featuredTitle ?? "Featured publications", items: latest.map(publicationCard) }, edit: { r, map: { title: "featuredTitle" } } });
  }
  blocks.push({
    type: "publications",
    variant: "byProduct",
    data: { anchor: "browse-by-product", title: cfg.browseTitle ?? "Browse by product", groups, anchors: products.map((p) => p.slug) },
    edit: { r, map: { title: "browseTitle" } },
  });
  return blocks;
}

export type TherapiesLanding = {
  title?: string; intro?: string; heroVideoUrl?: string; note?: string;
  blocks?: { title: string; body: string; imageUrl?: string; links?: { label: string; href: string }[] }[];
  closingTitle?: string; closingBody?: string; metaTitle?: string; metaDescription?: string;
};

export type OverviewTherapy = { slug: string; navLabel: string; heroTitle: string; therapyGroup?: string | null; proofPoint?: string | null; productName?: string | null; heroImageUrl?: string | null };

/** Overview cards of one therapy group (also used by the stored page's `therapyGroup` source). */
export function therapyCards(items: OverviewTherapy[], region: Region) {
  return items.map((s) => ({
    eyebrow: s.productName ?? undefined,
    title: s.navLabel,
    body: s.heroTitle,
    note: s.proofPoint || undefined,
    // No picture: only some therapies have a hero image (others a video), so cards would differ in height.
    href: `/${region}/therapies/${s.slug}`,
  }));
}

/**
 * Regional therapies overview (decision 2026-11-10): one group of link cards per therapy group, built from the
 * therapy records themselves. The landing's own `blocks` texts are no longer shown (kept in settings, not deleted).
 */
export function therapiesToBlocks({ region, landing, items }: { region: Region; landing: TherapiesLanding; items: OverviewTherapy[] }): Block[] {
  const r = `settings:therapies:${region}`;
  const blocks: Block[] = [
    {
      type: "hero",
      variant: "bannerCompact",
      data: { eyebrow: REGION_LABELS[region], title: landing.title ?? "Therapies", body: landing.intro, note: landing.note, videoUrl: landing.heroVideoUrl },
      edit: { r, map: { title: "title", body: "intro", note: "note" } },
    },
  ];
  for (const g of groupTherapies(items)) blocks.push({ type: "columns", variant: "cards", data: { title: g.label || null, items: therapyCards(g.items, region) } });
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
  congress: e.congress || null,
  registrationOpen: registrationOpen(e, now),
  edit: record("events", e.id),
});

/** News & Events: upcoming events first, then news, then the events archive (docs/screens/events.md). */
export function newsPageToBlocks(items: NewsItem[], eventItems: Event[] = [], now?: string): Block[] {
  const featured = items.filter((n) => n.featured);
  const slides = (featured.length ? featured : items).slice(0, 5);
  const { upcoming, past } = splitEvents(eventItems, now);
  const blocks: Block[] = [{ type: "hero", variant: "title", data: { title: "News &", title2: "Events" } }];
  if (upcoming.length > 0) blocks.push({ type: "events", variant: "upcoming", data: { title: "Upcoming events", anchor: "upcoming-events", items: upcoming.map((e) => eventCard(e, now)) } });
  if (slides.length > 0) {
    blocks.push({ type: "news", variant: "carousel", data: { title: "Latest news", items: slides.map(newsCard), allHref: "#all-news", allLabel: "View all news ↓" } });
  }
  blocks.push({ type: "news", variant: "timeline", data: { anchor: "all-news", items: items.map(newsCard) } });
  if (past.length > 0) blocks.push({ type: "events", variant: "archive", data: { title: "Past events", anchor: "past-events", items: past.map((e) => eventCard(e, now)) } });
  return blocks;
}

export function webinarsToBlocks({ region, list }: { region: Region; list: (Webinar & { product?: Pick<Product, "name"> | null })[] }): Block[] {
  return [
    { type: "hero", variant: "page", data: { title: "Webinars", body: "Physician-led webinars are available to view on-demand. To request a recording, please fill in the form below." } },
    { type: "webinars", variant: "cards", data: { items: list.map((w) => ({ id: w.id, title: w.title, speaker: w.speaker, event: w.event, productName: w.product?.name, imageUrl: w.imageUrl, edit: record("webinars", w.id) })) } },
    { type: "form", variant: "compact", data: { form: "webinar", topics: list.length ? list.map((w) => w.title) : ["Webinar recording request"], defaultRegion: REGION_FORM_VALUE[region] } },
  ];
}

export function chooserToBlocks({ regional, suggested, next }: { regional: { chooserTitle?: string; chooserNote?: string }; suggested: Region | null; next?: string }): Block[] {
  const target = next && /^[a-z-]+$/.test(next) ? next : "therapies";
  return [
    {
      type: "hero",
      variant: "page",
      data: { title: regional.chooserTitle ?? "Choose your location.", body: regional.chooserNote ?? "Product availability and regulatory information differ by region." },
      edit: { r: "settings:regional", map: { title: "chooserTitle", body: "chooserNote" } },
    },
    { type: "regionChooser", variant: "default", data: { options: REGION_CHOICES.map((o) => ({ label: o.label, href: `/${o.region}/${target}`, suggested: suggested === o.region })) } },
  ];
}

export function jobsToBlocks(jobs: Job[]): Block[] {
  return [
    { type: "hero", variant: "page", data: { title: "Join us" } },
    { type: "jobs", variant: "list", data: { generalHref: "/careers#general-interest", items: jobs.map((j) => ({ title: j.title, href: `/open-positions/${j.slug}`, department: j.department, location: j.location })) } },
  ];
}
