/* Key of a wireframe node's real render. One function for both sides: the pack (browser, inlined by make-pack.py)
   looks a node up by it, render.cjs (Node) files the snapshot under it.
   Units (what the site renders for one node):
   - blocks: "rm-<type>" with the variant in "v" and the block's fields, or a run of them inside "rm-page";
   - chrome: "rm-header" / "rm-footer" {region}, "rm-regionBanner" {suggested} — the site's own header, footer, banner;
     "rm-regionModal" {region, source, back | next} — the «Choose your location» window, opened as a click opens it;
   - route: "rm-route" {path, region} — the main part of a real page of the site (pages built in their route, not from
     blocks); region — the visitor's chosen region (its cookie).
   "act" on a node — steps done in the browser before the snapshot (a state: errors, sent, a search) — is part of the
   unit. The kit's own props (hotspots, notes, selection) and the pack's ("links", "state", "focus") are not. */
var WFKEY = (function () {
  var KIT = ['c', 'v', 'to', 'quiet', 'annotation', 'selected', 'hover', 'toolbar', 'toolbarPos', 'popover', 'popoverPos', 'cursor', 'grow', 'focus', 'asis', 'branch', 'act', 'links', 'state', '_html'];
  var CHROME = { 'rm-header': 'header', 'rm-footer': 'footer', 'rm-regionBanner': 'banner', 'rm-regionModal': 'modal' };
  function stable(x) {
    if (Array.isArray(x)) return '[' + x.map(stable).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).filter(function (k) { return x[k] !== undefined; }).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(x[k]); }).join(',') + '}';
    return JSON.stringify(x === undefined ? null : x);
  }
  // FNV-1a over UTF-16 code units, two seeds → 16 hex digits
  function hash(s) {
    var a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ c, 0x01000193); b = (b ^ (b >>> 15)) >>> 0; }
    return ('0000000' + (a >>> 0).toString(16)).slice(-8) + ('0000000' + (b >>> 0).toString(16)).slice(-8);
  }
  function block(n, variantOf) {
    var type = String(n.c).replace(/^rm-/, ''), data = {};
    Object.keys(n).forEach(function (k) { if (KIT.indexOf(k) < 0 && !(k === 'label' && n.to)) data[k] = n[k]; });
    return { type: type, variant: n.v || variantOf(type), data: data };
  }
  // "asis": a screen "as is" — drawn by the code before the redesign; "branch": "<name>" — drawn by the code of that
  // branch, not yet in main (render-branch.sh <name>) — each a separate snapshot
  function era(u, n) { if (n.asis) u.asis = true; if (n.branch) u.branch = String(n.branch); return u; }
  function acts(u, list) { if (list.length) u.act = list; return u; }
  function unit(n, variantOf) {
    if (n.c === 'rm-regionModal') return acts(era({ chrome: 'modal', region: n.region || null, source: n.source || null, back: n.back || null, next: n.next || null }, n), n.act || []);
    if (CHROME[n.c]) return acts(era(n.c === 'rm-regionBanner' ? { chrome: 'banner', suggested: n.suggested || 'us' } : { chrome: CHROME[n.c], region: n.region || null }, n), n.act || []);
    if (n.c === 'rm-route') return acts(era(n.region ? { route: n.path, region: n.region } : { route: n.path }, n), n.act || []);
    // a window a page opens (its act steps open it): only the window is kept
    if (n.c === 'rm-dialog') return acts(era({ route: n.path, region: n.region || null, dialog: true }, n), n.act || []);
    return acts(era({ page: false, blocks: [block(n, variantOf)] }, n), n.act || []);
  }
  // An rm-page: runs of page blocks are units (the site groups them); anything else between them (the header) stays a
  // kit node. Returns [{unit, items}] and [{node}] in order; `items` are the run's own nodes (for notes and hotspots).
  function segments(n, variantOf, isBlock) {
    var out = [], run = null;
    (n.items || []).filter(Boolean).forEach(function (i) {
      if (!isBlock(String(i.c).replace(/^rm-/, ''))) { run = null; out.push({ node: i }); return; }
      if (!run) { run = { unit: era({ page: true, blocks: [] }, n), items: [] }; out.push(run); }
      run.unit.blocks.push(block(i, variantOf)); run.items.push(i);
      if (i.act) run.unit.act = (run.unit.act || []).concat(i.act);
    });
    return out;
  }
  return { unit: unit, segments: segments, chrome: CHROME, key: function (u) { return hash(stable(u)); } };
})();
if (typeof module !== 'undefined') module.exports = WFKEY;
