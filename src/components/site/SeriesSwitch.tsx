"use client";
import { Children, useState, type ReactNode } from "react";

/** Chips over a chart: one series visible at a time (DESIGN.md → Распределение по времени). One series — no chips. */
export function SeriesSwitch({ labels, children }: { labels: string[]; children: ReactNode }) {
  const [on, setOn] = useState(0);
  const items = Children.toArray(children);
  if (items.length < 2) return <>{items}</>;
  return (
    <div>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        {labels.map((l, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === on} onClick={() => setOn(i)} className={`rounded-full border px-3 py-1 text-xs font-medium ${i === on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>
            {l}
          </button>
        ))}
      </div>
      {items.map((c, i) => <div key={i} role="tabpanel" hidden={i !== on}>{c}</div>)}
    </div>
  );
}
