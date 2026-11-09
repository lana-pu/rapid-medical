import { getNews } from "@/lib/content";
import { BlockList } from "@/blocks/render";
import { newsPageToBlocks } from "@/blocks/from-settings";

export const metadata = {
  title: "News & Events",
  description: "Stay updated on Rapid Medical™ news & events. Discover innovative devices & FDA clearances.",
};

export default async function NewsPage() {
  return <BlockList blocks={newsPageToBlocks(await getNews())} />;
}
