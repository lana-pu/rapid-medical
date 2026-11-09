"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * "You seem to be in …: go to the regional site?" — suggested from the IP
 * country (cookie set in proxy.ts). Never redirects automatically (Fix List
 * C.4 / routing plan): Google crawls mostly from the US and travelling
 * physicians must still reach every site. Dismissal is remembered for 30 days.
 */
export function RegionBanner({ suggested, label, href }: { suggested: string; label: string; href: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const dismiss = () => {
    document.cookie = `rm_geo_dismissed=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    setHidden(true);
  };
  return (
    <div className="border-b border-border bg-surface text-sm" role="region" aria-label="Regional site suggestion">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
        <span>
          It looks like you are in <b>{label}</b>. This site is intended for healthcare professionals in your region.
        </span>
        <Link href={href} onClick={dismiss} className="rounded bg-accent px-3 py-1 text-accent-foreground" data-region={suggested}>
          Go to the {label} site
        </Link>
        <button type="button" onClick={dismiss} className="underline">Stay here</button>
      </div>
    </div>
  );
}
