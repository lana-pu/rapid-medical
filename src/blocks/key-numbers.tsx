import type { Stat } from "@/db/schema";
import { Section } from "@/components/site/primitives";
import { StatCircles, StatRow, StatBadge } from "@/components/site/blocks/Stats";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type KeyNumbersVariant = "circles" | "row" | "badge";

export type KeyNumbersData = { items: Stat[]; caption?: string | null };

function KeyNumbers({ variant, data: d, edit: e, nested }: BlockProps<"keyNumbers">) {
  const items = d.items.filter((x) => x.value);
  if (!items.length) return null;
  const inner =
    variant === "row" ? (
      <StatRow items={items} render={(s, j, part) => <F e={e} k={`items.${j}.${part}`}>{s[part]}</F>} />
    ) : variant === "badge" ? (
      <StatBadge stat={items[0]} render={(part) => <F e={e} k={`items.0.${part}`}>{items[0][part]}</F>} />
    ) : (
      <StatCircles
        items={items}
        caption={d.caption ? <F e={e} k="caption">{d.caption}</F> : undefined}
        render={(s, j, part) => <F e={e} k={`items.${j}.${part}`}>{s[part]}</F>}
      />
    );
  return nested ? inner : <Section>{inner}</Section>;
}

export const keyNumbers: BlockDef<"keyNumbers"> = {
  type: "keyNumbers",
  name: "Key numbers",
  description: "Big numbers with labels: results, counters, a badge.",
  category: "content",
  nestable: true,
  variants: [
    { id: "circles", label: "Circles", description: "Number and label in a circle, caption below" },
    { id: "row", label: "Row with icons", description: "Icon, number and label in a row" },
    { id: "badge", label: "Badge", description: "One number in a frame" },
  ],
  fields: [
    { key: "items", label: "Numbers: value (required), label, note, icon", kind: "items", required: true },
    { key: "caption", label: "Caption (circles)", kind: "text" },
  ],
  example: {
    items: [
      { value: "40%", label: "Sample", note: "note" },
      { value: "0%", label: "Sample" },
      { value: "90%", label: "Sample" },
    ],
    caption: "Sample numbers, not study results",
  },
  examples: {
    row: {
      items: [
        { value: "10+", label: "Sample counter", iconUrl: "/icons/stat-patents.svg" },
        { value: "20+", label: "Sample counter", iconUrl: "/icons/stat-patients.svg" },
        { value: "30+", label: "Sample counter", iconUrl: "/icons/stat-publications.svg" },
      ],
    },
    badge: { items: [{ value: "30+", label: "Sample badge", iconUrl: "/icons/stat-publications.svg" }] },
  },
  Component: KeyNumbers,
};
