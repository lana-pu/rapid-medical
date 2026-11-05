import type { ReactNode } from "react";
import type { Feature, AnnotatedImage as AnnotatedImageT, InPracticeItem } from "@/db";
import { Img, Btn } from "../primitives";
import { Video } from "../Media";

/* Small server-rendered blocks that mirror the widgets on the current site. */

/** Icon + title + text, 2×2 (product overview). */
export function FeatureGrid({ items, render }: { items: Feature[]; render?: (f: Feature, i: number, part: "title" | "body") => ReactNode }) {
  return (
    <ul className="grid gap-8 md:grid-cols-2">
      {items.map((f, i) => (
        <li key={i} className="flex gap-5">
          {f.iconUrl ? <Img src={f.iconUrl} alt="" className="h-20 w-20 flex-none rounded-full object-cover" /> : <span className="h-20 w-20 flex-none rounded-full bg-surface" />}
          <div>
            <h4 className="font-semibold text-accent">{render ? render(f, i, "title") : f.title}</h4>
            <p className="mt-1 text-sm">{render ? render(f, i, "body") : f.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Image with numbered markers and a legend (device diagrams, instead of text baked into the picture). */
export function AnnotatedImage({ a, render }: { a: AnnotatedImageT; render?: (i: number, part: "label") => ReactNode }) {
  return (
    <figure>
      <div className="relative">
        <Img src={a.imageUrl} alt={a.caption ?? ""} className="w-full rounded" sizes="100vw" />
        {a.markers.map((m, i) => (
          <span key={i} className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground shadow" style={{ left: `${m.x}%`, top: `${m.y}%` }} title={m.label}>
            {i + 1}
          </span>
        ))}
      </div>
      <figcaption className="mt-3">
        {a.caption && <div className="text-sm text-muted">{a.caption}</div>}
        <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 md:grid-cols-3">
          {a.markers.map((m, i) => (
            <li key={i} className="flex gap-2"><span className="font-semibold text-accent">{i + 1}.</span><span>{render ? render(i, "label") : m.label}</span></li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}

/** In-Practice entries as on the current site: round thumbnail, "Name | Location", title, link. */
export function PracticeList({ items, render }: { items: InPracticeItem[]; render?: (p: InPracticeItem, i: number, part: "person" | "location" | "title") => ReactNode }) {
  const linkLabel = (p: InPracticeItem) => (p.kind === "case" ? "View the case →" : p.kind === "recording" ? "Watch recording →" : "Read more →");
  return (
    <ul className="divide-y divide-border">
      {items.map((p, i) => (
        <li key={i} className="flex items-center gap-6 py-6">
          <Img src={p.imageUrl} className="h-20 w-20 flex-none rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            {(p.person || p.location) && (
              <div className="font-semibold uppercase tracking-wide">
                {render ? render(p, i, "person") : p.person}
                {p.person && p.location ? <span className="font-normal text-muted"> | </span> : null}
                <span className="font-normal italic normal-case text-muted">{render ? render(p, i, "location") : p.location}</span>
              </div>
            )}
            <div className="mt-1 text-muted">{render ? render(p, i, "title") : p.title}</div>
            {p.linkUrl && p.linkUrl !== "#" && (
              <a href={p.linkUrl} target={p.linkUrl.startsWith("/") ? undefined : "_blank"} rel="noopener" className="mt-2 inline-block text-sm font-medium text-accent underline">{linkLabel(p)}</a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Full-width band with a background image/video, text and an optional button. */
export function Banner({ imageUrl, videoUrl, title, body, cta, align = "center", children }: { imageUrl?: string | null; videoUrl?: string | null; title?: ReactNode; body?: ReactNode; cta?: { label: string; href: string }; align?: "center" | "left"; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-neutral-900 text-white">
      {videoUrl ? <Video src={videoUrl} poster={imageUrl} background /> : imageUrl ? <Img src={imageUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" sizes="100vw" /> : null}
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div className={`relative mx-auto max-w-6xl px-4 py-20 md:py-28 ${align === "center" ? "text-center" : ""}`}>
        {title && <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>}
        {body && <p className={`mt-4 text-lg opacity-90 ${align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{body}</p>}
        {cta && <div className="mt-8"><Btn href={cta.href}>{cta.label}</Btn></div>}
        {children}
      </div>
    </section>
  );
}

/** Image grid with a caption overlay on hover (careers photos with employee quotes). */
export function Gallery({ items, render }: { items: { imageUrl?: string; quote?: string; author?: string }[]; render?: (i: number, part: "quote" | "author") => ReactNode }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {items.map((q, i) => (
        <li key={i} className="group relative overflow-hidden rounded">
          <Img src={q.imageUrl} className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" />
          {(q.quote || q.author) && (
            <figcaption className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              {q.quote && <blockquote className="text-lg">“{render ? render(i, "quote") : q.quote}”</blockquote>}
              {q.author && <div className="mt-2 text-sm opacity-90">– {render ? render(i, "author") : q.author}</div>}
            </figcaption>
          )}
        </li>
      ))}
    </ul>
  );
}

/** "WE ARE RAPID": one column per principle, first letter highlighted. */
export function Principles({ items, render }: { items: { title: string; body: string }[]; render?: (i: number, part: "title" | "body") => ReactNode }) {
  return (
    <ul className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
      {items.map((p, i) => (
        <li key={i} className="text-center">
          <h3 className="text-xl first-letter:font-bold first-letter:text-accent">{render ? render(i, "title") : p.title}</h3>
          <p className="mt-2 text-sm text-muted">{render ? render(i, "body") : p.body}</p>
        </li>
      ))}
    </ul>
  );
}
