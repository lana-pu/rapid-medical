"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * «Back» goes where the person came from in this tab, like the browser's button; with nothing to go back to (a link
 * from an email, a bookmark) — to the page above (docs/screens/admin-sections.md → «Кнопки «назад»»).
 */

let moves = 0; // moves inside the admin since this document loaded (client navigations push history entries)
let last: string | null = null;

/** Mounted once in the admin layouts: counts in-app moves, so Back knows there is a page of ours behind. */
export function NavTracker() {
  const path = usePathname();
  useEffect(() => {
    if (last !== null && last !== path) moves++;
    last = path;
  }, [path]);
  return null;
}

/** Is the page behind this one ours? A move inside the admin, or a full load that came from the site or the admin. */
export function canGoBack(): boolean {
  if (moves > 0) return true;
  try {
    if (!document.referrer || window.history.length < 2) return false;
    const r = new URL(document.referrer);
    return r.origin === location.origin && !/^\/(admin\/login|admin\/reset|api)(\/|$)/.test(r.pathname) && r.href !== location.href;
  } catch {
    return false;
  }
}

export function BackLink({ fallback, children, className, label }: { fallback: string; children: ReactNode; className?: string; label?: string }) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      aria-label={label}
      title={label}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // a new tab gets the page above
        if (!canGoBack()) return;
        e.preventDefault();
        router.back();
      }}
    >
      {children}
    </Link>
  );
}

/** The «← Back» button of a screen, styled as the admin's secondary button. */
export function BackButton({ fallback, children = "← Back", small = false }: { fallback: string; children?: ReactNode; small?: boolean }) {
  return (
    <BackLink fallback={fallback} className={small ? "inline-flex items-center rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100" : "inline-flex items-center gap-2 rounded border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"}>
      {children}
    </BackLink>
  );
}
