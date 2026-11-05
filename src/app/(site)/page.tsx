import { getSetting } from "@/lib/settings";
import { getFeaturedNews } from "@/lib/content";
import { getRememberedRegion } from "@/lib/region-cookie";
import { Container, Section, H1, H2, Btn, formatMonth } from "@/components/site/primitives";
import { VideoHero, Video } from "@/components/site/Media";
import { E, EMedia } from "@/components/site/editable";
import { StatRow } from "@/components/site/blocks/Stats";
import { Banner } from "@/components/site/blocks/Blocks";

type Home = {
  heroLine1?: string; heroLine2?: string; heroSub?: string; heroBody?: string;
  heroCtaLabel?: string; heroCtaHref?: string; heroVideoUrl?: string;
  problemTitle?: string; problemVideoUrl?: string; stats?: { value: string; label: string; iconUrl?: string }[]; solutionLine?: string;
  engineeredTitle?: string; engineeredBody?: string; engineeredImageUrl?: string; newsTitle?: string;
};

export default async function HomePage() {
  const [home, news, region] = await Promise.all([getSetting<Home>("home"), getFeaturedNews(4), getRememberedRegion()]);
  const therapies = region ? `/${region}/therapies` : "/choose-your-location";
  const R = { r: "settings:home" } as const;

  return (
    <>
      <VideoHero videoUrl={home.heroVideoUrl}>
        <Container className="py-24 md:py-40">
          <H1>
            <E {...R} f="heroLine1">{home.heroLine1 ?? "EXPAND"}</E>
            <br />
            <E {...R} f="heroLine2">{home.heroLine2 ?? "WHAT’S POSSIBLE"}</E>
          </H1>
          {home.heroSub && <p className="mt-3 text-xl"><E {...R} f="heroSub">{home.heroSub}</E></p>}
          {home.heroBody && <p className="mt-4 max-w-xl opacity-90"><E {...R} f="heroBody">{home.heroBody}</E></p>}
          <div className="mt-8">
            <Btn href={home.heroCtaHref || therapies}><E {...R} f="heroCtaLabel" fh="heroCtaHref" k="link">{home.heroCtaLabel || "Explore Our Therapies"}</E></Btn>
          </div>
        </Container>
      </VideoHero>

      <Section>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            {home.problemTitle && <p className="max-w-xl text-2xl font-medium leading-snug"><E {...R} f="problemTitle">{home.problemTitle}</E></p>}
          </div>
          {home.problemVideoUrl && <EMedia {...R} f="problemVideoUrl"><Video src={home.problemVideoUrl} /></EMedia>}
        </div>
        {home.stats && home.stats.length > 0 && (
          <div className="mt-16"><StatRow items={home.stats} render={(s, i, part) => <E {...R} f={`stats.${i}.${part}`}>{s[part]}</E>} /></div>
        )}
        {home.solutionLine && <p className="mt-12 text-lg"><E {...R} f="solutionLine">{home.solutionLine}</E></p>}
        <div className="mt-6">
          <Btn href={region ? `/contact-us?region=${region}&topic=demo` : "/contact-us?topic=demo"} variant="secondary">Request a demo</Btn>
        </div>
      </Section>

      {(home.engineeredTitle || home.engineeredBody) && (
        <Banner imageUrl={home.engineeredImageUrl} title={home.engineeredTitle && <E {...R} f="engineeredTitle">{home.engineeredTitle}</E>} body={home.engineeredBody && <E {...R} f="engineeredBody">{home.engineeredBody}</E>} />
      )}

      <Section>
        <H2><E {...R} f="newsTitle">{home.newsTitle ?? "At the forefront of advancing stroke intervention"}</E></H2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {news.map((n) => (
            <li key={n.id} className="flex flex-col rounded border border-border bg-background p-5">
              <div className="text-xs text-muted">{formatMonth(n.publishedOn)}{n.source ? ` · ${n.source}` : ""}</div>
              <h3 className="mt-2 flex-1 font-medium"><E r="news" id={n.id} f="title">{n.title}</E></h3>
              <a href={n.url} target="_blank" rel="noopener" className="mt-4 inline-block text-sm font-medium text-accent underline">Continue reading →</a>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <Btn href="/news-events" variant="secondary">View all news ›</Btn>
        </div>
      </Section>
    </>
  );
}
