import type { InPracticeItem } from "@/db/schema";
import { Section } from "@/components/site/primitives";
import { PracticeList } from "@/components/site/blocks/Blocks";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type PeopleVariant = "physicians";

export type PeopleData = { items: InPracticeItem[] };

function People({ data: d, edit: e, nested }: BlockProps<"people">) {
  const inner = <PracticeList items={d.items} render={(p, i, part) => <F e={e} k={`items.${i}.${part}`}>{p[part]}</F>} />;
  return nested ? inner : <Section>{inner}</Section>;
}

export const people: BlockDef<"people"> = {
  type: "people",
  name: "People",
  description: "A list of people. Now: physicians with testimonials, cases and recordings.",
  category: "list",
  nestable: true,
  variants: [{ id: "physicians", label: "Physicians (In practice)", description: "Photo, name and city, topic, link" }],
  fields: [{ key: "items", label: "People: kind, topic (required), name, city, link, photo", kind: "items", required: true }],
  example: {
    items: [
      { kind: "testimonial", title: "Why I choose an adjustable retriever", person: "Dr. A. Example", location: "Berlin, Germany", linkUrl: "/style-guide#people" },
      { kind: "case", title: "Distal occlusion, first pass", person: "Dr. B. Example", location: "Madrid, Spain", linkUrl: "/style-guide#people" },
    ],
  },
  Component: People,
};
