"use client";

import { useEffect, useState, type ReactNode } from "react";

export type Tab = { id: string; label: string; sublabel?: string; content: ReactNode; href?: string };

/**
 * Pill tabs as on the current site (rounded bar, active pill filled). On
 * small screens the same tabs become an accordion: every panel gets its own
 * header and only the active one is open.
 * A link to `#<tab id>` opens that tab (deep links from therapy pages to Evidence).
 */
export function Tabs({ tabs, hint, variant = "pills" }: { tabs: Tab[]; hint?: string; variant?: "pills" | "underline" }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const pill = variant === "pills";
  // Tab ids are plain slugs, so the hash is compared as is (no decoding: a malformed "%" must not throw).
  const openable = tabs.filter((t) => !t.href).map((t) => t.id).join("\n");
  useEffect(() => {
    const ids = openable.split("\n");
    const openFromHash = () => {
      const id = window.location.hash.slice(1);
      if (id && ids.includes(id)) setActive(id);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [openable]);
  return (
    <div>
      {hint && <p className="mb-4 text-center text-lg">{hint}</p>}
      {/* desktop / tablet: tab bar */}
      <div role="tablist" className={`hidden md:flex ${pill ? "rounded-full border border-accent p-1" : "flex-wrap gap-2 border-b border-border"}`}>
        {tabs.map((t) =>
          t.href ? (
            <a key={t.id} href={t.href} className={pill ? "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium hover:bg-surface" : "-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted hover:text-foreground"}>
              {t.label} ↗
            </a>
          ) : (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setActive(t.id)}
              className={
                pill
                  ? `flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition ${active === t.id ? "bg-accent text-accent-foreground" : "hover:bg-surface"}`
                  : `-mb-px border-b-2 px-4 py-2 text-sm font-medium ${active === t.id ? "border-foreground text-foreground" : "border-transparent text-muted hover:text-foreground"}`
              }
            >
              <span className="block">{t.label}</span>
              {t.sublabel && <span className={`block text-[11px] font-normal ${active === t.id ? "opacity-90" : "text-muted"}`}>{t.sublabel}</span>}
            </button>
          ),
        )}
      </div>
      {tabs.map((t) =>
        t.href ? (
          <a key={t.id} href={t.href} className="flex items-center justify-between border-b border-border py-3 font-medium md:hidden">{t.label} <span>↗</span></a>
        ) : (
          <div key={t.id}>
            {/* mobile: accordion header */}
            <button type="button" onClick={() => setActive(active === t.id ? "" : t.id)} aria-expanded={active === t.id} className="flex w-full items-center justify-between border-b border-border py-3 text-left font-medium md:hidden">
              <span>{t.label}{t.sublabel && <span className="block text-xs font-normal text-muted">{t.sublabel}</span>}</span>
              <span className="text-muted">{active === t.id ? "−" : "+"}</span>
            </button>
            <div id={`panel-${t.id}`} role="tabpanel" hidden={active !== t.id} className="py-6 md:pt-8">
              {t.content}
            </div>
          </div>
        ),
      )}
    </div>
  );
}
