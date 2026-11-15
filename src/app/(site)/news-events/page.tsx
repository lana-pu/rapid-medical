import { getEvents, getNews } from "@/lib/content";
import { BlockList } from "@/blocks/render";
import { absoluteTitle } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import { newsPageToBlocks } from "@/blocks/from-settings";

/** How Google shows the page: Settings → Google (docs/screens/admin-seo.md), the old texts as the fallback. */
export async function generateMetadata() {
  const seo = await getSetting<Record<string, string>>("seo");
  return { title: absoluteTitle(seo.newsTitle, "News & Events"), description: seo.newsDescription || "Stay updated on Rapid Medical™ news & events. Discover innovative devices & FDA clearances." };
}

export default async function NewsPage() {
  const [news, events] = await Promise.all([getNews(), getEvents()]);
  return <BlockList blocks={newsPageToBlocks(news, events)} />;
}
