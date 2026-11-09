import { getSetting } from "@/lib/settings";
import { getSuggestedRegion } from "@/lib/region-cookie";
import { BlockList } from "@/blocks/render";
import { chooserToBlocks } from "@/blocks/from-settings";

export const metadata = { title: "Choose Your Location", description: "Access tailored neurovascular therapy options worldwide." };

export default async function ChooseLocation({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const [regional, suggested] = await Promise.all([getSetting<{ chooserTitle?: string; chooserNote?: string }>("regional"), getSuggestedRegion()]);
  return <BlockList blocks={chooserToBlocks({ regional, suggested: suggested ?? null, next: sp.next })} />;
}
