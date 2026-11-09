import { Section, Prose } from "@/components/site/primitives";
import { safeHtml } from "@/lib/html";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type RichTextVariant = "default";

export type RichTextData = { html: string };

function RichText({ data: d, edit: e, nested }: BlockProps<"richText">) {
  const inner = <F e={e} k="html" kind="rich" className="mt-8 max-w-3xl"><Prose html={safeHtml(d.html)} /></F>;
  return nested ? inner : <Section>{inner}</Section>;
}

export const richText: BlockDef<"richText"> = {
  type: "richText",
  name: "Rich text",
  description: "Long formatted text: legal pages, articles, biographies.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Headings, paragraphs, lists, links, images" }],
  fields: [{ key: "html", label: "Text", kind: "rich", required: true }],
  example: {
    html: "<h2>Sample heading</h2><p>A paragraph of sample text with a <a href=\"/style-guide#richText\">link</a>.</p><h3>Sample subheading</h3><ul><li>First item</li><li>Second item</li></ul>",
  },
  Component: RichText,
  flow: () => true,
};
