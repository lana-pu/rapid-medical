import { getSetting } from "@/lib/settings";
import { getJobs } from "@/lib/content";
import { Section, H1, H2, Btn, Img } from "@/components/site/primitives";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata = { title: "Careers", description: "Join Rapid Medical. Explore job opportunities." };

type Careers = {
  heroTitle?: string; heroSub?: string; heroBody?: string; heroImageUrl?: string;
  quotes?: { quote: string; imageUrl?: string }[];
  principlesTitle?: string; principlesBody?: string; principlesImageUrl?: string; eeoStatement?: string;
};

export default async function CareersPage() {
  const [c, jobs] = await Promise.all([getSetting<Careers>("careers"), getJobs()]);

  return (
    <>
      <Section>
        <H1>{c.heroTitle ?? "Unlock your potential"}</H1>
        {c.heroSub && <p className="mt-4 text-xl">{c.heroSub}</p>}
        {c.heroBody && <p className="mt-4 max-w-3xl text-muted">{c.heroBody}</p>}
        <div className="mt-6"><Btn href="/open-positions">View open positions{jobs.length ? ` (${jobs.length})` : ""}</Btn></div>
        <Img src={c.heroImageUrl} className="mt-10 aspect-[21/9] w-full rounded object-cover" />
      </Section>

      {c.quotes && c.quotes.length > 0 && (
        <Section className="bg-surface">
          <ul className="grid gap-8 md:grid-cols-2">
            {c.quotes.map((q, i) => (
              <li key={i} className="flex gap-4">
                <Img src={q.imageUrl} className="h-24 w-24 flex-none rounded object-cover" />
                <blockquote className="text-lg">“{q.quote}”</blockquote>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        <H2>{c.principlesTitle ?? "Our guiding principles"}</H2>
        {c.principlesBody && <p className="mt-3 text-muted">{c.principlesBody}</p>}
        <Img src={c.principlesImageUrl} className="mt-8 w-full max-w-3xl" />
      </Section>

      <Section className="bg-surface" id="general-interest">
        <H2>Submit general interest</H2>
        {c.eeoStatement && <p className="mt-4 max-w-3xl text-sm text-muted">{c.eeoStatement}</p>}
        <div className="mt-8 max-w-2xl">
          <ContactForm form="careers" topics={["General interest", "Internship", "Other"]} />
        </div>
      </Section>
    </>
  );
}
