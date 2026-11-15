import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { regionOr404 } from "@/lib/region-param";
import { getProductsForRegion, getPublication, getPublications } from "@/lib/content";
import { evidenceLists } from "@/blocks/from-settings";
import { idFromParam, publicationHref } from "@/lib/material";
import { safeHref } from "@/lib/safe-path";
import { REGION_LABELS } from "@/lib/regions";
import { Section, H1, Eyebrow, KeyValue, Btn, formatMonth } from "@/components/site/primitives";
import { ShareLinks } from "@/components/site/ShareLinks";

type Params = Promise<{ seg: string; pub: string }>;

async function load(params: Params) {
  const { seg, pub } = await params;
  const region = regionOr404(seg);
  const id = idFromParam(pub);
  const p = id ? await getPublication(region, id) : null;
  return { region, pub, p };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { p, region } = await load(params);
  if (!p) return {};
  return { title: `${p.title} – Evidence`, description: [p.journal, formatMonth(p.publishedOn), REGION_LABELS[region]].filter(Boolean).join(" · ") };
}

/** A local PDF can be shown on the page (same origin); one on another site is a link. */
const localPdf = (u: string | null | undefined) => !!u && /^\/uploads\/[^?#]+\.pdf(?:[?#].*)?$/i.test(u);

/**
 * A publication's own page (docs/screens/material.md, ADR-009; every record has one — decision 2026-11-15): the
 * record's facts on the left, the article on the right (the PDF shown here when it is ours, else the original),
 * other publications of the same product below.
 */
export default async function PublicationPage({ params }: { params: Params }) {
  const { region, pub, p } = await load(params);
  if (!p) notFound();
  const canonical = publicationHref(region, p);
  if (canonical !== `/${region}/evidence/${pub}`) permanentRedirect(canonical);

  // the same product groups as the Evidence archive (a family lists its sub-products without their own tab)
  const [all, products] = await Promise.all([getPublications(region), getProductsForRegion(region)]);
  const group = evidenceLists({ all, products, featured: [] }).groups.find((g) => g.items.some((x) => x.id === p.id));
  const more = (group?.items ?? []).filter((x) => x.id !== p.id).slice(0, 5);
  const pdf = p.pdfUrl ? safeHref(p.pdfUrl) : null;
  const original = p.url ? safeHref(p.url) : null;

  const rows = [
    ...(p.publishedOn ? [{ label: "Published", value: formatMonth(p.publishedOn) }] : []),
    ...(p.journal ? [{ label: "Journal", value: p.journal }] : []),
    ...(group ? [{ label: "Product", value: <Link href={`/${region}/evidence#${group.id}`} className="underline">{group.label}</Link> }] : []),
    ...(p.doi ? [{ label: "DOI", value: original ? <a href={original} target="_blank" rel="noopener noreferrer" className="break-all underline">{p.doi}</a> : p.doi }] : []),
  ];

  return (
    <>
      <Section>
        <Link href={`/${region}/evidence#browse-by-product`} className="text-sm underline">← Evidence</Link>
        <div className="mt-6">
          <Eyebrow>{["Publication", group?.label].filter(Boolean).join(" · ")}</Eyebrow>
          <H1 size="long" className="max-w-4xl">{p.title}</H1>
        </div>
        <div className="mt-8 grid gap-10 border-t border-border pt-8 md:grid-cols-12">
          <aside className="space-y-6 md:col-span-4">
            {rows.length > 0 && <KeyValue rows={rows} />}
            {p.authors && (
              <div className="text-sm">
                <div className="text-muted">Authors</div>
                <p className="mt-1">{p.authors}</p>
              </div>
            )}
            {(pdf || original) && (
              <ul className="space-y-1.5 text-sm">
                {pdf && pdf !== "#" && <li><a href={pdf} target="_blank" rel="noopener noreferrer" className="underline">Download PDF</a></li>}
                {original && original !== "#" && <li><a href={original} target="_blank" rel="noopener noreferrer" className="underline">Open the original ↗</a></li>}
              </ul>
            )}
            <ShareLinks title={p.title} />
          </aside>
          <div className="min-w-0 md:col-span-7 md:col-start-6">
            {pdf && localPdf(pdf) ? (
              // «embed the PDF» mode of the template: pages here, download beside
              <object data={pdf} type="application/pdf" aria-label={`${p.title} (PDF)`} className="h-[80vh] w-full rounded border border-border">
                <p className="p-6 text-sm">This browser cannot show the PDF here. <a href={pdf} className="underline">Download PDF</a></p>
              </object>
            ) : (
              <div className="rounded border border-border bg-surface p-6">
                <p>The full article is published {p.journal ? <>in <em>{p.journal}</em></> : "by its journal"}.</p>
                {(original && original !== "#") || (pdf && pdf !== "#") ? (
                  <div className="mt-4"><Btn href={(original && original !== "#" ? original : pdf)!} external>Read the article ↗</Btn></div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </Section>
      {group && more.length > 0 && (
        <Section className="bg-surface">
          <h2 className="text-xl font-semibold md:text-2xl">More about {group.label}</h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {more.map((m) => (
              <li key={m.id} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <span className="text-sm text-muted">{formatMonth(m.publishedOn)}</span>
                <div className="min-w-0">
                  <Link href={publicationHref(region, m)} className="font-medium hover:underline">{m.title}</Link>
                  {m.journal && <div className="mt-1 text-xs text-muted">{m.journal}</div>}
                </div>
              </li>
            ))}
          </ul>
          <Link href={`/${region}/evidence#${group.id}`} className="mt-4 inline-block text-sm underline">All {group.items.length} publications →</Link>
        </Section>
      )}
    </>
  );
}
