"use client";

import { usePathname } from "next/navigation";
import { siteHref } from "@/lib/safe-path";

/**
 * The newest highlighted news above the header — Home only, switched on in Site settings → News bar
 * (DESIGN.md → Home, 2026-11-19). The whole line is a link to the item's page.
 */
export function NewsBar({ title, href }: { title: string; href: string }) {
  if (usePathname() !== "/") return null;
  return (
    <a href={siteHref(href)} className="block bg-foreground text-background hover:opacity-90">
      <span className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 text-sm">
        <b className="shrink-0">News</b>
        <span aria-hidden className="opacity-60">|</span>
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span aria-hidden className="shrink-0">→</span>
      </span>
    </a>
  );
}
