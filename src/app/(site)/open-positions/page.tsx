import { getJobs } from "@/lib/content";
import { BlockList } from "@/blocks/render";
import { absoluteTitle } from "@/lib/seo";
import { getSetting } from "@/lib/settings";
import { jobsToBlocks } from "@/blocks/from-settings";

/** How Google shows the page: Settings → Google (docs/screens/admin-seo.md), the old texts as the fallback. */
export async function generateMetadata() {
  const seo = await getSetting<Record<string, string>>("seo");
  return { title: absoluteTitle(seo.jobsTitle, "Open Positions"), description: seo.jobsDescription || "Explore job opportunities at Rapid Medical." };
}

export default async function OpenPositionsPage() {
  return <BlockList blocks={jobsToBlocks(await getJobs())} />;
}
