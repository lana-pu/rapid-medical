import "server-only";
import { cookies } from "next/headers";
import type { Region } from "@/db/schema";
import { isRegion } from "./regions";

export const REGION_COOKIE = "rm_region";

/** Last region the visitor browsed (set by proxy.ts on /us/* and /ous/*). */
export async function getRememberedRegion(): Promise<Region | null> {
  const v = (await cookies()).get(REGION_COOKIE)?.value;
  return isRegion(v) ? v : null;
}
