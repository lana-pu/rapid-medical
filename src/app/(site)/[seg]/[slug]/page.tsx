import { absoluteTitle } from "@/lib/seo";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { regionOr404 } from "@/lib/region-param";
import { getPage } from "@/lib/content";
import { redirectIfLegacy } from "@/lib/redirects";
import { isRegion } from "@/lib/regions";
import { BlockList } from "@/blocks/render";
import { textPageBlocks } from "@/blocks/convert";
import { PageMark } from "@/components/editor/PageMark";

/** Regional landing pages, e.g. /us/success-study-final-results */
export async function generateMetadata({ params }: { params: Promise<{ seg: string; slug: string }> }): Promise<Metadata> {
  const { seg, slug } = await params;
  if (!isRegion(seg)) return {};
  const region = regionOr404(seg);
  const page = await getPage(slug, region);
  if (!page) return {};
  return { title: absoluteTitle(page.metaTitle, page.title), description: page.metaDescription || undefined, robots: page.noindex ? { index: false } : undefined };
}

export default async function RegionalPage({ params }: { params: Promise<{ seg: string; slug: string }> }) {
  const { seg, slug } = await params;
  // Two-segment legacy paths that are not regional (e.g. Duda /event-details/…) → redirects table, else 404.
  if (!isRegion(seg)) {
    await redirectIfLegacy(`/${seg}/${slug}`);
    notFound();
  }
  const region = regionOr404(seg);

  // Legacy: us.rapid-medical.com/contact-us → global contact with region preselected
  if (slug === "contact-us") redirect(`/contact-us?region=${region}`);

  const page = await getPage(slug, region);
  if (!page) {
    await redirectIfLegacy(`/${region}/${slug}`);
    notFound();
  }

  return <>
      {page.blocks?.length ? <PageMark r="pages" id={page.id} /> : null}
      <BlockList blocks={textPageBlocks(page)} />
    </>;
}
