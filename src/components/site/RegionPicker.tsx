"use client";

import { useId, useState } from "react";
import type { Region } from "@/db/schema";
import { findCountries, regionCountryNames } from "@/lib/countries";
import { regionForCountry } from "@/lib/regions";
import { Tag } from "./ui";
import { inputClass } from "./ui-classes";

export type RegionOption = { region: Region; label: string; href: string; suggested?: boolean };
/** Where the current region came from: the IP, the visitor's own choice, or unknown (the page they opened). */
export type RegionSourceKind = "location" | "chosen" | null;

/** How many country names a card lists before «and N more» (the search finds the rest). */
const NAMES = 9;

/**
 * Choose your location (DESIGN.md → Выбор региона): the line, the current region and where it came from, «Find your
 * country», three region cards. The same content in the modal window and on /choose-your-location.
 */
export function RegionPicker({ options, current, intro }: { options: RegionOption[]; current?: { label: string; source: RegionSourceKind } | null; /** false: the page's heading already says it */ intro?: string | false }) {
  const [query, setQuery] = useState("");
  const matches = findCountries(query);
  const hit = matches[0] ?? null;
  const hitRegion = hit ? regionForCountry(hit.code) : null;
  const searchId = useId();

  return (
    <div>
      {intro !== false && <p className="text-muted">{intro ?? "Product availability and regulatory information differ by region. Pick the region you practice in."}</p>}

      {current && (
        <div className="mt-6 flex items-center justify-between gap-4 border-y first:mt-0 border-border py-3 text-sm">
          <div>
            <div className="text-xs text-muted">Current region</div>
            <div className="font-medium">{current.label}</div>
          </div>
          {current.source && <Tag muted>{current.source === "location" ? "From your location" : "Your choice"}</Tag>}
        </div>
      )}

      <label htmlFor={searchId} className="mt-6 block text-sm">Find your country</label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Start typing, e.g. Brazil"
        autoComplete="off"
        className={`mt-1 ${inputClass()}`}
      />
      <p className="mt-1 min-h-5 text-xs text-muted" aria-live="polite">
        {query.trim().length >= 2 && (hit ? (matches.length > 1 ? `Showing ${hit.name} · also ${matches.slice(1, 4).map((m) => m.name).join(", ")}` : "") : "No country found — choose the region you practice in.")}
      </p>

      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {options.map((o) => {
          const names = regionCountryNames(o.region);
          const on = hitRegion === o.region;
          return (
            <li key={o.region} className={`flex flex-col rounded border p-5 ${on || (!hitRegion && o.suggested) ? "border-foreground" : "border-border"}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">{o.label}</h3>
                <span className="shrink-0 text-xs text-muted">{names ? `${names.length} countries` : "all others"}</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {names
                  ? `${names.slice(0, NAMES).join(", ")}${names.length > NAMES ? ` and ${names.length - NAMES} more` : ""}`
                  : "Europe, Australia, New Zealand, Africa and all other countries"}
              </p>
              {on && hit && <p className="mt-3 text-sm font-medium">{hit.name} is here</p>}
              {!hitRegion && o.suggested && <p className="mt-3 text-sm font-medium">Suggested for your location</p>}
              <div className="mt-auto pt-5">
                <a href={o.href} className={`block rounded px-4 py-2 text-center text-sm font-medium ${on ? "bg-accent text-accent-foreground" : "border border-border hover:border-foreground"}`}>
                  Go to {o.label} →
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
