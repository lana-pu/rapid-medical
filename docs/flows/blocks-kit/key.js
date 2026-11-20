/* Key of a wireframe node's real render. One function for both sides: the pack (browser, inlined by make-pack.py)
   looks a node up by it, render.cjs (Node) files the snapshot under it. A node is "rm-<type>" with the variant in "v"
   and the block's fields; the kit's own props (hotspots, notes, selection) are not part of the block. */
var WFKEY = (function () {
  var KIT = ['c', 'v', 'to', 'quiet', 'annotation', 'selected', 'hover', 'toolbar', 'toolbarPos', 'popover', 'popoverPos', 'cursor', 'grow', 'focus', 'asis', '_html'];
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
  // "asis": the node is on a screen "as is" — drawn by the code before the redesign, a separate snapshot
  function era(u, n) { if (n.asis) u.asis = true; return u; }
  function unit(n, variantOf) { return era({ page: false, blocks: [block(n, variantOf)] }, n); }
  // An rm-page: runs of page blocks are units (the site groups them); anything else between them (the header) stays a
  // kit node. Returns [{unit, items}] and [{node}] in order; `items` are the run's own nodes (for notes and hotspots).
  function segments(n, variantOf, isBlock) {
    var out = [], run = null;
    (n.items || []).filter(Boolean).forEach(function (i) {
      if (!isBlock(String(i.c).replace(/^rm-/, ''))) { run = null; out.push({ node: i }); return; }
      if (!run) { run = { unit: era({ page: true, blocks: [] }, n), items: [] }; out.push(run); }
      run.unit.blocks.push(block(i, variantOf)); run.items.push(i);
    });
    return out;
  }
  return { unit: unit, segments: segments, key: function (u) { return hash(stable(u)); } };
})();
if (typeof module !== 'undefined') module.exports = WFKEY;
