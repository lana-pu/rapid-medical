# Generates visitor.json next to this file. Run: python3 docs/flows/visitor.py
# A physician's path on the public site, built from the real page compositions (rm-pages.json; refresh with blocks-kit/snapshot.sh).
# Annotations marked «по коду» describe the current behaviour found in the code, not proposals.
import json
from pathlib import Path

OUT = Path(__file__).with_name('visitor.json')
RM = json.load(open(Path(__file__).with_name('rm-pages.json'), encoding='utf8'))['pages']


def rm(page, i, **extra):
    b = RM[page][i]
    return dict({'c': 'rm-' + b['type'], 'v': b['variant']}, **dict(b['data'], **extra))


def page(name, idx=None, extra=None):
    blocks = RM[name]
    idx = range(len(blocks)) if idx is None else idx
    items = [rm(name, i, **((extra or {}).get(i, {}))) for i in idx]
    return {'c': 'rm-page', 'items': items}


HEADER = {'c': 'rm-header', 'region': 'us'}
HEADER_NONE = {'c': 'rm-header'}
FOOTER = {'c': 'rm-footer', 'region': 'us'}
THANKS = {'c': 'box', 'tone': 'surface', 'pad': 'm', 'border': True, 'items': [{'c': 'text', 'v': 'strong', 'text': 'Thank you for contacting us.'},
                                                                              {'c': 'text', 'v': 'small', 'text': 'We will get back to you as soon as possible.'}]}

