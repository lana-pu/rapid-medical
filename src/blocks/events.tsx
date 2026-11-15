import Link from "next/link";
import { Section, H2, SharedLine } from "@/components/site/primitives";
import { F, type EditBinding } from "./edit";
import { safeHref } from "@/lib/safe-path";
import type { BlockDef, BlockProps } from "./types";

export type EventsVariant = "upcoming" | "archive" | "next" | "past";

export type EventCard = { id: number; title: string; href: string; dates: string; year: number; place?: string | null; congress?: string | null; registrationOpen?: boolean; /** `next`: start time as typed («12:45 PM»), city and venue apart */ time?: string | null; city?: string | null; venue?: string | null; edit?: EditBinding };

export type EventsData = { title?: string | null; anchor?: string; items: EventCard[]; /** `next` with nothing coming: where the archive is */ emptyHref?: string };

/** Events from the records (docs/screens/events.md). Which list an event is in comes from its dates. */
function Events({ variant, data: d, edit: e, nested }: BlockProps<"events">) {
  if (variant === "next") {
    // DESIGN.md → News & Events: the nearest one as a card, the rest as rows; nothing coming — a line, not a gap
    const [first, ...rest] = d.items;
    const inner = (
      <SharedLine id={d.anchor} title={<F e={e} k="title">{d.title ?? "Upcoming events"}</F>} className="mt-16">
        {!first ? (
          <div>
            <p>No upcoming events right now.</p>
            {d.emptyHref && <a href={safeHref(d.emptyHref)} className="mt-2 inline-block text-sm underline">See past events ↓</a>}
          </div>
        ) : (
          <>
            <article className="rounded border border-border p-6">
              <div className="text-xs uppercase tracking-wide text-muted">{[first.dates, first.time, first.city].filter(Boolean).join(" · ")}</div>
              <h3 className="mt-2 text-xl font-semibold"><Link href={first.href} className="hover:underline"><F e={first.edit} k="title">{first.title}</F></Link></h3>
              {(first.congress || first.venue) && <p className="mt-1 text-sm text-muted">{[first.congress, first.venue].filter(Boolean).join(" · ")}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {first.registrationOpen && <Link href={first.href} className="rounded bg-accent px-4 py-2 font-medium text-accent-foreground">Register</Link>}
                <Link href={first.href} className="underline">Details →</Link>
              </div>
            </article>
            {rest.length > 0 && (
              <ul className="mt-6 divide-y divide-border border-y border-border">
                {rest.map((i) => (
                  <li key={i.id} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                    <span className="text-sm text-muted">{i.dates}</span>
                    <div className="min-w-0">
                      <Link href={i.href} className="font-medium hover:underline"><F e={i.edit} k="title">{i.title}</F></Link>
                      {(i.place || i.congress) && <div className="mt-1 text-xs text-muted">{[i.place, i.congress].filter(Boolean).join(" · ")}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </SharedLine>
    );
    return nested ? inner : <Section>{inner}</Section>;
  }
  if (d.items.length === 0) return null;
  if (variant === "past") {
    // the archive in the same rows as the news, by year (#past-events — «← Past events» on an event comes back here)
    const years = [...new Set(d.items.map((i) => i.year))];
    const inner = (
      <SharedLine id={d.anchor} title={<F e={e} k="title">{d.title ?? "Past events"}</F>} className="mt-16">
        {years.map((y) => (
          <div key={y} className="mt-8 first:mt-0">
            <div className="text-sm font-semibold">{y}</div>
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {d.items.filter((i) => i.year === y).map((i) => (
                <li key={i.id} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                  <span className="text-sm text-muted">{i.dates}</span>
                  <div className="min-w-0">
                    <Link href={i.href} className="font-medium hover:underline"><F e={i.edit} k="title">{i.title}</F></Link>
                    {(i.place || i.congress) && <div className="mt-1 text-xs text-muted">{[i.place, i.congress].filter(Boolean).join(" · ")}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </SharedLine>
    );
    return nested ? inner : <Section>{inner}</Section>;
  }
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
    { id: "next", label: "Upcoming, shared line", description: "The nearest as a card with Register, the rest as rows; nothing coming — a line and a link to the archive (News & Events)" },
    { id: "past", label: "Past, shared line", description: "Past events as rows by year, like the news rows (News & Events)" },
  ],
  fields: [
    { key: "title", label: "Title", kind: "text" },
    { key: "items", label: "Events", kind: "items", note: "edited in the event records" },
  ],
  example: { title: "Upcoming events", items: sample },
  examples: { archive: { title: "Past events", items: sample }, next: { title: "Upcoming events", items: sample }, past: { title: "Past events", items: sample } },
  Component: Events,
  flow: () => true,
};
