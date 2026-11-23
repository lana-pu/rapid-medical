# Generates site-prototype.json next to this file. Run: python3 docs/flows/site-prototype.py
# A clickable prototype of the public site (Americas, desktop) with every decision from site-pages.md applied.
# Screens are built by the same functions as the wireframe series (site-pages.py); this file adds a clickable
# the two pages decided last (Home, therapy — the code of branch therapy-home until it is merged) and the links between screens.
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


# ---------- Home and the therapy page: written in branch therapy-home, waiting for Emily — drawn by that branch ----------
# (render-branch.sh: the branch's last commit on a copy of the database with its migrations and build steps)
def branch(path, links, act=None):
    n = sp.route(path, region='us', branch='therapy-home', links=[{'text': t, 'to': to} for t, to in links])
    if act: n['act'] = act
    return n


HOME_LINKS = [('Explore Therapies', 'therapies'), ('Request a demo', 'contact-new'), ('Large vessel stroke', 'lvo'), ('Aneurysm', 'aneurysm'),
              ('19 publications →', 'evidence'), ('12 publications →', 'evidence'), ('Explore the evidence →', 'evidence'), ('View all news ›', 'news')]


def home_page(menu_open=False):
    return [nav('home', menu_open), branch('/', HOME_LINKS), FOOT]


# the product's tabs; on LVO «Clinical evidence ↗» leads to Evidence, not to a tab
TABS = [('Product overview', ''), ('How it works', '-how'), ('In-Practice', '-practice'), ('Clinical evidence', '-evidence')]


def therapy_page(slug, tab):
    links = [('Request a demo', 'contact-new'), ('Customer support', 'contact-new'), ('Therapies', 'therapies'), ('Request to view', 'webinars'),
             ('Unlock SUCCESS: The prospective study data', 'study'), ('All 12 publications →', 'evidence'), ('Evidence', 'evidence')]
    links += [(t, 'evidence' if (slug == 'lvo' and k == '-evidence') else slug + k) for t, k in TABS if t != tab]
    return [nav('therapies'), branch(f'/us/therapies/{slug}', links, act=None if tab == 'Product overview' else [{'tab': tab}]), FOOT]


# ---------- pages in the code: the real site (site-pages.py → now / route) ----------
def real(body, *links):
    return [nav()] + [dict(b, links=[{'text': t, 'to': to} for t, to in links]) if links and i == 0 else b for i, b in enumerate(body)] + [FOOT]


NEWS_35, NEWS_24 = '/news-events/1-rapid-medical-announces-fda-clearance-of-drivewire-35-and-first-stroke-cases', '/news-events/7-rapid-medical-surpasses-1-000-cases-with-drivewire-24-in-north-america-and'
screens = [
    ('home', 'Home (branch therapy-home, preliminary)', 'rapid-medical.com', home_page()),
    ('menu', 'Therapies menu (open)', 'rapid-medical.com', home_page(True)),
    ('region', 'Choose your location (from the header)', 'rapid-medical.com', home_page(), {'c': 'rm-regionModal', 'region': 'us', 'source': 'location', 'back': '/', 'links': [{'text': 'Go to Americas →', 'to': 'home'}]}),
    ('therapies', 'All therapies', 'rapid-medical.com/us/therapies', real([sp.now('US · Therapies')], ('Large vessel stroke', 'lvo'), ('Aneurysm', 'aneurysm'))),
    ('aneurysm', 'Aneurysm · Product overview (branch therapy-home, preliminary)', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('aneurysm', 'Product overview')),
    ('aneurysm-how', 'Aneurysm · How it works', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('aneurysm', 'How it works')),
    ('aneurysm-practice', 'Aneurysm · In-Practice', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('aneurysm', 'In-Practice')),
    ('aneurysm-evidence', 'Aneurysm · Clinical evidence', 'rapid-medical.com/us/therapies/aneurysm', therapy_page('aneurysm', 'Clinical evidence')),
    ('lvo', 'Large vessel stroke · Product overview (branch therapy-home, preliminary)', 'rapid-medical.com/us/therapies/lvo', therapy_page('lvo', 'Product overview')),
    ('lvo-how', 'Large vessel stroke · How it works', 'rapid-medical.com/us/therapies/lvo', therapy_page('lvo', 'How it works')),
    ('lvo-practice', 'Large vessel stroke · In-Practice', 'rapid-medical.com/us/therapies/lvo', therapy_page('lvo', 'In-Practice')),
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
                   'Весь прототип — сам сайт (снимок, pack.js). Home и страница терапии — код ветки therapy-home (предварительно, '
                   'ждут Emily; в main их ещё нет; render-branch.sh). Webinars — обсуждение отложено.',
    'start': 'home',
    'view': 'present',
    'groups': [
        {'title': 'Главная и выбор региона', 'screens': ['home', 'region']},
        {'title': 'Терапии', 'screens': ['menu', 'therapies', 'aneurysm', 'aneurysm-how', 'aneurysm-practice', 'aneurysm-evidence', 'lvo', 'lvo-how', 'lvo-practice']},
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
