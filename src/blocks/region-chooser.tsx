import Link from "next/link";
import { Section } from "@/components/site/primitives";
import type { BlockDef, BlockProps } from "./types";

export type RegionChooserVariant = "default";

export type RegionOption = { label: string; href: string; suggested?: boolean };

export type RegionChooserData = { options: RegionOption[] };

function RegionChooser({ data: d, nested }: BlockProps<"regionChooser">) {
  const inner = (
    <ul className="mt-10 grid gap-4 sm:grid-cols-3">
      {d.options.map((o) => (
        <li key={o.label}>
          <Link href={o.href} className={`block rounded border p-6 text-lg font-medium hover:bg-surface ${o.suggested ? "border-foreground" : "border-border"}`}>
            {o.label} →
            {o.suggested && <span className="mt-1 block text-xs font-normal text-muted">Suggested for your location</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const regionChooser: BlockDef<"regionChooser"> = {
  type: "regionChooser",
  name: "Region chooser",
  description: "Three regions to choose from; the region suggested for the visitor is highlighted.",
  category: "system",
  variants: [{ id: "default", label: "Default", description: "Three cards" }],
  fields: [{ key: "options", label: "Regions", kind: "items", note: "from the regional settings" }],
  example: {
    options: [
      { label: "Sample region", href: "/style-guide#regionChooser", suggested: true },
      { label: "Second region", href: "/style-guide#regionChooser" },
      { label: "Third region", href: "/style-guide#regionChooser" },
    ],
  },
  Component: RegionChooser,
  flow: () => true,
};
