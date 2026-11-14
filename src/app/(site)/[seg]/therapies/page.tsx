import { regionOr404 } from "@/lib/region-param";
import { and, eq, ne } from "drizzle-orm";
import { db, solutions } from "@/db";
import { Section } from "@/components/site/primitives";
import { REGION_CHOICES } from "@/lib/regions";
import { getSitePage, getSolutionsNav } from "@/lib/content";
import { resolveBlocks } from "@/blocks/stored";
import { PageMark } from "@/components/editor/PageMark";
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

export default async function TherapiesIndex({ params, searchParams }: { params: Promise<{ seg: string }>; searchParams: Promise<{ missing?: string }> }) {
  const region = regionOr404((await params).seg);
  const { missing } = await searchParams;
  const [page, landing, items] = await Promise.all([getSitePage("therapies", region), getSetting<Landing>(`therapies:${region}`), getSolutionsNav(region)]);
  // only true when it is so: not in this region, published in another (a link cannot claim otherwise)
  const gone =
    typeof missing === "string" && /^[a-z0-9-]{1,60}$/.test(missing) && !items.some((i) => i.slug === missing)
      ? await db.query.solutions.findFirst({ columns: { navLabel: true }, where: and(eq(solutions.slug, missing), eq(solutions.status, "published"), ne(solutions.region, region)) })
      : null;
  // came here from the region switcher on a therapy this region does not have
  const notice = gone ? (
    <Section className="pb-0 md:pb-0" aria-live="polite">
      <p className="rounded border border-border bg-surface px-4 py-3 text-sm" role="status">
        {gone.navLabel} is not available in {REGION_CHOICES.find((c) => c.region === region)?.label ?? region}. These are the therapies here.
      </p>
    </Section>
  ) : null;
  if (!page) return <>{notice}<BlockList blocks={therapiesToBlocks({ region, landing, items })} /></>;
  return (
    <>
      {notice}
      <PageMark r="site-pages" id={page.id} />
      <BlockList blocks={resolveBlocks(page.blocks, { region, lists: { therapies: items } }, { r: "site-pages", id: page.id })} />
    </>
  );
}
