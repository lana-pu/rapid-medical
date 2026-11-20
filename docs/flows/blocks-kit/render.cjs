#!/usr/bin/env node
/* Wireframe snapshot of the real blocks: every rm-* node of the flows rendered by the site itself.
     node docs/flows/blocks-kit/render.cjs [dev server URL, default http://localhost:3000] [--asis --root <checkout>]
   Needs a running dev server of this project (npm run dev). Collects the units (an rm-page, or a single rm-<block>)
   from docs/flows/*.json and blocks-kit/examples.json, renders them on a temporary route (render-page.tsx), and writes
   docs/flows/rm-render.json: the compiled CSS scoped to .rmx (md:/lg: become container queries of the wireframe frame)
   and each unit's HTML with pictures, videos and maps as labelled grey boxes. Then make-pack.py puts it into pack.js.
   --asis: only the nodes of screens "as is", against a dev server of the code before the redesign → rm-render-asis.json
   (CSS scoped to .rmxa). Run it through ./render.sh, which also refreshes the examples and the pack. */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const WFKEY = require('./key.js');

const HERE = __dirname;
const FLOWS = path.resolve(HERE, '..');
const ROOT = path.resolve(FLOWS, '../..');
const ASIS = process.argv.includes('--asis');
const opt = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const URL_ = (process.argv.slice(2).find((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--root') || 'http://localhost:3000').replace(/\/$/, '');
const APP = path.resolve(opt('--root') || ROOT); // the checkout the dev server runs (--asis: the code before the redesign)
const SCOPE = ASIS ? '.rmxa' : '.rmx';
const OUT = path.join(FLOWS, ASIS ? 'rm-render-asis.json' : 'rm-render.json');
const META = JSON.parse(fs.readFileSync(path.join(FLOWS, 'rm-pages.json'), 'utf8')).meta;
const TYPES = new Set(META.map((m) => m.type));
const variantOf = (t) => ((META.find((m) => m.type === t) || { variants: [{ id: '' }] }).variants[0].id);

/* ---------- units ---------- */
const units = new Map();
const sources = fs.readdirSync(FLOWS).filter((f) => f.endsWith('.json') && !f.startsWith('rm-')).map((f) => path.join(FLOWS, f));
if (fs.existsSync(path.join(HERE, 'examples.json'))) sources.push(path.join(HERE, 'examples.json'));
function walk(o) {
  if (Array.isArray(o)) return o.forEach(walk);
  if (!o || typeof o !== 'object') return;
  const c = String(o.c || '');
  if (c === 'rm-page') {
    for (const s of WFKEY.segments(o, variantOf, (t) => TYPES.has(t))) {
      if (s.unit) units.set(WFKEY.key(s.unit), s.unit); else walk(s.node);
    }
    return;
  }
  if (c.startsWith('rm-') && TYPES.has(c.slice(3))) { const u = WFKEY.unit(o, variantOf); units.set(WFKEY.key(u), u); }
  Object.values(o).forEach(walk);
}
for (const f of sources) walk(JSON.parse(fs.readFileSync(f, 'utf8')));
for (const [k, u] of units) if (!!u.asis !== ASIS) units.delete(k);
const queue = [...units].map(([k, u]) => ({ k, page: u.page, blocks: u.blocks }));
for (const dir of new Set([HERE, path.join(APP, 'docs/flows/blocks-kit')])) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, '.queue.json'), JSON.stringify(queue)); }
console.log('units:', queue.length, 'from', sources.map((s) => path.basename(s)).join(', '));

