#!/usr/bin/env node
/* Wireframe snapshot of the real blocks: every rm-* node of the flows rendered by the site itself.
     node docs/flows/blocks-kit/render.cjs [dev server URL, default http://localhost:3000] [--asis --root <checkout>]
   Needs a running dev server of this project (npm run dev). Collects the units (key.js: blocks, header/footer/banner,
   whole pages by path) from docs/flows/*.json and blocks-kit/examples.json, renders them on a temporary route
   (render-page.tsx) or opens the page itself, does a node's "act" steps there (a state), and writes
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
  if (WFKEY.chrome[c] || c === 'rm-route' || (c.startsWith('rm-') && TYPES.has(c.slice(3)))) { const u = WFKEY.unit(o, variantOf); units.set(WFKEY.key(u), u); }
  Object.values(o).forEach(walk);
}
for (const f of sources) walk(JSON.parse(fs.readFileSync(f, 'utf8')));
for (const [k, u] of units) if (!!u.asis !== ASIS) units.delete(k);
const queue = [...units].map(([k, u]) => Object.assign({ k }, u));
const what = (u) => u.route ? 'page ' + u.route : u.chrome ? u.chrome + ' ' + (u.region || u.suggested || '') + (u.act ? ' +act' : '') : u.blocks.map((b) => b.type + '·' + b.variant).join(' ');
for (const dir of new Set([HERE, path.join(APP, 'docs/flows/blocks-kit')])) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, '.queue.json'), JSON.stringify(queue)); }
console.log('units:', queue.length, 'from', sources.map((s) => path.basename(s)).join(', '));

/* ---------- in the browser: scope the CSS, grey the media, cut the units ---------- */
function cssOf(SCOPE) {
  const splitTop = (s) => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()).filter(Boolean); };
  // a hover state can be shown without a mouse: the pack marks the element with data-wf-hover ("state": {"hover": …})
  const hover = (s) => s.replace(/(?<!\\):hover\b/g, ':is(:hover, [data-wf-hover])');
  const scope = (sel) => [...new Set(splitTop(sel).map((s) => hover(/^(html|body|:root|:host)\b/.test(s) ? s.replace(/^(html|body|:root|:host)(\b|$)/, SCOPE) : SCOPE + ' ' + s)))].join(', ');
  const widthOnly = (m) => /^\s*\(\s*(min-width|max-width|width)[^)]*\)(\s+and\s+\(\s*(min-width|max-width|width)[^)]*\))*\s*$/.test(m);
  const ser = (rules, nested) => [...rules].map((r) => {
    if (r instanceof CSSStyleRule) return nested ? r.cssText : `${scope(r.selectorText)} { ${r.style.cssText} ${r.cssRules ? ser(r.cssRules, true) : ''} }`;
    if (r instanceof CSSMediaRule) return `${widthOnly(r.media.mediaText) ? '@container frame' : '@media'} ${r.media.mediaText} { ${ser(r.cssRules, nested)} }`;
    if (r instanceof CSSSupportsRule) return `@supports ${r.conditionText} { ${ser(r.cssRules, nested)} }`;
    if (typeof CSSLayerBlockRule !== 'undefined' && r instanceof CSSLayerBlockRule) return `@layer ${r.name} { ${ser(r.cssRules, nested)} }`;
    return r.cssText; // @layer statements, @property, @keyframes, @font-face
  }).join('\n');
  const sheets = [];
  for (const s of document.styleSheets) { try { sheets.push(ser(s.cssRules, false)); } catch (e) { /* cross-origin sheet */ } }
  return sheets;
}

function cut() {
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
    // what was typed or chosen lives in properties, not in the HTML: write it into the attributes
    u.querySelectorAll('input').forEach((x) => { if (x.type === 'checkbox' || x.type === 'radio') x.toggleAttribute('checked', x.checked); else if (x.type !== 'hidden' && x.type !== 'file') x.setAttribute('value', x.value); });
    u.querySelectorAll('textarea').forEach((x) => { x.textContent = x.value; });
    u.querySelectorAll('select').forEach((x) => [...x.options].forEach((o) => o.toggleAttribute('selected', o.selected)));
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
    if (u.hasAttribute('data-wf-modal')) { const d = u.querySelector('dialog[open]'); out[u.dataset.wfUnit] = d ? { html: d.outerHTML } : { error: 'the window did not open' }; continue; }
    out[u.dataset.wfUnit] = items.length ? { shell: u.innerHTML, items } : { html: u.innerHTML };
  }
  return out;
}

