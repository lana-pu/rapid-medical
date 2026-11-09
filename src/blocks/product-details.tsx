import { Section, Eyebrow } from "@/components/site/primitives";
import { Tabs } from "@/components/site/Tabs";
import type { Block, BlockDef, BlockProps } from "./types";

export type ProductDetailsVariant = "pills" | "underline";

/** Blocks under a small heading inside a tab ("Specifications"). */
export type BlockGroup = { group: string; blocks: Block[] };

export type DetailsTab = {
  id: string;
  label: string;
  /** Small heading at the top of the tab. */
  title?: string;
  /** Link tab: goes to another page instead of opening. */
  href?: string;
  blocks: (Block | BlockGroup)[];
};

export type ProductDetailsData = { anchor?: string; hint?: string; tabs: DetailsTab[] };

const isGroup = (p: Block | BlockGroup): p is BlockGroup => "group" in p;

function ProductDetails({ variant, data: d, render }: BlockProps<"productDetails">) {
  return (
    <Section id={d.anchor}>
      <Tabs
        hint={d.hint}
        variant={variant}
        tabs={d.tabs.map((t) =>
          t.href
            ? { id: t.id, label: t.label, content: null, href: t.href }
            : {
                id: t.id,
                label: t.label,
                content: (
                  <div>
                    {t.title && <Eyebrow>{t.title}</Eyebrow>}
                    {t.blocks.map((p, i) =>
                      isGroup(p) ? (
                        <div key={i} className="mt-12">
                          <Eyebrow>{p.group}</Eyebrow>
                          {p.blocks.map((b, j) => render(b, true, j))}
                        </div>
                      ) : (
                        render(p, true, i)
                      ),
                    )}
                  </div>
                ),
              },
        )}
      />
    </Section>
  );
}

export const productDetails: BlockDef<"productDetails"> = {
  type: "productDetails",
  name: "Product details",
  description: "Product tabs, each with its own blocks inside. An accordion on phones.",
  category: "content",
  variants: [
    { id: "pills", label: "Pills", description: "Tabs in a rounded bar" },
    { id: "underline", label: "Underline", description: "A line under the active tab" },
  ],
  fields: [
    { key: "hint", label: "Hint above the tabs", kind: "text" },
    { key: "tabs", label: "Tabs: label, title, blocks inside or a link", kind: "items", required: true },
  ],
  example: {
    hint: "Click on a tab below to learn more.",
    tabs: [
      {
        id: "overview",
        label: "Product overview",
        title: "Product overview",
        blocks: [
          { type: "text", variant: "default", data: { body: "Inside a tab any nestable block can be used: text, columns, diagram, spec table, buttons." } },
          { type: "columns", variant: "features", data: { items: [
            { title: "Active technology", body: "Adjustable radial force.", iconUrl: "/uploads/features/tt-active-technology.jpg" },
            { title: "Visibility", body: "Fully visible under fluoroscopy.", iconUrl: "/uploads/features/tt-visibility.jpg" },
          ] } },
          { group: "Specifications", blocks: [
            { type: "specTable", variant: "table", data: { table: { columns: ["Model", "Diameter"], rows: [["Sample model A", "1.0–2.0 mm"]] } } },
          ] },
          { type: "cta", variant: "buttons", data: { buttons: [{ label: "Order", href: "/style-guide#productDetails" }, { label: "IFU", href: "/style-guide#productDetails" }] } },
        ],
      },
      {
        id: "how",
        label: "How it works",
        title: "How it works",
        blocks: [{ type: "columns", variant: "steps", data: { items: [{ title: "Advance" }, { title: "Expand" }, { title: "Retrieve" }] } }],
      },
      { id: "evidence", label: "Clinical evidence", href: "/style-guide#productDetails", blocks: [] },
    ],
  },
  Component: ProductDetails,
};
