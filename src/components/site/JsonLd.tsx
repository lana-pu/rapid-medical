/**
 * Structured data for search engines and AI assistants (schema.org, JSON-LD). Built from record fields only.
 * `<` is escaped so a value can never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }} />;
}

/** Plain text from stored HTML, for descriptions in structured data. */
export const plain = (html: string, max = 300) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

const DEFAULT_SITE = "https://www.rapid-medical.com";

/** Canonical site origin; a malformed NEXT_PUBLIC_SITE_URL falls back to the default instead of breaking pages. */
export function siteUrl(): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL;
  if (!v) return DEFAULT_SITE;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : DEFAULT_SITE;
  } catch {
    return DEFAULT_SITE;
  }
}

/** Absolute http(s) URL for structured data, or undefined for an empty or malformed value (never throws). */
export function absUrl(u: string | null | undefined, base: string = siteUrl()): string | undefined {
  if (!u) return undefined;
  try {
    const parsed = new URL(u, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}
