import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { getFeaturedNews } from "@/lib/content";
import { getRememberedRegion } from "@/lib/region-cookie";
import { Container, Section, H1, H2, Btn, Img, formatMonth } from "@/components/site/primitives";
import { VideoHero, Video } from "@/components/site/Media";

type Home = {
  heroLine1?: string; heroLine2?: string; heroSub?: string; heroBody?: string;
  heroCtaLabel?: string; heroCtaHref?: string; heroVideoUrl?: string;
  problemTitle?: string; problemVideoUrl?: string; stats?: { value: string; label: string }[]; solutionLine?: string;
  engineeredTitle?: string; engineeredBody?: string; engineeredImageUrl?: string; newsTitle?: string;
};

export default async function HomePage() {
  const [home, news, region] = await Promise.all([getSetting<Home>("home"), getFeaturedNews(4), getRememberedRegion()]);
  const therapies = region ? `/${region}/therapies` : "/choose-your-location";

  return (
    <>
      <VideoHero videoUrl={home.heroVideoUrl}>
        <Container className="py-24 md:py-40">
          <H1>
            {home.heroLine1 ?? "EXPAND"}
            <br />
            {home.heroLine2 ?? "WHAT’S POSSIBLE"}
          </H1>
          {home.heroSub && <p className="mt-3 text-xl">{home.heroSub}</p>}
          {home.heroBody && <p className="mt-4 max-w-xl opacity-90">{home.heroBody}</p>}
          <div className="mt-8">
            <Btn href={home.heroCtaHref || therapies}>{home.heroCtaLabel || "Explore Our Therapies"}</Btn>
          </div>
        </Container>
      </VideoHero>

      <Section>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            {home.problemTitle && <p className="max-w-xl text-2xl font-medium leading-snug">{home.problemTitle}</p>}
          </div>
          {home.problemVideoUrl && <Video src={home.problemVideoUrl} />}
        </div>
        {home.stats && home.stats.length > 0 && (
          <dl className="mt-16 grid gap-8 sm:grid-cols-3">
            {home.stats.map((s, i) => (
              <div key={i}>
                <dd className="text-5xl font-semibold tracking-tight">{s.value}</dd>
                <dt className="mt-1 text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        )}
        {home.solutionLine && <p className="mt-12 text-lg">{home.solutionLine}</p>}
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
            {home.engineeredImageUrl && <Img src={home.engineeredImageUrl} className="aspect-[4/3] w-full rounded object-cover" />}
          </div>
        </Section>
      )}

      <Section>
        <H2>{home.newsTitle ?? "At the forefront of advancing stroke intervention"}</H2>
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {news.map((n) => (
            <li key={n.id} className="flex gap-4 rounded border border-border p-5">
              {n.imageUrl && <Img src={n.imageUrl} className="h-20 w-28 flex-none rounded object-cover" />}
              <div>
                <div className="text-xs text-muted">{formatMonth(n.publishedOn)}{n.source ? ` · ${n.source}` : ""}</div>
                <h3 className="mt-2 font-medium">{n.title}</h3>
                <a href={n.url} target="_blank" rel="noopener" className="mt-3 inline-block text-sm underline">Continue reading →</a>
              </div>
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
