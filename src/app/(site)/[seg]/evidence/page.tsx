import Link from "next/link";
import { regionOr404 } from "@/lib/region-param";
import { getPublications, getFeaturedPublications, getProductsForRegion } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { REGION_LABELS } from "@/lib/regions";
import { Section, Container, H1, H2, Eyebrow, Img, Btn, formatMonth } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { Tabs } from "@/components/site/Tabs";
import { E, EMedia } from "@/components/site/editable";
import { StatBadge } from "@/components/site/blocks/Stats";
import { Carousel } from "@/components/site/blocks/Carousel";

type EvidenceSettings = {
  title?: string; intro?: string; heroVideoUrl?: string; statImageUrl?: string; statValue?: string; statLabel?: string; statIconUrl?: string;
  forefrontText?: string; forefrontImageUrl?: string; forefrontImage2Url?: string; featuredTitle?: string; browseTitle?: string;
};

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  regionOr404((await params).seg);
  return { title: "Evidence", description: "Clinical research on neurovascular devices like Tigertriever, Comaneci & Drivewire." };
}

export default async function EvidencePage({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const [all, featured, products, cfg] = await Promise.all([getPublications(region), getFeaturedPublications(region, 6), getProductsForRegion(region), getSetting<EvidenceSettings>("evidence")]);
  const latest = all.filter((p) => p.imageUrl).slice(0, 3);

  // A family tab (e.g. TIGERTRIEVER™) also lists sub-products that have no tab of their own in this region.
  const tabbed = new Set(products.map((p) => p.slug));
  const R = { r: "settings:evidence" } as const;
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
      sublabel: prod.fullName.replace(prod.name, "").replace(/^[\s™®–-]+/, "") || undefined,
      content: (
        <div>
          <h3 className="mb-2 text-lg font-semibold">{prod.fullName}</h3>
          <ul className="divide-y divide-border">
            {list.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 py-4 md:flex-row md:gap-6">
                <span className="w-20 flex-none text-sm text-muted">{formatMonth(p.publishedOn)}</span>
                <div className="flex-1">
                  <div className="font-medium"><E r="publications" id={p.id} f="title">{p.title}</E></div>
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
          <H1><E {...R} f="title">{cfg.title ?? "Evidence"}</E></H1>
          <p className="mt-4 max-w-2xl text-lg"><E {...R} f="intro">{cfg.intro}</E></p>
        </Container>
      </VideoHero>

      <Section>
        <div className="text-center">
          <StatBadge stat={{ value: cfg.statValue || `${all.length}+`, label: cfg.statLabel || "clinical publications", iconUrl: cfg.statIconUrl }} render={(part) => <E {...R} f={part === "value" ? "statValue" : "statLabel"}>{part === "value" ? cfg.statValue || `${all.length}+` : cfg.statLabel || "clinical publications"}</E>} />
          {cfg.forefrontText && <p className="mx-auto mt-8 max-w-xl text-lg italic text-accent"><E {...R} f="forefrontText">{cfg.forefrontText}</E></p>}
        </div>
        {featured.length > 0 && (
          <div className="mt-10">
            <Carousel ariaLabel="Featured publications">
              {featured.map((p) => (
                <article key={p.id} className="grid gap-6 rounded border border-border bg-surface p-6 md:grid-cols-2 md:p-10">
                  <EMedia r="publications" id={p.id} f="imageUrl"><Img src={p.imageUrl} className="aspect-video w-full rounded object-cover" /></EMedia>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted">{[p.journal, formatMonth(p.publishedOn)].filter(Boolean).join(" · ")}</div>
                    <h3 className="mt-2 text-xl font-semibold md:text-2xl"><E r="publications" id={p.id} f="title">{p.title}</E></h3>
                    {p.authors && <div className="mt-3 text-xs text-muted">{p.authors}</div>}
                    <div className="mt-6"><Btn href={p.pdfUrl || p.url || "#"} external>Read article</Btn></div>
                  </div>
                </article>
              ))}
            </Carousel>
          </div>
        )}
      </Section>

      {latest.length > 0 && (
        <Section className="bg-surface">
          <H2><E {...R} f="featuredTitle">{cfg.featuredTitle ?? "Featured publications"}</E></H2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {latest.map((p) => (
              <li key={p.id} className="rounded border border-border bg-background p-5">
                <EMedia r="publications" id={p.id} f="imageUrl" className="mb-4"><Img src={p.imageUrl} className="aspect-video w-full rounded object-cover" /></EMedia>
                <div className="text-xs font-semibold uppercase text-muted">{formatMonth(p.publishedOn)}</div>
                <div className="mt-2 font-medium"><E r="publications" id={p.id} f="title">{p.title}</E></div>
                <a href={p.pdfUrl || p.url || "#"} target="_blank" rel="noopener" className="mt-3 inline-block text-sm underline">Read ›</a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="browse-by-product">
        <H2><E {...R} f="browseTitle">{cfg.browseTitle ?? "Browse by product"}</E></H2>
        <div className="mt-8">
          {/* anchors so therapy pages can deep-link to a tab */}
          {products.map((p) => <span key={p.slug} id={p.slug} />)}
          <Tabs tabs={tabs} />
        </div>
      </Section>
    </>
  );
}
