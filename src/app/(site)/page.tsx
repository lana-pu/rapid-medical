import { getSetting } from "@/lib/settings";
import { getFeaturedNews } from "@/lib/content";
import { getRememberedRegion } from "@/lib/region-cookie";
import { BlockList } from "@/blocks/render";
import { homeToBlocks, type HomeSettings } from "@/blocks/from-settings";

export default async function HomePage() {
  const [home, news, region] = await Promise.all([getSetting<HomeSettings>("home"), getFeaturedNews(4), getRememberedRegion()]);
  return <BlockList blocks={homeToBlocks({ home, news, region: region ?? null })} />;
}
