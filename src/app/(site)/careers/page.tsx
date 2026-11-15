import { getSetting } from "@/lib/settings";
import { getJobs, getSitePage } from "@/lib/content";
import { resolveBlocks } from "@/blocks/stored";
import { PageMark } from "@/components/editor/PageMark";
import { BlockList } from "@/blocks/render";
import { careersToBlocks, jobRow, type CareersSettings } from "@/blocks/from-settings";

export const metadata = { title: "Career Opportunities", description: "Explore job opportunities at Rapid Medical. Join us!" };

export default async function CareersPage() {
  const [page, c, jobs] = await Promise.all([getSitePage("careers", null), getSetting<CareersSettings>("careers"), getJobs()]);
  const rows = jobs.map(jobRow);
  if (!page) return <BlockList blocks={careersToBlocks({ c, jobCount: jobs.length, jobs: rows })} />;
  return (
    <>
      <PageMark r="site-pages" id={page.id} />
      <BlockList blocks={resolveBlocks(page.blocks, { region: null, lists: { jobCount: jobs.length, jobs: rows } }, { r: "site-pages", id: page.id })} />
    </>
  );
}
