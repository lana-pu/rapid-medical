"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/admin/session-actions";

/** The person's menu in a header: who, role, My account & security, Sign out. Admin chrome: its own neutral palette. */
export function AccountMenu({ user }: { user: { name: string; email: string; role: string } }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  const label = `${user.name} — account`;
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} title={label} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-neutral-100">
        <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
      </button>
      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded border border-neutral-200 bg-white text-sm text-neutral-900 shadow-xl">
          <div className="border-b border-neutral-200 px-3 py-2">
            <div className="truncate font-medium">{user.name}</div>
            <div className="truncate text-xs text-neutral-500">{user.email} · {user.role}</div>
          </div>
          <Link role="menuitem" href="/admin/account" onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-neutral-100">My account &amp; security</Link>
          <form action={logoutAction}>
            <button role="menuitem" className="block w-full px-3 py-2 text-left hover:bg-neutral-100">Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}
