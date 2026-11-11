import type { Metadata } from "next";
import { REGIONS, type Region } from "./regions";

/**
 * hreflang alternates for a page that exists on several regional sites.
 * US → en-US, international → en (default English), APAC → en-AU as the closest
 * English locale Google accepts. x-default is the international (OUS) version: the location chooser now
 * redirects anyone with a known region, so it can't be the fallback page (decision 2026-11-10).
 */
const HREFLANG: Record<Region, string> = { us: "en-US", ous: "en", apac: "en-AU" };

export function regionalAlternates(path: (r: Region) => string, available: Region[] = [...REGIONS], current?: Region): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const r of available) languages[HREFLANG[r]] = path(r);
  languages["x-default"] = available.includes("ous") ? path("ous") : path(available[0]);
  return { canonical: current ? path(current) : undefined, languages };
}

/** Client-supplied titles already end with "| Rapid Medical", so bypass the layout template. */
export const absoluteTitle = (t: string | null | undefined, fallback: string): Metadata["title"] => (t ? { absolute: t } : fallback);
