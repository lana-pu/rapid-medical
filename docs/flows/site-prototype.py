# Generates site-prototype.json next to this file. Run: python3 docs/flows/site-prototype.py
# A clickable prototype of the public site (Americas, desktop) with every decision from site-pages.md applied.
# Screens are built by the same functions as the wireframe series (site-pages.py); this file adds a clickable
# header/footer (proto-pack.js), the two pages decided last (Home, therapy) and the links between screens.
# Build: build.py docs/flows/site-prototype.json <out>.html --pack docs/flows/pack.js docs/flows/proto-pack.js
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


# ---------- clickable header and footer ----------
def item(text, to, on=False, v=None):
    n = {'c': 'rm-navitem', 'text': text, 'to': to, 'quiet': True}
    if on: n['on'] = True
    if v: n['v'] = v
    return n


THERAPY_MENU = [('Ischemic stroke', [('Large vessel stroke', 'lvo')]), ('Hemorrhagic stroke', [('Aneurysm', 'aneurysm')]), ('Access', [('Access', None)])]


def nav(active=None, menu_open=False):
    menu = [('Welcome', 'home'), ('Therapies ▾', 'menu'), ('Evidence', 'evidence'), ('News & Events', 'news'), ('About Us', 'about'), ('Careers', 'careers')]
    n = {'c': 'rm-nav', 'logo': item('Rapid Medical™', 'home'), 'strip': [item('🌐 Americas ▾', 'region')],
         'items': [item(t, to, on=(to == active or (to == 'menu' and active == 'therapies'))) for t, to in menu], 'cta': item('Contact Us', 'contact-new', v='button')}
    if menu_open:
        dd = []
        for g, items in THERAPY_MENU:
            dd.append({'c': 'rm-navitem', 'v': 'group', 'text': g})
            dd += [item(t, to, v='menu') if to else {'c': 'rm-navitem', 'v': 'menu', 'text': t} for t, to in items]
        dd.append(item('All therapies →', 'therapies', on=True, v='menu'))
        n['menu'] = dd
    return n


FOOT = {'c': 'rm-navfoot', 'legal': [item('Privacy Statement', 'terms'), item('Terms of Use', 'terms'), item('Compliance Statement', 'terms'), item('Patents', 'terms')]}


def build(active, fn, *args):
    sp.HEADER = nav(active)
    sp.HEADER_NONE = nav(active)
    sp.FOOTER = FOOT
    return fn(*args)


# ---------- pages decided last ----------
def home_page(menu_open=False):
    bar = {'c': 'section', 'pad': 's', 'tone': 'dark', 'items': [{'c': 'row', 'justify': 'between', 'items': [
        T('DISTALS: TIGERTRIEVER™ 13 shows promising 90-day outcomes', 'small'), {'c': 'link', 'text': 'Read the news →', 'to': 'news-page'}]}]}
    hero = dict(rm('Home', 0), to='therapies', label='Explore Therapies')
    cards = [sp.ther_card(f'{g} · {p}', t, b, n) for g, p, t, b, n in sp.THER_US]
    cards[0]['to'] = 'lvo'
    cards[1]['to'] = 'aneurysm'
    statement = rm('Home', 1)
    statement['stats'] = [dict(s, value='102') if 'publication' in s['label'] else s for s in statement['stats']]
    statement['to'] = 'contact-new'
    studies = {'c': 'grid', 'cols': 2, 'gap': 'm', 'align': 'start', 'items': [
        sp.key_study('DISTALS', 'RCT', '98 randomized · FDA IDE', '86.3% vs 27.7%', 'reperfusion at 24 h without sICH', 'TIGERTRIEVER™ 13 · MeVO'),
        SUCCESS_CARD]}
    news = S([{'c': 'row', 'justify': 'between', 'items': [H('At the forefront of advancing stroke intervention', 2), {'c': 'link', 'text': 'View all news →', 'to': 'news'}]},
              sp.top_block()], 'm')
    return [bar, nav('home', menu_open), {'c': 'rm-page', 'items': [hero]},
            {'c': 'section', 'pad': 'l', 'items': [{'c': 'grid', 'cols': 3, 'gap': 'm', 'align': 'start', 'items': cards}]},
            {'c': 'rm-page', 'items': [statement, rm('Home', 2)]},
            {'c': 'section', 'pad': 'l', 'tone': 'surface', 'items': [S([{'c': 'row', 'justify': 'between', 'items': [H('Key studies', 2), {'c': 'link', 'text': 'All evidence →', 'to': 'evidence'}]}, studies], 'm')]},
            {'c': 'section', 'pad': 'l', 'items': [news]}, FOOT]


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
    tabbar = {'c': 'section', 'pad': 's', 'rule': True, 'items': [{'c': 'row', 'justify': 'between', 'items': [
        {'c': 'row', 'gap': 'l', 'items': [item(t, f'{slug}-{k}' if k != 'overview' else slug, on=(k == tab)) for t, k in TABS]},
        {'c': 'link', 'text': 'Indications, Safety & Warnings ↓'}]}]}
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
    return [nav('therapies'), {'c': 'rm-page', 'items': [hero] + body}, tabbar,
            {'c': 'section', 'pad': 'l', 'items': [S([T(pdx.get('hint', ''), 'caption')] + content, 'm')]},
            {'c': 'rm-page', 'items': tail}, FOOT]


