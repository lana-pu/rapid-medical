import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { regionOr404 } from "@/lib/region-param";
import { getSolution, getSolutionRegions } from "@/lib/content";
import { safeHtml } from "@/lib/html";
import { REGION_SHORT } from "@/lib/regions";
import { Section, Container, H1, H2, Btn, Img, Prose, Eyebrow } from "@/components/site/primitives";
import { MediaBlock, Embed, VideoHero, Video } from "@/components/site/Media";
import { Tabs } from "@/components/site/Tabs";
import { SpecTableView } from "@/components/site/SpecTable";
import { E, EMedia } from "@/components/site/editable";
import { StatCircles } from "@/components/site/blocks/Stats";
import { BarChart } from "@/components/site/blocks/BarChart";
import { FeatureGrid, AnnotatedImage, PracticeList } from "@/components/site/blocks/Blocks";
import type { Chart } from "@/db";

export async function generateMetadata({ params }: { params: Promise<{ seg: string; slug: string }> }): Promise<Metadata> {
  const { seg, slug } = await params;
  const region = regionOr404(seg);
  const s = await getSolution(region, slug);
  if (!s) return {};
  return { title: s.metaTitle || `${s.navLabel} – ${REGION_SHORT[region]}`, description: s.metaDescription || s.heroBody.slice(0, 160) };
}

const isChart = (c: unknown): c is Chart => !!c && typeof c === "object" && Array.isArray((c as Chart).categories) && (c as Chart).categories.length > 0;

