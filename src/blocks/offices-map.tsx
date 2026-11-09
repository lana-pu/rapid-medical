import type { ActionLink } from "@/db/schema";
import { Section, H2, Btn } from "@/components/site/primitives";
import { WorldMap, type MapRegionKey } from "@/components/site/WorldMap";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type OfficesMapVariant = "offices" | "map";

export type Office = { name: string; label?: string; address?: string; phone?: string; fax?: string; ordersEmail?: string; lat?: number; lon?: number };

export type OfficesMapData = {
  title?: string | null;
  subtitle?: string | null;
  anchor?: string;
  offices: Office[];
  /** `map`: region → contact page. */
  regionLinks?: Record<MapRegionKey, string>;
  fallbackImageUrl?: string | null;
  /** `map`: line with a button under the map. */
  closingLine?: string | null;
  button?: ActionLink | null;
};

function OfficesMap({ variant, data: d, edit: e }: BlockProps<"officesMap">) {
  if (variant === "offices") {
    return (
      <Section className="bg-surface" id={d.anchor}>
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        <ul className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {d.offices.map((o, i) => (
            <li key={i} className="text-sm">
              <div className="font-semibold"><F e={e} k={`offices.${i}.name`}>{o.name}</F></div>
              {o.label && <div className="text-muted"><F e={e} k={`offices.${i}.label`}>{o.label}</F></div>}
              {o.address && <p className="mt-2 whitespace-pre-line"><F e={e} k={`offices.${i}.address`}>{o.address}</F></p>}
              {o.phone && <div className="mt-2">Tel: <a href={`tel:${o.phone}`}><F e={e} k={`offices.${i}.phone`}>{o.phone}</F></a></div>}
              {o.fax && <div>Fax: <F e={e} k={`offices.${i}.fax`}>{o.fax}</F></div>}
              {o.ordersEmail && <div className="mt-2">Orders: <a className="underline" href={`mailto:${o.ordersEmail}`}>{o.ordersEmail}</a></div>}
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  const links = d.regionLinks ?? { usa: "/contact-us", canada: "/contact-us", latam: "/contact-us", europe: "/contact-us", australia: "/contact-us", middleeast: "/contact-us", asia: "/contact-us" };
  return (
    <Section id={d.anchor}>
      <div className="max-w-3xl">
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        {d.subtitle && <p className="mt-3 text-muted"><F e={e} k="subtitle">{d.subtitle}</F></p>}
      </div>
      <div className="mt-8">
        <WorldMap offices={d.offices.filter((o) => o.lat != null && o.lon != null).map((o) => ({ lat: o.lat!, lon: o.lon!, label: o.name }))} links={links} fallbackImageUrl={d.fallbackImageUrl} />
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <p className="text-lg"><F e={e} k="closingLine">{d.closingLine}</F></p>
        {d.button?.href && <Btn href={d.button.href}>{d.button.label}</Btn>}
      </div>
    </Section>
  );
}

const sampleOffices: Office[] = [
  { name: "Sample office", label: "Headquarters", address: "1 Example Street\nSample City", phone: "+00 000 000 000", lat: 40.7, lon: -74 },
  { name: "Second office", label: "Europe", address: "2 Example Road\nSample Town", lat: 48.1, lon: 11.6 },
];

export const officesMap: BlockDef<"officesMap"> = {
  type: "officesMap",
  name: "Offices and map",
  description: "Company offices from the contact settings: a list, or a world map with a contact line.",
  category: "system",
  variants: [
    { id: "offices", label: "Office list", description: "Grey band, address and phones of each office" },
    { id: "map", label: "World map", description: "Click on a region opens its contact page" },
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "subtitle", label: "Subtitle (map)", kind: "longText" },
    { key: "closingLine", label: "Line with a button (map)", kind: "text" },
    { key: "offices", label: "Offices", kind: "items", note: "edited in the contact settings" },
  ],
  example: { title: "Sample offices", offices: sampleOffices },
  examples: {
    map: { title: "Sample map", subtitle: "A short line about where the company works.", offices: sampleOffices, closingLine: "Have a question?", button: { label: "Contact us", href: "/style-guide#officesMap" } },
  },
  Component: OfficesMap,
};
