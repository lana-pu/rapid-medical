# Generates site-prototype.json next to this file. Run: python3 docs/flows/site-prototype.py
# A clickable prototype of the public site (Americas, desktop) with every decision from site-pages.md applied.
# Screens are built by the same functions as the wireframe series (site-pages.py); this file adds a clickable
# header/footer (proto-pack.js), the two pages decided last (Home, therapy) and the links between screens.
# Build: build.py docs/flows/site-prototype.json <out>.html --pack docs/flows/pack.js docs/flows/proto-pack.js
import copy
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


def nav(active=None):
    menu = [('Welcome', 'home'), ('Therapies', 'therapies'), ('Evidence', 'evidence'), ('News & Events', 'news'), ('About Us', 'about'), ('Careers', 'careers')]
    return {'c': 'rm-nav', 'logo': item('Rapid Medical™', 'home'), 'strip': [item('🌐 Americas ▾', 'region')],
            'items': [item(t, to, on=(to == active)) for t, to in menu], 'cta': item('Contact Us', 'contact-new', v='button')}


FOOT = {'c': 'rm-navfoot', 'legal': [item('Privacy Statement', 'terms'), item('Terms of Use', 'terms'), item('Compliance Statement', 'terms'), item('Patents', 'terms')]}


def build(active, fn, *args):
    sp.HEADER = nav(active)
    sp.HEADER_NONE = nav(active)
    sp.FOOTER = FOOT
    return fn(*args)


# ---------- pages decided last ----------
def home_page():
    bar = {'c': 'section', 'pad': 's', 'tone': 'dark', 'items': [{'c': 'row', 'justify': 'between', 'items': [
        T('DISTALS: TIGERTRIEVER™ 13 shows promising 90-day outcomes', 'small'), {'c': 'link', 'text': 'Read the news →', 'to': 'news-page'}]}]}
    hero = dict(rm('Home', 0), to='therapies', label='Explore Therapies')
    cards = [sp.ther_card(f'{g} · {p}', t, b, n) for g, p, t, b, n in sp.THER_US]
    cards[1]['to'] = 'therapy'
    statement = rm('Home', 1)
    statement['stats'] = [dict(s, value='102') if 'publication' in s['label'] else s for s in statement['stats']]
    statement['to'] = 'contact-new'
    studies = {'c': 'grid', 'cols': 2, 'gap': 'm', 'align': 'start', 'items': [
        sp.key_study('DISTALS', 'RCT', '98 randomized · FDA IDE', '86.3% vs 27.7%', 'reperfusion at 24 h without sICH', 'TIGERTRIEVER™ 13 · MeVO'),
        dict(sp.key_study('SUCCESS', 'Prospective, multicenter', '90 patients · 17 US centers', '95%', 'occlusion at 6 months', 'COMANECI™ · wide-neck aneurysms'), to='study')]}
    news = S([{'c': 'row', 'justify': 'between', 'items': [H('At the forefront of advancing stroke intervention', 2), {'c': 'link', 'text': 'View all news →', 'to': 'news'}]},
              sp.top_block()], 'm')
    return [bar, nav('home'), {'c': 'rm-page', 'items': [hero]},
            {'c': 'section', 'pad': 'l', 'items': [{'c': 'grid', 'cols': 3, 'gap': 'm', 'align': 'start', 'items': cards}]},
            {'c': 'rm-page', 'items': [statement, rm('Home', 2)]},
            {'c': 'section', 'pad': 'l', 'tone': 'surface', 'items': [S([{'c': 'row', 'justify': 'between', 'items': [H('Key studies', 2), {'c': 'link', 'text': 'All evidence →', 'to': 'evidence'}]}, studies], 'm')]},
            {'c': 'section', 'pad': 'l', 'items': [news]}, FOOT]


def therapy_page():
    blocks = sp.RM['US · Aneurysm']
    hero = dict(rm('US · Aneurysm', 0), to='contact-new', label='Request a demo')
    sticky = {'c': 'section', 'pad': 's', 'rule': True, 'items': [{'c': 'row', 'justify': 'between', 'items': [
        {'c': 'segmented', 'items': ['Overview', 'How it works', 'In-Practice', 'Evidence', 'Specs'], 'active': 0},
        {'c': 'link', 'text': 'Indications, Safety & Warnings ↓'}]}]}
    body = [rm('US · Aneurysm', i) for i in range(1, len(blocks) - 2)]
    evidence = {'c': 'section', 'pad': 'l', 'tone': 'surface', 'items': [S([
        {'c': 'row', 'justify': 'between', 'items': [H('Clinical evidence', 2), {'c': 'link', 'text': 'All 57 COMANECI™ publications →', 'to': 'evidence'}]},
        {'c': 'grid', 'cols': 2, 'gap': 'm', 'align': 'start', 'items': [
            dict(sp.key_study('SUCCESS', 'Prospective, multicenter', '90 patients · 17 US centers', '95%', 'occlusion at 6 months', 'COMANECI™ · wide-neck aneurysms'), to='study'),
            sp.key_study('Long-term outcomes', 'Retrospective', '[N — из публикации]', '[главная цифра]', '[конечная точка]', 'COMANECI™ · stent-assisted coiling')]}], 'm')]}
    practice = {'c': 'section', 'pad': 'l', 'items': [S([H('In practice', 2),
        dict(sp.feed_row('Webinar', 'Webinar', 'COMANECI: Tips & Tricks from Buffalo — Drs. Adnan Siddiqui & Jason Davies', None), to='webinars'),
        {'c': 'divider'},
        sp.feed_row('Webinar', 'Webinar', 'COMANECI Experience: Increasing packing density — Dr. Mani Puthuran', None),
        {'c': 'divider'},
        sp.feed_row('Document', 'IFU', 'COMANECI™ Instructions for Use — Americas (PDF)', None)], 's')]}
    return [nav('therapies'), {'c': 'rm-page', 'items': [hero]}, sticky, {'c': 'rm-page', 'items': body}, evidence, practice,
            {'c': 'rm-page', 'items': [dict(rm('US · Aneurysm', len(blocks) - 2), to='contact-new'), rm('US · Aneurysm', len(blocks) - 1)]}, FOOT]


# ---------- screens ----------
screens = [
    ('home', 'Home', 'rapid-medical.com', home_page()),
    ('region', 'Choose your location (from the header)', 'rapid-medical.com', home_page(), sp.region_modal('empty', current='Americas')),
    ('therapies', 'Therapies', 'rapid-medical.com/us/therapies', build('therapies', sp.therapies_new, 'us')),
    ('therapy', 'Aneurysm · COMANECI™', 'rapid-medical.com/us/therapies/aneurysm', therapy_page()),
    ('study', 'SUCCESS study', 'rapid-medical.com/us/success-study-final-results', build('evidence', sp.success_desktop)),
    ('evidence', 'Evidence (draft concept)', 'rapid-medical.com/us/evidence', build('evidence', sp.evidence_concept)),
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
              'All COMANECI™ publications →': 'evidence', 'COMANECI™ for aneurysms →': 'therapy', 'Contact a local representative': 'contact-new',
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
        {'title': 'Терапии и доказательства', 'screens': ['therapies', 'therapy', 'study', 'evidence', 'webinars']},
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
