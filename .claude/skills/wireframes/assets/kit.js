/* Wireframe kit — components, renderer and the three views (board, prototype, library).
   A flow is JSON: screens made of nodes {c: "<component>", ...props}. Format: references/flow-format.md.
   Projects add their own components with WF.register(name, def) in a pack file. */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const arr = x => x == null ? [] : Array.isArray(x) ? x : [x];
  const REG = {};
  const GROUPS = ['Layout', 'Navigation', 'Type', 'Controls', 'Data', 'Feedback', 'Overlays', 'Media', 'Sections'];
  let NOTES = null; // collects annotations while a screen renders
  let HOTS = null;  // collects hotspots ({to, label, quiet}) while a screen renders

  function register(name, def) { REG[name] = Object.assign({ group: 'Project', props: {}, examples: [] }, def); }

  /* ---------- node rendering ---------- */
  function node(n) {
    if (n == null || n === false) return '';
    if (typeof n === 'string' || typeof n === 'number') return esc(n);
    if (Array.isArray(n)) return n.map(node).join('');
    const def = REG[n.c];
    let html = def ? def.render(n) : `<div class="w-alert warning"><span class="tx">Unknown component <code>${esc(n.c)}</code></span></div>`;
    // helpers that work on any node
    const extra = [];
    if (n.toolbar) extra.push(`<div class="w-tbar ${n.toolbarPos === 'below' ? 'below' : ''}">${arr(n.toolbar).map(node).join('')}</div>`);
    if (n.popover) extra.push(`<div class="w-pop ${n.popoverPos || ''}">${arr(n.popover).map(node).join('')}</div>`);
    if (n.cursor) extra.push('<span class="w-cursor" aria-hidden="true"></span>');
    if (n.annotation && NOTES) { NOTES.push(n.annotation); extra.push(`<span class="w-pin">${NOTES.length}</span>`); }
    if (n.to && HOTS) HOTS.push({ to: n.to, label: n.label, quiet: !!n.quiet });
    const cls = [n.selected ? 'w-sel' : '', n.hover ? 'w-hov' : '', n.to ? 'w-hot' : ''].filter(Boolean).join(' ');
    if (!extra.length && !cls && !n.to) return html;
    const attrs = n.to ? ` data-to="${esc(n.to)}"${n.label ? ` data-label="${esc(n.label)}"` : ''}${n.quiet ? ' data-quiet' : ''}` : '';
    const block = def && def.inline ? 'inline-block' : 'block';
    return `<div class="w-anch ${cls}" style="display:${n.grow ? 'block;flex:1;min-width:0' : block}"${attrs}>${html}${extra.join('')}</div>`;
  }
  const kids = n => arr(n.items).map(node).join('');
  const gap = g => g ? ` g-${g}` : '';
  const txt = (v, t, extra = '') => t == null || t === '' ? '' : `<p class="w-t ${v || ''} ${extra}">${esc(t)}</p>`;
  const media = m => m ? node(Object.assign({ c: 'media' }, typeof m === 'string' ? { label: m } : m)) : '';
  const buttons = a => arr(a).map(x => typeof x === 'string' ? node({ c: 'button', text: x, v: 'secondary' }) : node(Object.assign({ c: 'button' }, x))).join('');
  const field = (n, inner, cls = '') => `<label class="w-field ${cls} ${n.error ? 'err' : ''} ${n.focus ? 'focus' : ''}">${n.label ? `<span class="lb">${esc(n.label)}${n.required ? ' *' : ''}</span>` : ''}${inner}${n.error ? `<span class="hint">${esc(n.error)}</span>` : n.hint ? `<span class="hint">${esc(n.hint)}</span>` : ''}</label>`;
  const val = n => n.value != null && n.value !== '' ? esc(n.value) : `<span class="ph">${esc(n.placeholder || '')}</span>`;
  const cols = c => typeof c === 'number' ? `repeat(${c}, minmax(0, 1fr))` : c;

  /* ---------- components ---------- */
  const P = (type, doc) => ({ type, doc });
  // Layout
  register('stack', { group: 'Layout', doc: 'Children one under another.', props: { items: P('nodes', 'children'), gap: P('xs|s|m|l|xl', 'space between') },
    render: n => `<div class="w-stack${gap(n.gap)}" style="${n.align === 'center' ? 'justify-items:center;text-align:center' : ''}">${kids(n)}</div>`,
    examples: [{ c: 'stack', gap: 's', items: [{ c: 'heading', level: 3, text: 'Page settings' }, { c: 'text', v: 'muted', text: 'Fields that are not visible on the page.' }] }] });
  register('row', { group: 'Layout', doc: 'Children side by side. Mark a child "grow": true to take the free space.', props: { items: P('nodes', ''), gap: P('xs|s|m|l', ''), justify: P('start|between|end|center', ''), align: P('center|start|stretch', ''), wrap: P('bool', '') },
    render: n => `<div class="w-row${gap(n.gap)} ${n.justify ? 'j-' + n.justify : ''} ${n.align ? 'a-' + n.align : ''} ${n.wrap ? 'wrap' : ''}">${arr(n.items).map(x => x && x.grow ? `<div class="grow">${node(Object.assign({}, x, { grow: false }))}</div>` : node(x)).join('')}</div>`,
    examples: [{ c: 'row', justify: 'between', items: [{ c: 'text', text: 'Large vessel stroke', v: 'strong' }, { c: 'row', gap: 's', items: [{ c: 'button', v: 'secondary', text: 'Preview' }, { c: 'button', v: 'primary', text: 'Publish' }] }] }] });
  register('grid', { group: 'Layout', doc: 'Equal columns.', props: { cols: P('number | CSS template', ''), items: P('nodes', ''), gap: P('s|m', '') },
    render: n => `<div class="w-grid${gap(n.gap)}" style="grid-template-columns:${cols(n.cols || 2)};${n.align ? 'align-items:' + n.align : ''}">${kids(n)}</div>`,
    examples: [{ c: 'grid', cols: 3, items: [{ c: 'card', title: 'Access' }, { c: 'card', title: 'Aneurysm' }, { c: 'card', title: 'Large vessel stroke' }] }] });
  register('split', { group: 'Layout', doc: 'App layout: sidebar, content, side panel. Columns as a CSS template.', props: { cols: P('"240px 1fr" | "1fr 360px" | …', ''), items: P('nodes', 'one per column'), height: P('px', 'min height') },
    render: n => `<div class="w-split" style="grid-template-columns:${n.cols || '240px minmax(0,1fr)'};${n.height ? 'min-height:' + n.height + 'px' : ''}">${arr(n.items).map(x => `<div style="min-width:0">${node(x)}</div>`).join('')}</div>`,
    examples: [{ c: 'split', cols: '200px minmax(0,1fr)', height: 160, items: [{ c: 'sidebar', items: [{ label: 'Pages', on: true }, { label: 'Evidence' }] }, { c: 'box', pad: 'm', items: [{ c: 'heading', level: 3, text: 'Pages' }] }] }] });
  register('box', { group: 'Layout', doc: 'A plain container: padding, border, background.', props: { items: P('nodes', ''), pad: P('s|m|l', ''), tone: P('paper|surface|dark', ''), border: P('bool', ''), gap: P('s|m|l', ''), fill: P('bool', 'full height') },
    render: n => `<div class="w-box ${n.pad ? 'pad-' + n.pad : ''} ${n.tone || ''} ${n.border ? 'border' : ''} ${n.fill ? 'fill' : ''}"><div class="w-stack${gap(n.gap)}">${kids(n)}</div></div>`,
    examples: [{ c: 'box', pad: 'm', border: true, items: [{ c: 'text', text: 'Bordered box' }] }] });
  register('section', { group: 'Layout', doc: 'A full-width band of a site page with a 1152 px container.', props: { items: P('nodes', ''), tone: P('paper|surface|dark', ''), pad: P('s|m|l|xl', ''), center: P('bool', ''), bg: P('text', 'label of a background picture or video'), rule: P('bool', 'line under it') },
    render: n => `<section class="w-section ${n.tone || ''} ${n.pad ? 'pad-' + n.pad : ''} ${n.center ? 'center' : ''} ${n.rule ? 'rule' : ''}">${n.bg ? `<span class="w-bgchip">${esc(n.bg)}</span>` : ''}<div class="in">${kids(n)}</div></section>`,
    examples: [{ c: 'section', tone: 'surface', items: [{ c: 'heading', level: 2, text: 'What we do' }] }] });
  register('divider', { group: 'Layout', doc: 'Horizontal line.', render: () => '<div class="w-divider"></div>', examples: [{ c: 'divider' }] });
  register('spacer', { group: 'Layout', doc: 'Empty space.', props: { size: P('px', '') }, render: n => `<div style="height:${n.size || 16}px"></div>`, examples: [{ c: 'spacer', size: 16 }] });

  // Navigation
  register('appbar', { group: 'Navigation', doc: 'Top bar of an app: product name, sections, actions.', props: { logo: P('text', ''), nav: P('[text]', ''), active: P('index', ''), actions: P('nodes', '') },
    render: n => `<div class="w-appbar"><span class="logo">${esc(n.logo || 'Product')}</span>${n.nav ? `<span class="nav">${arr(n.nav).map((x, i) => `<span class="${i === n.active ? 'on' : ''}">${esc(x)}</span>`).join('')}</span>` : ''}<span class="act">${arr(n.actions).map(node).join('')}</span></div>`,
    examples: [{ c: 'appbar', logo: 'Rapid Medical', nav: ['Website', 'Training tool'], active: 0, actions: [{ c: 'avatar', name: 'Svetlana P' }] }] });
  register('sidebar', { group: 'Navigation', doc: 'Side navigation. Items: {label, on, badge} or {group: "Title"}.', props: { items: P('[{label,on,badge}|{group}]', '') },
    render: n => `<nav class="w-sidebar">${arr(n.items).map(i => i.group ? `<div class="gt">${esc(i.group)}</div>` : `<div class="it ${i.on ? 'on' : ''}"><span>${esc(i.label)}</span>${i.badge != null ? `<span class="w-t small">${esc(i.badge)}</span>` : ''}</div>`).join('')}</nav>`,
    examples: [{ c: 'sidebar', items: [{ group: 'Website' }, { label: 'Pages', on: true }, { label: 'Evidence', badge: 102 }, { label: 'News', badge: 53 }] }] });
  register('toolbar', { group: 'Navigation', doc: 'A bar over content: left, middle and right groups.', props: { left: P('nodes', ''), center: P('nodes', ''), right: P('nodes', '') },
    render: n => `<div class="w-toolbar"><div class="w-row g-s">${arr(n.left).map(node).join('')}</div><div class="mid">${arr(n.center).map(node).join('')}</div><div class="w-row g-s">${arr(n.right).map(node).join('')}</div></div>`,
    examples: [{ c: 'toolbar', left: [{ c: 'iconbutton', icon: '←', label: 'Back' }, { c: 'text', v: 'strong', text: 'Large vessel stroke' }], right: [{ c: 'button', v: 'primary', text: 'Publish' }] }] });
  register('breadcrumbs', { group: 'Navigation', doc: 'Path to the current page.', props: { items: P('[text]', '') }, render: n => `<div class="w-crumbs">${arr(n.items).map(esc).map(s => `<span>${s}</span>`).join('<span>/</span>')}</div>`, examples: [{ c: 'breadcrumbs', items: ['Pages', 'Therapies', 'Large vessel stroke'] }] });
  register('tabs', { group: 'Navigation', doc: 'Tabs: underline or pills.', props: { items: P('[text]', ''), active: P('index', ''), v: P('underline|pills', '') },
    render: n => `<div class="w-tabs ${n.v === 'pills' ? 'pills' : ''}">${arr(n.items).map((x, i) => `<span class="${i === (n.active || 0) ? 'on' : ''}">${esc(x)}</span>`).join('')}</div>`,
    examples: [{ c: 'tabs', items: ['Content', 'Page settings', 'History'], active: 0 }, { c: 'tabs', v: 'pills', items: ['Product overview', 'How it works'], active: 0 }] });
  register('menu', { group: 'Navigation', doc: 'Dropdown or context menu. Items: {label, meta, on} | {title} | "-" for a divider.', props: { items: P('[…]', '') },
    render: n => `<div class="w-menu">${arr(n.items).map(i => i === '-' ? '<div class="md"></div>' : i.title ? `<div class="mt">${esc(i.title)}</div>` : node({ c: '_mi', i, to: i.to, label: i.toLabel, quiet: i.quiet, annotation: i.annotation })).join('')}</div>`,
    examples: [{ c: 'menu', items: [{ title: 'Showing' }, { label: 'Americas', on: true, meta: '✓' }, { label: 'Asia & Pacific', meta: '2 differences' }, '-', { label: 'See differences' }] }] });
  register('_mi', { group: 'hidden', render: n => `<div class="mi ${n.i.on ? 'on' : ''}"><span>${esc(n.i.label)}</span>${n.i.meta ? `<span class="meta">${esc(n.i.meta)}</span>` : ''}</div>` });
  register('pagination', { group: 'Navigation', doc: 'Page numbers.', props: { page: P('n', ''), pages: P('n', '') },
    render: n => { const p = n.page || 1, t = n.pages || 5; return `<div class="w-pager"><span>‹</span>${Array.from({ length: Math.min(t, 5) }, (_, i) => `<span class="${i + 1 === p ? 'on' : ''}">${i + 1}</span>`).join('')}${t > 5 ? `<span>…</span><span>${t}</span>` : ''}<span>›</span></div>`; },
    examples: [{ c: 'pagination', page: 2, pages: 9 }] });
  register('siteheader', { group: 'Navigation', doc: 'Header of a website.', props: { logo: P('text', ''), nav: P('[text]', ''), cta: P('text', '') },
    render: n => `<header class="w-siteheader"><span class="logo">${esc(n.logo || 'Site')}</span><span class="nav">${arr(n.nav).map(x => `<span>${esc(x)}</span>`).join('')}</span>${n.cta ? node({ c: 'button', v: 'primary', text: n.cta }) : ''}</header>`,
    examples: [{ c: 'siteheader', logo: 'Rapid Medical', nav: ['Therapies', 'Evidence', 'News', 'About', 'Careers'], cta: 'Get in touch' }] });
  register('sitefooter', { group: 'Navigation', doc: 'Footer of a website.', props: { columns: P('[{title, items}]', ''), legal: P('text', '') },
    render: n => `<footer class="w-sitefooter"><div class="cols">${arr(n.columns).map(c => `<div><div class="ct">${esc(c.title)}</div>${arr(c.items).map(i => `<div>${esc(i)}</div>`).join('')}</div>`).join('')}</div>${n.legal ? `<div class="legal">${esc(n.legal)}</div>` : ''}</footer>`,
    examples: [{ c: 'sitefooter', columns: [{ title: 'Get in touch', items: ['Contact us'] }, { title: 'Follow', items: ['LinkedIn', 'Instagram', 'YouTube'] }, { title: 'Legal', items: ['Privacy Statement', 'Terms of Use'] }] }] });

  // Type
  register('heading', { group: 'Type', doc: 'Heading, levels 1–5.', props: { text: P('text', ''), level: P('1–5', '') }, render: n => `<div class="w-h w-h${n.level || 2}">${esc(n.text)}</div>`, examples: [{ c: 'heading', level: 1, text: 'A patient-centric approach to AIS' }, { c: 'heading', level: 3, text: 'Page settings' }] });
  register('text', { group: 'Type', doc: 'Paragraph.', props: { text: P('text', ''), v: P('body|lead|statement|muted|small|caption|strong', '') }, render: n => txt(n.v, n.text), examples: [{ c: 'text', v: 'lead', text: 'TIGERTRIEVER™ is the only active thrombectomy device.' }, { c: 'text', v: 'small', text: 'Saved 2 minutes ago' }] });
  register('eyebrow', { group: 'Type', doc: 'Small caps label above a heading.', props: { text: P('text', '') }, render: n => `<div class="w-eyebrow">${esc(n.text)}</div>`, examples: [{ c: 'eyebrow', text: 'Therapies / Large vessel stroke' }] });
  register('link', { group: 'Type', doc: 'Text link.', inline: true, props: { text: P('text', '') }, render: n => `<span class="w-link">${esc(n.text)}</span>`, examples: [{ c: 'link', text: 'View live page ↗' }] });
  register('bullets', { group: 'Type', doc: 'List of points.', props: { items: P('[text]', ''), ordered: P('bool', '') }, render: n => `<${n.ordered ? 'ol' : 'ul'} class="w-bullets w-t">${arr(n.items).map(i => `<li>${esc(i)}</li>`).join('')}</${n.ordered ? 'ol' : 'ul'}>`, examples: [{ c: 'bullets', items: ['Title changed', 'Picture replaced'] }] });
  register('prose', { group: 'Type', doc: 'Long text from real HTML (headings, paragraphs, lists).', props: { html: P('html', ''), limit: P('n', 'max elements') },
    render: n => {
      if (typeof DOMParser === 'undefined') return '';
      const doc = new DOMParser().parseFromString(`<div>${n.html || ''}</div>`, 'text/html');
      const inline = el => [...el.childNodes].map(c => c.nodeType === 3 ? esc(c.textContent) : c.nodeType === 1 ? (/^(B|STRONG)$/.test(c.tagName) ? `<b>${inline(c)}</b>` : c.tagName === 'A' ? `<u>${inline(c)}</u>` : inline(c)) : '').join('');
      return `<div class="w-prose">${[...doc.body.firstChild.children].slice(0, n.limit || 12).map(el => /^H\d$/.test(el.tagName) ? `<div class="hd">${inline(el)}</div>` : /^(UL|OL)$/.test(el.tagName) ? `<${el.tagName.toLowerCase()}>${[...el.children].map(li => `<li>${inline(li)}</li>`).join('')}</${el.tagName.toLowerCase()}>` : `<p>${inline(el)}</p>`).join('')}</div>`;
    }, examples: [{ c: 'prose', html: '<h2>Terms of Use</h2><p>By using this website you agree to these terms.</p><ul><li>First point</li><li>Second point</li></ul>' }] });

  // Controls
  register('button', { group: 'Controls', doc: 'Button. The main action of a screen is primary, one per area.', inline: true, props: { text: P('text', ''), v: P('primary|secondary|ghost|danger|link', ''), size: P('s|m', ''), full: P('bool', 'full width') },
    render: n => `<span class="w-btn ${n.v || 'secondary'} ${n.size === 's' ? 's' : ''} ${n.full ? 'full' : ''}">${esc(n.text)}</span>`,
    examples: [{ c: 'row', gap: 's', items: [{ c: 'button', v: 'primary', text: 'Publish' }, { c: 'button', v: 'secondary', text: 'Preview' }, { c: 'button', v: 'ghost', text: 'Cancel' }, { c: 'button', v: 'danger', text: 'Discard changes' }, { c: 'button', v: 'link', text: 'History' }] }] });
  register('iconbutton', { group: 'Controls', doc: 'Square button with a glyph; label is for the reader of the wireframe.', inline: true, props: { icon: P('glyph', '↶ ↷ ← ✎ ⋯ ✕ + 🔍'), label: P('text', ''), on: P('bool', 'pressed') },
    render: n => `<span class="w-ib ${n.on ? 'on' : ''}" title="${esc(n.label || '')}">${esc(n.icon || '⋯')}</span>`, examples: [{ c: 'row', gap: 'xs', items: [{ c: 'iconbutton', icon: '↶', label: 'Undo' }, { c: 'iconbutton', icon: '↷', label: 'Redo' }, { c: 'iconbutton', icon: '⋯', label: 'More' }] }] });
  register('input', { group: 'Controls', doc: 'Text field, search, select or date.', props: { label: P('text', ''), value: P('text', ''), placeholder: P('text', ''), hint: P('text', ''), error: P('text', ''), v: P('text|search|select|date', ''), required: P('bool', ''), focus: P('bool', '') },
    render: n => field(n, `<span class="box">${n.v === 'search' ? '<span class="ph">⌕</span>' : ''}<span style="flex:1;min-width:0">${val(n)}</span>${n.v === 'select' ? '<span>▾</span>' : n.v === 'date' ? '<span>▦</span>' : ''}</span>`),
    examples: [{ c: 'input', label: 'Image description', value: 'TIGERTRIEVER device in a vessel', hint: 'Read aloud by screen readers' }, { c: 'input', v: 'search', placeholder: 'Search pages' }, { c: 'input', v: 'select', label: 'Region', value: 'Americas' }] });
  register('textarea', { group: 'Controls', doc: 'Multi-line field.', props: { label: P('text', ''), value: P('text', ''), placeholder: P('text', '') }, render: n => field(n, `<span class="box">${val(n)}</span>`, 'area'), examples: [{ c: 'textarea', label: 'Comment', placeholder: 'Write a comment for a colleague' }] });
  register('checkbox', { group: 'Controls', doc: 'Checkbox.', props: { label: P('text', ''), on: P('bool', '') }, render: n => `<div class="w-check ${n.on ? 'on' : ''}"><i>${n.on ? '✓' : ''}</i><span>${esc(n.label)}</span></div>`, examples: [{ c: 'checkbox', label: 'Pictures have descriptions', on: true }] });
  register('radio', { group: 'Controls', doc: 'Radio option.', props: { label: P('text', ''), on: P('bool', '') }, render: n => `<div class="w-check radio ${n.on ? 'on' : ''}"><i>${n.on ? '•' : ''}</i><span>${esc(n.label)}</span></div>`, examples: [{ c: 'stack', gap: 's', items: [{ c: 'radio', label: 'All regions', on: true }, { c: 'radio', label: 'Only Americas' }] }] });
  register('switch', { group: 'Controls', doc: 'On/off switch.', props: { label: P('text', ''), on: P('bool', '') }, render: n => `<div class="w-switch ${n.on ? 'on' : ''}"><i></i><span>${esc(n.label)}</span></div>`, examples: [{ c: 'switch', label: 'Same in all regions', on: true }] });
  register('segmented', { group: 'Controls', doc: 'Segmented control.', inline: true, props: { items: P('[text]', ''), active: P('index', '') }, render: n => `<span class="w-seg">${arr(n.items).map((x, i) => `<span class="${i === (n.active || 0) ? 'on' : ''}">${esc(x)}</span>`).join('')}</span>`, examples: [{ c: 'segmented', items: ['Desktop', 'Phone'], active: 0 }] });
  register('chips', { group: 'Controls', doc: 'Choice chips: a short list of options shown at once instead of a dropdown (up to ~8). One or several can be on; an error marks the whole group.', props: { label: P('text', ''), items: P('[text]', ''), active: P('index | [index]', 'chosen'), required: P('bool', ''), hint: P('text', ''), error: P('text', '') },
    render: n => { const on = [].concat(n.active ?? []); return field(n, `<span class="w-chips">${arr(n.items).map((x, i) => `<span class="${on.includes(i) ? 'on' : ''}">${esc(x)}</span>`).join('')}</span>`, 'chips'); },
    examples: [{ c: 'chips', label: 'What do you need?', required: true, items: ['Request a demo', 'Product question / Support', 'Customer Service / Orders', 'Other'], active: 0 }] });
  register('upload', { group: 'Controls', doc: 'Drop zone for files.', props: { label: P('text', ''), hint: P('text', '') }, render: n => `<div class="w-drop"><b style="color:var(--wf-ink)">${esc(n.label || 'Drop a file here or choose one')}</b>${n.hint ? `<span>${esc(n.hint)}</span>` : ''}</div>`, examples: [{ c: 'upload', label: 'Drop an image or choose from the library', hint: 'JPG, PNG or WebP, up to 10 MB' }] });

  // Data
  register('table', { group: 'Data', doc: 'Table. Cells are text or nodes; mark a row selected with {on: true, cells: […]}.', props: { columns: P('[text]', ''), rows: P('[[cell]] | [{cells, on}]', '') },
    render: n => `<div style="overflow-x:auto"><table class="w-table"><thead><tr>${arr(n.columns).map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${arr(n.rows).map(r => { const cells = Array.isArray(r) ? r : r.cells; return `<tr class="${r.on ? 'on' : ''}">${arr(cells).map(c => `<td>${node(c)}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>`,
    examples: [{ c: 'table', columns: ['Page', 'Regions', 'Status'], rows: [['Large vessel stroke', 'All regions', { c: 'badge', text: 'Live', tone: 'success' }], ['Access', 'Americas', { c: 'badge', text: 'Draft' }]] }] });
  register('list', { group: 'Data', doc: 'List of items: thumbnail, title, meta, badge, actions.', props: { items: P('[{title, meta, badge, tone, thumb, actions, on, to}]', '') },
    render: n => `<div class="w-list">${arr(n.items).map(i => node({ c: '_li', i, to: i.to, annotation: i.annotation, label: i.toLabel, quiet: i.quiet })).join('')}</div>`,
    examples: [{ c: 'list', items: [{ title: 'Large vessel stroke', meta: 'Therapies · edited today', badge: 'Live, with unpublished changes', tone: 'warning', thumb: 'page' }, { title: 'About Us', meta: 'All regions · 3 days ago', badge: 'Live', tone: 'success', thumb: 'page' }] }] });
  register('_li', { group: 'hidden', render: n => { const i = n.i; return `<div class="li ${i.on ? 'on' : ''}">${i.thumb ? `<div class="th">${media({ kind: i.thumb === true ? 'image' : i.thumb, ratio: '4/3', tiny: true })}</div>` : ''}${i.avatar ? node({ c: 'avatar', name: i.avatar }) : ''}<div class="tx"><span class="tt">${esc(i.title)}</span>${i.meta ? `<span class="mt">${esc(i.meta)}</span>` : ''}</div>${i.badge ? node({ c: 'badge', text: i.badge, tone: i.tone }) : ''}${arr(i.actions).map(node).join('')}</div>`; } });
  register('card', { group: 'Data', doc: 'Card: media, eyebrow, title, text, meta, actions or any nodes.', props: { media: P('media props', ''), eyebrow: P('text', ''), title: P('text', ''), text: P('text', ''), meta: P('text', ''), badge: P('text', ''), tone: P('badge tone', ''), actions: P('nodes', ''), items: P('nodes', 'extra content'), on: P('bool', 'selected') },
    render: n => `<div class="w-card ${n.on ? 'on' : ''}">${media(n.media)}${n.badge ? `<div>${node({ c: 'badge', text: n.badge, tone: n.tone })}</div>` : ''}${n.eyebrow ? `<div class="w-eyebrow">${esc(n.eyebrow)}</div>` : ''}${n.title ? `<div class="w-h w-h4">${esc(n.title)}</div>` : ''}${txt('small', n.text)}${kids(n)}${n.meta ? txt('caption', n.meta) : ''}${n.actions ? `<div class="w-row g-s wrap">${buttons(n.actions)}</div>` : ''}</div>`,
    examples: [{ c: 'card', media: { kind: 'image', label: 'publication cover', ratio: '16/9' }, eyebrow: 'Feb 2026', title: 'DISTALS trial results', actions: [{ v: 'link', text: 'Read ›' }] }] });
  register('stat', { group: 'Data', doc: 'Key number.', props: { value: P('text', ''), label: P('text', ''), v: P('plain|circle|badge', '') }, render: n => `<div class="w-stat ${n.v || ''}"><div class="v">${esc(n.value)}</div><div class="lb">${esc(n.label)}</div></div>`, examples: [{ c: 'row', gap: 'l', items: [{ c: 'stat', value: '50K+', label: 'procedures' }, { c: 'stat', v: 'circle', value: '47%', label: 'FPE' }, { c: 'stat', v: 'badge', value: '102+', label: 'clinical publications' }] }] });
  register('badge', { group: 'Data', doc: 'Status label.', inline: true, props: { text: P('text', ''), tone: P('neutral|info|success|warning|danger', ''), dot: P('bool', '') }, render: n => `<span class="w-badge ${n.tone || ''} ${n.dot ? 'dot' : ''}">${esc(n.text)}</span>`, examples: [{ c: 'row', gap: 's', wrap: true, items: [{ c: 'badge', text: 'Draft' }, { c: 'badge', text: 'Live', tone: 'success', dot: true }, { c: 'badge', text: 'Unpublished changes', tone: 'warning', dot: true }, { c: 'badge', text: 'Only in Americas', tone: 'info' }, { c: 'badge', text: 'Missing description', tone: 'danger' }] }] });
  register('avatar', { group: 'Data', doc: 'Person initials.', inline: true, props: { name: P('text', '') }, render: n => `<span class="w-avatar" title="${esc(n.name)}">${esc(String(n.name || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase())}</span>`, examples: [{ c: 'avatar', name: 'Svetlana P' }] });
  register('progress', { group: 'Data', doc: 'Progress bar.', props: { value: P('0–100', ''), label: P('text', '') }, render: n => `<div class="w-progress">${n.label ? `<span>${esc(n.label)}</span>` : ''}<i><b style="width:${Math.max(0, Math.min(100, n.value || 0))}%"></b></i></div>`, examples: [{ c: 'progress', value: 60, label: '3 of 5 regions ready' }] });
  register('stepper', { group: 'Data', doc: 'Steps of a process.', props: { steps: P('[text]', ''), current: P('index', '') },
    render: n => `<div class="w-stepper">${arr(n.steps).map((s, i) => `${i ? '<span class="sep"></span>' : ''}<span class="st ${i < n.current ? 'done' : i === n.current ? 'on' : ''}"><i>${i < n.current ? '✓' : i + 1}</i>${esc(s)}</span>`).join('')}</div>`,
    examples: [{ c: 'stepper', steps: ['Review changes', 'Check', 'Publish'], current: 1 }] });
  register('activity', { group: 'Data', doc: 'Feed: who did what, when.', props: { items: P('[{who, what, when, action}]', '') },
    render: n => `<div class="w-activity">${arr(n.items).map(i => `<div class="ai">${node({ c: 'avatar', name: i.who })}<div class="w-stack g-xs"><span><b>${esc(i.who)}</b> ${esc(i.what)}</span><span class="wh">${esc(i.when)}</span>${i.action ? `<div>${node(i.action)}</div>` : ''}</div></div>`).join('')}</div>`,
    examples: [{ c: 'activity', items: [{ who: 'Emily R', what: 'published Large vessel stroke', when: 'Today, 10:42' }, { who: 'Svetlana P', what: 'replaced the top picture', when: 'Yesterday, 18:05' }] }] });

  // Feedback
  register('alert', { group: 'Feedback', doc: 'Message inside the layout.', props: { tone: P('info|success|warning|danger', ''), title: P('text', ''), text: P('text', ''), actions: P('nodes', '') },
    render: n => `<div class="w-alert ${n.tone || ''}"><div class="tx">${n.title ? `<b>${esc(n.title)}</b>` : ''}${n.text ? `<span>${esc(n.text)}</span>` : ''}</div>${arr(n.actions).map(node).join('')}</div>`,
    examples: [{ c: 'alert', tone: 'warning', title: 'This picture is shared by all regions', text: 'Change it here and it changes in Americas, Europe and Asia & Pacific.' }] });
  register('toast', { group: 'Feedback', doc: 'Short confirmation. "float": true pins it to the bottom of the screen.', props: { text: P('text', ''), action: P('text', ''), float: P('bool', '') }, render: n => `<div class="w-toast ${n.float ? 'float' : ''}"><span>${esc(n.text)}</span>${n.action ? `<b>${esc(n.action)}</b>` : ''}</div>`, examples: [{ c: 'toast', text: 'Saved. Not live yet.', action: 'Undo' }] });
  register('empty', { group: 'Feedback', doc: 'Empty state: what is missing and what to do.', props: { title: P('text', ''), text: P('text', ''), action: P('button props', '') }, render: n => `<div class="w-empty"><span class="ic"></span><b style="color:var(--wf-ink)">${esc(n.title)}</b>${n.text ? `<span>${esc(n.text)}</span>` : ''}${n.action ? node(Object.assign({ c: 'button', v: 'primary' }, n.action)) : ''}</div>`, examples: [{ c: 'empty', title: 'No comments yet', text: 'Click anywhere on the page to leave one.' }] });
  register('skeleton', { group: 'Feedback', doc: 'Loading placeholder lines.', props: { lines: P('n', '') }, render: n => `<div class="w-skel">${'<i></i>'.repeat(n.lines || 3)}</div>`, examples: [{ c: 'skeleton', lines: 3 }] });

  // Overlays (used as a screen's "overlay")
  const overlayBox = (n, cls) => `<div class="${cls} ${n.wide ? 'wide' : ''}"><div class="w-ohead"><div class="w-h w-h3">${esc(n.title)}</div><span class="w-ib">✕</span></div><div class="w-obody">${kids(n)}</div>${n.actions ? `<div class="w-ofoot">${arr(n.actions).map(node).join('')}</div>` : ''}</div>`;
  register('modal', { group: 'Overlays', doc: 'Dialog over a dimmed screen. Put it in screen.overlay.', props: { title: P('text', ''), items: P('nodes', ''), actions: P('nodes', ''), wide: P('bool', '') }, overlay: 'modal', render: n => overlayBox(n, 'w-modal'),
    examples: [{ c: 'modal', title: 'Publish changes?', items: [{ c: 'text', text: '2 changes go live on Large vessel stroke in Americas.' }], actions: [{ c: 'button', v: 'ghost', text: 'Cancel' }, { c: 'button', v: 'primary', text: 'Publish' }] }] });
  register('drawer', { group: 'Overlays', doc: 'Side panel over a dimmed screen. Put it in screen.overlay.', props: { title: P('text', ''), items: P('nodes', ''), actions: P('nodes', ''), side: P('right|left', '') }, overlay: 'drawer', render: n => overlayBox(n, 'w-drawer'),
    examples: [{ c: 'drawer', title: 'Page settings', items: [{ c: 'input', label: 'Title in search results', value: 'Large Vessel Occlusion | Rapid Medical' }], actions: [{ c: 'button', v: 'primary', text: 'Done' }] }] });
  register('panel', { group: 'Overlays', doc: 'Side panel inside a split layout (no dimming): title, content, footer actions.', props: { title: P('text', ''), items: P('nodes', ''), actions: P('nodes', '') },
    render: n => `<aside class="w-box" style="height:100%;display:grid;grid-template-rows:auto 1fr auto;border-radius:0;box-shadow:inset 1px 0 0 var(--wf-line);background:var(--wf-paper)"><div class="w-ohead"><div class="w-h w-h4">${esc(n.title)}</div><span class="w-ib">✕</span></div><div class="w-obody">${kids(n)}</div>${n.actions ? `<div class="w-ofoot">${arr(n.actions).map(node).join('')}</div>` : '<div></div>'}</aside>`,
    examples: [{ c: 'panel', title: 'Picture', items: [{ c: 'media', kind: 'image', label: 'hero-lvo.jpg', ratio: '16/9' }, { c: 'button', v: 'secondary', text: 'Replace picture' }] }] });

  // Media
  register('media', { group: 'Media', doc: 'Grey placeholder with kind and file name. Kinds: image, video, photo, icon, chart, map, diagram, page (page thumbnail).', props: { kind: P('image|video|photo|icon|chart|map|diagram|page', ''), label: P('text', 'what is shown or file name'), ratio: P('w/h', ''), round: P('bool', ''), tiny: P('bool', 'no label') },
    render: n => { const k = n.kind || 'image'; const inner = k === 'page' ? '<span class="pl h"></span><span class="pl"></span><span class="pl s"></span><span class="pl"></span>' : `<span class="k">${esc(k)}</span>${n.label ? `<span class="l">${esc(n.label)}</span>` : ''}`; return `<div class="w-media ${k} ${n.round ? 'round' : ''} ${n.tiny ? 'tiny' : ''}" style="aspect-ratio:${n.ratio || '16/9'}">${inner}</div>`; },
    examples: [{ c: 'grid', cols: 4, gap: 's', items: [{ c: 'media', kind: 'image', label: 'hero-lvo.jpg', ratio: '4/3' }, { c: 'media', kind: 'video', label: 'tigerface-wide.mp4', ratio: '4/3' }, { c: 'media', kind: 'chart', label: 'FPE by device', ratio: '4/3' }, { c: 'media', kind: 'page', ratio: '4/3' }] }] });

  register('ref', { group: 'Media', doc: 'Reference screenshot from another product (Mobbin, a site): picture, source, what to take from it, link. The picture is a file published next to the page (src is a relative path), not a placeholder.', props: { src: P('path', 'relative path to the picture'), source: P('text', 'product name'), caption: P('text', 'what to take from it'), url: P('url', 'link to the original') },
    render: n => `<figure class="w-ref"><span class="im">${n.src ? `<img src="${esc(n.src)}" alt="${esc(n.source || '')}" loading="lazy">` : ''}</span><figcaption><b>${esc(n.source || '')}</b>${n.caption ? ` — ${esc(n.caption)}` : ''}${n.url ? ` <a href="${esc(n.url)}" target="_blank" rel="noopener">Mobbin ↗</a>` : ''}</figcaption></figure>`,
    examples: [{ c: 'ref', source: 'Dovetail', caption: 'topic first, help text beside the fields', url: 'https://mobbin.com/' }] });

  register('bars', { group: 'Media', doc: 'Horizontal bar chart drawn from numbers: one row per item, a row can be split into stacked segments (shades of grey). For charts that must stay data, not pictures.', props: { rows: P('[{label, segments:[{value, label}], note}]', 'value is a share of 100'), legend: P('[text]', 'segment names, in order'), caption: P('text', '') },
    render: n => { const sh = ['var(--wf-ink)', 'color-mix(in srgb, var(--wf-ink) 62%, var(--wf-paper))', 'color-mix(in srgb, var(--wf-ink) 38%, var(--wf-paper))', 'color-mix(in srgb, var(--wf-ink) 22%, var(--wf-paper))', 'color-mix(in srgb, var(--wf-ink) 12%, var(--wf-paper))'];
      const rows = arr(n.rows).map(r => `<div class="w-bars-r"><span class="lb">${esc(r.label)}</span><span class="bar">${arr(r.segments).map((s, i) => `<i style="width:${Math.max(0, Math.min(100, s.value))}%;background:${sh[i % sh.length]};color:${i < 2 ? 'var(--wf-paper)' : 'var(--wf-ink)'}">${s.value >= 7 ? esc(s.label ?? s.value) : ''}</i>`).join('')}</span>${r.note ? `<span class="nt">${esc(r.note)}</span>` : ''}</div>`).join('');
      const lg = arr(n.legend).length ? `<div class="w-bars-lg">${arr(n.legend).map((t, i) => `<span><i style="background:${sh[i % sh.length]}"></i>${esc(t)}</span>`).join('')}</div>` : '';
      return `<div class="w-bars">${rows}${lg}${n.caption ? `<span class="cap">${esc(n.caption)}</span>` : ''}</div>`; },
    examples: [{ c: 'bars', legend: ['mRS 0', 'mRS 1', 'mRS 2', 'mRS 3–6'], rows: [{ label: 'Baseline', segments: [{ value: 50.5 }, { value: 13.4 }, { value: 8.9 }, { value: 27.2 }], note: '73%' }, { label: '6 months', segments: [{ value: 55.5 }, { value: 18.8 }, { value: 7.7 }, { value: 18 }], note: '82%' }] }] });
  register('dots', { group: 'Media', doc: 'Unit chart: one dot per person or per cent. Groups are filled in order, the rest stay empty.', props: { total: P('n', 'dots in all'), groups: P('[{n, label}]', 'filled dots, in order'), cols: P('n', 'dots per row'), caption: P('text', '') },
    render: n => { const total = n.total || 100; const g = arr(n.groups); let k = 0; const cls = []; g.forEach((x, gi) => { for (let i = 0; i < x.n; i++) cls.push('g' + gi); }); while (cls.length < total) cls.push('');
      return `<div class="w-dots"><span class="grid" style="grid-template-columns:repeat(${n.cols || 15}, 10px)">${cls.slice(0, total).map(c => `<i class="${c}"></i>`).join('')}</span><span class="lg">${g.map((x, gi) => `<span><i class="g${gi}"></i>${esc(x.label)}</span>`).join('')}</span>${n.caption ? `<span class="cap">${esc(n.caption)}</span>` : ''}</div>`; },
    examples: [{ c: 'dots', total: 90, cols: 15, groups: [{ n: 32, label: 'Ruptured · 32' }, { n: 58, label: 'Unruptured · 58' }], caption: 'Each dot is one patient' }] });

  // Sections (site)
  register('hero', { group: 'Sections', doc: 'First screen of a site page. v: banner (dark, full width) · split (text and media) · title (light, line under) · compact (title in the flow of the page).', props: { v: P('banner|split|title|compact', ''), eyebrow: P('text', ''), title: P('text', ''), text: P('text', ''), actions: P('buttons', ''), media: P('media props', ''), bg: P('text', 'background media label') },
    render: n => { const v = n.v || 'banner'; const t = `<div class="w-stack">${n.eyebrow ? node({ c: 'eyebrow', text: n.eyebrow }) : ''}${node({ c: 'heading', level: 1, text: n.title })}${txt(v === 'compact' ? 'muted' : 'lead', n.text)}${n.actions ? `<div class="w-row g-s wrap">${buttons(n.actions)}</div>` : ''}</div>`;
      if (v === 'split') return node({ c: 'section', pad: 'l', rule: true, items: [{ c: 'grid', cols: 2, align: 'center', items: [{ c: '_raw', html: t }, Object.assign({ c: 'media', ratio: '4/3' }, n.media || {})] }] });
      if (v === 'compact') return `<section class="w-section pad-s"><div class="in">${t}</div></section>`;
      if (v === 'title') return `<section class="w-section pad-l rule"><div class="in">${t}</div></section>`;
      return `<section class="w-section dark pad-l">${n.bg ? `<span class="w-bgchip">${esc(n.bg)}</span>` : ''}<div class="in"><div style="max-width:720px">${t}</div></div></section>`; },
    examples: [{ c: 'hero', v: 'banner', eyebrow: 'Therapies / Large vessel stroke', title: 'A patient-centric approach to AIS', text: 'TIGERTRIEVER™ is the only active thrombectomy device.', actions: [{ v: 'primary', text: 'Request a demo' }], bg: 'Background video · tigerface-wide.mp4' }] });
  register('_raw', { group: 'hidden', render: n => n.html });
  register('textmedia', { group: 'Sections', doc: 'Text next to media.', props: { v: P('mediaRight|mediaLeft', ''), eyebrow: P('text', ''), title: P('text', ''), text: P('text', ''), actions: P('buttons', ''), media: P('media props', ''), tone: P('paper|surface', '') },
    render: n => { const t = `<div class="w-stack">${n.eyebrow ? node({ c: 'eyebrow', text: n.eyebrow }) : ''}${node({ c: 'heading', level: 2, text: n.title })}${txt('muted', n.text)}${n.actions ? `<div class="w-row g-s wrap">${buttons(n.actions)}</div>` : ''}</div>`; const m = media(Object.assign({ ratio: '4/3' }, n.media || {}));
      return `<section class="w-section ${n.tone || ''}"><div class="in"><div class="w-grid" style="grid-template-columns:1fr 1fr;align-items:center">${n.v === 'mediaLeft' ? m + t : t + m}</div></div></section>`; },
    examples: [{ c: 'textmedia', tone: 'surface', eyebrow: 'Gain active', title: 'control', text: 'Unlike conventional stent retrievers, active thrombectomy can improve clot penetration.', media: { kind: 'video', label: 'active-control.mp4' } }] });
  register('cards', { group: 'Sections', doc: 'Section with a title and a grid of cards.', props: { title: P('text', ''), cols: P('n', ''), items: P('[card props]', ''), tone: P('paper|surface', '') },
    render: n => `<section class="w-section ${n.tone || ''}"><div class="in">${n.title ? node({ c: 'heading', level: 2, text: n.title }) : ''}<div class="w-grid" style="grid-template-columns:${cols(n.cols || 3)}">${arr(n.items).map(i => node(Object.assign({ c: 'card' }, i))).join('')}</div></div></section>`,
    examples: [{ c: 'cards', title: 'At the forefront of advancing stroke intervention', cols: 3, items: [{ eyebrow: 'Mar 2026', title: 'FDA clears TIGERTRIEVER 13' }, { eyebrow: 'Feb 2026', title: 'DISTALS results presented at ISC' }, { eyebrow: 'Jan 2026', title: 'New office in Texas' }] }] });
  register('cta', { group: 'Sections', doc: 'Call to action. v: band (dark) · light (grey) · panel (dark box inside a section).', props: { v: P('band|light|panel', ''), title: P('text', ''), text: P('text', ''), actions: P('buttons', '') },
    render: n => { const inner = `${n.title ? node({ c: 'heading', level: 2, text: n.title }) : ''}${txt(n.v === 'light' ? 'muted' : '', n.text)}${n.actions ? `<div class="w-row g-s wrap ${n.v === 'panel' ? 'j-center' : ''}">${buttons(n.actions)}</div>` : ''}`;
      if (n.v === 'light') return `<section class="w-section surface"><div class="in">${inner}</div></section>`;
      if (n.v === 'panel') return `<section class="w-section"><div class="in"><div class="w-box dark pad-l" style="text-align:center;display:grid;gap:14px;justify-items:center">${inner}</div></div></section>`;
      return `<section class="w-section dark"><div class="in"><div class="w-row g-l wrap">${inner}</div></div></section>`; },
    examples: [{ c: 'cta', v: 'band', title: 'Questions?', text: 'Reach out to learn more about our company and devices.', actions: [{ v: 'primary', text: 'Contact us' }] }] });
  register('features', { group: 'Sections', doc: 'Icon columns.', props: { title: P('text', ''), cols: P('n', ''), items: P('[{title, text}]', '') },
    render: n => `<section class="w-section"><div class="in">${n.title ? node({ c: 'heading', level: 2, text: n.title }) : ''}<div class="w-grid" style="grid-template-columns:${cols(n.cols || 3)}">${arr(n.items).map(i => `<div class="w-row a-start"><div style="width:48px;flex:none">${media({ kind: 'icon', ratio: '1/1', tiny: true })}</div><div class="w-stack g-s">${node({ c: 'heading', level: 4, text: i.title })}${txt('small', i.text)}</div></div>`).join('')}</div></div></section>`,
    examples: [{ c: 'features', cols: 2, items: [{ title: 'Reinforced distal protection', text: 'Distal Embolic Net helps protect against distal emboli.' }, { title: 'Complete visibility', text: 'Radiopacity improves first-pass success.' }] }] });

  /* ---------- screens ---------- */
  function renderScreen(s, mode) {
    NOTES = []; HOTS = [];
    const body = arr(s.body).map(node).join('');
    let ov = '';
    if (s.overlay) { const d = REG[s.overlay.c]; const kind = d && d.overlay; ov = kind ? `<div class="w-overlay ${kind} ${s.overlay.side === 'left' ? 'left' : ''}">${node(s.overlay)}</div>` : `<div class="w-overlay modal">${node(s.overlay)}</div>`; }
    const notes = NOTES.concat(arr(s.notes)); const hots = HOTS; NOTES = null; HOTS = null;
    const chrome = s.url ? `<div class="w-chrome"><i></i><i></i><i></i><span class="url">${esc(s.url)}</span></div>` : '';
    const dev = s.device || 'desktop';
    return { hots, html: `<div class="w-screen ${dev}" data-screen="${esc(s.id)}">${chrome}<div class="w-body" style="${s.height ? 'min-height:' + s.height + 'px' : ''}">${body}${ov}</div></div>`, notes };
  }
  const WIDTH = { desktop: 1280, tablet: 820, mobile: 390 };

  /* ---------- app (board / prototype / library) ---------- */
  function app(root, data) {
    const flow = data.flow || null;
    const screens = flow ? arr(flow.screens) : [];
    const byId = Object.fromEntries(screens.map((s, i) => [s.id, Object.assign({ n: i + 1 }, s)]));
    const title = flow ? flow.title : 'Wireframe kit';
    const top = (active) => `<header class="k-top"><div class="k-brand"><b>${esc(title)}</b><span>${esc(flow ? [flow.project, screens.length + ' screens'].filter(Boolean).join(' · ') : 'Components for wireframes and flows')}</span></div>
      <nav class="k-tabs">${flow ? `<a href="#board" ${active === 'board' ? 'aria-current="page"' : ''}>Flow</a><a href="#proto-${esc(flow.start || screens[0]?.id || '')}" ${active === 'proto' ? 'aria-current="page"' : ''}>Prototype</a>` : ''}<a href="#library" ${active === 'library' ? 'aria-current="page"' : ''}>Library</a></nav></header>`;

    function vBoard() {
      const groups = flow.groups && flow.groups.length ? flow.groups : [{ title: '', screens: screens.map(s => s.id) }];
      return `<main class="k-main"><div class="k-kicker">${esc(flow.project || 'Flow')}</div><h1 class="k-ttl">${esc(flow.title)}</h1>${flow.description ? `<p class="k-lede">${esc(flow.description)}</p>` : ''}
        ${groups.map((g, gi) => `<section class="k-group">${g.title ? `<h2>${esc(g.title)}</h2>` : ''}<div class="k-lane-wrap"><div class="k-lane" data-lane="${gi}">${arr(g.screens).map(id => { const s = byId[id]; if (!s) return ''; const r = renderScreen(s); const w = WIDTH[s.device || 'desktop']; const z = (s.device === 'mobile' ? 300 : 560) / w;
          const outs = r.hots.filter(h => !h.quiet).concat(arr(flow.links).filter(l => l.from === s.id));
          return `<article class="k-card" data-card="${esc(s.id)}" style="width:${Math.round(w * z)}px"><div class="k-card-head"><b>${s.n}. ${esc(s.title || s.id)}</b><a href="#proto-${esc(s.id)}">open ↗</a></div><div style="zoom:${z}">${r.html}</div>
            ${r.notes.length ? `<ol class="k-notes">${r.notes.map((t, i) => `<li><span class="k-num">${i + 1}</span><span>${esc(t)}</span></li>`).join('')}</ol>` : ''}
            ${outs.length ? `<div class="k-goes">${outs.map(o => `→ ${byId[o.to] ? byId[o.to].n + '. ' + esc(byId[o.to].title || o.to) : esc(o.to)}${o.label ? ' · ' + esc(o.label) : ''}`).join('<br>')}</div>` : ''}</article>`; }).join('')}<svg class="k-arrows" aria-hidden="true"></svg></div></div></section>`).join('')}</main>`;
    }
    function drawArrows() {
      root.querySelectorAll('.k-lane').forEach(lane => {
        const svg = lane.querySelector('.k-arrows'); if (!svg) return;
        const lb = lane.getBoundingClientRect(); svg.setAttribute('width', lb.width); svg.setAttribute('height', lb.height);
        const paths = [];
        lane.querySelectorAll('.k-card').forEach(card => {
          const hot = [...card.querySelectorAll('[data-to]:not([data-quiet])')].map(el => ({ el, to: el.dataset.to }));
          const extra = arr(flow.links).filter(l => l.from === card.dataset.card).map(l => ({ el: card, to: l.to, label: l.label }));
          hot.concat(extra).forEach(h => {
            const target = lane.querySelector(`.k-card[data-card="${CSS.escape(h.to)}"]`); if (!target) return;
            const a = h.el.getBoundingClientRect(), b = target.getBoundingClientRect();
            const x1 = a.right - lb.left, y1 = a.top + a.height / 2 - lb.top, x2 = b.left - lb.left - 4, y2 = b.top - lb.top + 34;
            if (x2 > x1) { const dx = Math.max(30, (x2 - x1) / 2); paths.push(`<path d="M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}"/><path d="M${x2 - 7},${y2 - 4} L${x2},${y2} L${x2 - 7},${y2 + 4}"/>`); }
            else { const yb = lb.height - 12, xe = b.left - lb.left + 30; paths.push(`<path d="M${x1},${y1} C${x1 + 40},${y1} ${x1 + 40},${yb} ${x1},${yb} L${xe},${yb} L${xe},${b.bottom - lb.top + 2}" stroke-dasharray="4 4"/>`); }
          });
        });
        svg.innerHTML = paths.join('');
      });
    }
    function vProto(id) {
      const s = byId[id] || screens[0]; if (!s) return vLibrary();
      const r = renderScreen(s);
      return `<main class="k-main"><div class="k-proto"><div class="k-stage" id="stage"><div class="k-kicker">${s.n} / ${screens.length}</div><h1 class="k-ttl" style="font-size:20px">${esc(s.title || s.id)}</h1><div id="fit" style="margin-top:10px">${r.html}</div><p class="k-goes" style="margin-top:10px">Click a highlighted element to go on. Click anywhere else to see what is clickable.</p></div>
        <aside class="k-side">${r.notes.length ? `<div class="k-panel"><div class="k-kicker" style="margin-bottom:8px">Notes</div><ol class="k-notes">${r.notes.map((t, i) => `<li><span class="k-num">${i + 1}</span><span>${esc(t)}</span></li>`).join('')}</ol></div>` : ''}
        <div class="k-panel"><div class="k-kicker" style="margin-bottom:8px">Screens</div><ol>${screens.map(x => `<li><a href="#proto-${esc(x.id)}" aria-current="${x.id === s.id}">${esc(x.title || x.id)}</a></li>`).join('')}</ol></div></aside></div></main>`;
    }
    function fitProto() {
      const fit = root.querySelector('#fit'); if (!fit) return; const sc = fit.firstElementChild; if (!sc) return;
      const w = WIDTH[sc.classList.contains('mobile') ? 'mobile' : sc.classList.contains('tablet') ? 'tablet' : 'desktop'];
      sc.style.zoom = Math.min(1, fit.clientWidth / w);
    }
    function vLibrary() {
      const groups = GROUPS.concat(Object.values(REG).some(d => d.group === 'Project') ? ['Project'] : []);
      const list = g => Object.entries(REG).filter(([, d]) => d.group === g);
      return `<main class="k-main"><div class="k-lib"><nav class="k-libnav">${groups.map(g => `<h4>${g}</h4>${list(g).map(([n]) => `<a href="#c-${n}">${n}</a>`).join('')}`).join('')}</nav>
        <div style="display:grid;gap:14px;min-width:0"><div><div class="k-kicker">Library</div><h1 class="k-ttl">Wireframe components</h1><p class="k-lede">Every component with its properties and a JSON example. A flow screen is a list of these nodes. Any node also takes: <code>to</code> (goes to a screen; with <code>quiet</code> it is clickable in the prototype but not drawn on the board), <code>annotation</code> (numbered note about a UX decision), <code>selected</code>, <code>hover</code>, <code>toolbar</code>, <code>popover</code>, <code>cursor</code>.</p></div>
        ${groups.map(g => list(g).map(([name, d]) => `<section class="k-panel k-comp" id="c-${name}"><div class="k-comp-head"><b>${name}</b><span class="k-chip">${g}</span></div><p class="k-lede">${esc(d.doc || '')}</p>
          ${Object.keys(d.props || {}).length ? `<div class="k-scroll"><table class="k-props"><thead><tr><th>Property</th><th>Value</th><th></th></tr></thead><tbody>${Object.entries(d.props).map(([k, p]) => `<tr><td><code>${k}</code></td><td class="mono">${esc(p.type)}</td><td>${esc(p.doc)}</td></tr>`).join('')}</tbody></table></div>` : ''}
          ${arr(d.examples).map(ex => `<div class="k-example"><div class="k-scroll"><div class="w-screen" style="width:auto;min-width:0;padding:${d.overlay ? '0' : '16px'}">${d.overlay ? `<div style="position:relative;min-height:300px"><div class="w-overlay ${d.overlay}">${node(ex)}</div></div>` : node(ex)}</div></div><pre class="k-json">${esc(JSON.stringify(ex, null, 1).replace(/\n\s*/g, ' '))}</pre></div>`).join('')}</section>`).join('')).join('')}</div></div></main>`;
    }
    function show() {
      const h = location.hash.slice(1);
      let html, mode;
      if (flow && h.startsWith('proto-')) { html = vProto(h.slice(6)); mode = 'proto'; }
      else if (!flow || h === 'library' || h.startsWith('c-')) { html = vLibrary(); mode = 'library'; }
      else { html = vBoard(); mode = 'board'; }
      root.innerHTML = top(mode) + html; root.classList.toggle('k-board', mode === 'board');
      if (mode === 'board') requestAnimationFrame(drawArrows);
      if (mode === 'proto') requestAnimationFrame(fitProto);
      if (mode === 'library' && h.startsWith('c-')) { const el = document.getElementById(h); if (el) el.scrollIntoView(); }
    }
    root.addEventListener('click', e => {
      const hot = e.target.closest('[data-to]');
      if (hot && location.hash.startsWith('#proto-')) { e.preventDefault(); location.hash = 'proto-' + hot.dataset.to; return; }
      const stage = e.target.closest('#stage');
      if (stage && !hot) { stage.classList.add('k-hint'); setTimeout(() => stage.classList.remove('k-hint'), 700); }
    });
    window.addEventListener('hashchange', () => { show(); window.scrollTo(0, 0); });
    window.addEventListener('resize', () => { if (location.hash.startsWith('#proto-')) fitProto(); else requestAnimationFrame(drawArrows); });
    show();
  }

  window.WF = { register, node, renderScreen, app, components: REG };
})();
