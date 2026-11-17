import Link from "next/link";
import { Section, H2 } from "@/components/site/primitives";
import { OpenRoles } from "@/components/site/OpenRoles";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type JobsVariant = "list" | "roles";

export type JobRow = { title: string; href: string; department?: string | null; location?: string | null; /** `roles`: where «Apply ↗» leads (the application link or an email). */ applyHref?: string | null };

export type JobsData = {
  items: JobRow[];
  /** Empty list: where to send a general application. */
  generalHref: string;
  /** `roles`: heading, anchor and the line under the list («Applications go through Spark Hire.»). */
  title?: string | null;
  anchor?: string;
  note?: string | null;
};

function Jobs({ variant, data: d, edit: e, nested }: BlockProps<"jobs">) {
  if (variant === "roles") {
    // «Shared line» (DESIGN.md → Careers): heading and the count on the left, filters and the roles on the right
    const n = d.items.length;
    return (
      <Section id={d.anchor} className="scroll-mt-16">
        <div className="grid gap-10 border-t border-border pt-8 md:grid-cols-12">
          <div className="md:col-span-4">
            {d.title && <H2><F e={e} k="title">{d.title}</F></H2>}
            <p className="mt-2 text-sm text-muted">{n === 1 ? "1 role" : `${n} roles`}</p>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            {n === 0 ? (
              // the section stays: the visitor sees there is nothing open and where to go instead
              <div>
                <p className="font-medium">No open positions right now.</p>
                <p className="mt-2 text-muted">We still read every application — send us your details below and we’ll be in touch when a role fits.</p>
                <a href={d.generalHref} className="mt-3 inline-block text-sm underline">Send us your details ↓</a>
              </div>
            ) : (
              <OpenRoles items={d.items} />
            )}
            {n > 0 && d.note && <p className="mt-4 text-xs text-muted"><F e={e} k="note">{d.note}</F></p>}
          </div>
        </div>
      </Section>
    );
  }
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

const sampleRoles: JobRow[] = [
  { title: "Sample position", href: "/style-guide#jobs", department: "Sample department", location: "Sample city", applyHref: "/style-guide#jobs" },
  { title: "Another sample position", href: "/style-guide#jobs?2", department: "Sample department", location: "Second city" },
  { title: "Third sample position", href: "/style-guide#jobs?3", department: "Other department", location: "Sample city" },
];

export const jobs: BlockDef<"jobs"> = {
  type: "jobs",
  name: "Jobs",
  description: "Open positions from the records. Shows a link to a general application when the list is empty.",
  category: "list",
  variants: [
    { id: "list", label: "List", description: "Title, department and city" },
    { id: "roles", label: "Open positions", description: "Heading and count on the left; filters by department and city, the first six roles and «Show all» on the right (Careers)" },
  ],
  fields: [
    { key: "title", label: "Title (open positions)", kind: "text" },
    { key: "note", label: "Line under the list (open positions)", kind: "text" },
    { key: "items", label: "Positions", kind: "items", note: "edited in the job records" },
  ],
  example: { generalHref: "/style-guide#jobs", items: sampleRoles.slice(0, 2) },
  examples: { roles: { title: "Sample open positions", note: "A line about where applications go.", generalHref: "/style-guide#jobs", items: sampleRoles } },
  Component: Jobs,
  flow: (v) => v !== "roles",
};
