/**
 * What a file really is, from its first bytes — never from its name or from what the browser says
 * (docs/screens/admin-media.md, security check 2026-11-13). Only the types the media library takes.
 */
export type Sniffed = { mime: string; ext: string };

const starts = (b: Buffer, sig: number[], at = 0) => sig.every((x, i) => b[at + i] === x);

export function sniffType(b: Buffer): Sniffed | null {
  if (starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: ".png" };
  if (starts(b, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: ".jpg" };
  if (starts(b, [0x47, 0x49, 0x46, 0x38])) return { mime: "image/gif", ext: ".gif" };
  if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", ext: ".webp" };
  if (starts(b, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { mime: "application/pdf", ext: ".pdf" };
  if (starts(b, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: "video/webm", ext: ".webm" };
  if (starts(b, [0x66, 0x74, 0x79, 0x70], 4)) return { mime: "video/mp4", ext: ".mp4" }; // ISO media: mp4, m4v, mov
  const head = b.subarray(0, 1024).toString("utf8").replace(/^﻿/, "").trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return { mime: "image/svg+xml", ext: ".svg" };
  return null;
}

/**
 * An SVG is a document that can run scripts: only plain drawings are taken. Refused: script-like elements under any
 * namespace prefix, event handlers, links that are not «#…» or embedded pictures, SMIL that rewrites links, entity
 * declarations and numeric character references (they hide «javascript:» from simple checks). Served with a CSP
 * sandbox / as an attachment as well (next.config.ts, storage.ts) — this is the first line, not the only one.
 */
export function svgIsSafe(b: Buffer): boolean {
  const s = b.toString("utf8");
  const BAD = [
    /<\s*(?:[\w.-]+:)?(?:script|foreignobject|iframe|embed|object|handler|listener|animation)\b/i,
    /\son[a-z]+\s*=/i, // event handlers
    /<!ENTITY|<!DOCTYPE[^>]*\[/i, // entity declarations, internal subsets
    /&#|&[a-z]+;(?<!&amp;|&lt;|&gt;|&quot;|&apos;)/i, // character references other than the five basic ones
    /<\s*(?:[\w.-]+:)?(?:set|animate)\b[^>]*attributeName\s*=\s*["']?(?:[\w.-]+:)?href/i, // SMIL rewriting a link
    /\b(?:[\w.-]+:)?href\s*=\s*(?:"(?!#|data:image\/)[^"]*"|'(?!#|data:image\/)[^']*'|(?!["'#])\S)/i, // links: only #… or data:image
    /javascript:|vbscript:|data:text\//i,
  ];
  return !BAD.some((re) => re.test(s));
}
