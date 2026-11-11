"use client";

import { usePathname } from "next/navigation";
import type { Region } from "@/db/schema";
import { REGION_CHOICES } from "@/lib/regions";
import { DEMO, withBase } from "@/lib/demo";

/**
 * Region switcher in the header top bar (decision 2026-11-10): the current region by name, the other two one
 * click away. Plain links (works without JS); /api/region remembers the choice and keeps the visitor on the
 * same page. The static demo has no API, so there it links to the region's overview.
 */
export function RegionSwitcher({ region }: { region: Region | null }) {
  const pathname = usePathname() || "/";
  const current = REGION_CHOICES.find((c) => c.region === region);
  const href = (r: Region) => (DEMO ? withBase(`/${r}/therapies`) : `/api/region?to=${r}&back=${encodeURIComponent(pathname)}`);

  if (!current) {
    return <a href={withBase("/choose-your-location")} className="rounded border border-border px-2 py-0.5">🌐 Choose location</a>;
  }
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded border border-border px-2 py-0.5" aria-label={`Region: ${current.label}. Change region`}>
        🌐 {current.label} <span aria-hidden>▾</span>
      </summary>
      <ul className="absolute right-0 top-full z-30 mt-1 min-w-48 rounded border border-border bg-background p-1 shadow-md">
        {REGION_CHOICES.map((c) => (
          <li key={c.region}>
            {c.region === region ? (
              <span className="block rounded px-3 py-1.5 font-medium" aria-current="true">{c.label}</span>
            ) : (
              <a href={href(c.region)} className="block rounded px-3 py-1.5 hover:bg-surface">{c.label}</a>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
