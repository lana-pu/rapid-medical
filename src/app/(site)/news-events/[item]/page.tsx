import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getNews, getNewsItem } from "@/lib/content";
import { idFromParam, newsHref } from "@/lib/material";
import { isExternalHref, safeHref } from "@/lib/safe-path";
import { newsOrigin } from "@/blocks/news";
import { Section, H1, Eyebrow, KeyValue, Btn, Img, formatMonth } from "@/components/site/primitives";
import { ShareLinks } from "@/components/site/ShareLinks";

type Params = Promise<{ item: string }>;

async function load(params: Params) {
  const { item } = await params;
  const id = idFromParam(item);
  return { item, n: id ? await getNewsItem(id) : null };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { n } = await load(params);
  if (!n) return {};
  return { title: `${n.title} – News & Events`, description: [formatMonth(n.publishedOn), n.source].filter(Boolean).join(" · ") };
}

/**
 * A news item's own page (docs/screens/material.md, ADR-009; every record has one — decision 2026-11-15). The full text
 * is not copied yet («Create from a document», BACKLOG п. 8): the page names the source and leads to the original.
 */
export default async function NewsItemPage({ params }: { params: Params }) {
  const { item, n } = await load(params);
  if (!n) notFound();
  const canonical = newsHref(n);
  if (canonical !== `/news-events/${item}`) permanentRedirect(canonical);

  const original = safeHref(n.url);
  const origin = newsOrigin(n) ?? "the original site";
  const others = (await getNews(5)).filter((x) => x.id !== n.id).slice(0, 4);
  const date = n.publishedOn ? new Date(n.publishedOn).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";

  return (
    <>
      <Section>
        <Link href="/news-events#all-news" className="text-sm underline">← News & Events</Link>
        <div className="mt-6">
          <Eyebrow>{["News", n.source].filter(Boolean).join(" · ")}</Eyebrow>
          <H1 size="long" className="max-w-4xl">{n.title}</H1>
        </div>
        <div className="mt-8 grid gap-10 border-t border-border pt-8 md:grid-cols-12">
          <aside className="space-y-6 md:col-span-4">
            <KeyValue rows={[...(date ? [{ label: "Published", value: date }] : []), { label: "Source", value: origin }]} />
            {original !== "#" && (
              <a href={original} {...(isExternalHref(original) ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="block text-sm underline">
                Originally published on {origin}{isExternalHref(original) ? " ↗" : ""}
              </a>
            )}
            <ShareLinks title={n.title} />
          </aside>
          <div className="min-w-0 md:col-span-7 md:col-start-6">
            {n.imageUrl && <Img src={n.imageUrl} className="mb-8 aspect-video w-full rounded bg-surface object-contain" />}
            {n.excerpt && <p className="text-lg">{n.excerpt}</p>}
            <div className="rounded border border-border bg-surface p-6">
              <p>The full release is published on {origin}.</p>
              {original !== "#" && <div className="mt-4"><Btn href={original} external={isExternalHref(original)}>Read the full release{isExternalHref(original) ? " ↗" : ""}</Btn></div>}
            </div>
          </div>
        </div>
      </Section>
      {others.length > 0 && (
        <Section className="bg-surface">
          <h2 className="text-xl font-semibold md:text-2xl">More news</h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {others.map((m) => (
              <li key={m.id} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <span className="text-sm text-muted">{formatMonth(m.publishedOn)}</span>
                <div className="min-w-0">
                  <Link href={newsHref(m)} className="font-medium hover:underline">{m.title}</Link>
                  {m.source && <div className="mt-1 text-xs text-muted">{m.source}</div>}
                </div>
              </li>
            ))}
          </ul>
          <Link href="/news-events#all-news" className="mt-4 inline-block text-sm underline">All news →</Link>
        </Section>
      )}
    </>
  );
}
