# Generates site-prototype.json next to this file. Run: python3 docs/flows/site-prototype.py
# A clickable prototype of the public site (Americas, desktop) with every decision from site-pages.md applied.
# Screens are built by the same functions as the wireframe series (site-pages.py); this file adds a clickable
# the two pages decided last (Home, therapy — sketches until they are in the code) and the links between screens.
# Pages in the code are the real site (site-pages.py: now / route), with hotspots on their real links ("links").
# Build: build.py docs/flows/site-prototype.json <out>.html --pack docs/flows/pack.js
import copy
import re
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).parent
spec = importlib.util.spec_from_file_location('sp', HERE / 'site-pages.py')
sp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sp)
T, H, S, rm, page, stat = sp.T, sp.H, sp.S, sp.rm, sp.page, sp.stat
OUT = HERE / 'site-prototype.json'


# ---------- the site's header and footer, clickable (hotspots on their real links) ----------
def item(text, to, on=False):
    """A tab of the therapy-page sketch (the page is not in the code yet)."""
    return {'c': 'text', 'v': 'strong', 'text': text} if on else {'c': 'link', 'text': text, 'to': to, 'quiet': True}


HEADER_LINKS = [('Rapid Medical – home', 'home'), ('Welcome', 'home'), ('Therapies', 'menu'), ('Evidence', 'evidence'), ('News & Events', 'news'),
                ('About Us', 'about'), ('Careers', 'careers'), ('Contact Us', 'contact-new'), ('🌐 Americas ▾', 'region')]
MENU_LINKS = [('Large vessel stroke', 'lvo'), ('Aneurysm', 'aneurysm'), ('All therapies →', 'therapies')]


def nav(active=None, menu_open=False):
    """The site header (rm-header); `active` is gone: the site marks no current section."""
    links = [{'text': t, 'to': to, 'quiet': True} for t, to in HEADER_LINKS + (MENU_LINKS if menu_open else [])]
    return dict({'c': 'rm-header', 'region': 'us', 'links': links}, **({'menuOpen': True} if menu_open else {}))


FOOT = {'c': 'rm-footer', 'region': 'us', 'links': [{'text': t, 'to': 'terms', 'quiet': True} for t in ('Privacy Statement', 'Terms of Use', 'Compliance Statement', 'Patents')]}


# ---------- pages decided last ----------
def home_page(menu_open=False):
    """Story order: promise → problem and our answer → the therapies → how they are engineered → proof → news."""
    hero = dict(rm('Home', 0), to='therapies', label='Explore Therapies')
    statement = rm('Home', 1)
    stats = statement.pop('stats')
    statement['to'] = 'contact-new'
    cards = [sp.ther_card(f'{g} · {p}', t, b, n) for g, p, t, b, n in sp.THER_US]
    cards[0]['to'] = 'lvo'
    cards[1]['to'] = 'aneurysm'
    therapies = {'c': 'section', 'pad': 'l', 'items': [S([{'c': 'row', 'justify': 'between', 'items': [H('Our therapies', 2), {'c': 'link', 'text': 'All therapies →', 'to': 'therapies'}]},
                                                          {'c': 'grid', 'cols': 3, 'gap': 'm', 'align': 'start', 'items': cards}], 'm')]}
    numbers = {'c': 'grid', 'cols': 3, 'gap': 'm', 'items': [{'c': 'stat', 'value': '102' if 'publication' in x['label'] else x['value'], 'label': x['label']} for x in stats]}
    studies = {'c': 'grid', 'cols': 2, 'gap': 'm', 'align': 'start', 'items': [
        SUCCESS_CARD, sp.key_study('TIGER', 'Prospective, multicenter', '[N · центры — из публикации]', '[главная цифра]', '[конечная точка]', 'TIGERTRIEVER™ · LVO')]}
    proof = {'c': 'section', 'pad': 'l', 'tone': 'surface', 'items': [S([
        {'c': 'row', 'justify': 'between', 'items': [H('Backed by clinical evidence', 2), {'c': 'link', 'text': 'All evidence →', 'to': 'evidence'}]}, numbers, studies], 'l')]}
    news = {'c': 'section', 'pad': 'l', 'items': [S([{'c': 'row', 'justify': 'between', 'items': [H('At the forefront of advancing stroke intervention', 2), {'c': 'link', 'text': 'View all news →', 'to': 'news'}]},
                                                    sp.top_block()], 'm')]}
    return [nav('home', menu_open), {'c': 'rm-page', 'items': [hero, statement]}, therapies,
            {'c': 'rm-page', 'items': [rm('Home', 2)]}, proof, news, FOOT]


