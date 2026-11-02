import { getSetting } from "@/lib/settings";
import { getJobs } from "@/lib/content";
import { Section, Container, H1, H2, Btn, Img } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata = { title: "Career Opportunities", description: "Explore job opportunities at Rapid Medical. Join us!" };

type Careers = {
  heroTitle?: string; heroSub?: string; heroBody?: string; heroImageUrl?: string; heroVideoUrl?: string;
  quotes?: { quote: string; author?: string; imageUrl?: string }[];
  principlesTitle?: string; principlesBody?: string; principlesImageUrl?: string; eeoStatement?: string;
};

export default async function CareersPage() {
  const [c, jobs] = await Promise.all([getSetting<Careers>("careers"), getJobs()]);

  return (
    <>
      <VideoHero videoUrl={c.heroVideoUrl} poster={c.heroImageUrl}>
        <Container className="py-20 md:py-32">
          <H1>{c.heroTitle ?? "Unlock your potential"}</H1>
          {c.heroSub && <p className="mt-4 text-xl">{c.heroSub}</p>}
          {c.heroBody && <p className="mt-4 max-w-3xl opacity-90">{c.heroBody}</p>}
          <div className="mt-6"><Btn href="/open-positions">View open positions{jobs.length ? ` (${jobs.length})` : ""}</Btn></div>
        </Container>
      </VideoHero>

      {c.quotes && c.quotes.length > 0 && (
        <Section>
          <ul className="grid gap-10 md:grid-cols-2">
            {c.quotes.map((q, i) => (
              <li key={i}>
                <Img src={q.imageUrl} className="mb-5 aspect-video w-full rounded object-cover" />
                <blockquote className="text-lg">“{q.quote}”</blockquote>
                {q.author && <div className="mt-2 text-sm text-muted">– {q.author}</div>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section className="bg-surface">
        <H2>{c.principlesTitle ?? "Our guiding principles"}</H2>
        {c.principlesBody && <p className="mt-3 text-muted">{c.principlesBody}</p>}
        <Img src={c.principlesImageUrl} className="mt-8 w-full max-w-3xl" />
      </Section>

      <Section id="general-interest">
        <H2>Submit general interest</H2>
        {c.eeoStatement && <p className="mt-4 max-w-3xl text-sm text-muted">{c.eeoStatement}</p>}
        <div className="mt-8 max-w-2xl">
          <ContactForm form="careers" topics={["General interest", "Internship", "Other"]} compact />
        </div>
      </Section>
    </>
  );
}
