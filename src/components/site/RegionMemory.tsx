"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const YEAR = 60 * 60 * 24 * 365;

/**
 * Remembers the region of a regional page the visitor actually opened (`rm_region`, as proxy.ts does on a page load).
 * Covers client-side navigation, which never reaches proxy.ts as a page load; a prefetched link is not opened, so it
 * changes nothing (UX walk 2026-11-14). When the region changes, the shared header is refreshed to match.
 */
export function RegionMemory() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const m = /^\/(us|ous|apac)(\/|$)/.exec(pathname);
    if (!m) return;
    const now = /(?:^|;\s*)rm_region=([^;]*)/.exec(document.cookie)?.[1];
    if (now === m[1]) return;
    document.cookie = `rm_region=${m[1]}; path=/; max-age=${YEAR}; samesite=lax`;
    router.refresh();
  }, [pathname, router]);
  return null;
}
