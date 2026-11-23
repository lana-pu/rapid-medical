"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The page screen's one filled button (docs/screens/admin-sections.md → «Иерархия»): Edit on page. One version — a link
 * into the editor; several regions — «Edit on page ▾» with the regions that have a version. Esc and a click outside
 * close the list.
 */
export function EditMenu({ items }: { items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const cls = "inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700";
  if (items.length <= 1) return items[0] ? <a href={items[0].href} className={cls}>Edit on page</a> : null;
  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cls}>
        Edit on page
        <span aria-hidden className="border-l border-white/30 pl-2 text-xs">▾</span>
      </button>
      {open && (
        <div role="menu" aria-label="Edit on page — region" className="absolute right-0 top-full z-40 mt-1 w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-xl">
          {items.map((i) => (
            <a key={i.href} role="menuitem" href={i.href} className="block px-3 py-2 hover:bg-neutral-50">{i.label}</a>
          ))}
        </div>
      )}
    </div>
  );
}
