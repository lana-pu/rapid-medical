"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * The second column of the Inbox and Settings spaces (docs/admin-ia.md): a short list of what is in the space.
 * Admin chrome: its own neutral palette.
 */
export type NavItem = { href: string; label: string; count?: number; heading?: string };

export function SpaceNav({ title, items }: { title: string; items: NavItem[] }) {
  const path = usePathname();
  const sp = useSearchParams();
  const here = `${path}${sp.toString() ? `?${sp.toString()}` : ""}`;
  // the most specific item that matches: exact address with its query first, then the path
  const active = items.find((i) => i.href === here) ?? items.find((i) => !i.href.includes("?") && (path === i.href || (i.href !== "/admin" && path.startsWith(`${i.href}/`))));
  return (
    <nav aria-label={title} className="sticky top-0 flex h-screen w-60 flex-none flex-col border-r border-neutral-200 bg-white">
      <div className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{title}</div>
      <ul className="flex-1 overflow-y-auto px-2 pb-4 text-sm">
        {items.map((i) => [
          i.heading && <li key={`h-${i.heading}`} className="px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{i.heading}</li>,
          <li key={i.href}>
            <Link href={i.href} aria-current={active === i ? "page" : undefined} className={`flex items-center gap-2 rounded px-2 py-1.5 ${active === i ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-700 hover:bg-neutral-50"}`}>
              <span className="min-w-0 flex-1 truncate">{i.label}</span>
              {!!i.count && <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-[11px] font-medium text-amber-900">{i.count}</span>}
            </Link>
          </li>,
        ])}
      </ul>
    </nav>
  );
}