def block(b):
    if 'group' in b:
        return [H(b['group'], 3)] + [block(x) for x in b['blocks']]
    return dict({'c': 'rm-' + b['type'], 'v': b['variant']}, **b['data'])


def flat(xs):
    out = []
    for x in xs:
        out += x if isinstance(x, list) else [x]
    return out


TABS = [('Product overview', 'overview'), ('How it works', 'how'), ('In-Practice', 'practice'), ('Clinical evidence', 'evidence')]


def therapy_page(snap, slug, tab, studies, pubs):
    blocks = sp.RM[snap]
    pdx = next(b for b in blocks if b['type'] == 'productDetails')['data']
    i_pd = next(i for i, b in enumerate(blocks) if b['type'] == 'productDetails')
    hero = dict(rm(snap, 0), to='contact-new', label='Request a demo')
    safety = {'c': 'section', 'pad': 's', 'items': [{'c': 'row', 'justify': 'end', 'items': [{'c': 'link', 'text': '⚠ Indications, Safety & Warnings ↓'}]}]}
    tabbar = {'c': 'section', 'pad': 's', 'rule': True, 'items': [S([T(pdx.get('hint', ''), 'caption'),
        {'c': 'row', 'gap': 'l', 'items': [item(t, f'{slug}-{k}' if k != 'overview' else slug, on=(k == tab)) for t, k in TABS]}], 's')]}
    if tab == 'evidence':
        content = [S([{'c': 'row', 'justify': 'between', 'items': [H('Key studies', 3), {'c': 'link', 'text': f'All {pubs} publications →', 'to': 'evidence'}]},
                      {'c': 'grid', 'cols': 2, 'gap': 'm', 'align': 'start', 'items': studies}], 'm')]
    else:
        tabd = next(t for t in pdx['tabs'] if t['label'] == dict(TABS)[{v: k for k, v in TABS}.get(tab, tab)] or t['label'].lower().startswith({'overview': 'product', 'how': 'how', 'practice': 'in-practice'}[tab]))
        content = flat([block(b) for b in tabd.get('blocks', [])])
        for c in content:
            if c.get('c') == 'rm-cta' and c.get('title') == 'Webinars':
                c['to'] = 'webinars'
        if tab == 'overview':
            content.append({'c': 'row', 'gap': 'm', 'items': [{'c': 'button', 'v': 'secondary', 'text': 'Download IFU (PDF)'}, T('Where available for this region', 'caption')]})
    body = [rm(snap, i) for i in range(1, i_pd)]
    tail = [dict(rm(snap, i), to='contact-new') if blocks[i]['type'] == 'cta' else rm(snap, i) for i in range(i_pd + 1, len(blocks))]
    return [nav('therapies'), {'c': 'rm-page', 'items': [hero]}, safety, {'c': 'rm-page', 'items': body}, tabbar,
            {'c': 'section', 'pad': 'l', 'items': [S(content, 'm')]},
            {'c': 'rm-page', 'items': tail}, FOOT]


SUCCESS_CARD = dict(sp.key_study('SUCCESS', 'Prospective, multicenter', '90 patients · 17 US centers', '95%', 'occlusion at 6 months', 'COMANECI™ · wide-neck aneurysms'), to='study')
ANEURYSM_STUDIES = [SUCCESS_CARD, sp.key_study('Long-term outcomes', 'Retrospective', '[N — из публикации]', '[главная цифра]', '[конечная точка]', 'COMANECI™ · stent-assisted coiling')]
LVO_STUDIES = [sp.key_study('TIGER', 'Prospective, multicenter', '[N · центры — из публикации]', '[главная цифра]', '[конечная точка]', 'TIGERTRIEVER™ · LVO'),
               sp.key_study('Meta-analysis', 'Meta-analysis', '[N исследований / пациентов]', '[главная цифра]', 'reperfusion vs self-expanding stent retrievers', 'TIGERTRIEVER™ · LVO')]




