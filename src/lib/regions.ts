import type { Region } from "@/db/schema";

export const REGION_LABELS: Record<Region, string> = {
  us: "Americas",
  ous: "Europe, Middle East & Asia Pacific",
};

export const REGION_SHORT: Record<Region, string> = {
  us: "US",
  ous: "OUS",
};

export function isRegion(v: unknown): v is Region {
  return v === "us" || v === "ous";
}

/** Legacy Duda hostnames → region */
export const LEGACY_HOSTS: Record<string, Region> = {
  "us.rapid-medical.com": "us",
  "ous.rapid-medical.com": "ous",
  "us-rapid-medical.juuced.co": "us",
  "ous-rapid-medical.juuced.co": "ous",
};
