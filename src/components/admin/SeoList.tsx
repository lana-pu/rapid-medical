"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * The pages of Search & sharing (docs/screens/admin-seo.md): by section of the site, a dot for what needs fixing,
 * search and «Only problems». Admin chrome: its own neutral palette.
 */
export type SeoListItem = { key: string; name: string; section: string; problems: number; regions: number };

export function SeoList({ items, current }: { items: SeoListItem[]; current: string }) {
  const [q, setQ] = useState("");
  const [onlyProblems, setOnlyProblems] = useState(false);
  const needle = q.trim().toLowerCase();
  const shown = items.filter((p) => (!onlyProblems || p.problems) && (!needle || p.name.toLowerCase().includes(needle)));
  const nProblems = items.filter((p) => p.problems).length;
  const sections = [...new Set(shown.map((p) => p.section))];

  return (
    <nav aria-label="Pages" className="flex flex-col">
      <div className="space-y-2 border-b border-neutral-200 p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a page" aria-label="Find a page" className="w-full rounded border border-neutral-300 px-2.5 py-1.5 text-sm" />
        <button type="button" aria-pressed={onlyProblems} onClick={() => setOnlyProblems((o) => !o)} className={`w-full rounded-full border px-3 py-1 text-left text-xs ${onlyProblems ? "border-amber-400 bg-amber-50 text-amber-900" : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"}`}>
          <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />
          Only problems ({nProblems})
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {sections.map((s) => (
          <div key={s} className="mb-2">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{s}</div>
            <ul>
              {shown.filter((p) => p.section === s).map((p) => (
                <li key={p.key}>
                  <Link href={`/admin/seo?page=${encodeURIComponent(p.key)}`} aria-current={p.key === current ? "page" : undefined} className={`flex items-center gap-2 px-3 py-1.5 text-sm ${p.key === current ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-700 hover:bg-neutral-50"}`}>
                    <span aria-label={p.problems ? "needs fixing" : "fine"} className={`h-2 w-2 shrink-0 rounded-full ${p.problems ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.regions > 1 && <span className="shrink-0 text-[11px] text-neutral-400">{p.regions} regions</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!shown.length && <p className="px-3 py-6 text-center text-sm text-neutral-500">{onlyProblems ? "No problems — every page is fine." : "Nothing matches."}</p>}
      </div>
    </nav>
  );
}
