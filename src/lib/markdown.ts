import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

/**
 * Renders editor-authored Markdown to HTML.
 *
 * Extensions:
 *   @[video](https://…/file.mp4)        → <video> (muted, looping, inline)
 *   @[youtube](https://youtu.be/ID)     → responsive <iframe>
 *
 * Content comes only from authenticated admins; add sanitize-html here
 * if untrusted authors are ever allowed.
 */
export function md(src: string | null | undefined): string {
  if (!src) return "";
  const pre = src
    .replace(/^@\[video\]\((\S+)\)\s*$/gm, (_m, url) => `<video class="rm-video" src="${url}" controls playsInline preload="metadata"></video>`)
    .replace(/^@\[youtube\]\((\S+)\)\s*$/gm, (_m, url) => {
      const id = youtubeId(url);
      return id ? `<div class="rm-embed"><iframe src="https://www.youtube.com/embed/${id}" title="Video" loading="lazy" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>` : "";
    });
  return marked.parse(pre) as string;
}

export function youtubeId(url: string): string | null {
  const m = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{6,})/.exec(url);
  return m?.[1] ?? null;
}
