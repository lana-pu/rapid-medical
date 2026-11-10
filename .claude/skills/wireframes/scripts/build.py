#!/usr/bin/env python3
"""Build a self-contained wireframe page.

  build.py <flow.json> <out.html> [--pack pack.js ...]   flow: board + prototype + library
  build.py --library <out.html> [--pack pack.js ...]     library only

Checks the flow before building: unique screen ids, links and hotspots that point to existing screens,
known components (kit + packs), screens that cannot be reached. Problems are printed; errors stop the build.
Format: ../references/flow-format.md
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent / 'assets'


def known_components(packs):
    src = (HERE / 'kit.js').read_text(encoding='utf8') + ''.join(Path(p).read_text(encoding='utf8') for p in packs)
    return set(re.findall(r"register\('([A-Za-z_][\w-]*)'", src))


def walk(n, fn):
    if isinstance(n, list):
        for x in n: walk(x, fn)
    elif isinstance(n, dict):
        if 'c' in n: fn(n)
        for k, v in n.items():
            if k in ('items', 'body', 'actions', 'toolbar', 'popover', 'left', 'center', 'right', 'overlay', 'action') or isinstance(v, (list, dict)):
                walk(v, fn)


def check(flow, comps):
    errors, warns = [], []
    screens = flow.get('screens') or []
    ids = [s.get('id') for s in screens]
    if not screens: errors.append('no screens')
    dup = {i for i in ids if ids.count(i) > 1}
    if dup: errors.append(f'duplicate screen ids: {sorted(dup)}')
    if any(not i for i in ids): errors.append('every screen needs an id')
    idset = set(ids)
    reached = {flow.get('start') or (ids[0] if ids else None)}
    for s in screens:
        def visit(n, s=s):
            c = n.get('c')
            if c not in comps: errors.append(f'{s["id"]}: unknown component "{c}"')
            to = n.get('to')
            if to:
                if to not in idset: errors.append(f'{s["id"]}: "to" points to missing screen "{to}"')
                reached.add(to)
            for it in n.get('items') or []:
                if isinstance(it, dict) and it.get('to'):
                    if it['to'] not in idset: errors.append(f'{s["id"]}: item "to" points to missing screen "{it["to"]}"')
                    reached.add(it['to'])
        walk(s.get('body'), visit)
        if s.get('overlay'): walk(s['overlay'], visit)
        if s.get('device', 'desktop') not in ('desktop', 'tablet', 'mobile'): errors.append(f'{s["id"]}: device must be desktop, tablet or mobile')
    for l in flow.get('links') or []:
        for k in ('from', 'to'):
            if l.get(k) not in idset: errors.append(f'link {l}: "{k}" is not a screen')
        reached.add(l.get('to'))
    for g in flow.get('groups') or []:
        for i in g.get('screens') or []:
            if i not in idset: errors.append(f'group "{g.get("title")}": unknown screen "{i}"')
    if flow.get('groups'):
        grouped = {i for g in flow['groups'] for i in g.get('screens') or []}
        missing = [i for i in ids if i not in grouped]
        if missing: warns.append(f'screens not in any group (not shown on the board): {missing}')
    lonely = [i for i in ids if i not in reached]
    if lonely: warns.append(f'screens no hotspot or link leads to: {lonely}')
    return errors, warns


def main(argv):
    packs = []
    if '--pack' in argv:
        i = argv.index('--pack'); packs = argv[i + 1:]; argv = argv[:i]
    if len(argv) != 2:
        print(__doc__); return 2
    src, out = argv
    comps = known_components(packs)
    if src == '--library':
        data, title = {}, 'Wireframe kit'
    else:
        flow = json.loads(Path(src).read_text(encoding='utf8'))
        errors, warns = check(flow, comps)
        for w in warns: print('warning:', w)
        for e in errors: print('error:', e)
        if errors: return 1
        data, title = {'flow': flow}, flow.get('title') or 'Flow'
    tpl = (HERE / 'template.html').read_text(encoding='utf8')
    js = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
    html = (tpl.replace('__TITLE__', title.replace('<', '&lt;'))
            .replace('/*__CSS__*/', (HERE / 'kit.css').read_text(encoding='utf8'))
            .replace('/*__KIT__*/', (HERE / 'kit.js').read_text(encoding='utf8'))
            .replace('/*__PACKS__*/', '\n'.join(Path(p).read_text(encoding='utf8') for p in packs))
            .replace('/*__DATA__*/', js))
    Path(out).write_text(html, encoding='utf8')
    n = len(data.get('flow', {}).get('screens', [])) if data else 0
    print(f'ok: {out} · {n} screens · {len(comps) - sum(1 for c in comps if c.startswith("_"))} components')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
