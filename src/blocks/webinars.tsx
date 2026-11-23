import { WebinarRequest } from "@/components/site/WebinarRequest";
import { WebinarLibrary } from "@/components/site/WebinarLibrary";
import { Section, Img, SharedLine, formatMonth } from "@/components/site/primitives";
import { F, FM, type EditBinding } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type WebinarsVariant = "cards" | "library";

export type WebinarCard = {
  id: number;
  title: string;
  speaker?: string | null;
  event?: string | null;
  productName?: string | null;
  /** `library`: the product's slug, for the filter and ?product= from a therapy page */
  productSlug?: string | null;
  imageUrl?: string | null;
  /** `library`: date held and length */
  heldOn?: Date | string | null;
  durationMin?: number | null;
  /** The webinar is a separate record. */
  edit?: EditBinding;
};

export type WebinarsData = {
  items: WebinarCard[];
  /** `library`: the line's name; the product chosen on arrival (?product=); the region for the form; the empty line */
  title?: string | null;
  product?: string;
  defaultRegion?: string;
  emptyLine?: string;
};

function Webinars({ variant, data: d, edit: e, nested }: BlockProps<"webinars">) {
  if (variant === "library") {
    // DESIGN.md → Решения по страницам («общая линия»): the name on the left, the rows on the right
    const rows = d.items.map((w) => ({
      id: w.id,
      title: <F e={w.edit} k="title">{w.title}</F>,
      text: w.title,
      image: <FM e={w.edit} k="imageUrl"><Img src={w.imageUrl} className="aspect-video w-full rounded object-cover" /></FM>,
      when: [formatMonth(w.heldOn), w.durationMin ? `${w.durationMin} min` : ""].filter(Boolean).join(" · ") || undefined,
      by: [w.speaker, w.event].filter(Boolean).join(" · ") || undefined,
      product: w.productSlug ?? undefined,
      productLabel: w.productName ?? undefined,
    }));
    const inner = (
      <SharedLine title={<F e={e} k="title">{d.title || "All webinars"}</F>} aside={d.items.length ? `${d.items.length} on demand` : undefined}>
        <WebinarLibrary rows={rows} initialProduct={d.product} defaultRegion={d.defaultRegion} emptyLine={d.emptyLine || "No webinars for this region yet."} contactHref="/contact-us" />
      </SharedLine>
    );
    return nested ? inner : <Section>{inner}</Section>;
  }
  if (!d.items.length) return null;
  const inner = (
    <ul className="mt-10 grid gap-6 md:grid-cols-3">
      {d.items.map((w) => (
        <li key={w.id} className="rounded border border-border p-5">
          <FM e={w.edit} k="imageUrl" className="mb-4"><Img src={w.imageUrl} className="aspect-video w-full rounded object-cover" /></FM>
          <div className="font-medium"><F e={w.edit} k="title">{w.title}</F></div>
          <div className="mt-1 text-sm text-muted">{[w.speaker, w.event].filter(Boolean).join(" · ")}</div>
          {w.productName && <div className="mt-1 text-xs uppercase text-muted">{w.productName}</div>}
          <WebinarRequest title={w.title} />
        </li>
      ))}
    </ul>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const webinars: BlockDef<"webinars"> = {
  type: "webinars",
  name: "Webinars",
  description: "Webinars from the records, as cards.",
  category: "list",
  variants: [
    { id: "cards", label: "Cards", description: "Three in a row: image, title, speaker, product" },
    { id: "library", label: "Shared line", description: "Rows like the Evidence archive: picture, date · length, title, speaker · event, product; «Request this recording» opens a window with the form; product filter from 9 webinars; an empty line when there are none" },
  ],
  fields: [
    { key: "title", label: "Title (shared line)", kind: "text" },
    { key: "items", label: "Webinars", kind: "items", note: "edited in the webinar records" },
  ],
  example: {
    items: [
      { id: 1, title: "Sample webinar", speaker: "Dr. A. Example", event: "Sample event", productName: "Sample product", imageUrl: "/uploads/features/tt-active-technology.jpg" },
      { id: 2, title: "Another sample webinar", speaker: "Dr. B. Example", imageUrl: "/uploads/features/tt-distal-protection.jpg" },
    ],
  },
  examples: {
    library: {
      items: [
        { id: 1, title: "Sample webinar", speaker: "Dr. A. Example", event: "Sample event", productName: "Sample product", productSlug: "sample", heldOn: "2025-03-15", durationMin: 45, imageUrl: "/uploads/features/tt-active-technology.jpg" },
        { id: 2, title: "Another sample webinar", speaker: "Dr. B. Example", productName: "Sample product", productSlug: "sample", heldOn: "2024-11-15", durationMin: 30, imageUrl: "/uploads/features/tt-distal-protection.jpg" },
      ],
    },
  },
  Component: Webinars,
  flow: () => true,
};
