import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { getFeaturedNews } from "@/lib/content";
import { getRememberedRegion } from "@/lib/region-cookie";
import { Container, Section, H1, H2, Btn, Img, formatMonth } from "@/components/site/primitives";

type Home = {
  heroLine1?: string; heroLine2?: string; heroSub?: string; heroBody?: string;
  heroCtaLabel?: string; heroCtaHref?: string; heroVideoUrl?: string;
  problemTitle?: string; stats?: { value: string; label: string }[]; solutionLine?: string;
  engineeredTitle?: string; engineeredBody?: string; engineeredImageUrl?: string; newsTitle?: string;
};

export default async function HomePage() {
  const [home, news, region] = await Promise.all([getSetting<Home>("home"), getFeaturedNews(4), getRememberedRegion()]);
  const therapies = region ? `/${region}/therapies` : "/choose-your-location";

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        {home.heroVideoUrl && (
          <video className="absolute inset-0 h-full w-full object-cover opacity-20" src={home.heroVideoUrl} autoPlay muted loop playsInline aria-hidden />
        )}
        <Container className="relative py-24 md:py-36">
          <H1>
            {home.heroLine1 ?? "EXPAND"}
            <br />
            {home.heroLine2 ?? "WHAT’S POSSIBLE"}
          </H1>
          {home.heroSub && <p className="mt-3 text-xl">{home.heroSub}</p>}
          {home.heroBody && <p className="mt-4 max-w-xl text-muted">{home.heroBody}</p>}
          <div className="mt-8">
            <Btn href={home.heroCtaHref || therapies}>{home.heroCtaLabel || "Explore Our Therapies"}</Btn>
          </div>
        </Container>
      </section>

      <Section>
        {home.problemTitle && <p className="max-w-2xl text-lg">{home.problemTitle}</p>}
        {home.stats && home.stats.length > 0 && (
          <dl className="mt-10 grid gap-8 sm:grid-cols-3">
            {home.stats.map((s, i) => (
              <div key={i}>
                <dd className="text-5xl font-semibold tracking-tight">{s.value}</dd>
                <dt className="mt-1 text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
        {home.solutionLine && <p className="mt-10 text-lg">{home.solutionLine}</p>}
        <div className="mt-6">
          <Btn href={region ? `/contact-us?region=${region}&topic=demo` : "/contact-us?topic=demo"} variant="secondary">Request a demo</Btn>
        </div>
      </Section>

      {(home.engineeredTitle || home.engineeredBody) && (
        <Section className="bg-surface">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              {home.engineeredTitle && <H2>{home.engineeredTitle}</H2>}
              {home.engineeredBody && <p className="mt-4 text-muted">{home.engineeredBody}</p>}
            </div>
            <Img src={home.engineeredImageUrl} className="aspect-[4/3] w-full rounded object-cover" />
          </div>
        </Section>
      )}

      <Section>
        <H2>{home.newsTitle ?? "At the forefront of advancing stroke intervention"}</H2>
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {news.map((n) => (
            <li key={n.id} className="rounded border border-border p-5">
              <div className="text-xs text-muted">{formatMonth(n.publishedOn)}{n.source ? ` · ${n.source}` : ""}</div>
              <h3 className="mt-2 font-medium">{n.title}</h3>
              <a href={n.url} target="_blank" rel="noopener" className="mt-3 inline-block text-sm underline">Continue reading →</a>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link href="/news-events" className="text-sm underline">View all news →</Link>
        </div>
      </Section>
    </>
  );
}