/* ---------- act: steps in the browser before the snapshot ---------- */
// {click: text} · {fill: [label, value]} · {select: [label, option]} · {pick: select name} (its first option) · {check: label} · {honeypot: true} (the forms'
// bot trap: the server answers «sent» and stores nothing) · {expect: text} (the state must show it) · {wait: ms}
async function act(page, root, steps) {
  for (const st of steps) {
    if (st.click) await root.getByRole('button', { name: st.click }).or(root.getByRole('link', { name: st.click })).or(root.getByText(st.click, { exact: true })).first().click({ timeout: 15000 });
    else if (st.fill) await root.getByLabel(st.fill[0]).or(root.getByPlaceholder(st.fill[0])).first().fill(st.fill[1], { timeout: 15000 });
    else if (st.select) await root.getByLabel(st.select[0]).first().selectOption({ label: st.select[1] }, { timeout: 15000 });
    else if (st.check) await root.getByLabel(st.check).first().check({ timeout: 15000 });
    else if (st.pick) await root.locator(`select[name="${st.pick}"]`).first().evaluate((el) => { const o = [...el.options].find((x) => x.value); if (o) { el.value = o.value; el.dispatchEvent(new Event('change', { bubbles: true })); } });
    else if (st.honeypot) await root.locator('input[name="website"]').first().evaluate((el) => { el.value = 'wireframe'; });
    else if (st.expect) await root.getByText(st.expect).first().waitFor({ timeout: 15000 });
    else if (st.wait) await page.waitForTimeout(st.wait);
  }
}
async function loadAll(page) {
  // pictures below the fold load lazily: load them all, so each grey box keeps the picture's proportions
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((im) => { im.loading = 'eager'; }));
  await page.evaluate(async () => { await Promise.all([...document.images].map((im) => im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 8000); }))); });
}
async function open(page, url) {
  for (let i = 0; i < 20; i++) {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 240000 }).catch((e) => ({ status: () => String(e.message).slice(0, 80) }));
    if (res.status() === 200) return;
    if (res.status() === 404 && !url.includes('/flows-render')) throw new Error(url + ': 404');
    console.log('waiting for', url, res.status()); await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(url + ' did not answer 200');
}
async function actOrFail(page, root, u) {
  if (!u.act) return;
  try { await act(page, root, u.act); } catch (e) {
    await root.evaluate((el, m) => el.setAttribute('data-wf-error', m), 'act ' + JSON.stringify(u.act) + ': ' + String(e.message).split('\n')[0]);
  }
}

/* ---------- run ---------- */
(async () => {
  const route = path.join(APP, 'src/app/flows-render');
  fs.mkdirSync(route, { recursive: true });
  fs.copyFileSync(path.join(HERE, 'render-page.tsx'), path.join(route, 'page.tsx'));
  fs.copyFileSync(path.join(HERE, 'boundary.tsx'), path.join(route, 'boundary.tsx'));
  fs.copyFileSync(path.join(HERE, ASIS ? 'modal-asis.tsx' : 'modal.tsx'), path.join(route, 'modal.tsx'));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await open(page, URL_ + '/flows-render');
    await loadAll(page);
    for (const u of queue.filter((q) => q.act && !q.route && q.chrome !== 'modal')) await actOrFail(page, page.locator(`[data-wf-unit="${u.k}"]`), u);
    const sheets = new Set(await page.evaluate(cssOf, SCOPE));
    const all = await page.evaluate(cut);
    // windows: each on its own load of the page, opened by a click on its link, as on the site
    for (const u of queue.filter((q) => q.chrome === 'modal')) {
      await open(page, URL_ + '/flows-render?only=' + u.k);
      const root = page.locator(`[data-wf-unit="${u.k}"]`);
      await root.locator('[data-wf-open]').click();
      await root.locator('dialog[open]').waitFor({ timeout: 15000 }).catch(() => {});
      await actOrFail(page, root, u);
      Object.assign(all, await page.evaluate(cut));
    }
    // whole pages: the page itself, its main part between the header and the footer
    for (const u of queue.filter((q) => q.route)) {
      try { await open(page, URL_ + u.route); } catch (e) { all[u.k] = { error: String(e.message) }; continue; }
      await loadAll(page);
      const main = page.locator('body > div.flex-1').first();
      await main.evaluate((el, k) => el.setAttribute('data-wf-unit', k), u.k);
      await actOrFail(page, main, u);
      for (const sh of await page.evaluate(cssOf, SCOPE)) sheets.add(sh);
      Object.assign(all, await page.evaluate(cut));
    }
    const css = [...sheets].join('\n');
    const missing = queue.filter((q) => !all[q.k]).map((q) => q.k);
    const failed = Object.entries(all).filter(([, v]) => v.error);
    const out = { snapshot: new Date().toISOString().slice(0, 10), css, units: all };
    fs.writeFileSync(OUT, JSON.stringify(out));
    console.log(`${path.basename(OUT)}: ${Object.keys(all).length} units, css ${Math.round(css.length / 1024)} KB, ${Math.round(JSON.stringify(out).length / 1024)} KB in all`);
    if (failed.length) { console.log('FAILED to render:'); failed.forEach(([k, v]) => console.log(' ', k, what(units.get(k)), '—', v.error)); }
    if (missing.length) { console.log('MISSING (not on the page):', missing.map((k) => what(units.get(k))).join('; ')); process.exitCode = 1; }
    if (failed.length) process.exitCode = 1;
  } finally {
    await browser.close();
    fs.rmSync(route, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); fs.rmSync(path.join(APP, 'src/app/flows-render'), { recursive: true, force: true }); process.exit(1); });
