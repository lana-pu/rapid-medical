#!/usr/bin/env python3
"""Generates ../pack.js (the Rapid Medical pack for the /wireframes kit): the site's blocks drawn by the site itself.
   python3 docs/flows/blocks-kit/make-pack.py
Inputs: pack.template.js (registration, rm-page, header, footer), key.js (node → snapshot key, shared with render.cjs),
wf-theme.css (grey tokens), ../rm-render.json and ../rm-render-asis.json (snapshots, render.sh), ../rm-pages.json (block
metadata and real instances for the Library examples). Also writes examples.json — render.cjs snapshots them too."""
import json
from pathlib import Path
from common import META, load

HERE = Path(__file__).resolve().parent
FLOWS = HERE.parent

pages, inst = load()


def trim(t, data):
    data = json.loads(json.dumps(data))
    if t == 'news': data['items'] = data.get('items', [])[:4]
    if t == 'publications':
        if 'items' in data: data['items'] = data['items'][:3]
        for g in data.get('groups', []): g['items'] = g['items'][:3]
        if 'groups' in data: data['groups'] = data['groups'][:3]
    if t == 'richText': data['html'] = data['html'][:1800]
    if t == 'indications':
        for k in ('referencesHtml', 'indicationsHtml'): data[k] = (data.get(k) or '')[:900]
    if t == 'productDetails':
        for tab in data['tabs']: tab['blocks'] = tab.get('blocks', [])[:2]
    for k in ('members', 'items'):
        if t in ('people', 'webinars') and data.get(k): data[k] = data[k][:3]
    if t == 'officesMap': data['offices'] = data['offices'][:4]
    return data


examples = {}
for m in META:
    for v in m['variants']:
        i = next((x for x in inst.get(m['type'], []) if x['variant'] == v['id']), None)
        # a variant no page uses: the registry's sample data (render-page.tsx reads {"sample": true})
        data = trim(m['type'], i['data']) if i else {'sample': True}
        examples.setdefault(m['type'], []).append(dict({'c': 'rm-' + m['type'], 'v': v['id']}, **data))
# the site's header, footer, banner and a whole page (pack: rm-header, rm-footer, rm-regionBanner, rm-route)
# a page of blocks grouped as on the site
examples['rm-page'] = [{'c': 'rm-page', 'items': [x for x in (examples.get('hero', [None] * 3)[2], *examples.get('textMedia', [])[:2], (examples.get('cta') or [None])[0]) if x]}]
examples['rm-header'] = [{'c': 'rm-header', 'region': 'us', 'menuOpen': True}, {'c': 'rm-header', 'region': 'ous'}, {'c': 'rm-header'}]
examples['rm-footer'] = [{'c': 'rm-footer', 'region': 'ous'}]
examples['rm-regionBanner'] = [{'c': 'rm-regionBanner', 'suggested': 'us'}]
examples['rm-regionModal'] = [{'c': 'rm-regionModal', 'next': '/us/evidence'}, {'c': 'rm-regionModal', 'region': 'us', 'source': 'location', 'back': '/us'}]
examples['rm-route'] = [{'c': 'rm-route', 'path': '/us/success-study-final-results'}]
(HERE / 'examples.json').write_text(json.dumps(examples, ensure_ascii=False), encoding='utf8')


def snapshot(name):
    p = FLOWS / name
    return json.loads(p.read_text(encoding='utf8')) if p.exists() else {'css': '', 'units': {}}


now, asis = snapshot('rm-render.json'), snapshot('rm-render-asis.json')
# branches not yet in main, one snapshot each (render-branch.sh <name>)
branches = {p.name[len('rm-render-branch-'):-len('.json')]: snapshot(p.name) for p in sorted(FLOWS.glob('rm-render-branch-*.json'))}
render = {'css': now['css'], 'units': now['units'], 'asis': asis['units'], 'branch': {b: s['units'] for b, s in branches.items()}}
# the code before the redesign and each branch: their own CSS, scoped to .rmxa and .rmxb-<name>
render['css'] += '\n' + asis.get('css', '') + ''.join('\n' + s.get('css', '') for s in branches.values())

names = ['rm-page', 'rm-header', 'rm-footer', 'rm-regionBanner', 'rm-regionModal', 'rm-route', 'rm-dialog', 'rm-hot'] + ['rm-' + m['type'] for m in META]
pack = ((HERE / 'pack.template.js').read_text(encoding='utf8')
        .replace('/*RENDER*/{}', json.dumps(render, ensure_ascii=False).replace('</', '<\\/'))
        .replace('/*KEY*/', (HERE / 'key.js').read_text(encoding='utf8'))
        .replace('/*THEME*/""', json.dumps((HERE / 'wf-theme.css').read_text(encoding='utf8')))
        .replace('/*META*/[]', json.dumps([{k: m[k] for k in ('type', 'name', 'description', 'category', 'variants', 'fields')} for m in META], ensure_ascii=False))
        .replace('/*EXAMPLES*/{}', json.dumps(examples, ensure_ascii=False))
        .replace('/*NAMES*/', ' '.join(names)))
(FLOWS / 'pack.js').write_text(pack, encoding='utf8')
shown = ', '.join('%s %d (%s)' % (b, len(x['units']), x.get('commit') or '') for b, x in branches.items())
print(f"ok: pack.js {len(pack) // 1024} KB, {len(names)} components; snapshots: {len(now['units'])} now (from {now.get('snapshot', '—')}), {len(asis['units'])} as is; branches: {shown or '—'}")
