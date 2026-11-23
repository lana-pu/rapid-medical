/**
 * The selection colour in the editor comes from the real background behind the element (owner, 2026-11-23): today the
 * palette is black and white, on the live site it will be in colour, so no fixed colour works everywhere.
 * Rule (DESIGN.md → «Новая модель блоков» → выделение): take the nearest opaque background up the page; of the site's own
 * colours (tokens) use the accent when it stands out from it by at least 3:1 (WCAG, graphics), otherwise the token
 * that stands out most. The name tag's text is the token that stands out most from the selection colour.
 */

type RGB = [number, number, number];

const cache = new Map<string, { rgb: RGB; a: number }>();
let ctx: CanvasRenderingContext2D | null = null;

/** Any CSS colour (hex, rgb, oklch, a token's value) → sRGB and alpha, as the browser paints it. */
function paint(css: string): { rgb: RGB; a: number } {
  const hit = cache.get(css);
  if (hit) return hit;
  ctx ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return { rgb: [255, 255, 255], a: 1 };
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  const out = { rgb: [r, g, b] as RGB, a: a / 255 };
  cache.set(css, out);
  return out;
}

const lum = ([r, g, b]: RGB) => {
  const ch = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
export const contrast = (a: RGB, b: RGB) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/** The colour actually behind an element: its own background, else its parents' (the first one that is mostly opaque). */
export function backgroundOf(el: Element | null): RGB {
  for (let x = el; x; x = x.parentElement) {
    const c = paint(getComputedStyle(x).backgroundColor);
    if (c.a >= 0.5) return c.rgb;
  }
  return token("--background") ?? [255, 255, 255];
}

function token(name: string): RGB | null {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? paint(v).rgb : null;
}

const css = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;
const TOKENS = ["--accent", "--foreground", "--background", "--inverse", "--inverse-foreground"];

/** Selection colour and tag text colour for an element, from the background behind it. */
export function selectionColours(el: Element): { line: string; text: string } {
  const bg = backgroundOf(el);
  const all = TOKENS.map(token).filter((x): x is RGB => !!x);
  const accent = token("--accent");
  const best = (against: RGB) => all.reduce((a, b) => (contrast(b, against) > contrast(a, against) ? b : a), all[0] ?? [0, 0, 0]);
  const line = accent && contrast(accent, bg) >= 3 ? accent : best(bg);
  return { line: css(line), text: css(best(line)) };
}
