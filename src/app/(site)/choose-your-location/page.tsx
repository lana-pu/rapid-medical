import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSetting } from "@/lib/settings";
import { getRememberedRegion, getSuggestedRegion, regionSource } from "@/lib/region-cookie";
import { safeLocalPath } from "@/lib/safe-path";
import { REGION_CHOICES } from "@/lib/regions";
import { BlockList } from "@/blocks/render";
import { chooserToBlocks } from "@/blocks/from-settings";

export const metadata = { title: "Choose Your Location", description: "Access tailored neurovascular therapy options worldwide.", robots: { index: false } };

const NEXT = /^[a-z-]+$/;

/**
 * The «Choose your location» window as a page (DESIGN.md → Выбор региона): for links followed without JavaScript.
 * `next` — a regional section asked for while the region is unknown; with a region the visitor goes straight on.
 * `back` — from the header switcher: change the region and return to that page; shown with the current region.
 */
export default async function ChooseLocation({ searchParams }: { searchParams: Promise<{ next?: string; back?: string }> }) {
  const sp = await searchParams;
  const [region, suggested, jar] = await Promise.all([getRememberedRegion(), getSuggestedRegion(), cookies()]);
  const back = typeof sp.back === "string" ? safeLocalPath(sp.back, "") || null : null;
  if (region && !back) redirect(`/${region}/${sp.next && NEXT.test(sp.next) ? sp.next : "therapies"}`);
  const regional = await getSetting<{ chooserTitle?: string; chooserNote?: string }>("regional");
  const current = region ? { label: REGION_CHOICES.find((c) => c.region === region)?.label ?? region, source: regionSource(region, suggested, jar.get("rm_region_chosen")?.value) } : null;
  return <BlockList blocks={chooserToBlocks({ regional, suggested: region ? null : suggested, next: sp.next, back, current })} />;
}
