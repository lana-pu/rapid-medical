import Link from "next/link";
import type { ReactNode } from "react";
import { lookupMedia } from "@/lib/media-lookup";

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

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">{children}</div>;
}

export function H1({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-3xl font-semibold leading-tight tracking-tight md:text-5xl ${className}`}>{children}</h1>;
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-2xl font-semibold leading-tight tracking-tight md:text-3xl ${className}`}>{children}</h2>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-2xl text-lg text-muted">{children}</p>;
}

export function Btn({ href, children, variant = "primary", external, onDark }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; external?: boolean; /** On a dark band: inverted colours (DESIGN.md → Btn). */ onDark?: boolean }) {
  const base = "inline-flex items-center rounded px-4 py-2 text-sm font-medium";
  const cls = onDark
    ? variant === "primary"
      ? `${base} bg-background text-foreground hover:opacity-90`
      : `${base} border border-background hover:bg-background/10`
    : variant === "primary"
      ? `${base} bg-accent text-accent-foreground hover:opacity-90`
      : `${base} border border-foreground hover:bg-surface`;
  if (external || href.startsWith("http") || href.startsWith("mailto:"))
    return (
      <a href={href} className={cls} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener">
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

export function Prose({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`prose-rm ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function formatMonth(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
