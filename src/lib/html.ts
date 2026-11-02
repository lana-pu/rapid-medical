import sanitizeHtml from "sanitize-html";
import { marked } from "marked";

/**
 * Rich-text content is stored as HTML (produced by the Tiptap editor in the
 * admin). Everything that reaches the page goes through `safeHtml`, so even
 * a compromised editor account cannot inject scripts.
 */

const ALLOWED = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote", "pre", "code",
    "ul", "ol", "li", "strong", "em", "u", "s", "sup", "sub", "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
    "video", "source", "iframe", "div", "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    video: ["src", "poster", "controls", "autoplay", "muted", "loop", "playsinline", "preload", "class"],
    source: ["src", "type"],
    iframe: ["src", "title", "allow", "allowfullscreen", "loading", "frameborder"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    col: ["width"],
    div: ["class", "data-youtube-video"],
    span: ["class"],
    "*": ["id"],
  },
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    a: (tag: string, attribs: Record<string, string>) => {
      const external = /^https?:\/\//.test(attribs.href ?? "") && !/rapid-medical\.com/.test(attribs.href ?? "");
      return { tagName: tag, attribs: external ? { ...attribs, target: "_blank", rel: "noopener" } : attribs };
    },
  },
} satisfies sanitizeHtml.IOptions;

export function safeHtml(html: string | null | undefined): string {
  if (!html) return "";
  // drop iframes whose src was stripped (disallowed host)
  return sanitizeHtml(html, ALLOWED).replace(/<iframe(?![^>]*\ssrc=)[^>]*>\s*<\/iframe>/gi, "");
}

/** True when a string looks like HTML (vs. legacy Markdown). */
export function looksLikeHtml(s: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|div|table|blockquote|video|iframe|img|figure)\b/i.test(s);
}

marked.setOptions({ gfm: true, breaks: true });

/**
 * One-off conversion for content authored as Markdown (seed files, legacy rows).
 * Supports the `@[video](url)` / `@[youtube](url)` shorthand used in seeds.
 */
export function markdownToHtml(src: string | null | undefined): string {
  if (!src) return "";
  if (looksLikeHtml(src)) return src;
  const pre = src
    .replace(/^@\[video\]\((\S+)\)\s*$/gm, (_m, url) => `<video class="rm-video" src="${url}" controls playsinline preload="metadata"></video>`)
    .replace(/^@\[youtube\]\((\S+)\)\s*$/gm, (_m, url) => {
      const id = youtubeId(url);
      return id ? `<div data-youtube-video class="rm-embed"><iframe src="https://www.youtube.com/embed/${id}" title="Video" loading="lazy" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>` : "";
    });
  return marked.parse(pre) as string;
}

export function youtubeId(url: string): string | null {
  const m = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{6,})/.exec(url);
  return m?.[1] ?? null;
}
