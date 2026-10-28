import Link from "next/link";
import { regionOr404 } from "@/lib/region-param";
import { getPublications, getFeaturedPublications, getProducts } from "@/lib/content";
import { REGION_LABELS } from "@/lib/regions";
import { Section, H1, H2, Eyebrow, Img, formatMonth } from "@/components/site/primitives";

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  regionOr404((await params).seg);
  return { title: "Evidence", description: "Clinical research on neurovascular devices like Tigertriever, Comaneci & Drivewire." };
}

export default async function EvidencePage({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const [all, featured, products] = await Promise.all([getPublications(region), getFeaturedPublications(region), getProducts()]);

  return (
    <>
      <Section>
        <Eyebrow>{REGION_LABELS[region]} · <Link href="/choose-your-location?next=evidence" className="underline">change</Link></Eyebrow>
        <H1>Evidence</H1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Clinical &amp; scientific research play a pivotal role in understanding the effectiveness, safety, and long-term impact that our solutions have on patient outcomes.
        </p>
        <p className="mt-6 text-3xl font-semibold">{all.length}+ clinical publications</p>
      </Section>

      {featured.length > 0 && (
        <Section className="bg-surface">
          <H2>Latest</H2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {featured.map((p) => (
              <li key={p.id} className="rounded border border-border bg-background p-5">
                <Img src={p.imageUrl} className="mb-4 aspect-video w-full rounded object-cover" />
                <div className="text-xs font-semibold uppercase text-muted">{formatMonth(p.publishedOn)}</div>
                <div className="mt-2 font-medium">{p.title}</div>
                <a href={p.pdfUrl || p.url || "#"} target="_blank" rel="noopener" className="mt-3 inline-block text-sm underline">Read →</a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="browse-by-product">
        <H2>Browse by product</H2>
        <div className="mt-8 space-y-12">
          {products.map((prod) => {
            const list = all.filter((p) => p.productId === prod.id);
            if (!list.length) return null;
            return (
              <div key={prod.id} id={prod.slug}>
                <h3 className="border-b border-border pb-2 text-lg font-semibold">{prod.fullName}</h3>
                <ul className="divide-y divide-border">
                  {list.map((p) => (
                    <li key={p.id} className="flex flex-col gap-1 py-4 md:flex-row md:gap-6">
                      <span className="w-20 flex-none text-sm text-muted">{formatMonth(p.publishedOn)}</span>
                      <div className="flex-1">
                        <div className="font-medium">{p.title}</div>
                        {(p.authors || p.journal) && <div className="mt-1 text-sm text-muted">{[p.authors, p.journal].filter(Boolean).join(" · ")}</div>}
                        <div className="mt-1 flex gap-4 text-sm">
                          {p.url && <a href={p.url} target="_blank" rel="noopener" className="underline">{p.doi ? `doi:${p.doi}` : "Link"}</a>}
                          {p.pdfUrl && <a href={p.pdfUrl} target="_blank" rel="noopener" className="underline">PDF</a>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {(() => {
            const untagged = all.filter((p) => !p.productId);
            return untagged.length ? (
              <div>
                <h3 className="border-b border-border pb-2 text-lg font-semibold">Other</h3>
                <ul className="divide-y divide-border">
                  {untagged.map((p) => (
                    <li key={p.id} className="py-4"><span className="mr-4 text-sm text-muted">{formatMonth(p.publishedOn)}</span>{p.title}</li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}
        </div>
      </Section>
    </>
  );
}
