import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { regionOr404 } from "@/lib/region-param";
import { getPage } from "@/lib/content";
import { redirectIfLegacy } from "@/lib/redirects";
import { REGION_LABELS } from "@/lib/regions";
import { BlockList } from "@/blocks/render";
import { pageToBlocks } from "@/blocks/from-pages";

/** Regional landing pages, e.g. /us/success-study-final-results */
export async function generateMetadata({ params }: { params: Promise<{ seg: string; slug: string }> }): Promise<Metadata> {
  const { seg, slug } = await params;
  const region = regionOr404(seg);
  const page = await getPage(slug, region);
  if (!page) return {};
  return { title: page.metaTitle || page.title, description: page.metaDescription || undefined, robots: page.noindex ? { index: false } : undefined };
}

export default async function RegionalPage({ params }: { params: Promise<{ seg: string; slug: string }> }) {
  const { seg, slug } = await params;
  const region = regionOr404(seg);

  // Legacy: us.rapid-medical.com/contact-us → global contact with region preselected
  if (slug === "contact-us") redirect(`/contact-us?region=${region}`);

  const page = await getPage(slug, region);
  if (!page) {
    await redirectIfLegacy(`/${region}/${slug}`);
    notFound();
  }

  return <BlockList blocks={pageToBlocks(page, REGION_LABELS[region])} />;
}
