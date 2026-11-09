import { getJobs } from "@/lib/content";
import { BlockList } from "@/blocks/render";
import { jobsToBlocks } from "@/blocks/from-settings";

export const metadata = { title: "Open Positions", description: "Explore job opportunities at Rapid Medical." };

export default async function OpenPositionsPage() {
  return <BlockList blocks={jobsToBlocks(await getJobs())} />;
}