export default async function SolutionPage({ params }: { params: Promise<{ seg: string; slug: string }> }) {
  const { seg, slug } = await params;
  const region = regionOr404(seg);
  const [s, available] = await Promise.all([getSolution(region, slug), getSolutionRegions(slug)]);
  if (!s) notFound();
  const others = available.filter((r) => r !== region);
  const R = { r: "solutions", id: s.id } as const;

  const actions = (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {s.actionLinks.map((a, i) => (
        <Btn key={i} href={a.href} variant={i === 0 ? "primary" : "secondary"}><E {...R} f={`actionLinks.${i}.label`} fh={`actionLinks.${i}.href`} k="link">{a.label}</E></Btn>
      ))}
      {s.actionNote && <span className="text-sm text-muted"><E {...R} f="actionNote">{s.actionNote}</E></span>}
    </div>
  );

  const evidenceHref = `/${region}/evidence#${s.product?.slug ?? "browse-by-product"}`;
  const hasFeatures = s.overviewFeatures.length > 0;
  const annotated = s.annotatedImage?.imageUrl ? s.annotatedImage : null;
  const closingIsVideo = !!s.closingEmbedUrl && /\.mp4(\?|$)/i.test(s.closingEmbedUrl);
  const questions = s.closingBody?.replace(/^questions\?\s*/i, "") ?? "";

  return (
    <>
      {/* Hero */}
      <VideoHero videoUrl={s.heroVideoUrl} poster={s.heroVideoUrl ? s.heroImageUrl : null}>
        <Container className="grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Eyebrow>
              {s.breadcrumb || `Our solutions / ${s.navLabel}`}
              {others.map((o) => (
                <span key={o}> · <Link href={`/${o}/therapies/${slug}`} className="underline">{REGION_SHORT[o]} version</Link></span>
              ))}
            </Eyebrow>
            <H1><E {...R} f="heroTitle">{s.heroTitle}</E></H1>
            {s.heroBody && <p className="mt-6 text-lg"><E {...R} f="heroBody">{s.heroBody}</E></p>}
            {s.heroCta?.href && <div className="mt-8"><Btn href={s.heroCta.href}><E {...R} f="heroCta.label" fh="heroCta.href" k="link">{s.heroCta.label}</E></Btn></div>}
          </div>
          {!s.heroVideoUrl && <EMedia {...R} f="heroImageUrl" fv="heroVideoUrl"><Img src={s.heroImageUrl} className="w-full rounded object-contain" /></EMedia>}
        </Container>
      </VideoHero>

      {(s.introTitle || s.introBody || s.introVideoUrl || s.introImageUrl) && (
        <Section>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              {s.introTitle && <H2><E {...R} f="introTitle">{s.introTitle}</E></H2>}
              {s.introBody && <p className="mt-4 text-lg text-muted"><E {...R} f="introBody">{s.introBody}</E></p>}
            </div>
            {(s.introVideoUrl || s.introImageUrl) && <EMedia {...R} f="introImageUrl" fv="introVideoUrl"><MediaBlock videoUrl={s.introVideoUrl} imageUrl={s.introImageUrl} /></EMedia>}
          </div>
        </Section>
      )}

      {/* Benefit rows: text + media (proof points / chart / video / image), optional device photo */}
      {s.benefits.length > 0 && (
        <Section className="bg-surface">
          <div className="space-y-20">
            {s.benefits.map((b, i) => {
              const stats = b.stats?.filter((x) => x.value) ?? [];
              const chart = isChart(b.chart) ? b.chart : null;
              const hasMedia = stats.length > 0 || chart || b.videoUrl || b.imageUrl;
              const text = (
                <div>
                  {b.eyebrow && <Eyebrow><E {...R} f={`benefits.${i}.eyebrow`}>{b.eyebrow}</E></Eyebrow>}
                  <H2><E {...R} f={`benefits.${i}.title`}>{b.title}</E></H2>
                  {b.body && <p className="mt-4 text-muted"><E {...R} f={`benefits.${i}.body`}>{b.body}</E></p>}
                  {b.footnote && <p className="mt-3 text-sm text-muted"><E {...R} f={`benefits.${i}.footnote`}>{b.footnote}</E></p>}
                  {b.link?.href && (
                    <div className="mt-5">
                      <Btn href={b.link.href} variant="secondary"><E {...R} f={`benefits.${i}.link.label`} fh={`benefits.${i}.link.href`} k="link">{b.link.label}</E></Btn>
                    </div>
                  )}
                </div>
              );
              const media = hasMedia && (
                <div className="space-y-6">
                  {stats.length > 0 && (
                    <StatCircles
                      items={stats}
                      caption={b.statsCaption ? <E {...R} f={`benefits.${i}.statsCaption`}>{b.statsCaption}</E> : undefined}
                      render={(st, j, part) => <E {...R} f={`benefits.${i}.stats.${j}.${part}`}>{st[part]}</E>}
                    />
                  )}
                  {chart && <BarChart chart={chart} />}
                  {(b.videoUrl || b.imageUrl) && (
                    <EMedia {...R} f={`benefits.${i}.imageUrl`} fv={`benefits.${i}.videoUrl`}><MediaBlock videoUrl={b.videoUrl} imageUrl={b.imageUrl} alt={b.title} /></EMedia>
                  )}
                </div>
              );
              const secondary = b.secondaryImageUrl && (
                <EMedia {...R} f={`benefits.${i}.secondaryImageUrl`}><Img src={b.secondaryImageUrl} className="mx-auto max-h-64 w-auto object-contain" /></EMedia>
              );
              return secondary ? (
                <div key={i} className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr_0.8fr]">
                  {media}{text}{secondary}
                </div>
              ) : (
                <div key={i} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                  {text}{media}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Product tabs (pills; accordion on phones) */}
      <Section id="overview">
        <Tabs
          hint="Click on a tab below to learn more."
          tabs={[
            {
              id: "overview",
              label: "Product overview",
              content: (
                <div>
                  <Eyebrow>{s.overviewTitle || "Product overview"}</Eyebrow>
                  {s.overviewBody && <p className="max-w-3xl text-lg"><E {...R} f="overviewBody">{s.overviewBody}</E></p>}
                  {hasFeatures ? (
                    <div className="mt-8"><FeatureGrid items={s.overviewFeatures} render={(f, j, part) => <E {...R} f={`overviewFeatures.${j}.${part}`}>{f[part]}</E>} /></div>
                  ) : s.overviewImageUrl ? (
                    <EMedia {...R} f="overviewImageUrl" className="mt-8"><Img src={s.overviewImageUrl} className="w-full rounded" /></EMedia>
                  ) : null}

                  {(annotated || (s.specs && s.specs.columns.length > 0) || s.specImageUrls.length > 0) && (
                    <div className="mt-12">
                      <Eyebrow>Specifications</Eyebrow>
                      {annotated && <div className="mt-4"><AnnotatedImage a={annotated} render={(j) => <E {...R} f={`annotatedImage.markers.${j}.label`}>{annotated.markers[j].label}</E>} /></div>}
                      {s.specs && s.specs.columns.length > 0 ? (
                        <>
                          <SpecTableView t={s.specs} />
                          {(s.specs.note || s.specNote) && <p className="mt-2 text-xs italic text-muted">*{s.specs.note || s.specNote}</p>}
                        </>
                      ) : (
                        <>
                          {s.specImageUrls.filter((u) => !annotated || u !== annotated.imageUrl).map((u, j) => <EMedia key={u} {...R} f={`specImageUrls.${j}`} className="mt-4"><Img src={u} className="w-full rounded border border-border" /></EMedia>)}
                          {s.specNote && <p className="mt-2 text-xs italic text-muted"><E {...R} f="specNote">{s.specNote}</E></p>}
                        </>
                      )}
                    </div>
                  )}
                  {actions}
                </div>
              ),
            },
            ...(s.howItWorks.length
              ? [{
                  id: "how",
                  label: "How it works",
                  content: (
                    <div>
                      <Eyebrow>How it works</Eyebrow>
                      <ol className="grid gap-6 md:grid-cols-3">
                        {s.howItWorks.map((st, i) => (
                          <li key={i}>
                            <div className="mb-3 text-sm"><span className="font-semibold text-accent">{i + 1}. <E {...R} f={`howItWorks.${i}.title`}>{st.title}</E></span>{st.body && <span className="text-muted"> <E {...R} f={`howItWorks.${i}.body`}>{st.body}</E></span>}</div>
                            {(st.videoUrl || st.imageUrl) && <EMedia {...R} f={`howItWorks.${i}.imageUrl`} fv={`howItWorks.${i}.videoUrl`}><MediaBlock videoUrl={st.videoUrl} imageUrl={st.imageUrl} className="aspect-video object-cover" /></EMedia>}
                          </li>
                        ))}
                      </ol>
                      {actions}
                    </div>
                  ),
                }]
              : []),
            ...(s.inPractice.length || s.webinarCtaEnabled
              ? [{
                  id: "practice",
                  label: "In-Practice",
                  content: (
                    <div>
                      <Eyebrow>In practice</Eyebrow>
                      {s.webinarCtaEnabled && (
                        <div className="relative mb-6 overflow-hidden rounded bg-neutral-900 px-6 py-10 text-center text-white">
                          <h3 className="text-xl font-semibold uppercase tracking-wide">Webinars</h3>
                          <p className="mx-auto mt-2 max-w-xl text-sm opacity-90">Physician-led webinars are available to view on-demand. To watch a recording, please submit a request.</p>
                          <div className="mt-5"><Btn href={`/${region}/webinars`}>Request to view</Btn></div>
                        </div>
                      )}
                      <PracticeList items={s.inPractice} render={(p, i, part) => <E {...R} f={`inPractice.${i}.${part}`}>{p[part]}</E>} />
                      {actions}
                    </div>
                  ),
                }]
              : []),
            { id: "evidence", label: "Clinical evidence", content: null, href: evidenceHref },
          ]}
        />
      </Section>

      {/* Statement band (+ video) */}
      {(s.closingTitle || s.closingEmbedUrl) && (
        <section className="relative overflow-hidden bg-neutral-900 py-16 text-white md:py-24">
          {closingIsVideo && <Video src={s.closingEmbedUrl} background />}
          <Container className="relative text-center">
            {s.closingTitle && <h2 className="text-2xl font-medium md:text-3xl"><E {...R} f="closingTitle">{s.closingTitle}</E></h2>}
            {s.closingEmbedUrl && !closingIsVideo && <div className="mx-auto mt-10 max-w-3xl"><Embed url={s.closingEmbedUrl} /></div>}
          </Container>
        </section>
      )}

      {/* Questions band */}
      {s.closingBody && (
        <section className="bg-black py-12 text-white">
          <Container className="flex flex-wrap items-center gap-6 md:gap-12">
            <h2 className="text-3xl font-light uppercase tracking-wide">Questions?</h2>
            <p className="max-w-md flex-1 text-sm opacity-90"><E {...R} f="closingBody">{questions}</E></p>
            <Btn href={`/contact-us?region=${region}`}>Contact us</Btn>
          </Container>
        </section>
      )}

      {(s.regulatoryHtml || s.referencesHtml) && (
        <section className="border-t border-border py-10">
          <Container>
            {s.regulatoryHtml && <E {...R} f="regulatoryHtml" k="rich"><Prose html={safeHtml(s.regulatoryHtml)} className="prose-rm-sm max-w-4xl" /></E>}
            {s.referencesHtml && <E {...R} f="referencesHtml" k="rich" className="mt-6"><Prose html={safeHtml(s.referencesHtml)} className="prose-rm-sm max-w-4xl" /></E>}
          </Container>
        </section>
      )}
    </>
  );
}
