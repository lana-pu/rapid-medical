import Link from "next/link";
import { Section, H2 } from "@/components/site/primitives";
import { F, type EditBinding } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type EventsVariant = "upcoming" | "archive";

export type EventCard = { id: number; title: string; href: string; dates: string; year: number; place?: string | null; congress?: string | null; registrationOpen?: boolean; edit?: EditBinding };

export type EventsData = { title?: string | null; anchor?: string; items: EventCard[] };

/** Events from the records (docs/screens/events.md). Which list an event is in comes from its dates. */
function Events({ variant, data: d, edit: e }: BlockProps<"events">) {
  if (d.items.length === 0) return null;
  if (variant === "archive") {
    const years = [...new Set(d.items.map((i) => i.year))];
    return (
      <Section id={d.anchor}>
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        {years.map((y) => (
          <div key={y} className="mt-8">
            <div className="text-sm font-semibold text-muted">{y}</div>
            <ul className="mt-2 divide-y divide-border">
              {d.items.filter((i) => i.year === y).map((i) => (
                <li key={i.id} className="flex flex-wrap items-baseline gap-x-4 py-3">
                  <span className="w-44 shrink-0 text-sm text-muted">{i.dates}</span>
                  <Link href={i.href} className="font-medium hover:underline"><F e={i.edit} k="title">{i.title}</F></Link>
                  {i.place && <span className="text-sm text-muted">{i.place}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Section>
    );
  }
  return (
    <Section id={d.anchor}>
      {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
      <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {d.items.map((i) => (
          <li key={i.id}>
            <Link href={i.href} className="group flex h-full flex-col rounded border border-border p-6 hover:bg-surface">
              <div className="text-sm font-medium">{i.dates}</div>
              {(i.place || i.congress) && <div className="mt-1 text-sm text-muted">{[i.congress, i.place].filter(Boolean).join(" · ")}</div>}
              <h3 className="mt-3 flex-1 text-lg font-medium group-hover:underline"><F e={i.edit} k="title">{i.title}</F></h3>
              <span className="mt-4 text-sm font-medium underline">{i.registrationOpen ? "Details and registration →" : "Details →"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const sample: EventCard[] = [
  { id: 1, title: "Sample workshop", href: "/style-guide#events", dates: "15–16 September 2026", year: 2026, place: "Sample city", congress: "Sample congress", registrationOpen: true },
  { id: 2, title: "Sample dinner", href: "/style-guide#events", dates: "3 June 2025", year: 2025, place: "Sample city" },
];

export const events: BlockDef<"events"> = {
  type: "events",
  name: "Events",
  description: "Events from the records: upcoming ones as cards, past ones as a list by year. Moves between the two by date.",
  category: "list",
  variants: [
    { id: "upcoming", label: "Upcoming", description: "Cards: dates, congress and city, title, link to details and registration" },
    { id: "archive", label: "Archive", description: "Past events by year, newest first" },
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "items", label: "Events", kind: "items", note: "edited in the event records" },
  ],
  example: { title: "Upcoming events", items: sample },
  examples: { archive: { title: "Past events", items: sample } },
  Component: Events,
  flow: () => true,
};
