import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { regionOr404 } from "@/lib/region-param";
import { getSolution, getSolutionRegions } from "@/lib/content";
import { REGION_SHORT } from "@/lib/regions";
import { redirectIfLegacy } from "@/lib/redirects";
import { regionalAlternates, absoluteTitle } from "@/lib/seo";
import { BlockList } from "@/blocks/render";
import { solutionToBlocks } from "@/blocks/from-solution";

export async function generateMetadata({ params }: { params: Promise<{ seg: string; slug: string }> }): Promise<Metadata> {
  const { seg, slug } = await params;
  const region = regionOr404(seg);
  const [s, available] = await Promise.all([getSolution(region, slug), getSolutionRegions(slug)]);
  if (!s) return {};
  const image = s.shareImageUrl || s.heroImageUrl || s.benefits.find((b) => b.secondaryImageUrl)?.secondaryImageUrl || s.overviewImageUrl || undefined;
  return {
    title: absoluteTitle(s.metaTitle, `${s.navLabel} – ${REGION_SHORT[region]}`),
    description: s.metaDescription || s.heroBody.slice(0, 160),
    alternates: regionalAlternates((r) => `/${r}/therapies/${slug}`, available, region),
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

/** Therapy page: blocks built from the record (docs/screens/therapy.md → «Блоки»). */
export default async function SolutionPage({ params }: { params: Promise<{ seg: string; slug: string }> }) {
  const { seg, slug } = await params;
  const region = regionOr404(seg);
  const [s, available] = await Promise.all([getSolution(region, slug), getSolutionRegions(slug)]);
  if (!s) {
    await redirectIfLegacy(`/${region}/therapies/${slug}`); // e.g. /us/therapies/access → /us/therapies/drivewire (301)
    notFound();
  }
  const others = available.filter((r) => r !== region);
  return <BlockList blocks={solutionToBlocks(s, { region, others })} />;
}
