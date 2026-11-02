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

export async function generateMetadata({ params }: { params: Promise<{ seg: string; slug: string }> }): Promise<Metadata> {
  const { seg, slug } = await params;
  const region = regionOr404(seg);
  const s = await getSolution(region, slug);
  if (!s) return {};
  return { title: s.metaTitle || `${s.navLabel} – ${REGION_SHORT[region]}`, description: s.metaDescription || s.heroBody.slice(0, 160) };
}

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

      {/* Benefits */}
      {s.benefits.length > 0 && (
        <Section className="bg-surface">
          <div className="space-y-20">
            {s.benefits.map((b, i) => (
              <div key={i} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
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
                <EMedia {...R} f={`benefits.${i}.imageUrl`} fv={`benefits.${i}.videoUrl`}><MediaBlock videoUrl={b.videoUrl} imageUrl={b.imageUrl} alt={b.title} /></EMedia>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tabs */}
      <Section id="overview">
        <Tabs
          hint="Click on a tab below to learn more."
          tabs={[
            {
              id: "overview",
              label: "Product overview",
              content: (
                <div>
                  <Eyebrow>Product overview</Eyebrow>
                  {s.overviewBody && <p className="max-w-3xl text-lg"><E {...R} f="overviewBody">{s.overviewBody}</E></p>}
                  {s.overviewImageUrl && <EMedia {...R} f="overviewImageUrl" className="mt-8"><Img src={s.overviewImageUrl} className="w-full rounded" /></EMedia>}
                  {s.specs && s.specs.columns.length > 0 ? (
                    <div className="mt-10">
                      <Eyebrow>Specifications</Eyebrow>
                      <SpecTableView t={s.specs} />
                      {(s.specs.note || s.specNote) && <p className="mt-2 text-xs italic text-muted">{s.specs.note || s.specNote}</p>}
                    </div>
                  ) : s.specImageUrls.length > 0 ? (
                    <div className="mt-10">
                      <Eyebrow>Specifications</Eyebrow>
                      {s.specImageUrls.map((u, i) => <EMedia key={u} {...R} f={`specImageUrls.${i}`} className="mt-4"><Img src={u} className="w-full rounded border border-border" /></EMedia>)}
                      {s.specNote && <p className="mt-2 text-xs italic text-muted"><E {...R} f="specNote">{s.specNote}</E></p>}
                    </div>
                  ) : null}
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
                          <li key={i} className="rounded border border-border p-5">
                            {(st.videoUrl || st.imageUrl) && <EMedia {...R} f={`howItWorks.${i}.imageUrl`} fv={`howItWorks.${i}.videoUrl`} className="mb-4"><MediaBlock videoUrl={st.videoUrl} imageUrl={st.imageUrl} className="aspect-video object-cover" /></EMedia>}
                            <div className="text-3xl font-semibold text-muted">{i + 1}</div>
                            <div className="mt-2 font-medium"><E {...R} f={`howItWorks.${i}.title`}>{st.title}</E></div>
                            {st.body && <p className="mt-1 text-sm text-muted"><E {...R} f={`howItWorks.${i}.body`}>{st.body}</E></p>}
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
                        <div className="mb-8 rounded border border-border p-6">
                          <h3 className="text-lg font-semibold">Webinars</h3>
                          <p className="mt-1 text-sm text-muted">Physician-led webinars are available to view on-demand. To watch a recording, please submit a request.</p>
                          <div className="mt-4"><Btn href={`/${region}/webinars`} variant="secondary">Request to view</Btn></div>
                        </div>
                      )}
                      <ul className="grid gap-6 md:grid-cols-3">
                        {s.inPractice.map((p, i) => (
                          <li key={i} className="rounded border border-border p-5">
                            <EMedia {...R} f={`inPractice.${i}.imageUrl`} className="mb-4"><Img src={p.imageUrl} className="aspect-video w-full rounded object-cover" /></EMedia>
                            {(p.person || p.location) && <div className="text-sm font-medium"><E {...R} f={`inPractice.${i}.person`}>{p.person}</E>{p.person && p.location ? " – " : ""}<E {...R} f={`inPractice.${i}.location`}>{p.location}</E></div>}
                            <div className="mt-1 text-sm"><E {...R} f={`inPractice.${i}.title`}>{p.title}</E></div>
                            {p.linkUrl && p.linkUrl !== "#" && (
                              <a href={p.linkUrl} target={p.linkUrl.startsWith("/") ? undefined : "_blank"} rel="noopener" className="mt-3 inline-block text-sm underline">
                                {p.kind === "case" ? "View the case →" : p.kind === "recording" ? "Watch recording →" : "View testimonial →"}
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                      {actions}
                    </div>
                  ),
                }]
              : []),
            { id: "evidence", label: "Clinical evidence", content: null, href: evidenceHref },
          ]}
        />
      </Section>

      {(s.closingTitle || s.closingBody || s.closingEmbedUrl) && (
        <Section className="bg-surface">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              {s.closingTitle && <H2><E {...R} f="closingTitle">{s.closingTitle}</E></H2>}
              {s.closingBody && <p className="mt-3 text-muted"><E {...R} f="closingBody">{s.closingBody}</E></p>}
              <div className="mt-6"><Btn href={`/contact-us?region=${region}`}>Contact us</Btn></div>
            </div>
            {s.closingEmbedUrl && (/\.mp4(\?|$)/i.test(s.closingEmbedUrl) ? <Video src={s.closingEmbedUrl} /> : <Embed url={s.closingEmbedUrl} />)}
          </div>
        </Section>
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
