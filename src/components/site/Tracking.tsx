"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureFirstTouch, eventForLink, rememberPage, track } from "@/lib/tracking";

/**
 * Remembers where the visit came from (for form submissions) and reports link clicks that matter:
 * email links, and moves to a therapy page from the menu or the overview. PDF downloads are left to GA4's
 * enhanced measurement (file_download), so they are not counted twice.
 */
export function Tracking() {
  const pathname = usePathname();

  useEffect(() => {
    captureFirstTouch();
    rememberPage(pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a) return;
      const ev = eventForLink(a.getAttribute("href") ?? "", { inHeader: !!a.closest("header"), pathname: location.pathname });
      if (ev) track(ev.name, ev.params);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
