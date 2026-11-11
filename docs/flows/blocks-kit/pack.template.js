/* Rapid Medical — project pack for the wireframes kit (/wireframes).
   The 22 page blocks of the site (src/blocks) as wireframe components: "rm-<type>", variant in "v", the rest are the
   block's own fields (same names as in code). "rm-page" groups blocks the way the site does: simple blocks share one
   section, text-and-media rows share a band. Examples carry real content from the site (snapshot 2026-11-10).
   Names and variants follow src/blocks/registry.ts: a new block goes there first, then here. Real page compositions
   for flows: rm-pages.json.
   Highlight one part of a block (editor flows): "focus": {"part": "title", "style": "selected"|"hover", "toolbar": [nodes], "cursor": true}.
   @components /*NAMES*/ */
(function () {
const style = document.createElement('style');
style.textContent = /*CSS*/"" + '[data-focus]{position:relative;outline-offset:3px;display:inline-block}[data-focus="selected"]{outline:2px solid var(--sel)}[data-focus="hover"]{outline:1px dashed var(--sel)}';
document.head.appendChild(style);
/*JS*/
const META = /*META*/[];
const EXAMPLES = /*EXAMPLES*/{};
for (const m of META) {
  const props = { v: { type: m.variants.map(v => v.id).join(' | '), doc: 'variant' } };
  for (const f of m.fields) props[f.key] = { type: f.kind, doc: f.label + (f.required ? ' (required)' : '') };
  WF.register('rm-' + m.type, {
    group: 'Project', doc: m.name + ' — ' + m.description + ' Variants: ' + m.variants.map(v => v.label + ' (' + v.id + ')').join(', ') + '.',
    props, examples: (EXAMPLES[m.type] || []).slice(0, 3),
    render: n => focus(render({ type: m.type, variant: n.v || m.variants[0].id, data: n }, n._ctx || {}), n.focus),
  });
}
function focus(html, f) {
  if (!f || !f.part) return html;
  const extra = (f.toolbar ? `<span class="w-tbar below" style="font-size:13px;letter-spacing:0;text-transform:none;font-weight:400">${[].concat(f.toolbar).map(WF.node).join('')}</span>` : '') + (f.cursor ? '<span class="w-cursor" aria-hidden="true"></span>' : '');
  const re = new RegExp(`(<[^>]*data-part="${f.part}"[^>]*)>`);
  return html.replace(re, `$1 data-focus="${f.style === 'hover' ? 'hover' : 'selected'}">${extra}`);
}
const typ = it => String(it.c || '').replace(/^rm-/, '');
const blk = it => ({ type: typ(it), variant: it.v || ((META.find(m => m.type === typ(it)) || { variants: [{ id: '' }] }).variants[0].id) });
WF.register('rm-page', {
  group: 'Project', doc: 'A site page from Rapid Medical blocks, grouped as on the site. Items are rm-* nodes; notes, selection, toolbars and hotspots work on each.',
  props: { items: { type: 'rm-* nodes', doc: 'blocks top to bottom' } },
  render: n => {
    const items = (n.items || []).filter(Boolean); const out = [];
    for (let i = 0; i < items.length;) {
      const b = blk(items[i]);
      if (isFlow(b)) { let j = i; const parts = []; while (j < items.length && isFlow(blk(items[j]))) { parts.push(WF.node(Object.assign({}, items[j], { _ctx: { nested: true } }))); j++; } out.push(A.section('', `<div class="stack s24">${parts.join('')}</div>`)); i = j; continue; }
      const g = stackOf(b);
      if (g) { let j = i; const parts = []; while (j < items.length && typ(items[j]) === b.type && stackOf(blk(items[j])) === g) { parts.push(WF.node(Object.assign({}, items[j], { _ctx: { inStack: true } }))); j++; } out.push(wrapStack(g, parts.join(''))); i = j; continue; }
      out.push(WF.node(items[i])); i++;
    }
    return out.join('');
  },
  examples: [{ c: 'rm-page', items: [EXAMPLES.hero && EXAMPLES.hero[2], EXAMPLES.textMedia && EXAMPLES.textMedia[0], EXAMPLES.textMedia && EXAMPLES.textMedia[1], EXAMPLES.cta && EXAMPLES.cta[0]].filter(Boolean) }],
});

/* ---------- site chrome: header, footer, region banner (global, not page blocks; src/components/site/Header.tsx, Footer.tsx, RegionBanner.tsx) ---------- */
const CONTACT = { phoneHq: '+972-72-250-3331', phoneUs: '+1-469-991-7712', email: 'info@rapid-medical.com' };
const NAV = { us: ['Large vessel stroke', 'Aneurysm', 'Access'], ous: ['Large vessel stroke', 'Medium vessel stroke', 'Aneurysm', 'Vasospasm', 'Access'], apac: ['Large vessel stroke', 'Medium vessel stroke', 'Aneurysm', 'Vasospasm', 'Access'] };
const SHORT = { us: 'US', ous: 'OUS', apac: 'APAC' };
const LABEL = { us: 'Americas', ous: 'Europe, Middle East, Latin America & Australia', apac: 'Asia & Pacific' };
const NOTICE = { us: '', ous: 'Not all products are available in all countries. Refer to the Instructions for Use for the indications approved in your region.', apac: '*Not all products are available in all countries.' };
style.textContent += '.w-row.rmh-mob{display:none}@container frame (max-width: 719px){.rmh-desk{display:none!important}.w-row.rmh-mob{display:flex}.rmh-pad{padding-inline:18px!important}}';
WF.register('rm-header', {
  group: 'Project', doc: 'Site header: contact strip with the region chip, logo, main menu (Therapies opens the region’s therapies), Contact Us. On a phone the menu becomes a row of links.',
  props: { region: { type: 'us | ous | apac | (none)', doc: 'current region; none = not chosen yet' }, menuOpen: { type: 'bool', doc: 'show the Therapies dropdown' } },
  render: n => {
    const r = n.region;
    const drop = n.menuOpen && r ? `<div class="w-pop" style="min-width:220px"><div class="w-menu">${NAV[r].map(x => `<div class="mi"><span>${esc(x)}</span></div>`).join('')}</div></div>` : '';
    return `<header style="border-bottom:1px solid var(--wf-line);background:var(--wf-paper)">
      <div class="w-row j-between rmh-pad" style="padding:6px 40px;background:var(--wf-surface);font-size:12px;color:var(--wf-muted);border-bottom:1px solid var(--wf-line)">
        <span class="w-row g-l"><b style="color:var(--wf-ink)">Get in touch</b><span>HQ: ${CONTACT.phoneHq}</span><span class="rmh-desk">US: ${CONTACT.phoneUs}</span><span class="rmh-desk">${CONTACT.email}</span></span>
        <span class="w-badge" style="background:var(--wf-paper);box-shadow:inset 0 0 0 1px var(--wf-line)">🌐 ${r ? SHORT[r] : 'Choose location'}</span></div>
      <div class="w-row j-between rmh-pad" style="padding:16px 40px"><b style="font-size:18px">Rapid Medical™</b>
        <nav class="w-row g-l rmh-desk" style="font-size:14px"><span>Welcome</span><span class="w-anch" style="display:inline-block">Therapies ▾${drop}</span><span>Evidence</span><span>News &amp; Events</span><span>About Us</span><span>Careers</span></nav>
        <span class="w-btn primary s">Contact Us</span></div>
      <nav class="rmh-mob w-row g-l rmh-pad" style="padding:8px 40px;border-top:1px solid var(--wf-line);font-size:13px;overflow:hidden"><span>Therapies</span><span>Evidence</span><span>News</span><span>About</span><span>Careers</span></nav></header>`;
  },
  examples: [{ c: 'rm-header', region: 'us', menuOpen: true }, { c: 'rm-header' }],
});
WF.register('rm-footer', {
  group: 'Project', doc: 'Site footer: contacts, social links, legal pages, the regional notice, copyright.',
  props: { region: { type: 'us | ous | apac | (none)', doc: 'shows that region’s notice' } },
  render: n => `<footer style="background:var(--wf-surface);border-top:1px solid var(--wf-line);font-size:13px">
    <div class="w-grid rmh-pad" style="grid-template-columns:repeat(3,minmax(0,1fr));padding:36px 40px">
      <div class="w-stack g-s"><b>Get in touch</b><span class="w-t small">HQ: ${CONTACT.phoneHq}<br>US: ${CONTACT.phoneUs}<br>${CONTACT.email}</span></div>
      <div class="w-stack g-s"><b>Follow</b><span class="w-t small">X<br>LinkedIn<br>Instagram</span></div>
      <div class="w-stack g-s"><b>Legal</b><span class="w-t small">Privacy Statement<br>Terms of Use<br>Compliance Statement<br>Patents</span></div></div>
    ${n.region && NOTICE[n.region] ? `<div class="rmh-pad w-t small" style="padding:0 40px 14px">${esc(NOTICE[n.region])}</div>` : ''}
    <div class="rmh-pad w-t small" style="padding:12px 40px;border-top:1px solid var(--wf-line)">© 2026 Rapid Medical™. All rights reserved.</div></footer>`,
  examples: [{ c: 'rm-footer', region: 'ous' }],
});
WF.register('rm-regionBanner', {
  group: 'Project', doc: 'Suggestion of the regional site by the visitor’s IP; never redirects (Fix List C.4). Shown until dismissed (30 days).',
  props: { suggested: { type: 'us | ous | apac', doc: 'region from the IP' } },
  render: n => `<div class="rmh-pad" style="background:var(--wf-surface);border-bottom:1px solid var(--wf-line);padding:8px 40px"><div class="w-row g-s wrap" style="font-size:13px"><span>It looks like you are in <b>${esc(LABEL[n.suggested || 'us'])}</b>. This site is intended for healthcare professionals in your region.</span><span class="w-btn primary s">Go to the ${esc(LABEL[n.suggested || 'us'])} site</span><span class="w-btn link">Stay here</span></div></div>`,
  examples: [{ c: 'rm-regionBanner', suggested: 'us' }],
});
})();
