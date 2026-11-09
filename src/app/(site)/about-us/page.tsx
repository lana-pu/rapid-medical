import { getSetting } from "@/lib/settings";
import { getTeam } from "@/lib/content";
import { BlockList } from "@/blocks/render";
import { aboutToBlocks, type AboutSettings } from "@/blocks/from-pages";
import type { Office } from "@/blocks/offices-map";

export const metadata = {
  title: "About Us",
  description: "Learn about our innovative neurovascular solutions for stroke treatment.",
};

export default async function AboutPage() {
  const [about, contact, team] = await Promise.all([getSetting<AboutSettings>("about"), getSetting<{ offices?: Office[] }>("contact"), getTeam()]);
  return <BlockList blocks={aboutToBlocks({ about, offices: contact.offices ?? [], team })} />;
}
