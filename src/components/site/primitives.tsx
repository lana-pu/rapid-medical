import { lookupMedia } from "@/lib/media-lookup";

export { Container, Section, Eyebrow, H1, H2, Lead, Btn, KeyValue, Prose, formatMonth, SharedLine } from "./layout-primitives";

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

