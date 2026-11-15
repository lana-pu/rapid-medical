/* Rapid Medical — prototype pack: a clickable site header and footer (every menu item leads to its own screen).
   Used by site-prototype.json together with pack.js. Items are nodes, so "to" makes each of them a hotspot.
   @components rm-nav rm-navfoot rm-navitem */
(function () {
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
WF.register('rm-navitem', {
  group: 'Project', doc: 'One clickable item of the prototype header or footer.', inline: true,
  props: { text: { type: 'text', doc: '' }, on: { type: 'bool', doc: 'current section' }, v: { type: 'menu | strip | button | foot', doc: '' } },
  render: n => n.v === 'button' ? `<span class="w-btn primary s">${esc(n.text)}</span>`
    : `<span style="${n.on ? 'font-weight:600;box-shadow:inset 0 -2px 0 var(--wf-ink);padding-bottom:4px' : ''}">${esc(n.text)}</span>`,
  examples: [{ c: 'rm-navitem', text: 'Evidence', on: true }],
});
WF.register('rm-nav', {
  group: 'Project', doc: 'Prototype site header: contact strip with the region switcher, logo, menu. Each item is a node with its own "to".',
  props: { strip: { type: 'nodes', doc: 'right side of the top strip (region switcher)' }, logo: { type: 'node', doc: '' }, items: { type: 'nodes', doc: 'menu' }, cta: { type: 'node', doc: 'Contact Us' } },
  render: n => `<header style="border-bottom:1px solid var(--wf-line);background:var(--wf-paper)">
    <div class="w-row j-between" style="padding:6px 40px;background:var(--wf-surface);font-size:12px;color:var(--wf-muted);border-bottom:1px solid var(--wf-line)">
      <span class="w-row g-l"><b style="color:var(--wf-ink)">Get in touch</b><span>HQ: +972-72-250-3331</span><span>US: +1-469-991-7712</span></span>
      <span>${(n.strip || []).map(WF.node).join('')}</span></div>
    <div class="w-row j-between" style="padding:16px 40px"><b style="font-size:18px">${n.logo ? WF.node(n.logo) : 'Rapid Medical™'}</b>
      <nav class="w-row g-l" style="font-size:14px">${(n.items || []).map(WF.node).join('')}</nav>${n.cta ? WF.node(n.cta) : ''}</div></header>`,
  examples: [{ c: 'rm-nav', items: [{ c: 'rm-navitem', text: 'Therapies' }, { c: 'rm-navitem', text: 'Evidence', on: true }], cta: { c: 'rm-navitem', v: 'button', text: 'Contact Us' } }],
});
WF.register('rm-navfoot', {
  group: 'Project', doc: 'Prototype site footer with clickable Legal links.',
  props: { legal: { type: 'nodes', doc: '' } },
  render: n => `<footer style="background:var(--wf-surface);border-top:1px solid var(--wf-line);padding:28px 40px;font-size:13px;color:var(--wf-muted)">
    <div class="w-grid" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:24px">
      <div class="w-stack g-xs"><b style="color:var(--wf-ink)">Get in touch</b><span>HQ: +972-72-250-3331</span><span>US: +1-469-991-7712</span><span>info@rapid-medical.com</span></div>
      <div class="w-stack g-xs"><b style="color:var(--wf-ink)">Follow</b><span>X</span><span>LinkedIn</span><span>Instagram</span></div>
      <div class="w-stack g-xs"><b style="color:var(--wf-ink)">Legal</b>${(n.legal || []).map(WF.node).join('')}</div></div>
    <div style="margin-top:20px">© 2026 Rapid Medical™. All rights reserved.</div></footer>`,
  examples: [{ c: 'rm-navfoot', legal: [{ c: 'rm-navitem', text: 'Terms of Use' }] }],
});
})();
