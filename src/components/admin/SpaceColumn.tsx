"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

/**
 * A space's second column — the site tree, the Settings menu (docs/admin-ia.md → «Адаптив»). From lg (1024) it stands
 * left of the working area; below, it takes no room: a bar with «☰ <label>» over the working area opens it over the
 * page, and going to a page, Esc or a click beside it closes it. Wrap it and the AdminMain in SpaceColumns.
 */
export function SpaceColumn({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="sticky top-12 z-30 flex h-11 flex-none items-center border-b border-neutral-200 bg-white px-2 lg:hidden">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm font-medium hover:bg-neutral-100">
          <span aria-hidden>☰</span>
          {label}
        </button>
      </div>
      {open && <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-x-0 bottom-14 top-12 z-40 bg-neutral-900/30 sm:bottom-0 lg:hidden" />}
      {/* a link chosen in the column closes it: the page under it changes */}
      <div
        id={id}
        onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        className={`${open ? "fixed bottom-14 left-0 top-12 z-50 flex shadow-xl sm:bottom-0 sm:left-16" : "hidden"} lg:sticky lg:bottom-auto lg:left-auto lg:top-12 lg:z-auto lg:flex lg:h-[calc(100vh-3rem)] lg:shadow-none`}
      >
        {children}
      </div>
    </>
  );
}

/** The space's column and its working area: one above the other below lg (the column's bar on top), side by side from lg. */
export function SpaceColumns({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col lg:flex-row">{children}</div>;
}
