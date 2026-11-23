import Link from "next/link";
import type { ReactNode } from "react";
import { lookupMedia } from "@/lib/media-lookup";
import { buttonClass, type ButtonSize } from "./ui-classes";

/* Layout primitives – intentionally plain. Visual design is a later pass. */

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 ${className}`}>{children}</div>;
}

export function Section({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`py-12 md:py-16 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/** `as="span"`: inside a heading, so «Gain active» + «control» read as one heading (usability pass 2026-11-13). */
export function Eyebrow({ children, as = "div" }: { children: ReactNode; as?: "div" | "span" }) {
  const Tag = as;
  return <Tag className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted">{children}</Tag>;
}

/** `long`: a material's title (an article, a press release) — often two or three lines, one step smaller. */
export function H1({ children, className = "", size = "page" }: { children: ReactNode; className?: string; size?: "page" | "long" }) {
  const scale = size === "long" ? "text-2xl md:text-4xl" : "text-3xl md:text-5xl";
  return <h1 className={`font-semibold leading-tight tracking-tight ${scale} ${className}`}>{children}</h1>;
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-2xl font-semibold leading-tight tracking-tight md:text-3xl ${className}`}>{children}</h2>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-2xl text-lg text-muted">{children}</p>;
}

/** A link that looks like a button (DESIGN.md → Btn); the action twin is `Button` (ui.tsx), same classes. */
export function Btn({ href, children, variant = "primary", size = "md", external, onDark, track, className = "" }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; size?: ButtonSize; external?: boolean; /** On a dark band: inverted colours (DESIGN.md → Btn). */ onDark?: boolean; /** "out": a registration or application that leaves the site — counted for the Inbox (screens/admin-inbox.md). */ track?: "out"; className?: string }) {
  const cls = `${buttonClass({ variant, size, onDark })} ${className}`;
  if (external || href.startsWith("http") || href.startsWith("mailto:"))
    return (
      <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener" data-rm-out={track === "out" ? "" : undefined}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/**
 * Placeholder-aware image. For files from the media library it emits a
 * responsive WebP srcset, intrinsic size and a blur-up placeholder; other
 * URLs (external, legacy) render as a plain <img>.
 */
/** A library picture: responsive variants and its description from the media library (the `alt` given is the fallback). */
export async function Img({ src, alt = "", className = "", sizes = "(max-width: 768px) 100vw, 50vw", priority = false }: { src?: string | null; alt?: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) return <div className={`bg-surface ${className}`} aria-hidden />;
  const info = (await lookupMedia([src])).get(src);
  if (!info?.srcSet) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={info?.alt || alt} className={className} loading={priority ? "eager" : "lazy"} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={info.srcSet}
      sizes={sizes}
      width={info.width ?? undefined}
      height={info.height ?? undefined}
      alt={info.alt || alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={info.placeholder ? { backgroundImage: `url(${info.placeholder})`, backgroundSize: "cover" } : undefined}
    />
  );
}

/** Key — value rows with hairlines (DESIGN.md → «Таблица ключ — значение»): contacts, dates, short facts. */
export function KeyValue({ rows, footer }: { rows: { label: ReactNode; value: ReactNode }[]; footer?: ReactNode }) {
  return (
    <dl className="divide-y divide-border text-sm">
      {rows.map((r, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-muted">{r.label}</dt>
          <dd className="text-right">{r.value}</dd>
        </div>
      ))}
      {footer && <div className="pt-3">{footer}</div>}
    </dl>
  );
}

export function Prose({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`prose-rm ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function formatMonth(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * «Shared line» (DESIGN.md → Решения по страницам): a hairline, the section's name on the left (4/12) and its content
 * on the right (7/12), both starting level. On a phone the name stands above the content.
 */
export function SharedLine({ title, aside, children, id, className = "" }: { title?: ReactNode; /** under the name, e.g. «8 roles» */ aside?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <div id={id} className={`grid scroll-mt-16 gap-6 border-t border-border pt-8 md:grid-cols-12 md:gap-10 ${className}`}>
      <div className="md:col-span-4">
        {title && <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>}
        {aside && <div className="mt-2 text-sm text-muted">{aside}</div>}
      </div>
      <div className="min-w-0 md:col-span-7 md:col-start-6">{children}</div>
    </div>
  );
}
