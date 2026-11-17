import type { Region } from "@/db/schema";

export const REGIONS = ["us", "ous", "apac"] as const;

/** Regions the team does not use now: hidden by default where regions are compared (owner, 2026-11-15). */
export const PAUSED_REGIONS: readonly string[] = ["apac"];
export type { Region };

export const REGION_LABELS: Record<Region, string> = {
  us: "Americas",
  ous: "Europe, Middle East, Latin America & Australia",
  apac: "Asia & Pacific",
};

export const REGION_SHORT: Record<Region, string> = {
  us: "US",
  ous: "OUS",
  apac: "APAC",
};

/** Options on the "Choose your location" page, in display order. */
export const REGION_CHOICES: { label: string; region: Region }[] = [
  { label: "Americas", region: "us" },
  { label: "Asia & Pacific", region: "apac" },
  { label: "Europe & Middle East", region: "ous" },
];

/** Contact-form "Region" value preselected for a site region. */
export const REGION_FORM_VALUE: Record<Region, string> = {
  us: "Americas",
  ous: "Europe",
  apac: "Asia Pacific",
};

export function isRegion(v: unknown): v is Region {
  return v === "us" || v === "ous" || v === "apac";
}

/** Legacy Duda hostnames → region */
export const LEGACY_HOSTS: Record<string, Region> = {
  "us.rapid-medical.com": "us",
  "ous.rapid-medical.com": "ous",
  "apac.rapid-medical.com": "apac",
  "us-rapid-medical.juuced.co": "us",
  "ous-rapid-medical.juuced.co": "ous",
  "apac-rapid-medical.juuced.co": "apac",
};

/**
 * Countries of the Americas and Asia & Pacific; every other country is Europe & Middle East (`ous`). One table for
 * the IP region, the contact form and the region chooser (DESIGN.md → Выбор региона).
 */
export const REGION_COUNTRY_CODES: { us: string[]; apac: string[] } = {
  us: ["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GT", "HN", "SV", "NI", "CR", "PA", "DO", "CU", "JM", "TT", "PR", "GY", "SR", "BZ", "HT"],
  apac: ["CN", "JP", "KR", "IN", "SG", "MY", "TH", "VN", "ID", "PH", "TW", "HK", "MO", "PK", "BD", "LK", "NP", "KH", "LA", "MM", "MN", "KZ", "UZ", "KG", "TJ", "TM", "AF", "BT", "MV", "BN", "TL", "IL", "SA", "AE", "QA", "BH", "KW", "OM", "IQ", "IR", "JO", "LB", "SY", "TR", "PS", "EG", "YE"],
};

/**
 * ISO-3166 alpha-2 → suggested region. Mirrors the Duda geo-redirect and the
 * About-page map: Americas → us; Asia + Middle East → apac; everything else → ous.
 */
export function regionForCountry(cc: string | null | undefined): Region | null {
  if (!cc) return null;
  const c = cc.toUpperCase();
  // Not a real country: unknown (XX), Tor (T1), anonymous proxy / satellite (A1, A2), region-level codes (EU, AP)
  if (!/^[A-Z]{2}$/.test(c) || ["XX", "T1", "A1", "A2", "O1", "EU", "AP", "ZZ"].includes(c)) return null;
  if (REGION_COUNTRY_CODES.us.includes(c)) return "us";
  if (REGION_COUNTRY_CODES.apac.includes(c)) return "apac";
  return "ous";
}
