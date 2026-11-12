import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { regionOr404 } from "@/lib/region-param";
import { getSolution, getSolutionRegions } from "@/lib/content";
import { REGION_CHOICES } from "@/lib/regions";
import { JsonLd, plain, absUrl, siteUrl } from "@/components/site/JsonLd";
import { redirectIfLegacy } from "@/lib/redirects";
import { regionalAlternates, absoluteTitle } from "@/lib/seo";
import { BlockList } from "@/blocks/render";
import { therapyPageBlocks } from "@/blocks/convert";
import { pageSummary } from "@/blocks/stored";

export async function generateMetadata({ params }: { params: Promise<{ seg: string; slug: string }> }): Promise<Metadata> {
  const { seg, slug } = await params;
  const region = regionOr404(seg);
  const [s, available] = await Promise.all([getSolution(region, slug), getSolutionRegions(slug)]);
  if (!s) return {};
  // A converted page (ADR-007) describes itself through its first hero block; old fields are the fallback.
  const sum = pageSummary(s.blocks);
  const image = s.shareImageUrl || (s.blocks ? sum.imageUrl : s.heroImageUrl || s.benefits.find((b) => b.secondaryImageUrl)?.secondaryImageUrl || s.overviewImageUrl) || undefined;
  return {
    title: absoluteTitle(s.metaTitle, `${s.navLabel} – ${REGION_CHOICES.find((c) => c.region === region)?.label ?? region}`),
    description: s.metaDescription || (s.blocks ? sum.body ?? "" : s.heroBody).slice(0, 160),
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
  const site = siteUrl();
  const p = s.product;
  const deviceName = (p && (p.aliases?.[region]?.fullName ?? p.fullName)) || s.navLabel;
  const sum = pageSummary(s.blocks);
  const image = (s.blocks ? sum.imageUrl : s.heroImageUrl || s.annotatedImage?.imageUrl) || undefined;
  return (
    <>
      {/* Structured data (Emily's audit, SEO): what the device is and who makes it — built from the record only. */}
      <JsonLd
        data={{
          "@type": "MedicalDevice",
          name: deviceName,
          description: plain(s.blocks ? sum.body ?? "" : s.overviewBody || s.heroBody) || undefined,
          url: `${site}/${region}/therapies/${slug}`,
          image: absUrl(image, site),
          manufacturer: { "@type": "Organization", name: "Rapid Medical", url: site },
        }}
      />
      <BlockList blocks={therapyPageBlocks(s, { region, others })} />
    </>
  );
}
