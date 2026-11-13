import { WebinarRequest } from "@/components/site/WebinarRequest";
import { Section, Img } from "@/components/site/primitives";
import { F, FM, type EditBinding } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type WebinarsVariant = "cards";

export type WebinarCard = { id: number; title: string; speaker?: string | null; event?: string | null; productName?: string | null; imageUrl?: string | null; /** The webinar is a separate record. */ edit?: EditBinding };

export type WebinarsData = { items: WebinarCard[] };

function Webinars({ data: d, nested }: BlockProps<"webinars">) {
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
  variants: [{ id: "cards", label: "Cards", description: "Three in a row: image, title, speaker, product" }],
  fields: [{ key: "items", label: "Webinars", kind: "items", note: "edited in the webinar records" }],
  example: {
    items: [
      { id: 1, title: "Sample webinar", speaker: "Dr. A. Example", event: "Sample event", productName: "Sample product", imageUrl: "/uploads/features/tt-active-technology.jpg" },
      { id: 2, title: "Another sample webinar", speaker: "Dr. B. Example", imageUrl: "/uploads/features/tt-distal-protection.jpg" },
    ],
  },
  Component: Webinars,
  flow: () => true,
};
