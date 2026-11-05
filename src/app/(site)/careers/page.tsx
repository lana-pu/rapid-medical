import { getSetting } from "@/lib/settings";
import { getJobs } from "@/lib/content";
import { Section, Container, H1, H2, Btn, Img } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { ContactForm } from "@/components/site/ContactForm";
import { E, EMedia } from "@/components/site/editable";
import { Gallery, Principles } from "@/components/site/blocks/Blocks";

export const metadata = { title: "Career Opportunities", description: "Explore job opportunities at Rapid Medical. Join us!" };

type Careers = {
  heroTitle?: string; heroSub?: string; heroBody?: string; heroImageUrl?: string; heroVideoUrl?: string;
  quotes?: { quote: string; author?: string; imageUrl?: string }[];
  principlesTitle?: string; principlesBody?: string; principlesImageUrl?: string; principles?: { title: string; body: string }[]; eeoStatement?: string;
};

export default async function CareersPage() {
  const [c, jobs] = await Promise.all([getSetting<Careers>("careers"), getJobs()]);
  const R = { r: "settings:careers" } as const;

  return (
    <>
      <VideoHero videoUrl={c.heroVideoUrl} poster={c.heroImageUrl}>
        <Container className="py-20 md:py-32">
          <H1><E {...R} f="heroTitle">{c.heroTitle ?? "Unlock your potential"}</E></H1>
          {c.heroSub && <p className="mt-4 text-xl"><E {...R} f="heroSub">{c.heroSub}</E></p>}
          {c.heroBody && <p className="mt-4 max-w-3xl opacity-90"><E {...R} f="heroBody">{c.heroBody}</E></p>}
          <div className="mt-6"><Btn href="/open-positions">View open positions{jobs.length ? ` (${jobs.length})` : ""}</Btn></div>
        </Container>
      </VideoHero>

      {c.quotes && c.quotes.length > 0 && (
        <Section>
          <Gallery items={c.quotes} render={(i, part) => <E {...R} f={`quotes.${i}.${part}`}>{c.quotes![i][part]}</E>} />
        </Section>
      )}

      <Section className="bg-surface">
        <H2><E {...R} f="principlesTitle">{c.principlesTitle ?? "Our guiding principles"}</E></H2>
        {c.principlesBody && <p className="mt-3 text-muted"><E {...R} f="principlesBody">{c.principlesBody}</E></p>}
        {c.principlesImageUrl && <EMedia {...R} f="principlesImageUrl" className="mx-auto mt-8 max-w-xl"><Img src={c.principlesImageUrl} className="w-full" /></EMedia>}
        {c.principles && c.principles.length > 0 && <div className="mt-10"><Principles items={c.principles} render={(i, part) => <E {...R} f={`principles.${i}.${part}`}>{c.principles![i][part]}</E>} /></div>}
      </Section>

      <Section id="general-interest">
        <H2>Submit general interest</H2>
        {c.eeoStatement && <p className="mt-4 max-w-3xl text-sm text-muted"><E {...R} f="eeoStatement">{c.eeoStatement}</E></p>}
        <div className="mt-8 max-w-2xl">
          <ContactForm form="careers" topics={["General interest", "Internship", "Other"]} compact />
        </div>
      </Section>
    </>
  );
}
