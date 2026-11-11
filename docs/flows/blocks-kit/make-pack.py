#!/usr/bin/env python3
"""Generates ../pack.js (the Rapid Medical pack for the /wireframes kit) from the same renderers as the blocks kit page.
   python3 docs/flows/blocks-kit/make-pack.py
Edit renderers in page.template.html, pack glue (registration, rm-page, header, footer) in pack.template.js."""
import json
from pathlib import Path
from common import META, load

HERE = Path(__file__).resolve().parent
lines = (HERE / 'page.template.html').read_text(encoding='utf8').split('\n')
start = next(i for i, l in enumerate(lines) if l.startswith('/* ---------- wireframe atoms'))
end = next(i for i, l in enumerate(lines) if l.startswith('/* page composer */'))
css = '\n'.join(lines[start + 1:end]).replace('.frame { font-family: var(--f-ui); font-size: 15px; line-height: 1.55 }\n', '')
css = '.w-screen { container: frame / inline-size }\n' + css
js_start = next(i for i, l in enumerate(lines) if l.startswith('const esc ='))
js_end = next(i for i, l in enumerate(lines) if l.startswith('/* page = groups'))
js = '\n'.join(lines[js_start:js_end])

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
        i = next((x for x in inst.get(m['type'], []) if x['variant'] == v['id']), None) or (inst.get(m['type']) or [None])[0]
        if i: examples.setdefault(m['type'], []).append(dict({'c': 'rm-' + m['type'], 'v': v['id']}, **trim(m['type'], i['data'])))
names = ['rm-page', 'rm-header', 'rm-footer', 'rm-regionBanner'] + ['rm-' + m['type'] for m in META]
pack = ((HERE / 'pack.template.js').read_text(encoding='utf8')
        .replace('/*CSS*/""', json.dumps(css)).replace('/*JS*/', js)
        .replace('/*META*/[]', json.dumps([{k: m[k] for k in ('type', 'name', 'description', 'category', 'variants', 'fields')} for m in META], ensure_ascii=False))
        .replace('/*EXAMPLES*/{}', json.dumps(examples, ensure_ascii=False))
        .replace('/*NAMES*/', ' '.join(names)))
(HERE.parent / 'pack.js').write_text(pack, encoding='utf8')
print('ok: pack.js', len(pack), 'bytes,', len(names), 'components')
