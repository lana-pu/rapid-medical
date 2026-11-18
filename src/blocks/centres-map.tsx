import { Section, SharedLine } from "@/components/site/primitives";
import { CentresWorld } from "@/components/site/CentresWorld";
import { mapCountry } from "@/lib/map-countries";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type CentresMapVariant = "default";

/** DESIGN.md → Набор инфографики → Карта центров: the countries on a world map, the centres listed by country. */
export type CentresMapData = {
  title?: string | null;
  caption?: string | null;
  centres: { name: string; city?: string | null; country: string }[];
};

function CentresMap({ data: d, edit: e, nested }: BlockProps<"centresMap">) {
  const centres = (d.centres ?? []).map((c, i) => ({ ...c, i })).filter((c) => c.name && c.country);
  if (!centres.length) return null;
  // by country (as the map names it), the biggest first
  const byCountry = new Map<string, typeof centres>();
  for (const c of centres) byCountry.set(mapCountry(c.country), [...(byCountry.get(mapCountry(c.country)) ?? []), c]);
  const groups = [...byCountry.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const n = centres.length, m = groups.length;
  const inner = (
    <SharedLine
      title={<F e={e} k="title">{d.title || "Centres"}</F>}
      aside={<span className="text-base font-semibold text-foreground">{n} centre{n > 1 ? "s" : ""} in {m} countr{m > 1 ? "ies" : "y"}</span>}
      className="mt-16"
    >
      <CentresWorld countries={groups.map(([c]) => c)} />
      <ul className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        {groups.map(([country, list]) => (
          <li key={country}>
            <div className="font-medium">{list[0].country} <span className="text-muted">({list.length})</span></div>
            <div className="text-muted">
              {list.map((c, k) => (
                <span key={c.i}>{k > 0 && ", "}<F e={e} k={`centres.${c.i}.name`}>{c.name}</F>{c.city ? ` (${c.city})` : ""}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {d.caption && <p className="mt-5 text-xs text-muted"><F e={e} k="caption">{d.caption}</F></p>}
    </SharedLine>
  );
  return nested ? inner : <Section>{inner}</Section>;
}

export const centresMap: BlockDef<"centresMap"> = {
  type: "centresMap",
  name: "Study centres",
  description: "The study's countries on a world map and its centres listed by country — names from the approved document.",
  category: "content",
  variants: [{ id: "default", label: "Default", description: "Shared line: the title and «N centres in M countries» on the left, the map and the list on the right" }],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "centres", label: "Centres: name, city, country (required)", kind: "items", required: true },
    { key: "caption", label: "Note", kind: "text" },
  ],
  example: {
    title: "Where the study ran",
    centres: [
      { name: "Sample University Hospital", city: "Sample City", country: "USA" },
      { name: "Second Sample Centre", city: "Sample Town", country: "USA" },
      { name: "Example Clinic", city: "Example City", country: "Germany" },
    ],
  },
  Component: CentresMap,
};
