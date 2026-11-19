import type { Stat } from "@/db/schema";
import { Section, SharedLine } from "@/components/site/primitives";
import { siteHref } from "@/lib/safe-path";
import { StatCircles, StatRow, StatBadge } from "@/components/site/blocks/Stats";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type KeyNumbersVariant = "circles" | "row" | "badge" | "figures" | "evidence";

export type KeyNumbersData = {
  items: Stat[];
  caption?: string | null;
  /** `evidence`: the title on the left and the link under it */
  title?: string | null;
  link?: { label: string; href: string } | null;
  /** `evidence`: the publications counted from the records (filled by the page's source) */
  count?: number | null;
};

function KeyNumbers({ variant, data: d, edit: e, nested }: BlockProps<"keyNumbers">) {
  // a number counted from the records replaces the typed one (it is not edited on the page)
  const items = d.items.map((x) => (x.from === "publications" && d.count ? { ...x, value: `${d.count}+` } : x)).filter((x) => x.value);
  if (!items.length) return null;
  const inner =
    variant === "evidence" ? (
      // DESIGN.md → Home → Блок доказательств: shared line, the title and a link on the left, the numbers with icons right
      <SharedLine
        title={<F e={e} k="title">{d.title || "Backed by clinical evidence"}</F>}
        aside={d.link?.href ? <a href={siteHref(d.link.href)} className="font-medium text-foreground underline underline-offset-4"><F e={e} k="link.label">{d.link.label}</F></a> : null}
        className="mt-16"
      >
        <StatRow items={items} render={(s, j, part) => (items[j].from === "publications" && d.count ? s[part] : <F e={e} k={`items.${j}.${part}`}>{s[part]}</F>)} />
      </SharedLine>
    ) : variant === "figures" ? (
      // DESIGN.md → Набор инфографики → Ключевые цифры: 2–4 pairs, each with its quote from the document
      <ul className="mt-10 grid gap-x-10 gap-y-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s, j) => (
          <li key={j}>
            <div className="text-4xl font-semibold tracking-tight md:text-5xl"><F e={e} k={`items.${j}.value`}>{s.value}</F></div>
            <div className="mt-2 font-medium"><F e={e} k={`items.${j}.label`}>{s.label}</F></div>
            {s.note && <p className="mt-2 text-xs text-muted">“<F e={e} k={`items.${j}.note`}>{s.note}</F>”</p>}
          </li>
        ))}
      </ul>
    ) : variant === "row" ? (
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
    { id: "figures", label: "Key figures", description: "2–4 large numbers with a label and the quote they come from (study and news pages)" },
    { id: "evidence", label: "Evidence", description: "Shared line: a title and a link on the left, numbers with icons on the right; the publications counted from the records (Home)" },
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
    figures: {
      items: [
        { value: "00%", label: "Sample outcome", note: "The sentence of the document this number comes from." },
        { value: "0", label: "Second outcome", note: "Its quote." },
      ],
    },
    evidence: {
      title: "Backed by clinical evidence",
      link: { label: "Explore the evidence →", href: "/style-guide#keyNumbers" },
      items: [
        { value: "10+", label: "Sample counter", iconUrl: "/icons/stat-patients.svg" },
        { value: "20+", label: "Sample counter", iconUrl: "/icons/stat-patents.svg" },
        { value: "30+", label: "Sample publications", iconUrl: "/icons/stat-publications.svg", from: "publications" },
      ],
    },
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
  // key figures sit under the page title in one section (study and news pages)
  flow: (v) => v === "figures",
};
