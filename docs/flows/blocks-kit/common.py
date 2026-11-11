"""Shared loading for the Rapid Medical blocks kit: real page compositions (../rm-pages.json) → instances of every block.

Instances are every real occurrence of a block on the snapshot pages, plus a few built from real site data for the
variants no page uses yet (marked built=True, with the source in `page`).
"""
import json, re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = json.load(open(HERE.parent / 'rm-pages.json', encoding='utf8'))
META = DATA['meta']


def strip(o):
    if isinstance(o, dict): return {k: strip(v) for k, v in o.items() if k not in ('edit', 'regionLinks', 'anchors', 'generalHref')}
    if isinstance(o, list): return [strip(x) for x in o]
    return o


def walk(bs, fn, nested=False):
    for b in bs:
        if 'group' in b: walk(b['blocks'], fn, True); continue
        fn(b, nested)
        if b['type'] == 'productDetails':
            for t in b['data']['tabs']: walk(t.get('blocks', []), fn, True)


def load():
    pages = {k: strip(v) for k, v in DATA['pages'].items() if v}

    def trim(b, nested):
        d = b['data']
        if b['type'] == 'news' and b['variant'] == 'timeline': d['items'] = d['items'][:14]
        if b['type'] == 'publications' and b['variant'] == 'byProduct':
            for g in d['groups']: g['items'] = g['items'][:5]
    for v in pages.values(): walk(v, trim)

    inst = {}
    for pname, bs in pages.items():
        walk(bs, lambda b, nested, pname=pname: inst.setdefault(b['type'], []).append({'page': pname, 'variant': b['variant'], 'data': b['data'], 'nested': nested}))

    def first(t, v=None):
        return next((i for i in inst.get(t, []) if v is None or i['variant'] == v), None)
    tm_stats = next(i for i in inst['textMedia'] if i['data'].get('stats'))
    home_stat, ev_spot, pd, spec = first('textMedia', 'statement'), first('publications', 'spotlight'), first('productDetails', 'pills'), first('specTable', 'table')
    heroes = [next(b for b in pages[p] if b['type'] == 'hero') for p in ('OUS · Large vessel stroke', 'US · Aneurysm')]
    built = 'Из данных сайта: '
    poster = re.search(r'src="([^"]+)"', next(b for b in pages['US · SUCCESS study'] if b['type'] == 'richText')['data']['html']).group(1)
    extra = [
        ('keyNumbers', 'circles', {'items': tm_stats['data']['stats'], 'caption': tm_stats['data'].get('statsCaption')}, built + tm_stats['page'] + ' (цифры ряда Text and media)'),
        ('keyNumbers', 'row', {'items': home_stat['data']['stats']}, built + 'Home (цифры под заявлением)'),
        ('keyNumbers', 'badge', {'items': [ev_spot['data']['stat']]}, built + 'US · Evidence (бейдж числа публикаций)'),
        ('media', 'image', {'imageUrl': poster}, built + 'US · SUCCESS study (постер внутри текста)'),
        ('media', 'video', {'videoUrl': 'https://vid.cdn-website.com/8b5f57de/videos/4dlgjo3QFam70mAUC7RQ_Comaneci+spinal+case_Patankar-v.mp4'}, built + 'OUS · COMANECI spinal case (видео внутри текста)'),
        ('media', 'document', {'document': {'label': 'Open PDF', 'href': 'https://irp.cdn-website.com/9d0280ee/files/uploaded/TigerTrieverIFU_CANADA_ANTRPP3661C_07-Jan+2026.pdf'}}, built + 'US · TIGERTRIEVER™ IFU – Canada'),
        ('columns', 'cards', {'items': [{'eyebrow': h['data']['eyebrow'].split('/')[-1].strip(), 'title': h['data']['title'], 'href': '#'} for h in heroes]}, built + 'записи терапий (запасной вид списка)'),
        ('productDetails', 'underline', pd['data'], built + pd['page'] + ' (те же вкладки)'),
        ('specTable', 'images', {'images': ['https://irp.cdn-website.com/9d0280ee/dms3rep/multi/opt/Specifications-Resized-1920w.jpg'], 'note': spec['data']['table'].get('note')}, built + 'US · Large vessel stroke (старый формат спецификаций)'),
    ]
    for t, v, data, src in extra:
        inst.setdefault(t, []).append({'page': src, 'variant': v, 'data': data, 'nested': False, 'built': True})
    return pages, inst