/* ---------- in the browser: scope the CSS, grey the media, cut the units ---------- */
function extract(SCOPE) {
  const splitTop = (s) => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()).filter(Boolean); };
  const scope = (sel) => [...new Set(splitTop(sel).map((s) => /^(html|body|:root|:host)\b/.test(s) ? s.replace(/^(html|body|:root|:host)(\b|$)/, SCOPE) : SCOPE + ' ' + s))].join(', ');
  const widthOnly = (m) => /^\s*\(\s*(min-width|max-width|width)[^)]*\)(\s+and\s+\(\s*(min-width|max-width|width)[^)]*\))*\s*$/.test(m);
  const ser = (rules, nested) => [...rules].map((r) => {
    if (r instanceof CSSStyleRule) return nested ? r.cssText : `${scope(r.selectorText)} { ${r.style.cssText} ${r.cssRules ? ser(r.cssRules, true) : ''} }`;
    if (r instanceof CSSMediaRule) return `${widthOnly(r.media.mediaText) ? '@container frame' : '@media'} ${r.media.mediaText} { ${ser(r.cssRules, nested)} }`;
    if (r instanceof CSSSupportsRule) return `@supports ${r.conditionText} { ${ser(r.cssRules, nested)} }`;
    if (typeof CSSLayerBlockRule !== 'undefined' && r instanceof CSSLayerBlockRule) return `@layer ${r.name} { ${ser(r.cssRules, nested)} }`;
    return r.cssText; // @layer statements, @property, @keyframes, @font-face
  }).join('\n');
  let css = '';
  for (const s of document.styleSheets) { try { css += ser(s.cssRules, false) + '\n'; } catch (e) { /* cross-origin sheet */ } }

  const fileLabel = (u) => { try { return decodeURIComponent(new URL(u, location.href).pathname.split('/').pop() || u); } catch { return String(u); } };
  const box = (kind, label, w, h, shown) => {
    w = Math.max(1, Math.round(w || 16)); h = Math.max(1, Math.round(h || 9));
    const t = String(label).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).slice(0, 60);
    const fs_ = 12 * w / Math.max(shown || w, 1); // 12px as drawn on the page, whatever the file's own size
    return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="${fs_}" fill="#7d858e">${t ? kind + ' · ' + t : ''}</text></svg>`);
  };
  const toImg = (el, kind, label) => {
    const r = el.getBoundingClientRect();
    let w = el.naturalWidth || el.videoWidth || el.width?.baseVal?.value || Number(el.getAttribute('width')) || r.width;
    let h = el.naturalHeight || el.videoHeight || el.height?.baseVal?.value || Number(el.getAttribute('height')) || r.height;
    if (!w || !h || h < 24) { w = r.width || 1600; h = w * 9 / 16; } // the file did not load and the box has no size: 16:9
    const img = document.createElement('img');
    if (el.getAttribute('class')) img.setAttribute('class', el.getAttribute('class'));
    // keep the layout, not the picture: the blur placeholder of Img lives in the inline background
    if (el.getAttribute('style')) { img.setAttribute('style', el.getAttribute('style')); ['background', 'background-image', 'background-size', 'background-position', 'background-repeat'].forEach((k) => img.style.removeProperty(k)); }
    img.setAttribute('alt', el.getAttribute('alt') || '');
    img.setAttribute('data-wf-media', kind);
    img.setAttribute('src', box(kind, r.width >= 120 && r.height >= 40 ? label : '', w, h, r.width));
    el.replaceWith(img);
  };
  const out = {};
  for (const u of document.querySelectorAll('[data-wf-unit]')) {
    u.querySelectorAll('script, noscript').forEach((x) => x.remove());
    u.querySelectorAll('img:not([data-wf-media])').forEach((x) => toImg(x, 'image', fileLabel(x.currentSrc || x.getAttribute('src') || '') || x.alt || 'image'));
    u.querySelectorAll('video').forEach((x) => toImg(x, 'video', fileLabel(x.currentSrc || x.querySelector('source')?.src || x.getAttribute('src') || x.poster || 'video')));
    u.querySelectorAll('iframe').forEach((x) => toImg(x, 'embed', x.title || fileLabel(x.src)));
    u.querySelectorAll('canvas').forEach((x) => toImg(x, 'canvas', 'chart'));
    // a map (WorldMap: country outlines) is megabytes of paths; icons and charts are small and stay real
    u.querySelectorAll('svg').forEach((x) => { if (x.isConnected && x.outerHTML.length > 30000) toImg(x, 'map', x.getAttribute('aria-label') || 'world map'); });
    const err = u.querySelector('[data-wf-error]');
    if (err) { out[u.dataset.wfUnit] = { error: err.getAttribute('data-wf-error') }; continue; }
    const items = [];
    for (const it of u.querySelectorAll('[data-wf-item]')) {
      if (it.parentElement.closest('[data-wf-item]')) continue;
      const i = Number(it.dataset.wfItem); items[i] = it.innerHTML;
      const slot = document.createElement('wf-slot'); slot.setAttribute('data-i', String(i)); it.replaceWith(slot);
    }
    out[u.dataset.wfUnit] = items.length ? { shell: u.innerHTML, items } : { html: u.innerHTML };
  }
  return { css, units: out };
}

/* ---------- run ---------- */
(async () => {
  const route = path.join(APP, 'src/app/flows-render');
  fs.mkdirSync(route, { recursive: true });
  fs.copyFileSync(path.join(HERE, 'render-page.tsx'), path.join(route, 'page.tsx'));
  fs.copyFileSync(path.join(HERE, 'boundary.tsx'), path.join(route, 'boundary.tsx'));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let ok = false;
    for (let i = 0; i < 20 && !ok; i++) {
      const res = await page.goto(URL_ + '/flows-render', { waitUntil: 'networkidle', timeout: 240000 }).catch((e) => ({ status: () => String(e.message).slice(0, 80) }));
      ok = res.status() === 200;
      if (!ok) { console.log('waiting for the route…', res.status()); await new Promise((r) => setTimeout(r, 3000)); }
    }
    if (!ok) throw new Error('flows-render did not answer 200');
    // pictures below the fold load lazily: load them all, so each grey box keeps the picture's proportions
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((im) => { im.loading = 'eager'; }));
    await page.evaluate(async () => { await Promise.all([...document.images].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 8000); }))); });
    const got = await page.evaluate(extract, SCOPE);
    const missing = queue.filter((q) => !got.units[q.k]).map((q) => q.k);
    const failed = Object.entries(got.units).filter(([, v]) => v.error);
    const out = { snapshot: new Date().toISOString().slice(0, 10), css: got.css, units: got.units };
    fs.writeFileSync(OUT, JSON.stringify(out));
    console.log(`${path.basename(OUT)}: ${Object.keys(got.units).length} units, css ${Math.round(got.css.length / 1024)} KB, ${Math.round(JSON.stringify(out).length / 1024)} KB in all`);
    if (failed.length) { console.log('FAILED to render:'); failed.forEach(([k, v]) => console.log(' ', k, units.get(k).blocks.map((b) => b.type + '·' + b.variant).join(' '), '—', v.error)); }
    if (missing.length) { console.log('MISSING (not on the page):', missing.length); process.exitCode = 1; }
    if (failed.length) process.exitCode = 1;
  } finally {
    await browser.close();
    fs.rmSync(route, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); fs.rmSync(path.join(APP, 'src/app/flows-render'), { recursive: true, force: true }); process.exit(1); });
