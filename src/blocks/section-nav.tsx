import { SectionNav, type NavItem } from "@/components/site/SectionNav";
import type { BlockDef, BlockProps } from "./types";

export type SectionNavVariant = "default";

/** DESIGN.md → Страница терапии → Навигация по разделам: links to the page's sections, sticking to the top. */
export type SectionNavData = { items: NavItem[] };

function SectionNavBlock({ data: d }: BlockProps<"sectionNav">) {
  const items = (d.items ?? []).filter((it) => it.label && it.href);
  return items.length ? <SectionNav items={items} /> : null;
}

export const sectionNav: BlockDef<"sectionNav"> = {
  type: "sectionNav",
  name: "Section navigation",
  description: "The page's sections as links in a bar that sticks to the top; a link to a tab opens it.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Under the hero; scrolls sideways on phones; a section not on the page is not shown" }],
  fields: [{ key: "items", label: "Links: label, #section (required)", kind: "items", required: true }],
  example: { items: [{ label: "Overview", href: "#sectionNav" }, { label: "How it works", href: "#sectionNav" }, { label: "Evidence", href: "#sectionNav" }] },
  Component: SectionNavBlock,
};
