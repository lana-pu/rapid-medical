import Link from "next/link";
import { regionOr404 } from "@/lib/region-param";
import { getSolutionsNav } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { REGION_LABELS } from "@/lib/regions";
import { Section, Container, H1, H2, Btn, Img, Eyebrow } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { E, EMedia } from "@/components/site/editable";

type Landing = {
  title?: string; intro?: string; heroVideoUrl?: string; note?: string;
  blocks?: { title: string; body: string; imageUrl?: string; links?: { label: string; href: string }[] }[];
  closingTitle?: string; closingBody?: string;
};

export async function generateMetadata({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  return { title: `Our Therapies – ${REGION_LABELS[region]}`, description: "Our devices enable real-time responses for stroke patients." };
}

export default async function TherapiesIndex({ params }: { params: Promise<{ seg: string }> }) {
  const region = regionOr404((await params).seg);
  const [landing, items] = await Promise.all([getSetting<Landing>(`therapies:${region}`), getSolutionsNav(region)]);
  const blocks = landing.blocks ?? [];
  const R = { r: `settings:therapies:${region}` } as const;

  return (
    <>
      <VideoHero videoUrl={landing.heroVideoUrl}>
        <Container className="py-20 md:py-28">
          <Eyebrow>{REGION_LABELS[region]} · <Link href="/choose-your-location" className="underline">change</Link></Eyebrow>
          <H1><E {...R} f="title">{landing.title ?? "Our Therapies"}</E></H1>
          {landing.intro && <p className="mt-6 max-w-3xl text-lg"><E {...R} f="intro">{landing.intro}</E></p>}
          {landing.note && <p className="mt-3 text-sm opacity-80"><E {...R} f="note">{landing.note}</E></p>}
        </Container>
      </VideoHero>

      {blocks.length > 0 ? (
        <Section>
          <div className="space-y-16">
            {blocks.map((b, i) => (
              <div key={i} className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <H2><E {...R} f={`blocks.${i}.title`}>{b.title}</E></H2>
                  <p className="mt-4 text-muted"><E {...R} f={`blocks.${i}.body`}>{b.body}</E></p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {b.links?.map((l, j) => <Btn key={l.href} href={l.href} variant="secondary"><E {...R} f={`blocks.${i}.links.${j}.label`} fh={`blocks.${i}.links.${j}.href`} k="link">{l.label}</E> →</Btn>)}
                  </div>
                </div>
                {b.imageUrl ? <EMedia {...R} f={`blocks.${i}.imageUrl`}><Img src={b.imageUrl} className="w-full rounded" /></EMedia> : <div />}
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section>
          <ul className="grid gap-6 md:grid-cols-2">
            {items.map((s) => (
              <li key={s.slug}>
                <Link href={`/${region}/therapies/${s.slug}`} className="group block rounded border border-border p-6 hover:bg-surface">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted">{s.navLabel}</div>
                  <h2 className="mt-1 text-xl font-medium group-hover:underline">{s.heroTitle}</h2>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section className="bg-surface">
        <H2><E {...R} f="closingTitle">{landing.closingTitle ?? "Questions?"}</E></H2>
        <p className="mt-3 text-muted"><E {...R} f="closingBody">{landing.closingBody ?? "Reach out to learn more about our company and stroke solutions."}</E></p>
        <div className="mt-6"><Btn href={`/contact-us?region=${region}`}>Contact us</Btn></div>
      </Section>
    </>
  );
}
