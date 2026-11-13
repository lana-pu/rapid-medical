import { regionOr404 } from "@/lib/region-param";
import { getWebinars } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { REGIONS } from "@/lib/regions";
import { regionalAlternates, absoluteTitle } from "@/lib/seo";
import { BlockList } from "@/blocks/render";
import { webinarsToBlocks } from "@/blocks/from-settings";

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const seo = await getSetting<Record<string, string>>("seo");
  return {
    title: absoluteTitle(seo.webinarsTitle, "Webinars"),
    description: seo.webinarsDescription || undefined,
    alternates: regionalAlternates((r) => `/${r}/webinars`, [...REGIONS], region),
  };
}

export default async function WebinarsPage({ params, searchParams }: { params: Promise<{ seg: string }>; searchParams: Promise<{ product?: string }> }) {
  const region = regionOr404((await params).seg);
  const { product } = await searchParams;
  return <BlockList blocks={webinarsToBlocks({ region, list: await getWebinars(region), product: typeof product === "string" ? product : undefined })} />;
}
