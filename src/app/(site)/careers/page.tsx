import { getSetting } from "@/lib/settings";
import { getJobs } from "@/lib/content";
import { BlockList } from "@/blocks/render";
import { careersToBlocks, type CareersSettings } from "@/blocks/from-settings";

export const metadata = { title: "Career Opportunities", description: "Explore job opportunities at Rapid Medical. Join us!" };

export default async function CareersPage() {
  const [c, jobs] = await Promise.all([getSetting<CareersSettings>("careers"), getJobs()]);
  return <BlockList blocks={careersToBlocks({ c, jobCount: jobs.length })} />;
}
