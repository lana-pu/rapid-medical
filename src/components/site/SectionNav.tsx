"use client";

import { useEffect, useState } from "react";

export type NavItem = { label: string; href: string };

/**
 * The therapy page's sections in a bar that sticks to the top (DESIGN.md → Страница терапии, 2026-11-19). A `#tab` link
 * opens that tab (Tabs listens to the hash); a tab that leads to another page is followed there; an item whose section
 * is not on this page is not shown.
 */
export function SectionNav({ items }: { items: NavItem[] }) {
  const [shown, setShown] = useState(items);
  useEffect(() => {
    // after the page is drawn: which sections it has (tabs, inner anchors, tabs that lead away)
    const raf = requestAnimationFrame(() => setShown(
      items.flatMap((it) => {
        if (!it.href.startsWith("#")) return [it];
        const id = it.href.slice(1);
        if (document.getElementById(id) || document.getElementById(`panel-${id}`)) return [it];
        const away = document.querySelector<HTMLAnchorElement>(`a[data-tab-link="${CSS.escape(id)}"]`);
        return away ? [{ ...it, href: away.getAttribute("href") ?? it.href }] : [];
      }),
    ));
    return () => cancelAnimationFrame(raf);
  }, [items]);
  if (!shown.length) return null;
  return (
    <nav aria-label="On this page" className="sticky top-0 z-30 border-b border-border bg-background">
      <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 py-3 text-sm font-medium">
        {shown.map((it) => (
          <li key={it.label} className="shrink-0">
            <a
              href={it.href}
              onClick={(e) => {
                // the same section twice: the hash does not change, so open it again by hand
                if (it.href.startsWith("#") && window.location.hash === it.href) {
                  e.preventDefault();
                  window.dispatchEvent(new HashChangeEvent("hashchange"));
                }
              }}
              className="text-muted hover:text-foreground"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
