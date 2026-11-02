"use client";

import { useState, type ReactNode } from "react";

export type Tab = { id: string; label: string; content: ReactNode; href?: string };

/** Simple accessible tabs. On small screens tabs stack as an accordion. */
export function Tabs({ tabs, hint }: { tabs: Tab[]; hint?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      {hint && <p className="mb-3 text-sm text-muted">{hint}</p>}
      <div role="tablist" className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) =>
          t.href ? (
            <a key={t.id} href={t.href} className="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted hover:text-foreground">
              {t.label} ↗
            </a>
          ) : (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${active === t.id ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ),
        )}
      </div>
      {tabs.filter((t) => !t.href).map((t) => (
        <div key={t.id} id={`panel-${t.id}`} role="tabpanel" hidden={active !== t.id} className="pt-8">
          {t.content}
        </div>
      ))}
    </div>
  );
}
