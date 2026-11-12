import { regionOr404 } from "@/lib/region-param";
import { getPublications, getFeaturedPublications, getProductsForRegion, getSitePage } from "@/lib/content";
import { resolveBlocks } from "@/blocks/stored";
import { PageMark } from "@/components/editor/PageMark";
import { getSetting } from "@/lib/settings";
import { REGIONS } from "@/lib/regions";
import { regionalAlternates, absoluteTitle } from "@/lib/seo";
import { BlockList } from "@/blocks/render";
import { evidenceToBlocks, type EvidenceSettings } from "@/blocks/from-settings";

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const seo = await getSetting<Record<string, string>>("seo");
  return {
    title: absoluteTitle(seo.evidenceTitle, "Evidence"),
    description: seo.evidenceDescription || "Clinical research on neurovascular devices like Tigertriever, Comaneci & Drivewire.",
    alternates: regionalAlternates((r) => `/${r}/evidence`, [...REGIONS], region),
  };
}

export default async function EvidencePage({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const [page, all, featured, products, cfg] = await Promise.all([getSitePage("evidence", region), getPublications(region), getFeaturedPublications(region, 6), getProductsForRegion(region), getSetting<EvidenceSettings>("evidence")]);
  if (!page) return <BlockList blocks={evidenceToBlocks({ region, cfg, all, featured, products })} />;
  return (
    <>
      <PageMark r="site-pages" id={page.id} />
      <BlockList blocks={resolveBlocks(page.blocks, { region, lists: { evidence: { all, featured, products } } }, { r: "site-pages", id: page.id })} />
    </>
  );
}
