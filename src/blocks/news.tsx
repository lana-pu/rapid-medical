import { Section, H2, Img, Btn, formatMonth } from "@/components/site/primitives";
import { Carousel } from "@/components/site/blocks/Carousel";
import { NewsTimeline } from "@/components/site/blocks/NewsTimeline";
import { F, FM, type EditBinding } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type NewsVariant = "cards" | "carousel" | "timeline";

export type NewsCard = { id: number; title: string; url: string; imageUrl?: string | null; publishedOn?: Date | string | null; source?: string | null; /** The item is a separate record. */ edit?: EditBinding };

export type NewsData = {
  title?: string | null;
  items: NewsCard[];
  anchor?: string;
  /** Link to all news. */
  allHref?: string;
  allLabel?: string;
};

function News({ variant, data: d, edit: e }: BlockProps<"news">) {
  if (variant === "timeline") {
    const items = d.items.map((n) => {
      const date = n.publishedOn ? new Date(n.publishedOn) : null;
      return { id: n.id, year: date ? date.getFullYear() : 0, date: date ? `${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}` : "", title: <F e={n.edit} k="title">{n.title}</F>, url: n.url };
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
            <a href={n.url} target="_blank" rel="noopener" className="mt-4 inline-block text-sm font-medium text-accent underline">Continue reading →</a>
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
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "items", label: "News", kind: "items", note: "edited in the news records" },
    { key: "allLabel", label: "Link to all news", kind: "text" },
  ],
  example: { title: "Sample news", items: sample, allHref: "/style-guide#news", allLabel: "View all news ›" },
  examples: { timeline: { items: sample } },
  Component: News,
};
