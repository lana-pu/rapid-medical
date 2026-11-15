import Link from "next/link";
import { Section, Prose, KeyValue } from "@/components/site/primitives";
import { safeHtml } from "@/lib/html";
import { F } from "./edit";
import type { BlockDef, BlockProps } from "./types";

export type RichTextVariant = "default" | "document";

export type RichTextData = {
  html: string;
  /** `document`: the other documents of the section (Legal: the footer's list), the current one marked. */
  related?: { label: string; href: string; current?: boolean }[];
};

const plain = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/\s+/g, " ").trim();
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "section";

/**
 * A long document as «shared line» (DESIGN.md → Текстовая страница): «Last revised» and «On this page» from the text
 * itself, the section's documents. Headings get anchors; a «Last Revised: …» heading moves to the rail.
 */
export function documentParts(html: string) {
  let lastRevised: string | null = null;
  let body = html.replace(/<h[1-6][^>]*>\s*(?:<[^>]+>\s*)*Last Revised:\s*([^<]+?)\s*(?:<\/[^>]+>\s*)*<\/h[1-6]>/i, (_, d: string) => {
    lastRevised = d.trim();
    return "";
  });
  const toc: { id: string; title: string }[] = [];
  const used = new Set<string>();
  body = body.replace(/<(h[2-6])([^>]*)>([\s\S]*?)<\/\1>/gi, (m, tag: string, attrs: string, inner: string) => {
    const title = plain(inner);
    if (!title) return m;
    let id = slug(title);
    for (let n = 2; used.has(id); n++) id = `${slug(title)}-${n}`;
    used.add(id);
    toc.push({ id, title });
    return `<${tag}${attrs.replace(/\sid="[^"]*"/i, "")} id="${id}" class="scroll-mt-24">${inner}</${tag}>`;
  });
  return { body, lastRevised: lastRevised as string | null, toc };
}

function RichText({ variant, data: d, edit: e, nested }: BlockProps<"richText">) {
  const html = safeHtml(d.html);
  if (variant === "document") {
    const { body, lastRevised, toc } = documentParts(html);
    const related = d.related ?? [];
    if (lastRevised || toc.length > 2 || related.length) {
      const inner = (
        <div className="mt-8 grid gap-10 border-t border-border pt-8 md:grid-cols-12">
          <aside className="md:col-span-4">
            <div className="space-y-8 md:sticky md:top-6">
              {lastRevised && <KeyValue rows={[{ label: "Last revised", value: lastRevised }]} />}
              {toc.length > 2 && (
                <nav aria-label="On this page" className="text-sm">
                  <div className="mb-2 font-medium">On this page</div>
                  <ol className="space-y-1.5">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-muted hover:text-foreground">{t.title}</a></li>)}</ol>
                </nav>
              )}
              {related.length > 0 && (
                <nav aria-label="Legal" className="text-sm">
                  <div className="mb-2 font-medium">Legal</div>
                  <ul className="space-y-1.5">
                    {related.map((r) => <li key={r.href}>{r.current ? <span className="font-medium" aria-current="page">{r.label}</span> : <Link href={r.href} className="text-muted hover:text-foreground">{r.label}</Link>}</li>)}
                  </ul>
                </nav>
              )}
            </div>
          </aside>
          <div className="min-w-0 md:col-span-7 md:col-start-6"><F e={e} k="html" kind="rich"><Prose html={body} /></F></div>
        </div>
      );
      return nested ? inner : <Section>{inner}</Section>;
    }
  }
  const inner = <F e={e} k="html" kind="rich" className="mt-8 max-w-3xl"><Prose html={html} /></F>;
  return nested ? inner : <Section>{inner}</Section>;
}

export const richText: BlockDef<"richText"> = {
  type: "richText",
  name: "Rich text",
  description: "Long formatted text: legal pages, articles, biographies.",
  category: "content",
  variants: [
    { id: "default", label: "Default", description: "Headings, paragraphs, lists, links, images" },
    { id: "document", label: "Document", description: "Long document: date, «On this page» and the section's documents on the left" },
  ],
  fields: [{ key: "html", label: "Text", kind: "rich", required: true }],
  example: {
    html: "<h2>Sample heading</h2><p>A paragraph of sample text with a <a href=\"/style-guide#richText\">link</a>.</p><h3>Sample subheading</h3><ul><li>First item</li><li>Second item</li></ul>",
  },
  Component: RichText,
  flow: () => true,
};
