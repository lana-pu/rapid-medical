import "server-only";
import { cookies } from "next/headers";
import type { Region } from "@/db/schema";
import { isRegion } from "./regions";

export const REGION_COOKIE = "rm_region";
export const GEO_COOKIE = "rm_geo";

/** Last region the visitor browsed (set by proxy.ts on /us/*, /ous/*, /apac/*). */
export async function getRememberedRegion(): Promise<Region | null> {
  const v = (await cookies()).get(REGION_COOKIE)?.value;
  return isRegion(v) ? v : null;
}

/** Region suggested from the visitor's IP country (set once by proxy.ts). */
export async function getSuggestedRegion(): Promise<Region | null> {
  const v = (await cookies()).get(GEO_COOKIE)?.value;
  return isRegion(v) ? v : null;
}
