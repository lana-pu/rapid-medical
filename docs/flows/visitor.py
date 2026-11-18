# Generates visitor.json next to this file. Run: python3 docs/flows/visitor.py
# A physician's path on the public site, built from the real page compositions (rm-pages.json; refresh with blocks-kit/snapshot.sh).
# Annotations marked «по коду» describe the current behaviour found in the code, not proposals.
# Updated 2026-11-18 to the redesigned site (main after PR #2): region window, therapies overview, Evidence, Contact Us.
import json
from pathlib import Path

OUT = Path(__file__).with_name('visitor.json')
SNAP = json.load(open(Path(__file__).with_name('rm-pages.json'), encoding='utf8'))
RM = SNAP['pages']


def rm(page, i, **extra):
    b = RM[page][i]
    return dict({'c': 'rm-' + b['type'], 'v': b['variant']}, **dict(b['data'], **extra))


def page(name, idx=None, extra=None):
    blocks = RM[name]
    idx = range(len(blocks)) if idx is None else idx
    items = [rm(name, i, **((extra or {}).get(i, {}))) for i in idx]
    return {'c': 'rm-page', 'items': items}


def region_window(snap, **extra):
    """«Choose your location» as a window over the page (RegionModal → RegionPicker)."""
    return {'c': 'modal', 'title': 'Choose your location', 'items': [
        {'c': 'text', 'v': 'muted', 'text': 'Product availability and regulatory information differ by region. Pick the region you practice in.'},
        rm(snap, 1, _ctx={'nested': True}, **extra)]}


HEADER = {'c': 'rm-header', 'region': 'us'}
HEADER_NONE = {'c': 'rm-header'}
FOOTER = {'c': 'rm-footer', 'region': 'us'}


def thanks(annotation):
    return {'c': 'box', 'pad': 'l', 'items': [{'c': 'box', 'tone': 'surface', 'pad': 'm', 'border': True, 'annotation': annotation, 'items': [
        {'c': 'text', 'v': 'strong', 'text': 'Thank you for contacting us.'},
        {'c': 'text', 'v': 'small', 'text': 'We will get back to you as soon as possible.'}]}]}


