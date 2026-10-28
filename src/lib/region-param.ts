import { notFound } from "next/navigation";
import type { Region } from "@/db/schema";
import { isRegion } from "./regions";

/** The first URL segment is either a region (us/ous) or a global page slug. */
export function regionOr404(seg: string): Region {
  if (!isRegion(seg)) notFound();
  return seg;
}
