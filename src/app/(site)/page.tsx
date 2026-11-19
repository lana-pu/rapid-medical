import { getSetting } from "@/lib/settings";
import { getFeaturedNews, getProductsForRegion, getPublications, getSitePage, getSolutionsNav } from "@/lib/content";
import { REGIONS, type Region } from "@/lib/regions";
import { publicationCounts } from "@/blocks/from-settings";
import { getRememberedRegion } from "@/lib/region-cookie";
import { BlockList } from "@/blocks/render";
import { homeToBlocks, type HomeSettings } from "@/blocks/from-settings";
import { resolveBlocks } from "@/blocks/stored";
import { PageMark } from "@/components/editor/PageMark";
import type { Metadata } from "next";
import { JsonLd, absUrl, siteUrl } from "@/components/site/JsonLd";

type Contact = { phoneHq?: string; email?: string; offices?: { name?: string; label?: string; address?: string }[] };
type Social = Record<string, string | undefined>;

/** How Google shows the home page: its own fields (docs/screens/admin-seo.md); empty — the site's default. */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getSitePage("home", null);
  return { ...(page?.metaTitle ? { title: { absolute: page.metaTitle } } : {}), ...(page?.metaDescription ? { description: page.metaDescription } : {}) };
}

export default async function HomePage() {
  const [page, home, news, region, contact, social, branding] = await Promise.all([
    getSitePage("home", null),
    getSetting<HomeSettings>("home"),
    getFeaturedNews(4),
    getRememberedRegion(),
    getSetting<Contact>("contact"),
    getSetting<Social>("social"),
    getSetting<{ logoUrl?: string }>("branding"),
  ]);
  const site = siteUrl();
  const hq = contact.offices?.[0];
  const lists = await homeLists(region ?? null);
  return (
    <>
      {/* Structured data (Emily's audit, SEO): the company, from the contact and social settings. */}
      <JsonLd
        data={{
          "@type": "Organization",
          name: "Rapid Medical",
          url: site,
          logo: absUrl(branding.logoUrl, site),
          email: contact.email || undefined,
          telephone: contact.phoneHq || undefined,
          address: hq?.address ? { "@type": "PostalAddress", streetAddress: hq.address.replace(/\n/g, ", ") } : undefined,
          sameAs: Object.values(social).filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u)),
        }}
      />
      {page ? (
        <>
          <PageMark r="site-pages" id={page.id} />
          <BlockList blocks={resolveBlocks(page.blocks, { region: region ?? null, lists: { news, ...lists } }, { r: "site-pages", id: page.id })} />
        </>
      ) : (
        <BlockList blocks={homeToBlocks({ home, news, region: region ?? null })} />
      )}
    </>
  );
}

/**
 * «Our therapies» and the publications figure (docs/screens/home.md): the remembered region's, as its overview and
 * Evidence show them; with no region yet — every region's therapies (once each) and every publication (once each).
 */
async function homeLists(region: Region | null) {
  if (region) {
    const [therapies, all, products] = await Promise.all([getSolutionsNav(region), getPublications(region), getProductsForRegion(region)]);
    return { therapies, publicationCounts: publicationCounts({ all, products, featured: [] }), publicationCount: all.length };
  }
  const per = await Promise.all(REGIONS.map(async (r) => ({ therapies: await getSolutionsNav(r), pubs: await getPublications(r) })));
  const seen = new Set<string>();
  const therapies = per.flatMap((x) => x.therapies).filter((t) => (seen.has(t.slug) ? false : (seen.add(t.slug), true)));
  return { therapies, publicationCount: new Set(per.flatMap((x) => x.pubs.map((p) => p.id))).size };
}
