import { Section } from "@/components/site/primitives";
import { RegionPicker, type RegionOption } from "@/components/site/RegionPicker";
import type { BlockDef, BlockProps } from "./types";

export type RegionChooserVariant = "default";

export type { RegionOption };

export type RegionChooserData = { options: RegionOption[]; /** the region and where it came from, when the visitor came to change it */ current?: { label: string; source: "location" | "chosen" | null } | null };

/** The page /choose-your-location: the same picker as the window (DESIGN.md → Выбор региона), for links without JavaScript. */
function RegionChooser({ data: d, nested }: BlockProps<"regionChooser">) {
  const inner = <div className="mt-8"><RegionPicker options={d.options} current={d.current} intro={false} /></div>;
  return nested ? inner : <Section>{inner}</Section>;
}

export const regionChooser: BlockDef<"regionChooser"> = {
  type: "regionChooser",
  name: "Region chooser",
  description: "Three regions with their countries and a country search; the region suggested for the visitor is highlighted.",
  category: "system",
  variants: [{ id: "default", label: "Default", description: "Country search and three region cards" }],
  fields: [{ key: "options", label: "Regions", kind: "items", note: "from the regional settings" }],
  example: {
    options: [
      { region: "us", label: "Americas", href: "/style-guide#regionChooser", suggested: true },
      { region: "apac", label: "Asia & Pacific", href: "/style-guide#regionChooser" },
      { region: "ous", label: "Europe & Middle East", href: "/style-guide#regionChooser" },
    ],
  },
  Component: RegionChooser,
  flow: () => true,
};
