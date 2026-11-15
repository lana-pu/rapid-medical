import type { Stat } from "@/db/schema";
import { Section, H2, Img, Btn, KeyValue, SharedLine, formatMonth } from "@/components/site/primitives";
import { PublicationLibrary, type LibraryRow } from "@/components/site/PublicationLibrary";
import { safeHref } from "@/lib/safe-path";
import { publicationHref } from "@/lib/material";
import Link from "next/link";
import { Tabs } from "@/components/site/Tabs";
import { Carousel } from "@/components/site/blocks/Carousel";
import { StatBadge } from "@/components/site/blocks/Stats";
import { F, FM, type EditBinding } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type PublicationsVariant = "spotlight" | "cards" | "byProduct" | "overview" | "library";

export type PublicationCard = {
  id: number;
  title: string;
  journal?: string | null;
  authors?: string | null;
  publishedOn?: Date | string | null;
  imageUrl?: string | null;
  url?: string | null;
  pdfUrl?: string | null;
  doi?: string | null;
  /** The publication is a separate record. */
  edit?: EditBinding;
};

export type PublicationGroup = { id: string; label: string; sublabel?: string; fullName: string; items: PublicationCard[] };

export type PublicationsData = {
  /** `overview`, `library`: the region, for the publications' own pages */
  region?: string;
  title?: string | null;
  anchor?: string;
  /** `spotlight`: number above the carousel and a line under it. */
  stat?: Stat;
  line?: string | null;
  items?: PublicationCard[];
  /** `byProduct` */
  groups?: PublicationGroup[];
  /** `byProduct`: extra anchors, so other pages can link to a product. */
  anchors?: string[];
};

const year = (d: Date | string | null | undefined) => (d ? String(new Date(d).getUTCFullYear()) : "");

