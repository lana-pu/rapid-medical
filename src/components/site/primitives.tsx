import Link from "next/link";
import type { ReactNode } from "react";

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

export function Btn({ href, children, variant = "primary", external }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; external?: boolean }) {
  const cls =
    variant === "primary"
      ? "inline-flex items-center rounded bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      : "inline-flex items-center rounded border border-foreground px-4 py-2 text-sm font-medium hover:bg-surface";
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

/** Placeholder-aware image: renders a neutral box when no URL is set. */
export function Img({ src, alt = "", className = "" }: { src?: string | null; alt?: string; className?: string }) {
  if (!src) return <div className={`bg-surface ${className}`} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

export function Prose({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`prose-rm ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function formatMonth(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
