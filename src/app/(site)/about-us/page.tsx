import { getSetting } from "@/lib/settings";
import { getPublicationCount, getSitePage, getTeam } from "@/lib/content";
import { resolveBlocks } from "@/blocks/stored";
import { PageMark } from "@/components/editor/PageMark";
import { BlockList } from "@/blocks/render";
import { aboutToBlocks, companyFacts, type AboutSettings } from "@/blocks/from-pages";
import { absoluteTitle } from "@/lib/seo";
import type { Office } from "@/blocks/offices-map";

/** How Google shows the page: its own fields (docs/screens/admin-seo.md), the old texts as the fallback. */
export async function generateMetadata() {
  const page = await getSitePage("about", null);
  return { title: absoluteTitle(page?.metaTitle, "About Us"), description: page?.metaDescription || "Learn about our innovative neurovascular solutions for stroke treatment." };
}

export default async function AboutPage() {
  const [page, about, contact, team, publications] = await Promise.all([getSitePage("about", null), getSetting<AboutSettings>("about"), getSetting<{ offices?: Office[] }>("contact"), getTeam(), getPublicationCount()]);
  const offices = contact.offices ?? [];
  const facts = companyFacts(publications, offices);
  if (!page) return <BlockList blocks={aboutToBlocks({ about, offices, team, facts })} />;
  return (
    <>
      <PageMark r="site-pages" id={page.id} />
      <BlockList blocks={resolveBlocks(page.blocks, { region: null, lists: { team, offices, facts } }, { r: "site-pages", id: page.id })} />
    </>
  );
}
