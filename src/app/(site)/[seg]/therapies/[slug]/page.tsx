import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { regionOr404 } from "@/lib/region-param";
import { getSolution, getSolutionRegions } from "@/lib/content";
import { md } from "@/lib/markdown";
import { REGION_SHORT } from "@/lib/regions";
import { Section, Container, H1, H2, Btn, Img, Prose, Eyebrow } from "@/components/site/primitives";

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
  const other = available.find((r) => r !== region);

  const actions = (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {s.actionLinks.map((a, i) => (
        <Btn key={i} href={a.href} variant={i === 0 ? "primary" : "secondary"}>{a.label}</Btn>
      ))}
      {s.actionNote && <span className="text-sm text-muted">{s.actionNote}</span>}
    </div>
  );

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <Container className="grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Eyebrow>
              {s.breadcrumb || `Our solutions / ${s.navLabel}`}
              {other && (
                <> · <Link href={`/${other}/therapies/${slug}`} className="underline">view {REGION_SHORT[other]} version</Link></>
              )}
            </Eyebrow>
            <H1>{s.heroTitle}</H1>
            {s.heroBody && <p className="mt-6 text-lg">{s.heroBody}</p>}
            {s.heroCta?.href && <div className="mt-8"><Btn href={s.heroCta.href}>{s.heroCta.label}</Btn></div>}
          </div>
          <Img src={s.heroImageUrl} className="aspect-[4/3] w-full rounded object-cover" />
        </Container>
      </section>

      {(s.introTitle || s.introBody) && (
        <Section>
          {s.introTitle && <H2>{s.introTitle}</H2>}
          {s.introBody && <p className="mt-4 max-w-3xl text-muted">{s.introBody}</p>}
        </Section>
      )}

      {/* Benefits */}
      {s.benefits.length > 0 && (
        <Section className="bg-surface">
          <div className="space-y-16">
            {s.benefits.map((b, i) => (
              <div key={i} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                <div>
                  {b.eyebrow && <Eyebrow>{b.eyebrow}</Eyebrow>}
                  <H2>{b.title}</H2>
                  <p className="mt-4 text-muted">{b.body}</p>
                  {b.footnote && <p className="mt-3 text-xs text-muted">{b.footnote}</p>}
                </div>
                <Img src={b.imageUrl} className="aspect-[4/3] w-full rounded object-cover" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tabs rendered as stacked sections – real tabs come with the design pass */}
      <Section id="overview">
        <Eyebrow>Product overview</Eyebrow>
        <H2>{s.overviewTitle}</H2>
        {s.overviewBody && <p className="mt-4 max-w-3xl">{s.overviewBody}</p>}
        <Img src={s.overviewImageUrl} className="mt-8 w-full rounded" />
        {s.specImageUrls.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold">Specifications</h3>
            {s.specImageUrls.map((u) => <Img key={u} src={u} className="mt-4 w-full rounded border border-border" />)}
            {s.specNote && <p className="mt-2 text-xs italic text-muted">{s.specNote}</p>}
          </div>
        )}
        {actions}
      </Section>

      {s.howItWorks.length > 0 && (
        <Section className="bg-surface" id="how-it-works">
          <Eyebrow>How it works</Eyebrow>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {s.howItWorks.map((st, i) => (
              <li key={i} className="rounded border border-border bg-background p-5">
                <div className="text-3xl font-semibold text-muted">{i + 1}</div>
                <div className="mt-2 font-medium">{st.title}</div>
                {st.body && <p className="mt-1 text-sm text-muted">{st.body}</p>}
                {st.imageUrl && <Img src={st.imageUrl} className="mt-4 w-full rounded" />}
              </li>
            ))}
          </ol>
          {actions}
        </Section>
      )}

      {(s.inPractice.length > 0 || s.webinarCtaEnabled) && (
        <Section id="in-practice">
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
                <a href={p.linkUrl} target="_blank" rel="noopener" className="mt-3 inline-block text-sm underline">
                  {p.kind === "case" ? "View the case →" : p.kind === "recording" ? "Watch recording →" : "View testimonial →"}
                </a>
              </li>
            ))}
          </ul>
          {actions}
        </Section>
      )}

      {s.product && (
        <Section className="bg-surface">
          <Eyebrow>Clinical evidence</Eyebrow>
          <p>See publications on {s.product.name} in <Link href={`/${region}/evidence#${s.product.slug}`} className="underline">Evidence</Link>.</p>
        </Section>
      )}

      {(s.closingTitle || s.closingBody) && (
        <Section>
          {s.closingTitle && <H2>{s.closingTitle}</H2>}
          {s.closingBody && <p className="mt-3 text-muted">{s.closingBody}</p>}
          <div className="mt-6"><Btn href={`/contact-us?region=${region}`}>Contact us</Btn></div>
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
