"use client";

import { useState, type ReactNode } from "react";

export type TimelineItem = { id: number; year: number; date: string; title: ReactNode; url: string };

/** News list grouped by year with a "Show more" button, as on the current site. */
export function NewsTimeline({ items, pageSize = 8 }: { items: TimelineItem[]; pageSize?: number }) {
  const [shown, setShown] = useState(pageSize);
  const visible = items.slice(0, shown);
  return (
    <div>
      <ol className="relative border-l border-border pl-8 md:pl-12">
        {visible.map((n, i) => {
          const yearHeader = i === 0 || n.year !== visible[i - 1].year;
          return (
            <li key={n.id} className="relative pb-6">
              {yearHeader && (
                <span className="absolute -left-8 top-0 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-accent bg-background text-sm font-semibold md:-left-12 md:h-14 md:w-14" aria-label={`Year ${n.year}`}>{n.year}</span>
              )}
              <div className={`rounded border border-border p-4 ${yearHeader ? "mt-2" : ""}`}>
                <div className="text-xs font-semibold text-accent">{n.date}</div>
                <div className="mt-1 font-medium">{n.title}</div>
                <a href={n.url} target="_blank" rel="noopener" className="mt-2 inline-block text-sm text-accent underline">Read more »</a>
              </div>
            </li>
          );
        })}
      </ol>
      {shown < items.length && (
        <button type="button" onClick={() => setShown((s) => s + pageSize)} className="mt-4 rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">Show more</button>
      )}
    </div>
  );
}