SUCCESS_CARD = dict(sp.key_study('SUCCESS', 'Prospective, multicenter', '90 patients · 17 US centers', '95%', 'occlusion at 6 months', 'COMANECI™ · wide-neck aneurysms'), to='study')
ANEURYSM_STUDIES = [SUCCESS_CARD, sp.key_study('Long-term outcomes', 'Retrospective', '[N — из публикации]', '[главная цифра]', '[конечная точка]', 'COMANECI™ · stent-assisted coiling')]
LVO_STUDIES = [sp.key_study('TIGER', 'Prospective, multicenter', '[N · центры — из публикации]', '[главная цифра]', '[конечная точка]', 'TIGERTRIEVER™ · LVO'),
               sp.key_study('Meta-analysis', 'Meta-analysis', '[N исследований / пациентов]', '[главная цифра]', 'reperfusion vs self-expanding stent retrievers', 'TIGERTRIEVER™ · LVO')]


def study_page():
    sp.HEADER = nav('evidence'); sp.FOOTER = FOOT
    page_ = sp.success_desktop()
    i = next(k for k, x in enumerate(page_) if isinstance(x, dict) and x.get('c') == 'section' and 'Download the poster (PDF)' in json.dumps(x, ensure_ascii=False))
    return page_[:i] + [sp.full_text_band('copy')] + page_[i:]


# ---------- screens ----------
sp.LEAD = sp.RM['Contact'][0]['data']['body']  # client copy stays as on the site: "Please provide a few contact details below."


def therapies_page():
    page_ = build('therapies', sp.therapies_new, 'us')
    page_ = [x for x in page_ if not (isinstance(x, dict) and 'not available' in json.dumps(x, ensure_ascii=False))]
    for x in page_:
        for box in (x.get('items') or [{}])[0].get('items', []) if isinstance(x, dict) and x.get('c') == 'section' else []:
            t = json.dumps(box, ensure_ascii=False)
            if '"Large vessel stroke"' in t: box['to'] = 'lvo'
            if '"Aneurysm"' in t: box['to'] = 'aneurysm'
    return page_


def evidence_page():
    page_ = build('evidence', sp.evidence_concept)
    txt = json.dumps(page_, ensure_ascii=False)
    def mark(o):
        if isinstance(o, list): return [mark(x) for x in o]
        if not isinstance(o, dict): return o
        o = {k: mark(v) for k, v in o.items()}
        if o.get('c') == 'box' and '"SUCCESS"' in json.dumps(o, ensure_ascii=False) and 'Study page' in json.dumps(o, ensure_ascii=False) and 'grid' not in json.dumps(o)[:20]:
            o['to'] = 'study'
        return o
    return mark(page_)