flow = {
    'title': 'Physician on the website — from the home page to a demo request',
    'project': 'Rapid Medical',
    'description': 'Врач-нейроинтервенционалист из США впервые на сайте: находит терапию аневризм (COMANECI™), смотрит исследования, просит запись вебинара или демо. Регион определяется по IP сразу (решение 2026-11-10). Все страницы — реальные составы из блоков сайта (снимок в rm-pages.json). Заметки «по коду» — как сайт работает сейчас; остальные — вопросы и предложения.',
    'start': 'home',
    'groups': [
        {'title': '1 · Первый вход: регион уже известен', 'screens': ['home', 'menu', 'therapies']},
        {'title': '1a · Когда регион не известен или чужой', 'screens': ['home-unknown', 'choose', 'shared-link', 'switcher']},
        {'title': '2 · Терапия и исследования', 'screens': ['aneurysm', 'aneurysm-tabs', 'evidence']},
        {'title': '3 · Вебинар или демо', 'screens': ['webinars', 'webinar-sent', 'contact', 'contact-sent']},
        {'title': '4 · Тот же путь на телефоне', 'screens': ['aneurysm-phone', 'contact-phone']},
    ],
    'links': [{'from': 'evidence', 'to': 'webinars', 'label': 'меню → вебинары (через In-Practice)'}, {'from': 'aneurysm', 'to': 'aneurysm-phone', 'label': 'та же страница на телефоне'},
              {'from': 'home', 'to': 'home-unknown', 'label': 'страна не определилась (VPN)'}, {'from': 'home', 'to': 'shared-link', 'label': 'врач из США открыл ссылку коллеги из Европы'}],
    'screens': [
        {'id': 'home', 'title': 'Home page, first visit from the US', 'url': 'rapid-medical.com', 'body': [
            dict(HEADER, to='menu', label='Therapies ▾', focus={'part': 'menu', 'style': 'hover', 'cursor': True},
                 annotation='По коду: регион по IP применяется сразу при первом заходе (Americas), без вопроса и плашки. В шапке — переключатель «🌐 Americas ▾» с названием региона.'),
            page('Home', [0, 1, 2], {
                0: {'to': 'therapies', 'label': 'Explore Our Therapies', 'focus': {'part': 'cta', 'style': 'hover'},
                    'annotation': 'Кнопка героя ведёт на обзор терапий региона (/us/therapies) — для тех, кто не знает линейку. Врач, который знает, что ищет, идёт через меню.'}})]},
        {'id': 'menu', 'title': 'Therapies menu', 'url': 'rapid-medical.com', 'height': 620, 'body': [
            dict(HEADER, menuOpen=True, to='aneurysm', label='Aneurysm',
                 annotation='По коду: терапии региона по направлениям — Ischemic stroke / Hemorrhagic stroke / Access, внизу «All therapies». Направление — поле терапии в админке.'),
            page('Home', [0])]},
        {'id': 'therapies', 'title': 'Therapies overview, Americas', 'url': 'rapid-medical.com/us/therapies', 'body': [HEADER, page('US · Therapies', None, {
            2: {'to': 'aneurysm', 'label': 'COMANECI™', 'focus': {'part': 'items', 'style': 'hover', 'cursor': True},
                'annotation': 'По коду: обзор собирается из записей терапий — группа на направление, карточка: продукт, название, подзаголовок. Строка-доказательство на карточке появится после MLR (поле proofPoint пустое).'}})]},
        {'id': 'home-unknown', 'title': 'Home page, country unknown', 'url': 'rapid-medical.com', 'body': [
            dict(HEADER_NONE, to='choose', label='Therapies ▾', focus={'part': 'menu', 'style': 'hover', 'cursor': True},
                 annotation='По коду: если страна не определилась (VPN, нет заголовка), в шапке «🌐 Choose location», а Therapies и Evidence ведут на выбор региона. Это единственный случай, когда врач видит выбор.'),
            page('Home', [0])]},
        {'id': 'choose', 'title': 'Choose your location', 'url': 'rapid-medical.com/choose-your-location', 'height': 560, 'body': [HEADER_NONE, page('Choose location', None, {
            1: {'to': 'therapies', 'label': 'Americas', 'annotation': 'Выбор запоминается и больше не перебивается IP. Когда регион известен, этот адрес сразу уводит в регион и не индексируется.'}})]},
        {'id': 'shared-link', 'title': 'A colleague’s link to the Europe page', 'url': 'rapid-medical.com/ous/therapies/lvo', 'body': [
            {'c': 'rm-regionBanner', 'suggested': 'us', 'to': 'therapies', 'label': 'Go to the Americas site',
             'annotation': 'По коду: плашка только когда регион страницы не совпадает с IP и врач сам регион не выбирал. Кнопка ведёт на обзор терапий региона, а не на эту же страницу; переключатель в шапке возвращает на ту же страницу. Вопрос: вести плашку тоже на ту же страницу?'},
            dict(HEADER, region='ous', to='switcher', label='🌐 Europe & Middle East ▾', focus={'part': 'switcher', 'style': 'hover', 'cursor': True}),
            page('OUS · Large vessel stroke', [0, 1])]},
        {'id': 'switcher', 'title': 'Region switcher', 'url': 'rapid-medical.com/ous/therapies/lvo', 'height': 520, 'body': [
            dict(HEADER, region='ous', switcherOpen=True, to='therapies', label='Americas',
                 annotation='По коду: выбор запоминается, плашка гаснет, открывается та же страница в другом регионе; если её там нет — обзор терапий. Названия здесь короткие («Europe & Middle East»), а в плашке и на Evidence — длинные («Europe, Middle East, Latin America & Australia»): вопрос к Emily.'),
            page('OUS · Large vessel stroke', [0])]},
        {'id': 'aneurysm', 'title': 'Aneurysm: top of the page', 'url': 'rapid-medical.com/us/therapies/aneurysm', 'body': [HEADER, page('US · Aneurysm', [0, 1, 2], {
            0: {'focus': {'part': 'eyebrow', 'style': 'hover'}, 'annotation': 'Над заголовком — версии страницы в других регионах, названиями регионов.'}}),
            {'c': 'box', 'pad': 's', 'items': [{'c': 'button', 'v': 'link', 'text': 'Scroll to the product details ↓', 'to': 'aneurysm-tabs'}]}]},
        {'id': 'aneurysm-tabs', 'title': 'Aneurysm: product tabs, actions and safety text', 'url': 'rapid-medical.com/us/therapies/aneurysm#overview', 'body': [page('US · Aneurysm', [5, 6, 7], {
            5: {'to': 'evidence', 'label': 'Clinical evidence ↗', 'focus': {'part': 'tabs', 'style': 'hover', 'cursor': True},
                'annotation': 'Вкладка «Clinical evidence» уводит на Evidence (↗) и открывает там вкладку продукта. Вопрос: оставить ссылкой или показать 3 последних исследования прямо во вкладке.'},
            6: {'to': 'contact', 'label': 'Request a demo', 'annotation': 'По коду: два действия — «Request a demo» (тема демо) и «Customer support». Заявка уходит по теме и региону: заказы и IFU — туда, куда раньше шли письма.'},
            7: {'annotation': 'Показания и источники — закреплённый блок в конце, свой в каждом регионе.'}}), FOOTER]},
        {'id': 'evidence', 'title': 'Evidence: COMANECI studies', 'url': 'rapid-medical.com/us/evidence#comaneci', 'body': [HEADER, page('US · Evidence', [0, 1, 3], {
            3: {'activeTab': 'comaneci', 'annotation': 'По коду: ссылка #comaneci прокручивает к вкладкам и открывает вкладку COMANECI™ (исправлено 2026-11-11).'}})]},
        {'id': 'webinars', 'title': 'Webinars: request a recording', 'url': 'rapid-medical.com/us/webinars', 'body': [HEADER, page('US · Webinars', None, {
            2: {'to': 'webinar-sent', 'label': 'Submit', 'annotation': 'Регион формы подставлен из адреса (Americas). Темы — названия вебинаров региона.'}})]},
        {'id': 'webinar-sent', 'title': 'Webinar request sent', 'url': 'rapid-medical.com/us/webinars', 'body': [HEADER, page('US · Webinars', [0, 1]),
            {'c': 'box', 'pad': 'l', 'items': [dict(THANKS, annotation='По коду: тот же текст, что у контактной формы. Врач не знает, когда и как придёт запись. Предложение: «We will email you a link to the recording within 2 working days» — срок за клиентом.')]}]},
        {'id': 'contact', 'title': 'Contact: demo request', 'url': 'rapid-medical.com/contact-us?region=us&topic=demo', 'height': 900, 'body': [HEADER, page('Contact', None, {
            1: {'to': 'contact-sent', 'label': 'Submit', 'annotation': 'Тема «Request a demo» и регион Americas выбраны по адресу (?region=us&topic=demo). Неизвестные значения в адресе игнорируются.'}})]},
        {'id': 'contact-sent', 'title': 'Demo request sent', 'url': 'rapid-medical.com/contact-us?region=us&topic=demo', 'body': [HEADER, page('Contact', [0]),
            {'c': 'box', 'pad': 'l', 'items': [dict(THANKS, annotation='Почта форм ещё не настроена (BACKLOG): без SMTP заявка видна только в админке, раздел Requests.')]}]},
        {'id': 'aneurysm-phone', 'title': 'Aneurysm on a phone', 'device': 'mobile', 'body': [HEADER, page('US · Aneurysm', [0, 1, 2]),
            {'c': 'box', 'pad': 's', 'items': [{'c': 'button', 'v': 'primary', 'text': 'Request a demo', 'to': 'contact-phone'}]}],
         'notes': ['На телефоне вкладки продукта становятся аккордеоном (по коду). Кнопки демо — в блоке «Questions?» внизу страницы.']},
        {'id': 'contact-phone', 'title': 'Contact on a phone', 'device': 'mobile', 'body': [HEADER, page('Contact')],
         'notes': ['12 полей на телефоне. Вопрос: убрать Country и State/Province из контактной формы, как в компактной (вебинары, карьера).']},
    ],
}
json.dump(flow, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('written', len(flow['screens']), 'screens')
