import type { Region } from "@/db/schema";

export const REGIONS = ["us", "ous", "apac"] as const;
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
 * ISO-3166 alpha-2 → suggested region. Mirrors the Duda geo-redirect and the
 * About-page map: Americas → us; Asia + Middle East → apac; everything else → ous.
 */
export function regionForCountry(cc: string | null | undefined): Region | null {
  if (!cc) return null;
  const c = cc.toUpperCase();
  if (["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "VE", "EC", "BO", "PY", "UY", "GT", "HN", "SV", "NI", "CR", "PA", "DO", "CU", "JM", "TT", "PR", "GY", "SR", "BZ", "HT"].includes(c)) return "us";
  if (["CN", "JP", "KR", "IN", "SG", "MY", "TH", "VN", "ID", "PH", "TW", "HK", "MO", "PK", "BD", "LK", "NP", "KH", "LA", "MM", "MN", "KZ", "UZ", "KG", "TJ", "TM", "AF", "BT", "MV", "BN", "TL", "IL", "SA", "AE", "QA", "BH", "KW", "OM", "IQ", "IR", "JO", "LB", "SY", "TR", "PS", "EG", "YE"].includes(c)) return "apac";
  return "ous";
}