function Publications({ variant, data: d, edit: e }: BlockProps<"publications">) {
  const items = d.items ?? [];
  if (variant === "overview") {
    // DESIGN.md → Evidence: the number from the records (the region's), per product; the line; the featured ones
    const groups = d.groups ?? [];
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    const rows = [
      { label: d.stat?.label ? d.stat.label.charAt(0).toUpperCase() + d.stat.label.slice(1) : "Clinical publications", value: <strong>{total}</strong> },
      ...groups.map((g) => ({ label: g.label, value: <a href={`#${g.id}`} className="underline">{g.items.length}</a> })),
    ];
    return (
      <Section>
        <div className="grid gap-10 border-t border-border pt-8 md:grid-cols-12">
          <div className="md:col-span-4">{total > 0 && <KeyValue rows={rows} />}</div>
          <div className="md:col-span-7 md:col-start-6">
            {d.line && <p className="text-xl"><F e={e} k="line">{d.line}</F></p>}
          </div>
        </div>
        {items.length > 0 && (
          <div className="mt-16">
            <H2><F e={e} k="title">{d.title || "Featured publications"}</F></H2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {items.map((p) => (
                <li key={p.id} className="flex flex-col rounded border border-border p-5">
                  {p.imageUrl && <FM e={p.edit} k="imageUrl" className="mb-4"><Img src={p.imageUrl} className="aspect-video w-full rounded object-cover" /></FM>}
                  <div className="text-xs uppercase tracking-wide text-muted">{[year(p.publishedOn), p.journal].filter(Boolean).join(" · ")}</div>
                  <h3 className="mt-2 font-semibold leading-snug">{d.region ? <Link href={publicationHref(d.region, p)} className="hover:underline"><F e={p.edit} k="title">{p.title}</F></Link> : <F e={p.edit} k="title">{p.title}</F>}</h3>
                  <div className="mt-auto flex flex-wrap gap-x-4 pt-4 text-sm">
                    {p.url && <a href={safeHref(p.url)} target="_blank" rel="noopener noreferrer" className="underline">Read ↗</a>}
                    {p.pdfUrl && <a href={safeHref(p.pdfUrl)} target="_blank" rel="noopener noreferrer" className="underline">Download PDF</a>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    );
  }
  if (variant === "library") {
    const groups = d.groups ?? [];
    const rows: LibraryRow[] = groups.flatMap((g) =>
      g.items.map((p) => ({
        id: p.id,
        title: <F e={p.edit} k="title">{p.title}</F>,
        text: p.title,
        journal: p.journal,
        authors: p.authors,
        date: p.publishedOn ? new Date(p.publishedOn).getTime() : 0,
        year: year(p.publishedOn),
        url: p.url,
        doi: p.doi,
        pdfUrl: p.pdfUrl,
        product: g.id,
        productLabel: g.label,
        page: d.region ? publicationHref(d.region, p) : null,
      })),
    );
    return (
      <Section id={d.anchor} className="scroll-mt-16">
        {d.anchors?.map((a) => <span key={a} id={a} className="block scroll-mt-16" />)}
        <SharedLine title={<F e={e} k="title">{d.title || "All publications"}</F>}>
          <PublicationLibrary rows={rows} products={groups.map((g) => ({ id: g.id, label: g.label, count: g.items.length }))} />
        </SharedLine>
      </Section>
    );
  }
  if (variant === "spotlight") {
    const stat = d.stat;
    return (
      <Section>
        <div className="text-center">
          {stat && <StatBadge stat={stat} render={(part) => <F e={e} k={`stat.${part}`}>{stat[part]}</F>} />}
          {d.line && <p className="mx-auto mt-8 max-w-xl text-lg italic text-accent"><F e={e} k="line">{d.line}</F></p>}
        </div>
        {items.length > 0 && (
          <div className="mt-10">
            <Carousel ariaLabel="Featured publications">
              {items.map((p) => (
                <article key={p.id} className="grid gap-6 rounded border border-border bg-surface p-6 md:grid-cols-2 md:p-10">
                  <FM e={p.edit} k="imageUrl"><Img src={p.imageUrl} className="aspect-video w-full rounded object-cover" /></FM>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted">{[p.journal, formatMonth(p.publishedOn)].filter(Boolean).join(" · ")}</div>
                    <h3 className="mt-2 text-xl font-semibold md:text-2xl"><F e={p.edit} k="title">{p.title}</F></h3>
                    {p.authors && <div className="mt-3 text-xs text-muted">{p.authors}</div>}
                    <div className="mt-6"><Btn href={p.pdfUrl || p.url || "#"} external>Read article</Btn></div>
                  </div>
                </article>
              ))}
            </Carousel>
          </div>
        )}
      </Section>
    );
  }
  if (variant === "cards") {
    return (
      <Section className="bg-surface">
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        <ul className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map((p) => (
            <li key={p.id} className="rounded border border-border bg-background p-5">
              <FM e={p.edit} k="imageUrl" className="mb-4"><Img src={p.imageUrl} className="aspect-video w-full rounded object-cover" /></FM>
              <div className="text-xs font-semibold uppercase text-muted">{formatMonth(p.publishedOn)}</div>
              <div className="mt-2 font-medium"><F e={p.edit} k="title">{p.title}</F></div>
              <a href={p.pdfUrl || p.url || "#"} target="_blank" rel="noopener" className="mt-3 inline-block text-sm underline">Read ›</a>
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  const tabs = (d.groups ?? []).map((g) => ({
    id: g.id,
    label: g.label,
    sublabel: g.sublabel,
    content: (
      <div>
        <h3 className="mb-2 text-lg font-semibold">{g.fullName}</h3>
        <ul className="divide-y divide-border">
          {g.items.map((p) => (
            <li key={p.id} className="flex flex-col gap-1 py-4 md:flex-row md:gap-6">
              <span className="w-20 flex-none text-sm text-muted">{formatMonth(p.publishedOn)}</span>
              <div className="flex-1">
                <div className="font-medium"><F e={p.edit} k="title">{p.title}</F></div>
                {(p.authors || p.journal) && <div className="mt-1 text-sm text-muted">{[p.authors, p.journal].filter(Boolean).join(" · ")}</div>}
                <div className="mt-1 flex gap-4 text-sm">
                  {p.url && <a href={p.url} target="_blank" rel="noopener" className="underline">{p.doi ? `doi:${p.doi}` : "Read"}</a>}
                  {p.pdfUrl && <a href={p.pdfUrl} target="_blank" rel="noopener" className="underline">Download PDF</a>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
  }));
  return (
    <Section id={d.anchor}>
      {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
      <div className="mt-8">
        {d.anchors?.map((a) => <span key={a} id={a} />)}
        <Tabs tabs={tabs} />
      </div>
    </Section>
  );
}

const sample: PublicationCard[] = [
  { id: 1, title: "Sample publication title", journal: "Sample Journal", authors: "Example A, Example B", publishedOn: "2026-02-15", imageUrl: "/uploads/features/tt-active-technology.jpg", url: "/style-guide#publications", doi: "10.0000/sample" },
  { id: 2, title: "Another sample publication", journal: "Sample Journal", authors: "Example C", publishedOn: "2025-09-15", imageUrl: "/uploads/features/tt-distal-protection.jpg", url: "/style-guide#publications" },
  { id: 3, title: "Third sample publication", journal: "Sample Journal", publishedOn: "2025-05-15", imageUrl: "/uploads/features/tt-visibility.jpg", url: "/style-guide#publications" },
];

export const publications: BlockDef<"publications"> = {
  type: "publications",
  name: "Publications",
  description: "Clinical publications from the records: a highlight, cards or tabs by product.",
  category: "list",
  variants: [
    { id: "spotlight", label: "Highlight", description: "A number, a line and a carousel of featured publications" },
    { id: "cards", label: "Cards", description: "Grey band, three cards with an image" },
    { id: "byProduct", label: "By product", description: "Tabs by product, a list in each" },
    { id: "overview", label: "Overview", description: "Publications counted from the records (per product) beside a line, then the featured ones as cards (Evidence)" },
    { id: "library", label: "Archive", description: "Shared line: search, product filter with counts, sort, rows with the first author, Read / PDF, Show more (Evidence)" },
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "stat", label: "Number (highlight)", kind: "items" },
    { key: "line", label: "Line under the number (highlight)", kind: "text" },
    { key: "items", label: "Publications", kind: "items", note: "edited in the publication records" },
  ],
  example: { stat: { value: "00+", label: "sample publications" }, line: "A short line under the number.", items: sample },
  examples: {
    cards: { title: "Sample publications", items: sample },
    byProduct: {
      title: "Sample by product",
      groups: [
        { id: "sample-a", label: "PRODUCT A", fullName: "Sample product A", items: sample.slice(0, 2) },
        { id: "sample-b", label: "PRODUCT B", fullName: "Sample product B", items: sample.slice(2) },
      ],
    },
    overview: {
      stat: { value: "", label: "sample publications" },
      line: "A short line beside the numbers.",
      items: sample.slice(0, 3),
      groups: [
        { id: "sample-a", label: "PRODUCT A", fullName: "Sample product A", items: sample.slice(0, 2) },
        { id: "sample-b", label: "PRODUCT B", fullName: "Sample product B", items: sample.slice(2) },
      ],
    },
    library: {
      title: "Sample archive",
      groups: [
        { id: "sample-a", label: "PRODUCT A", fullName: "Sample product A", items: sample.slice(0, 2) },
        { id: "sample-b", label: "PRODUCT B", fullName: "Sample product B", items: sample.slice(2) },
      ],
    },
  },
  Component: Publications,
};
