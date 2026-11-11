import { redirect } from "next/navigation";
import { getSetting } from "@/lib/settings";
import { getRememberedRegion } from "@/lib/region-cookie";
import { BlockList } from "@/blocks/render";
import { chooserToBlocks } from "@/blocks/from-settings";

export const metadata = { title: "Choose Your Location", description: "Access tailored neurovascular therapy options worldwide.", robots: { index: false } };

const NEXT = /^[a-z-]+$/;

/**
 * Shown only when the visitor's region is unknown (no IP country, nothing chosen yet) — decision 2026-11-10.
 * With a region (remembered, or applied from the IP by proxy.ts) the visitor goes straight on to `next`.
 */
export default async function ChooseLocation({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const region = await getRememberedRegion();
  if (region) redirect(`/${region}/${sp.next && NEXT.test(sp.next) ? sp.next : "therapies"}`);
  const regional = await getSetting<{ chooserTitle?: string; chooserNote?: string }>("regional");
  return <BlockList blocks={chooserToBlocks({ regional, suggested: null, next: sp.next })} />;
}
