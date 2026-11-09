import Link from "next/link";
import { Section } from "@/components/site/primitives";
import type { BlockDef, BlockProps } from "./types";

export type JobsVariant = "list";

export type JobRow = { title: string; href: string; department?: string | null; location?: string | null };

export type JobsData = { items: JobRow[]; /** Empty list: where to send a general application. */ generalHref: string };

function Jobs({ data: d, nested }: BlockProps<"jobs">) {
  const inner =
    d.items.length === 0 ? (
      <p className="mt-6 text-muted">
        There are no open positions right now. You can still <Link href={d.generalHref} className="underline">submit general interest</Link>.
      </p>
    ) : (
      <ul className="mt-10 divide-y divide-border">
        {d.items.map((j) => (
          <li key={j.href} className="py-4">
            <Link href={j.href} className="text-lg font-medium hover:underline">{j.title}</Link>
            <div className="text-sm text-muted">{[j.department, j.location].filter(Boolean).join(" · ")}</div>
          </li>
        ))}
      </ul>
    );
  return nested ? inner : <Section>{inner}</Section>;
}

export const jobs: BlockDef<"jobs"> = {
  type: "jobs",
  name: "Jobs",
  description: "Open positions from the records. Shows a link to a general application when the list is empty.",
  category: "list",
  variants: [{ id: "list", label: "List", description: "Title, department and city" }],
  fields: [{ key: "items", label: "Positions", kind: "items", note: "edited in the job records" }],
  example: {
    generalHref: "/style-guide#jobs",
    items: [
      { title: "Sample position", href: "/style-guide#jobs", department: "Sample department", location: "Sample city" },
      { title: "Another sample position", href: "/style-guide#jobs?2", department: "Sample department" },
    ],
  },
  Component: Jobs,
  flow: () => true,
};
