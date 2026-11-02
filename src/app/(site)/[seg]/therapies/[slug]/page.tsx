import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { regionOr404 } from "@/lib/region-param";
import { getSolution, getSolutionRegions } from "@/lib/content";
import { md } from "@/lib/markdown";
import { REGION_SHORT } from "@/lib/regions";
import { Section, Container, H1, H2, Btn, Img, Prose, Eyebrow } from "@/components/site/primitives";
import { MediaBlock, Embed, VideoHero, Video } from "@/components/site/Media";
import { Tabs } from "@/components/site/Tabs";

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

  const actions = (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {s.actionLinks.map((a, i) => (
        <Btn key={i} href={a.href} variant={i === 0 ? "primary" : "secondary"}>{a.label}</Btn>
      ))}
      {s.actionNote && <span className="text-sm text-muted">{s.actionNote}</span>}
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
            <H1>{s.heroTitle}</H1>
            {s.heroBody && <p className="mt-6 text-lg">{s.heroBody}</p>}
            {s.heroCta?.href && <div className="mt-8"><Btn href={s.heroCta.href}>{s.heroCta.label}</Btn></div>}
          </div>
          {!s.heroVideoUrl && <Img src={s.heroImageUrl} className="w-full rounded object-contain" />}
        </Container>
      </VideoHero>

      {(s.introTitle || s.introBody || s.introVideoUrl || s.introImageUrl) && (
        <Section>
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              {s.introTitle && <H2>{s.introTitle}</H2>}
              {s.introBody && <p className="mt-4 text-lg text-muted">{s.introBody}</p>}
            </div>
            {(s.introVideoUrl || s.introImageUrl) && <MediaBlock videoUrl={s.introVideoUrl} imageUrl={s.introImageUrl} />}
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
                  {b.eyebrow && <Eyebrow>{b.eyebrow}</Eyebrow>}
                  <H2>{b.title}</H2>
                  {b.body && <p className="mt-4 text-muted">{b.body}</p>}
                  {b.footnote && <p className="mt-3 text-sm text-muted">{b.footnote}</p>}
                  {b.link?.href && (
                    <div className="mt-5">
                      <Btn href={b.link.href} variant="secondary">{b.link.label}</Btn>
                    </div>
                  )}
                </div>
                <MediaBlock videoUrl={b.videoUrl} imageUrl={b.imageUrl} alt={b.title} />
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
                  {s.overviewBody && <p className="max-w-3xl text-lg">{s.overviewBody}</p>}
                  {s.overviewImageUrl && <Img src={s.overviewImageUrl} className="mt-8 w-full rounded" />}
                  {s.specImageUrls.length > 0 && (
                    <div className="mt-10">
                      <Eyebrow>Specifications</Eyebrow>
                      {s.specImageUrls.map((u) => <Img key={u} src={u} className="mt-4 w-full rounded border border-border" />)}
                      {s.specNote && <p className="mt-2 text-xs italic text-muted">{s.specNote}</p>}
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
                          <li key={i} className="rounded border border-border p-5">
                            {(st.videoUrl || st.imageUrl) && <MediaBlock videoUrl={st.videoUrl} imageUrl={st.imageUrl} className="mb-4 aspect-video object-cover" />}
                            <div className="text-3xl font-semibold text-muted">{i + 1}</div>
                            <div className="mt-2 font-medium">{st.title}</div>
                            {st.body && <p className="mt-1 text-sm text-muted">{st.body}</p>}
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
                            <Img src={p.imageUrl} className="mb-4 aspect-video w-full rounded object-cover" />
                            {(p.person || p.location) && <div className="text-sm font-medium">{[p.person, p.location].filter(Boolean).join(" – ")}</div>}
                            <div className="mt-1 text-sm">{p.title}</div>
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
              {s.closingTitle && <H2>{s.closingTitle}</H2>}
              {s.closingBody && <p className="mt-3 text-muted">{s.closingBody}</p>}
              <div className="mt-6"><Btn href={`/contact-us?region=${region}`}>Contact us</Btn></div>
            </div>
            {s.closingEmbedUrl && (/\.mp4(\?|$)/i.test(s.closingEmbedUrl) ? <Video src={s.closingEmbedUrl} /> : <Embed url={s.closingEmbedUrl} />)}
          </div>
        </Section>
      )}

      {(s.regulatoryMd || s.referencesMd) && (
        <section className="border-t border-border py-10">
          <Container>
            {s.regulatoryMd && <Prose html={md(s.regulatoryMd)} className="prose-rm-sm max-w-4xl" />}
            {s.referencesMd && <Prose html={md(s.referencesMd)} className="prose-rm-sm mt-6 max-w-4xl" />}
          </Container>
        </section>
      )}
    </>
  );
}
