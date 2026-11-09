import { regionOr404 } from "@/lib/region-param";
import { getSolutionsNav } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { REGION_LABELS, REGIONS } from "@/lib/regions";
import { regionalAlternates, absoluteTitle } from "@/lib/seo";
import { BlockList } from "@/blocks/render";
import { therapiesToBlocks, type TherapiesLanding as Landing } from "@/blocks/from-settings";

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const landing = await getSetting<Landing>(`therapies:${region}`);
  return {
    title: absoluteTitle(landing.metaTitle, `Therapies – ${REGION_LABELS[region]}`),
    description: landing.metaDescription || "Adjustable endovascular devices that adapt to each patient's anatomy.",
    alternates: regionalAlternates((r) => `/${r}/therapies`, [...REGIONS], region),
  };
}

export default async function TherapiesIndex({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const [landing, items] = await Promise.all([getSetting<Landing>(`therapies:${region}`), getSolutionsNav(region)]);
  return <BlockList blocks={therapiesToBlocks({ region, landing, items })} />;
}
