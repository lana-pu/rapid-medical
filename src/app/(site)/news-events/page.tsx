import { getNews } from "@/lib/content";
import { Section, H1, Img, formatMonth } from "@/components/site/primitives";
import { E, EMedia } from "@/components/site/editable";

export const metadata = {
  title: "News & Events",
  description: "Stay updated on Rapid Medical™ news & events. Discover innovative devices & FDA clearances.",
};

export default async function NewsPage() {
  const items = await getNews();
  const [latest, ...rest] = items;

  return (
    <Section>
      <H1>News &amp; Events</H1>

      {latest && (
        <div className="mt-10 grid gap-6 rounded border border-border p-6 md:grid-cols-2">
          <EMedia r="news" id={latest.id} f="imageUrl"><Img src={latest.imageUrl} className="aspect-video w-full rounded object-cover" /></EMedia>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">Latest news</div>
            <div className="mt-2 text-sm text-muted">{formatMonth(latest.publishedOn)}</div>
            <h2 className="mt-2 text-xl font-medium"><E r="news" id={latest.id} f="title">{latest.title}</E></h2>
            <a href={latest.url} target="_blank" rel="noopener" className="mt-4 inline-block underline">Continue reading →</a>
          </div>
        </div>
      )}

      <ul className="mt-12 divide-y divide-border">
        {rest.map((n) => (
          <li key={n.id} className="flex flex-col gap-1 py-4 md:flex-row md:items-baseline md:gap-6">
            <span className="w-28 flex-none text-sm text-muted">{formatMonth(n.publishedOn)}</span>
            <span className="flex-1"><E r="news" id={n.id} f="title">{n.title}</E></span>
            <a href={n.url} target="_blank" rel="noopener" className="flex-none text-sm underline">Read more</a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
