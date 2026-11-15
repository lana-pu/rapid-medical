"use client";

import { useState, type ReactNode } from "react";
import { safeHref } from "@/lib/safe-path";

export type FeedRow = { id: number; date: string; title: ReactNode; meta?: string | null; href: string; external?: boolean };

/** Material rows (DESIGN.md → «Строка материала»): date in its own column, title, kind and source; «Show more». */
export function NewsFeed({ items, pageSize = 10 }: { items: FeedRow[]; pageSize?: number }) {
  const [shown, setShown] = useState(pageSize);
  return (
    <div>
      <ul className="divide-y divide-border border-y border-border">
        {items.slice(0, shown).map((n) => (
          <li key={n.id} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
            <span className="text-sm text-muted">{n.date}</span>
            <div className="min-w-0">
              <a href={safeHref(n.href)} {...(n.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="font-medium hover:underline">{n.title}</a>
              {(n.meta || n.external) && <div className="mt-1 text-xs text-muted">{[n.meta, n.external ? "↗" : null].filter(Boolean).join(" ")}</div>}
            </div>
          </li>
        ))}
      </ul>
      {shown < items.length && (
        <button type="button" onClick={() => setShown((s) => s + pageSize)} className="mt-6 w-full rounded border border-border px-5 py-2.5 text-sm font-medium hover:border-foreground">
          Show more
        </button>
      )}
    </div>
  );
}
