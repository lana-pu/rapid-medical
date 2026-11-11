import { getSetting } from "@/lib/settings";
import { getFeaturedNews } from "@/lib/content";
import { getRememberedRegion } from "@/lib/region-cookie";
import { BlockList } from "@/blocks/render";
import { homeToBlocks, type HomeSettings } from "@/blocks/from-settings";
import { JsonLd } from "@/components/site/JsonLd";

type Contact = { phoneHq?: string; email?: string; offices?: { name?: string; label?: string; address?: string }[] };
type Social = Record<string, string | undefined>;

export default async function HomePage() {
  const [home, news, region, contact, social, branding] = await Promise.all([
    getSetting<HomeSettings>("home"),
    getFeaturedNews(4),
    getRememberedRegion(),
    getSetting<Contact>("contact"),
    getSetting<Social>("social"),
    getSetting<{ logoUrl?: string }>("branding"),
  ]);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rapid-medical.com";
  const hq = contact.offices?.[0];
  return (
    <>
      {/* Structured data (Emily's audit, SEO): the company, from the contact and social settings. */}
      <JsonLd
        data={{
          "@type": "Organization",
          name: "Rapid Medical",
          url: site,
          logo: branding.logoUrl ? new URL(branding.logoUrl, site).toString() : undefined,
          email: contact.email || undefined,
          telephone: contact.phoneHq || undefined,
          address: hq?.address ? { "@type": "PostalAddress", streetAddress: hq.address.replace(/\n/g, ", ") } : undefined,
          sameAs: Object.values(social).filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u)),
        }}
      />
      <BlockList blocks={homeToBlocks({ home, news, region: region ?? null })} />
    </>
  );
}