# ---------- pages in the code: the real site (site-pages.py → now / route) ----------
def real(body, *links):
    return [nav()] + [dict(b, links=[{'text': t, 'to': to} for t, to in links]) if links and i == 0 else b for i, b in enumerate(body)] + [FOOT]


NEWS_35, NEWS_24 = '/news-events/1-rapid-medical-announces-fda-clearance-of-drivewire-35-and-first-stroke-cases', '/news-events/7-rapid-medical-surpasses-1-000-cases-with-drivewire-24-in-north-america-and'
screens = [
    ('home', 'Home', 'rapid-medical.com', home_page()),
    ('menu', 'Therapies menu (open)', 'rapid-medical.com', home_page(True)),
    ('region', 'Choose your location (from the header)', 'rapid-medical.com', home_page(), {'c': 'rm-regionModal', 'region': 'us', 'source': 'location', 'back': '/', 'links': [{'text': 'Go to Americas →', 'to': 'home'}]}),
    ('therapies', 'All therapies', 'rapid-medical.com/us/therapies', real([sp.now('US · Therapies')], ('Large vessel stroke', 'lvo'), ('Aneurysm', 'aneurysm'))),
    ('aneurysm', 'Aneurysm · Product overview', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'overview', ANEURYSM_STUDIES, '12 COMANECI™')),
    ('aneurysm-how', 'Aneurysm · How it works', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'how', ANEURYSM_STUDIES, '12 COMANECI™')),
    ('aneurysm-practice', 'Aneurysm · In-Practice', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'practice', ANEURYSM_STUDIES, '12 COMANECI™')),
    ('aneurysm-evidence', 'Aneurysm · Clinical evidence', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'evidence', ANEURYSM_STUDIES, '12 COMANECI™')),
    ('lvo', 'Large vessel stroke · Product overview (content from the Europe page)', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'overview', LVO_STUDIES, '19 TIGERTRIEVER™')),
    ('lvo-how', 'Large vessel stroke · How it works', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'how', LVO_STUDIES, '19 TIGERTRIEVER™')),
    ('lvo-practice', 'Large vessel stroke · In-Practice', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'practice', LVO_STUDIES, '19 TIGERTRIEVER™')),
    ('lvo-evidence', 'Large vessel stroke · Clinical evidence', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'evidence', LVO_STUDIES, '19 TIGERTRIEVER™')),
    ('study', 'SUCCESS study', 'rapid-medical.com/us/success-study-final-results', real([sp.route('/us/success-study-final-results')])),
    ('evidence', 'Evidence', 'rapid-medical.com/us/evidence', real([sp.now('US · Evidence')])),
    ('webinars', 'Webinars (discussion parked)', 'rapid-medical.com/us/webinars', real([sp.now('US · Webinars')])),
    ('news', 'News & Events', 'rapid-medical.com/news-events', real([sp.now('News & Events')], ('Rapid Medical Announces FDA Clearance of DRIVEWIRE™ 35 and First Stroke Cases', 'news-35'), ('Rapid Medical™ Surpasses 1,000 Cases With DRIVEWIRE™ 24 in North America and Expands Into Europe With MDR Approval', 'news-page'), ('DRIVEWIRE™ 24 in Clinical Practice', 'event-past-new'))),
    ('news-35', 'News page · DRIVEWIRE™ 35 clearance', 'rapid-medical.com' + NEWS_35, real([sp.route(NEWS_35)], ('← News & Events', 'news'))),
    ('news-page', 'News page · DRIVEWIRE™ 24, 1,000 cases', 'rapid-medical.com' + NEWS_24, real([sp.route(NEWS_24)], ('← News & Events', 'news'))),
    ('event-past-new', 'Past event', 'rapid-medical.com/events/drivewire-24-in-clinical-practice-esmint-2026', real([sp.route('/events/drivewire-24-in-clinical-practice-esmint-2026')], ('← News & Events', 'news'))),
    ('about', 'About Us', 'rapid-medical.com/about-us', real([sp.now('About')], ('Contact us', 'contact-new'))),
    ('careers', 'Careers (sample roles: none in the database now)', 'rapid-medical.com/careers', real([sp.now('Careers', over={'jobs.roles': {'sample': True}})])),
    ('contact-new', 'Contact Us', 'rapid-medical.com/contact-us?region=us&topic=demo', real([sp.now('Contact')], ('All offices and addresses →', 'about'), ('Submit', 'contact-sent'))),
    ('contact-sent', 'Contact Us · request sent', 'rapid-medical.com/contact-us', real([sp.now('Contact', act={'form.split': sp.FORM_SENT})])),
    ('terms', 'Terms of Use', 'rapid-medical.com/terms-of-use', real([sp.now('Terms')])),
]
IDS = {s[0] for s in screens}
TEXT_LINKS = {'← News & Events': 'news', '← Past events': 'news', 'Discuss SUCCESS with our team': 'contact-new',
              'All COMANECI™ publications →': 'evidence', 'COMANECI™ for aneurysms →': 'aneurysm', 'Contact a local representative': 'contact-new',
              'Contact us': 'contact-new', 'All offices and addresses →': 'about', 'Go to Americas →': 'home',
              'Read →': 'news-35', 'All news and events →': 'news'}


