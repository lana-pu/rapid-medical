import Link from "next/link";
import type { InPracticeItem } from "@/db/schema";
import { Section, H2, Img, Prose } from "@/components/site/primitives";
import { PracticeList } from "@/components/site/blocks/Blocks";
import { F, FM, type EditBinding } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type PeopleVariant = "physicians" | "team";

export type PersonCard = { name: string; title?: string | null; photoUrl?: string | null; href: string; /** `team`: anchor id and the bio shown on the spot (HTML, already sanitised). */ slug?: string; longTitle?: string | null; bioHtml?: string | null; /** The person is a separate record. */ edit?: EditBinding };

export type PeopleData = {
  /** `physicians`: elements of the block. */
  items?: InPracticeItem[];
  /** `team`: people from the team records. */
  members?: PersonCard[];
  title?: string | null;
  intro?: string | null;
  anchor?: string;
};

function People({ variant, data: d, edit: e, nested }: BlockProps<"people">) {
  if (variant === "team") {
    return (
      <Section id={d.anchor}>
        {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
        {d.intro && <p className="mt-4 max-w-3xl text-muted"><F e={e} k="intro">{d.intro}</F></p>}
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {(d.members ?? []).map((m, i) => (
            <li key={i} id={m.slug} className="scroll-mt-24">
              {/* Bio on the spot instead of a separate one-paragraph page (decision 2026-11-10, Emily's audit). */}
              <FM e={m.edit} k="photoUrl"><Img src={m.photoUrl} alt={m.name} className="aspect-square w-full rounded object-cover" /></FM>
              <div className="mt-3 font-semibold uppercase tracking-wide"><F e={m.edit} k="name">{m.name}</F></div>
              <div className="text-sm text-muted"><F e={m.edit} k="title">{m.title}</F></div>
              {m.bioHtml ? (
                <details className="group mt-2 text-sm">
                  <summary className="cursor-pointer list-none underline">Read bio</summary>
                  {m.longTitle && m.longTitle !== m.title && <div className="mt-2 text-xs uppercase text-muted">{m.longTitle}</div>}
                  <Prose html={m.bioHtml} className="mt-2" />
                </details>
              ) : m.href ? (
                <Link href={m.href} className="mt-2 inline-block text-sm underline">Profile →</Link>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  const inner = <PracticeList items={d.items ?? []} render={(p, i, part) => <F e={e} k={`items.${i}.${part}`}>{p[part]}</F>} />;
  return nested ? inner : <Section>{inner}</Section>;
}

export const people: BlockDef<"people"> = {
  type: "people",
  name: "People",
  description: "A list of people: the leadership team, or physicians with testimonials, cases and recordings.",
  category: "list",
  nestable: true,
  variants: [
    { id: "physicians", label: "Physicians (In practice)", description: "Photo, name and city, topic, link" },
    { id: "team", label: "Team grid", description: "Photo, name and position, links to the person's page" },
  ],
  fields: [
    { key: "title", label: "Title (team)", kind: "text" },
    { key: "intro", label: "Intro (team)", kind: "longText" },
    { key: "items", label: "Physicians: kind, topic (required), name, city, link, photo", kind: "items" },
    { key: "members", label: "Team: taken from the team records", kind: "items", note: "edited in the record" },
  ],
  example: {
    items: [
      { kind: "testimonial", title: "Why I choose an adjustable retriever", person: "Dr. A. Example", location: "Berlin, Germany", linkUrl: "/style-guide#people" },
      { kind: "case", title: "Distal occlusion, first pass", person: "Dr. B. Example", location: "Madrid, Spain", linkUrl: "/style-guide#people" },
    ],
  },
  examples: {
    team: {
      title: "Sample team",
      intro: "A short intro to the team.",
      members: [
        { name: "A. Example", title: "Chief Executive Officer", href: "/style-guide#people" },
        { name: "B. Example", title: "Chief Medical Officer", href: "/style-guide#people" },
        { name: "C. Example", title: "VP Clinical", href: "/style-guide#people" },
      ],
    },
  },
  Component: People,
};
