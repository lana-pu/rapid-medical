import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

/**
 * Renders editor-authored Markdown to HTML.
 * Content comes only from authenticated admins; add sanitize-html here
 * if untrusted authors are ever allowed.
 */
export function md(src: string | null | undefined): string {
  if (!src) return "";
  return marked.parse(src) as string;
}
