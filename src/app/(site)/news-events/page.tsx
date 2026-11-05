import { getNews } from "@/lib/content";
import { Section, Container, H1, H2, Img, Btn, formatMonth } from "@/components/site/primitives";
import { VideoHero } from "@/components/site/Media";
import { E, EMedia } from "@/components/site/editable";
import { Carousel } from "@/components/site/blocks/Carousel";
import { NewsTimeline } from "@/components/site/blocks/NewsTimeline";

export const metadata = {
  title: "News & Events",
  description: "Stay updated on Rapid Medical™ news & events. Discover innovative devices & FDA clearances.",
};

export default async function NewsPage() {
  const items = await getNews();
  // "Latest news" slider: featured items, falling back to the newest ones
  const slides = (items.filter((n) => n.featured).length ? items.filter((n) => n.featured) : items).slice(0, 5);
  const timeline = items.map((n) => {
    const d = n.publishedOn ? new Date(n.publishedOn) : null;
    return { id: n.id, year: d ? d.getFullYear() : 0, date: d ? `${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}` : "", title: <E r="news" id={n.id} f="title">{n.title}</E>, url: n.url };
  });

  return (
    <>
      <VideoHero videoUrl={null}>
        <Container className="py-16 md:py-24">
          <H1>News &amp;<br />Events</H1>
        </Container>
      </VideoHero>

      {slides.length > 0 && (
        <Section>
          <H2 className="border-b border-accent pb-3 text-base font-medium uppercase tracking-widest">Latest news</H2>
          <div className="mt-8">
            <Carousel dots="left" arrows={false} ariaLabel="Latest news">
              {slides.map((n) => (
                <article key={n.id} className="grid items-center gap-8 md:grid-cols-[2fr_3fr]">
                  <EMedia r="news" id={n.id} f="imageUrl"><Img src={n.imageUrl} className="aspect-[4/3] w-full rounded bg-surface object-contain" /></EMedia>
                  <div>
                    <div className="text-sm text-accent">{formatMonth(n.publishedOn)}</div>
                    <h3 className="mt-2 text-2xl font-medium"><E r="news" id={n.id} f="title">{n.title}</E></h3>
                    <div className="mt-6"><Btn href={n.url} external>Continue reading</Btn></div>
                  </div>
                </article>
              ))}
            </Carousel>
          </div>
          <div className="mt-12 text-center"><a href="#all-news" className="text-sm text-accent underline">View all news ↓</a></div>
        </Section>
      )}

      <Section id="all-news" className="bg-surface">
        <NewsTimeline items={timeline} />
      </Section>
    </>
  );
}
