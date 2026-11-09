import { Section } from "@/components/site/primitives";
import { Gallery as GalleryGrid } from "@/components/site/blocks/Blocks";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type GalleryVariant = "quotes";

export type GalleryItem = { imageUrl?: string; quote?: string; author?: string };

export type GalleryData = { items: GalleryItem[] };

function Gallery({ data: d, edit: e }: BlockProps<"gallery">) {
  return (
    <Section>
      <GalleryGrid items={d.items} render={(i, part) => <F e={e} k={`items.${i}.${part}`}>{d.items[i][part]}</F>} />
    </Section>
  );
}

export const gallery: BlockDef<"gallery"> = {
  type: "gallery",
  name: "Gallery",
  description: "Photos with a quote that appears on hover.",
  category: "content",
  variants: [{ id: "quotes", label: "Photos with quotes", description: "Two columns, quote and author over the photo" }],
  fields: [{ key: "items", label: "Items: image (required), quote, author", kind: "items", required: true }],
  example: {
    items: [
      { imageUrl: "/uploads/features/tt-active-technology.jpg", quote: "A sample quote from an employee.", author: "A. Example" },
      { imageUrl: "/uploads/features/tt-distal-protection.jpg", quote: "Another sample quote.", author: "B. Example" },
    ],
  },
  Component: Gallery,
};
