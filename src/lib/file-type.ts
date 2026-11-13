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

/** An SVG is a document that can run scripts: only plain drawings are taken. */
export function svgIsSafe(b: Buffer): boolean {
  const s = b.toString("utf8");
  return !/<script|<foreignObject|<iframe|<embed|<object|<!ENTITY|\son[a-z]+\s*=|javascript:|data:text\/html|<use\b[^>]*\bhref\s*=\s*(?:["'](?!#)|(?!["'#]))/i.test(s);
}
