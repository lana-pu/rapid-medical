/**
 * Structured data for search engines and AI assistants (schema.org, JSON-LD). Built from record fields only.
 * `<` is escaped so a value can never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }} />;
}

/** Plain text from stored HTML, for descriptions in structured data. */
export const plain = (html: string, max = 300) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
