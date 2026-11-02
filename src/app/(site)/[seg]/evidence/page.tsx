import Link from "next/link";
import { regionOr404 } from "@/lib/region-param";
import { getPublications, getFeaturedPublications, getProductsForRegion } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { REGION_LABELS } from "@/lib/regions";
import { Section, Container, H1, H2, Eyebrow, Img, formatMonth } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { Tabs } from "@/components/site/Tabs";

type EvidenceSettings = {
  title?: string; intro?: string; heroVideoUrl?: string; statImageUrl?: string;
  forefrontText?: string; forefrontImageUrl?: string; forefrontImage2Url?: string; featuredTitle?: string; browseTitle?: string;
};

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  regionOr404((await params).seg);
  return { title: "Evidence", description: "Clinical research on neurovascular devices like Tigertriever, Comaneci & Drivewire." };
}

export default async function EvidencePage({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const [all, featured, products, cfg] = await Promise.all([getPublications(region), getFeaturedPublications(region), getProductsForRegion(region), getSetting<EvidenceSettings>("evidence")]);

  // A family tab (e.g. TIGERTRIEVER™) also lists sub-products that have no tab of their own in this region.
  const tabbed = new Set(products.map((p) => p.slug));
  const allProducts = await getProductsForRegion(region);
  void allProducts;
  const listFor = (slug: string) =>
    all.filter((p) => p.product?.slug === slug || (p.product?.family === slug && !tabbed.has(p.product.slug)));

  const tabs = products
    .map((prod) => ({ prod, list: listFor(prod.slug) }))
    .filter((t) => t.list.length > 0)
    .map(({ prod, list }) => ({
      id: prod.slug,
      label: prod.name,
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">{prod.fullName}</h3>
          <ul className="divide-y divide-border">
            {list.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 py-4 md:flex-row md:gap-6">
                <span className="w-20 flex-none text-sm text-muted">{formatMonth(p.publishedOn)}</span>
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  {(p.authors || p.journal) && <div className="mt-1 text-sm text-muted">{[p.authors, p.journal].filter(Boolean).join(" · ")}</div>}
                  <div className="mt-1 flex gap-4 text-sm">
                    {p.url && <a href={p.url} target="_blank" rel="noopener" className="underline">{p.doi ? `doi:${p.doi}` : "Read"}</a>}
                    {p.pdfUrl && <a href={p.pdfUrl} target="_blank" rel="noopener" className="underline">Download PDF</a>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ),
    }));

  return (
    <>
      <VideoHero videoUrl={cfg.heroVideoUrl}>
        <Container className="py-20 md:py-28">
          <Eyebrow>{REGION_LABELS[region]} · <Link href="/choose-your-location?next=evidence" className="underline">change</Link></Eyebrow>
          <H1>{cfg.title ?? "Evidence"}</H1>
          <p className="mt-4 max-w-2xl text-lg">{cfg.intro}</p>
        </Container>
      </VideoHero>

      <Section>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            {cfg.statImageUrl ? <Img src={cfg.statImageUrl} className="max-w-sm" /> : <p className="text-4xl font-semibold">{all.length}+ clinical publications</p>}
            {cfg.forefrontText && <p className="mt-6 max-w-md text-lg">{cfg.forefrontText}</p>}
          </div>
          <div className="space-y-4">
            {cfg.forefrontImageUrl && <Img src={cfg.forefrontImageUrl} className="w-full rounded" />}
            {cfg.forefrontImage2Url && <Img src={cfg.forefrontImage2Url} className="w-full rounded" />}
          </div>
        </div>
      </Section>

      {featured.length > 0 && (
        <Section className="bg-surface">
          <H2>{cfg.featuredTitle ?? "Featured publications"}</H2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {featured.map((p) => (
              <li key={p.id} className="rounded border border-border bg-background p-5">
                <Img src={p.imageUrl} className="mb-4 aspect-video w-full rounded object-cover" />
                <div className="text-xs font-semibold uppercase text-muted">{formatMonth(p.publishedOn)}</div>
                <div className="mt-2 font-medium">{p.title}</div>
                <a href={p.pdfUrl || p.url || "#"} target="_blank" rel="noopener" className="mt-3 inline-block text-sm underline">Read ›</a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="browse-by-product">
        <H2>{cfg.browseTitle ?? "Browse by product"}</H2>
        <div className="mt-8">
          {/* anchors so therapy pages can deep-link to a tab */}
          {products.map((p) => <span key={p.slug} id={p.slug} />)}
          <Tabs tabs={tabs} />
        </div>
      </Section>
    </>
  );
}
