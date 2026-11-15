"use client";

import Link from "next/link";

/**
 * A list's search and filters in one line (docs/screens/admin-list.md): a filter applies as soon as it is chosen,
 * the search on Enter; «Clear filters» when anything is set. Admin chrome: its own neutral palette.
 */
export type ListFilter = { name: string; value: string; label: string; options: { value: string; label: string }[] };

export function ListFilters({ base, q, filters, keep, active }: { base: string; q: string; filters: ListFilter[]; keep: Record<string, string>; active: boolean }) {
  return (
    <form action={base} className="mb-4 flex flex-wrap items-center gap-2">
      <input name="q" defaultValue={q} placeholder="Search…" aria-label="Search" className="w-64 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-neutral-900 focus:outline-none" />
      {filters.map((f) => (
        <select
          key={f.name}
          name={f.name}
          defaultValue={f.value}
          aria-label={f.label}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={`rounded-full border px-3 py-1.5 text-sm ${f.value ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"}`}
        >
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {Object.entries(keep).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {active && <Link href={base} className="text-sm text-neutral-500 underline hover:text-neutral-900">Clear filters</Link>}
    </form>
  );
}
