import { getSetting } from "@/lib/settings";
import { getSitePage, getTeam } from "@/lib/content";
import { resolveBlocks } from "@/blocks/stored";
import { PageMark } from "@/components/editor/PageMark";
import { BlockList } from "@/blocks/render";
import { aboutToBlocks, type AboutSettings } from "@/blocks/from-pages";
import type { Office } from "@/blocks/offices-map";

export const metadata = {
  title: "About Us",
  description: "Learn about our innovative neurovascular solutions for stroke treatment.",
};

export default async function AboutPage() {
  const [page, about, contact, team] = await Promise.all([getSitePage("about", null), getSetting<AboutSettings>("about"), getSetting<{ offices?: Office[] }>("contact"), getTeam()]);
  const offices = contact.offices ?? [];
  if (!page) return <BlockList blocks={aboutToBlocks({ about, offices, team })} />;
  return (
    <>
      <PageMark r="site-pages" id={page.id} />
      <BlockList blocks={resolveBlocks(page.blocks, { region: null, lists: { team, offices } }, { r: "site-pages", id: page.id })} />
    </>
  );
}