def wire(o):
    """Drop design notes, link known texts, keep only links to screens of this prototype."""
    if isinstance(o, list): return [wire(x) for x in o if not (isinstance(x, dict) and str(x.get('text', '')).startswith('[Proof point'))]
    if not isinstance(o, dict): return o
    o = {k: wire(v) for k, v in o.items() if k not in ('annotation',)}
    if o.get('c') in ('link', 'button') and o.get('text') in TEXT_LINKS and 'to' not in o:
        o['to'] = TEXT_LINKS[o['text']]
    if o.get('c') == 'link' and str(o.get('text', '')).endswith('publications →') and 'to' not in o:
        o['to'] = 'evidence'
    if 'to' in o and o['to'] not in IDS:
        o.pop('to'); o.pop('label', None)
    return o


flow = {
    'title': 'Rapid Medical — site prototype (Americas, desktop)',
    'project': 'Rapid Medical',
    'description': 'Кликабельный прототип сайта со всеми решениями серии вайрфреймов (docs/flows/site-pages.md). Серые экраны: '
                   'визуальный стиль решается отдельно. Меню, «Contact Us», регион в шапке и ссылки Legal в футере кликаются. '
                   'Страницы, которые уже в коде, — сам сайт (снимок, pack.js); шапка и футер — тоже. Home и страница терапии — '
                   'эскизы (предварительно, ждут Emily; в main их ещё нет), с настоящими шапкой и футером. Webinars — обсуждение отложено.',
    'start': 'home',
    'view': 'present',
    'groups': [
        {'title': 'Главная и выбор региона', 'screens': ['home', 'region']},
        {'title': 'Терапии', 'screens': ['menu', 'therapies', 'aneurysm', 'aneurysm-how', 'aneurysm-practice', 'aneurysm-evidence', 'lvo', 'lvo-how', 'lvo-practice', 'lvo-evidence']},
        {'title': 'Доказательства', 'screens': ['study', 'evidence', 'webinars']},
        {'title': 'Новости и события', 'screens': ['news', 'news-35', 'news-page', 'event-past-new']},
        {'title': 'Компания и контакты', 'screens': ['about', 'careers', 'contact-new', 'contact-sent', 'terms']},
    ],
    'links': [],
    'screens': [],
}
for s in screens:
    sid, title, url, body = s[:4]
    scr = {'id': sid, 'title': title, 'url': url, 'body': wire(copy.deepcopy(body))}
    if len(s) > 4:
        scr['overlay'] = wire(copy.deepcopy(s[4]))
    flow['screens'].append(scr)

OUT.write_text(json.dumps(sp.clean(flow), ensure_ascii=False, indent=1), encoding='utf8')
print('ok:', OUT.name, len(flow['screens']), 'screens')