screens = [
    ('home', 'Home', 'rapid-medical.com', home_page()),
    ('menu', 'Therapies menu (open)', 'rapid-medical.com', home_page(True)),
    ('region', 'Choose your location (from the header)', 'rapid-medical.com', home_page(), sp.region_modal('empty', current='Americas')),
    ('therapies', 'All therapies', 'rapid-medical.com/us/therapies', therapies_page()),
    ('aneurysm', 'Aneurysm · Product overview', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'overview', ANEURYSM_STUDIES, '57 COMANECI™')),
    ('aneurysm-how', 'Aneurysm · How it works', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'how', ANEURYSM_STUDIES, '57 COMANECI™')),
    ('aneurysm-practice', 'Aneurysm · In-Practice', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'practice', ANEURYSM_STUDIES, '57 COMANECI™')),
    ('aneurysm-evidence', 'Aneurysm · Clinical evidence', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('US · Aneurysm', 'aneurysm', 'evidence', ANEURYSM_STUDIES, '57 COMANECI™')),
    ('lvo', 'Large vessel stroke · Product overview (content from the Europe page)', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'overview', LVO_STUDIES, '32 TIGERTRIEVER™')),
    ('lvo-how', 'Large vessel stroke · How it works', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'how', LVO_STUDIES, '32 TIGERTRIEVER™')),
    ('lvo-practice', 'Large vessel stroke · In-Practice', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'practice', LVO_STUDIES, '32 TIGERTRIEVER™')),
    ('lvo-evidence', 'Large vessel stroke · Clinical evidence', 'rapid-medical.com/us/therapies/lvo', therapy_page('OUS · Large vessel stroke', 'lvo', 'evidence', LVO_STUDIES, '32 TIGERTRIEVER™')),
    ('study', 'SUCCESS study', 'rapid-medical.com/us/success-study-final-results', study_page()),
    ('evidence', 'Evidence (draft concept)', 'rapid-medical.com/us/evidence', evidence_page()),
    ('webinars', 'Webinars (as is — discussion parked)', 'rapid-medical.com/us/webinars', build(None, sp.webinars_asis)),
    ('news', 'News & Events', 'rapid-medical.com/news-events', build('news', sp.news_events_new, 'none')),
    ('news-page', 'News page', 'rapid-medical.com/news/drivewire-24-1000-cases', build('news', sp.news_article)),
    ('event-past-new', 'Past event', 'rapid-medical.com/events/drivewire-24-esmint-2026', build('news', sp.event_past_new)),
    ('about', 'About Us', 'rapid-medical.com/about-us', build('about', sp.about_new)),
    ('careers', 'Careers', 'rapid-medical.com/careers', build('careers', sp.careers_new, 'roles')),
    ('contact-new', 'Contact Us', 'rapid-medical.com/contact-us?region=us&topic=demo', build(None, sp.contact_desktop, 'empty')),
    ('contact-sent', 'Contact Us · request sent', 'rapid-medical.com/contact-us', build(None, sp.contact_desktop, 'sent')),
    ('terms', 'Terms of Use', 'rapid-medical.com/terms-of-use', build(None, sp.text_desktop)),
]
IDS = {s[0] for s in screens}
TEXT_LINKS = {'← News & Events': 'news', '← Past events': 'news', 'Discuss SUCCESS with our team': 'contact-new',
              'All COMANECI™ publications →': 'evidence', 'COMANECI™ for aneurysms →': 'aneurysm', 'Contact a local representative': 'contact-new',
              'Contact us': 'contact-new', 'All offices and addresses →': 'about', 'Go to Americas →': 'home',
              'Read →': 'news-page', 'All news and events →': 'news'}


def wire(o):
    """Drop design notes, link known texts, keep only links to screens of this prototype."""
    if isinstance(o, list): return [wire(x) for x in o if not (isinstance(x, dict) and str(x.get('text', '')).startswith('[Proof point'))]
    if not isinstance(o, dict): return o
    o = {k: wire(v) for k, v in o.items() if k not in ('annotation',)}
    if o.get('c') in ('link', 'button') and o.get('text') in TEXT_LINKS and 'to' not in o:
        o['to'] = TEXT_LINKS[o['text']]
    if 'to' in o and o['to'] not in IDS:
        o.pop('to'); o.pop('label', None)
    return o


flow = {
    'title': 'Rapid Medical — site prototype (Americas, desktop)',
    'project': 'Rapid Medical',
    'description': 'Кликабельный прототип сайта со всеми решениями серии вайрфреймов (docs/flows/site-pages.md). Серые экраны: '
                   'визуальный стиль решается отдельно. Меню, «Contact Us», регион в шапке и ссылки Legal в футере кликаются. '
                   'Home и страница терапии — предварительно (ждут Emily), Evidence — черновик концепции, Webinars — как есть.',
    'start': 'home',
    'groups': [
        {'title': 'Главная и выбор региона', 'screens': ['home', 'region']},
        {'title': 'Терапии', 'screens': ['menu', 'therapies', 'aneurysm', 'aneurysm-how', 'aneurysm-practice', 'aneurysm-evidence', 'lvo', 'lvo-how', 'lvo-practice', 'lvo-evidence']},
        {'title': 'Доказательства', 'screens': ['study', 'evidence', 'webinars']},
        {'title': 'Новости и события', 'screens': ['news', 'news-page', 'event-past-new']},
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