flow = {
    'title': 'Physician on the website — from the home page to a demo request',
    'project': 'Rapid Medical',
    'description': f"Врач-нейроинтервенционалист из США впервые на сайте: находит терапию аневризм (COMANECI™), смотрит исследования, просит запись вебинара или демо. Регион определяется по IP сразу (решение 2026-11-10). Все страницы — реальные составы из блоков сайта после редизайна (снимок {SNAP['snapshot']}, rm-pages.json). Заметки «по коду» — как сайт работает сейчас; остальные — вопросы и предложения.",
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
                0: {'to': 'therapies', 'label': 'Explore Therapies', 'focus': {'part': 'cta', 'style': 'hover'},
                    'annotation': 'Кнопка героя ведёт на обзор терапий региона (/us/therapies) — для тех, кто не знает линейку. Врач, который знает, что ищет, идёт через меню.'}})]},
        {'id': 'menu', 'title': 'Therapies menu', 'url': 'rapid-medical.com', 'height': 620, 'body': [
            dict(HEADER, menuOpen=True, to='aneurysm', label='Aneurysm',
                 annotation='По коду: терапии региона по направлениям — Ischemic stroke / Hemorrhagic stroke / Access, внизу «All therapies». Направление — поле терапии в админке; меню правится в Settings → Menu and footer.'),
            page('Home', [0])]},
        {'id': 'therapies', 'title': 'Therapies overview, Americas', 'url': 'rapid-medical.com/us/therapies', 'body': [HEADER, page('US · Therapies', None, {
            1: {'to': 'aneurysm', 'label': 'Aneurysm · Explore →', 'focus': {'part': 'items', 'style': 'hover', 'cursor': True},
                'annotation': 'По коду: одна сетка карточек из записей терапий региона. Над названием — направление и продукт («Hemorrhagic stroke · COMANECI™»), внизу две ссылки: «Explore →» на страницу терапии и «N publications →» сразу в Evidence на этот продукт.'}})]},
        {'id': 'home-unknown', 'title': 'Home page, country unknown', 'url': 'rapid-medical.com', 'body': [
            dict(HEADER_NONE, to='choose', label='Evidence', focus={'part': 'menu', 'style': 'hover', 'cursor': True},
                 annotation='По коду: если страна не определилась (VPN, нет заголовка), в шапке «🌐 Choose location». При входе ничего не всплывает: окно выбора открывается, только когда врач идёт в региональный раздел (Therapies, Evidence) или жмёт переключатель.'),
            page('Home', [0])]},
        {'id': 'choose', 'title': 'Choose your location (window)', 'url': 'rapid-medical.com', 'body': [HEADER_NONE, page('Home', [0])],
         'overlay': dict(region_window('Choose location', to='evidence', label='Go to Americas →'),
                         annotation='По коду: окно поверх страницы, не отдельный адрес. Поиск страны подсвечивает её регион («Brazil is here»); у каждого региона — список стран. После выбора врач попадает туда, куда шёл (Evidence региона), и выбор больше не перебивается IP. Без JavaScript — та же панель отдельной страницей /choose-your-location (не индексируется).')},
        {'id': 'shared-link', 'title': 'A colleague’s link to the Europe page', 'url': 'rapid-medical.com/ous/therapies/lvo', 'body': [
            {'c': 'rm-regionBanner', 'suggested': 'us', 'to': 'therapies', 'label': 'Go to the Americas site',
             'annotation': 'По коду: плашка только когда регион страницы не совпадает с IP и врач сам регион не выбирал. Кнопка ведёт на обзор терапий региона, а не на эту же страницу; переключатель в шапке возвращает на ту же страницу. Вопрос: вести плашку тоже на ту же страницу?'},
            dict(HEADER, region='ous', to='switcher', label='🌐 Europe & Middle East ▾', focus={'part': 'switcher', 'style': 'hover', 'cursor': True}),
            page('OUS · Large vessel stroke', [0, 1])]},
        {'id': 'switcher', 'title': 'Region switcher (window)', 'url': 'rapid-medical.com/ous/therapies/lvo', 'body': [dict(HEADER, region='ous'), page('OUS · Large vessel stroke', [0])],
         'overlay': dict(region_window('Choose location · from the header', to='therapies', label='Go to Americas →'),
                         annotation='По коду: то же окно, что и при неизвестном регионе, плюс строка «Current region» с источником — «From your location» или «Your choice». Выбор открывает ту же страницу в другом регионе (вместе с открытой вкладкой); если её там нет — обзор терапий. Названия здесь короткие («Europe & Middle East»), а в плашке и на Evidence — длинные («Europe, Middle East, Latin America & Australia»): вопрос к Emily.')},
        {'id': 'aneurysm', 'title': 'Aneurysm: top of the page', 'url': 'rapid-medical.com/us/therapies/aneurysm', 'body': [HEADER, page('US · Aneurysm', [0, 1, 2], {
            0: {'focus': {'part': 'eyebrow', 'style': 'hover'}, 'annotation': 'Над заголовком — версии страницы в других регионах, названиями регионов.'}}),
            {'c': 'box', 'pad': 's', 'items': [{'c': 'button', 'v': 'link', 'text': 'Scroll to the product details ↓', 'to': 'aneurysm-tabs'}]}]},
        {'id': 'aneurysm-tabs', 'title': 'Aneurysm: product tabs, actions and safety text', 'url': 'rapid-medical.com/us/therapies/aneurysm#overview', 'body': [page('US · Aneurysm', [5, 6, 7], {
            5: {'to': 'evidence', 'label': 'Clinical evidence ↗', 'focus': {'part': 'tabs', 'style': 'hover', 'cursor': True},
                'annotation': 'Вкладка «Clinical evidence» уводит на Evidence (↗) и открывает там продукт (/us/evidence#comaneci). Вопрос: оставить ссылкой или показать 3 последних исследования прямо во вкладке.'},
            6: {'to': 'contact', 'label': 'Request a demo', 'annotation': 'По коду: два действия — «Request a demo» (тема демо) и «Customer support». Заявка уходит по теме и региону: заказы и IFU — туда, куда раньше шли письма.'},
            7: {'annotation': 'Показания и источники — закреплённый блок в конце, свой в каждом регионе.'}}), FOOTER]},
        {'id': 'evidence', 'title': 'Evidence: COMANECI studies', 'url': 'rapid-medical.com/us/evidence#comaneci', 'body': [HEADER, page('US · Evidence', [0, 1, 2], {
            1: {'annotation': 'По коду: слева цифры региона — всего публикаций и по каждому продукту, справа — строка о направлении исследований. Ниже — «Featured publications» карточками (отмеченные в админке).'},
            2: {'activeTab': 'comaneci', 'focus': {'part': 'groups', 'style': 'hover'},
                'annotation': 'По коду: ссылка #comaneci прокручивает к «Browse by product» и включает фильтр COMANECI™. В списке — поиск по названию, автору и журналу, сортировка; у статьи — год, авторы, продукт, DOI и «Download PDF», где файл наш.'}})]},
        {'id': 'webinars', 'title': 'Webinars: request a recording', 'url': 'rapid-medical.com/us/webinars', 'body': [HEADER, page('US · Webinars', None, {
            1: {'annotation': 'По коду: «Request this recording» на карточке выбирает этот вебинар в форме ниже и прокручивает к ней.'},
            2: {'to': 'webinar-sent', 'label': 'Submit', 'annotation': 'Регион формы подставлен из адреса (Americas). Темы — названия вебинаров региона.'}})]},
        {'id': 'webinar-sent', 'title': 'Webinar request sent', 'url': 'rapid-medical.com/us/webinars', 'body': [HEADER, page('US · Webinars', [0, 1]),
            thanks('По коду: тот же текст, что у контактной формы (своё сообщение есть только у регистрации на событие и у Careers). Врач не знает, когда и как придёт запись. Предложение: «We will email you a link to the recording within 2 working days» — срок за клиентом.')]},
        {'id': 'contact', 'title': 'Contact: demo request', 'url': 'rapid-medical.com/contact-us?region=us&topic=demo', 'height': 900, 'body': [HEADER, page('Contact', None, {
            1: {'to': 'contact-sent', 'label': 'Submit', 'focus': {'part': 'topics', 'style': 'hover'},
                'annotation': 'По коду: тема «Request a demo» выбрана по адресу (?topic=demo), три частые темы — кнопками, остальные — в «Other topic». Слева — телефон и почта заказов региона из адреса (?region=us). Вместо региона — страна, подставлена по IP; поле штата появляется только для США и Канады.'}})]},
        {'id': 'contact-sent', 'title': 'Demo request sent', 'url': 'rapid-medical.com/contact-us?region=us&topic=demo', 'body': [HEADER, page('Contact', [0]),
            thanks('Почта форм ещё не настроена (BACKLOG): без SMTP заявка видна только в админке, раздел Requests.')]},
        {'id': 'aneurysm-phone', 'title': 'Aneurysm on a phone', 'device': 'mobile', 'body': [HEADER, page('US · Aneurysm', [0, 1, 2]),
            {'c': 'box', 'pad': 's', 'items': [{'c': 'button', 'v': 'primary', 'text': 'Request a demo', 'to': 'contact-phone'}]}],
         'notes': ['На телефоне вкладки продукта становятся аккордеоном (по коду). Кнопки демо — в блоке «Questions?» внизу страницы.']},
        {'id': 'contact-phone', 'title': 'Contact on a phone', 'device': 'mobile', 'body': [HEADER, page('Contact')],
         'notes': ['7 полей вместо 12 до редизайна: страна вместо региона, штат — только для США и Канады (решение 2026-11-14).']},
    ],
}
json.dump(flow, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('written', len(flow['screens']), 'screens')
