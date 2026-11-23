import Link from "next/link";
import { Section, H2, Img, Btn, SharedLine, formatMonth } from "@/components/site/primitives";
import { Carousel } from "@/components/site/blocks/Carousel";
import { NewsTimeline } from "@/components/site/blocks/NewsTimeline";
import { NewsFeed } from "@/components/site/blocks/NewsFeed";
import { isExternalHref, safeHref, siteHref } from "@/lib/safe-path";
import { F, FM, type EditBinding } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type NewsVariant = "cards" | "carousel" | "timeline" | "highlights" | "feed";

export type NewsCard = { id: number; title: string; url: string; /** the item's own page (ADR-009) */ href?: string; imageUrl?: string | null; publishedOn?: Date | string | null; source?: string | null; /** The item is a separate record. */ edit?: EditBinding };

export type NewsData = {
  title?: string | null;
  items: NewsCard[];
  anchor?: string;
  /** Link to all news. */
  allHref?: string;
  allLabel?: string;
};

/** Where a news item says it comes from: its source, else the site it links to. */
export function newsOrigin(n: Pick<NewsCard, "source" | "url">): string | null {
  if (n.source) return n.source;
  try {
    return new URL(n.url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
const isExternal = isExternalHref;
// every link of a news record goes through safeHref first (security review 2026-11-15)
const ext = (url: string) => (isExternal(url) ? { target: "_blank", rel: "noopener noreferrer" } : {});

function News({ variant, data: d, edit: e, nested }: BlockProps<"news">) {
  if (variant === "highlights") {
    // DESIGN.md → News & Events: instead of a carousel, the first one large and the next three beside it
    // own page when there is one (every news item has, decision 2026-11-15), else the original
    const [big, ...side] = d.items.map((n) => ({ ...n, url: siteHref(n.href ?? n.url) }));
    if (!big) return null;
    // Home carries its own title and «View all news» (nothing lost when Home took this layout, 2026-11-19); News & Events has neither
    const grid = (
      <div id={d.anchor} className="mt-8 grid gap-8 border-t border-border pt-8 md:grid-cols-12 md:gap-10">
        <article className="md:col-span-7">
          <a href={big.url} {...ext(big.url)} className="group block">
            {big.imageUrl && <FM e={big.edit} k="imageUrl"><Img src={big.imageUrl} className="aspect-video w-full rounded bg-surface object-cover" /></FM>}
            <div className="mt-4 text-xs uppercase tracking-wide text-muted">{[formatMonth(big.publishedOn), newsOrigin(big)].filter(Boolean).join(" · ")}</div>
            <h2 className="mt-2 text-2xl font-semibold leading-tight group-hover:underline"><F e={big.edit} k="title">{big.title}</F></h2>
            <span className="mt-3 inline-block text-sm font-medium underline">Read{isExternal(big.url) ? " ↗" : " →"}</span>
          </a>
        </article>
        {side.length > 0 && (
          <ul className="divide-y divide-border md:col-span-4 md:col-start-9">
            {side.slice(0, 3).map((n) => (
              <li key={n.id} className="py-4 first:pt-0">
                <a href={n.url} {...ext(n.url)} className="group grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-4">
                  {n.imageUrl ? <Img src={n.imageUrl} className="aspect-[4/3] w-full rounded bg-surface object-cover" /> : <span aria-hidden />}
                  <span>
                    <span className="block text-xs text-muted">{[formatMonth(n.publishedOn), newsOrigin(n)].filter(Boolean).join(" · ")}</span>
                    <span className="mt-1 block font-medium leading-snug group-hover:underline"><F e={n.edit} k="title">{n.title}</F></span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
    const inner = d.title || d.allHref ? (
      <>
        {d.title && <H2 className="mt-8"><F e={e} k="title">{d.title}</F></H2>}
        {grid}
        {d.allHref && <div className="mt-8"><Btn href={safeHref(d.allHref)} variant="secondary">{d.allLabel || "View all news"}</Btn></div>}
      </>
    ) : grid;
    return nested ? inner : <Section>{inner}</Section>;
  }
  if (variant === "feed") {
    const rows = d.items.map((n) => {
      const href = siteHref(n.href ?? n.url);
      return { id: n.id, date: formatMonth(n.publishedOn), title: <F e={n.edit} k="title">{n.title}</F>, meta: newsOrigin(n), href, external: isExternal(href) };
    });
    const inner = (
      <SharedLine id={d.anchor} title={<F e={e} k="title">{d.title ?? "All news"}</F>} className="mt-16">
        {rows.length ? <NewsFeed items={rows} /> : <p className="text-muted">No news yet.</p>}
        {d.allHref && <Link href={safeHref(d.allHref)} className="mt-4 inline-block text-sm underline">{d.allLabel}</Link>}
      </SharedLine>
    );
    return nested ? inner : <Section>{inner}</Section>;
  }
  if (variant === "timeline") {
    const items = d.items.map((n) => {
      const date = n.publishedOn ? new Date(n.publishedOn) : null;
      return { id: n.id, year: date ? date.getFullYear() : 0, date: date ? date.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }) : "", title: <F e={n.edit} k="title">{n.title}</F>, url: n.url };
    });
    return <Section id={d.anchor} className="bg-surface"><NewsTimeline items={items} /></Section>;
  }
  if (variant === "carousel") {
    return (
      <Section>
        <H2 className="border-b border-accent pb-3 text-base font-medium uppercase tracking-widest"><F e={e} k="title">{d.title}</F></H2>
        <div className="mt-8">
          <Carousel dots="left" arrows={false} ariaLabel={d.title ?? "News"}>
            {d.items.map((n) => (
              <article key={n.id} className="grid items-center gap-8 md:grid-cols-[2fr_3fr]">
                <FM e={n.edit} k="imageUrl"><Img src={n.imageUrl} className="aspect-[4/3] w-full rounded bg-surface object-contain" /></FM>
                <div>
                  <div className="text-sm text-accent">{formatMonth(n.publishedOn)}</div>
                  <h3 className="mt-2 text-2xl font-medium"><F e={n.edit} k="title">{n.title}</F></h3>
                  <div className="mt-6"><Btn href={n.url} external>Continue reading</Btn></div>
                </div>
              </article>
            ))}
          </Carousel>
        </div>
        {d.allHref && <div className="mt-12 text-center"><a href={d.allHref} className="text-sm text-accent underline">{d.allLabel}</a></div>}
      </Section>
    );
  }
  return (
    <Section>
      {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {d.items.map((n) => (
          <li key={n.id} className="flex flex-col rounded border border-border bg-background p-5">
            <div className="text-xs text-muted">{formatMonth(n.publishedOn)}{n.source ? ` · ${n.source}` : ""}</div>
            <h3 className="mt-2 flex-1 font-medium"><F e={n.edit} k="title">{n.title}</F></h3>
            <a href={siteHref(n.href ?? n.url)} {...ext(siteHref(n.href ?? n.url))} className="mt-4 inline-block text-sm font-medium text-accent underline">Continue reading →</a>
          </li>
        ))}
      </ul>
      {d.allHref && <div className="mt-8 text-center"><Btn href={d.allHref} variant="secondary">{d.allLabel}</Btn></div>}
    </Section>
  );
}

const sample: NewsCard[] = [
  { id: 1, title: "Sample news headline", url: "/style-guide#news", publishedOn: "2026-03-15", source: "Sample source", imageUrl: "/uploads/features/tt-active-technology.jpg" },
  { id: 2, title: "Another sample headline", url: "/style-guide#news", publishedOn: "2025-11-15", source: "Sample source", imageUrl: "/uploads/features/tt-distal-protection.jpg" },
];

export const news: BlockDef<"news"> = {
  type: "news",
  name: "News",
  description: "News from the news records: cards, a carousel or a list by year.",
  category: "list",
  variants: [
    { id: "cards", label: "Cards", description: "Four in a row, button to all news" },
    { id: "carousel", label: "Carousel", description: "One item at a time, image and headline" },
    { id: "timeline", label: "By year", description: "Grey band, grouped by year, “Show more”" },
    { id: "highlights", label: "Highlights", description: "The first one large with its picture, the next three beside it (News & Events)" },
    { id: "feed", label: "Rows", description: "Shared line: the name on the left; date, title and source in rows, “Show more” (News & Events)" },
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "items", label: "News", kind: "items", note: "edited in the news records" },
    { key: "allLabel", label: "Link to all news", kind: "text" },
  ],
  example: { title: "Sample news", items: sample, allHref: "/style-guide#news", allLabel: "View all news ›" },
  examples: { timeline: { items: sample }, highlights: { items: [...sample, ...sample.map((n) => ({ ...n, id: n.id + 2 }))] }, feed: { title: "Sample rows", items: sample } },
  Component: News,
  flow: (v) => v === "highlights" || v === "feed",
};
