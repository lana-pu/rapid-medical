# Generates visitor.json next to this file. Run: python3 docs/flows/visitor.py
# A physician's path on the public site, built from the real page compositions (rm-pages.json, snapshot 2026-11-10).
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
HEADER_M = {'c': 'rm-header', 'region': 'us'}
BANNER = {'c': 'rm-regionBanner', 'suggested': 'us', 'to': 'therapies', 'label': 'плашка региона',
    'annotation': 'Плашка по IP, без автоматического редиректа (Fix List C.4): Google и врачи в поездках должны видеть любой регион. По коду: ведёт на список терапий региона, а не на ту же страницу.'}
FOOTER = {'c': 'rm-footer', 'region': 'us'}
THANKS = {'c': 'box', 'tone': 'surface', 'pad': 'm', 'border': True, 'items': [{'c': 'text', 'v': 'strong', 'text': 'Thank you for contacting us.'},
                                                                              {'c': 'text', 'v': 'small', 'text': 'We will get back to you as soon as possible.'}]}

flow = {
    'title': 'Physician on the website — from the home page to a demo request',
    'project': 'Rapid Medical',
    'description': 'Врач-нейроинтервенционалист из США впервые на сайте: выбирает регион, находит терапию аневризм (COMANECI™), смотрит исследования, просит запись вебинара или демо. Все страницы — реальные составы из блоков сайта (снимок 2026-11-10). Заметки «по коду» — как сайт работает сейчас; остальные — вопросы и предложения.',
    'start': 'home',
    'groups': [
        {'title': '1 · Первый вход и регион', 'screens': ['home', 'choose', 'therapies']},
        {'title': '2 · Терапия и исследования', 'screens': ['aneurysm', 'aneurysm-tabs', 'evidence']},
        {'title': '3 · Вебинар или демо', 'screens': ['webinars', 'webinar-sent', 'contact', 'contact-sent']},
        {'title': '4 · Тот же путь на телефоне', 'screens': ['aneurysm-phone', 'contact-phone']},
    ],
    'links': [{'from': 'evidence', 'to': 'webinars', 'label': 'меню → вебинары (через In-Practice)'}, {'from': 'aneurysm', 'to': 'aneurysm-phone', 'label': 'та же страница на телефоне'}],
    'screens': [
        {'id': 'home', 'title': 'Home page, first visit', 'url': 'rapid-medical.com', 'body': [BANNER, HEADER_NONE, page('Home', [0, 1, 2], {
            0: {'to': 'choose', 'label': 'Explore Our Therapies', 'focus': {'part': 'cta', 'style': 'hover', 'cursor': True},
                'annotation': 'Два пути к терапиям: плашка региона и кнопка героя. Кнопка без запомненного региона ведёт на выбор региона — лишний шаг, если плашка уже знает регион. Вопрос: вести кнопку сразу в подсказанный регион?'}})]},
        {'id': 'choose', 'title': 'Choose your location', 'url': 'rapid-medical.com/choose-your-location', 'height': 560, 'body': [HEADER_NONE, page('Choose location', None, {
            1: {'to': 'therapies', 'annotation': 'Подсказанный регион выделен рамкой. Названия здесь «Europe & Middle East», а в плашке и шапках — «Europe, Middle East, Latin America & Australia» (по коду, REGION_CHOICES и REGION_LABELS). Свести к одному.'}})]},
        {'id': 'therapies', 'title': 'Therapies, Americas', 'url': 'rapid-medical.com/us/therapies', 'body': [dict(HEADER, menuOpen=True, annotation='По коду: в шапке метка «🌐 US» — код региона, а не название (REGION_SHORT). Меню Therapies раскрывает терапии выбранного региона.'), page('US · Therapies', None, {
            2: {'to': 'aneurysm', 'label': 'COMANECI™', 'focus': {'part': 'links', 'style': 'hover', 'cursor': True}}})]},
        {'id': 'aneurysm', 'title': 'Aneurysm: top of the page', 'url': 'rapid-medical.com/us/therapies/aneurysm', 'body': [HEADER, page('US · Aneurysm', [0, 1, 2], {
            0: {'to': 'contact', 'label': 'Request a demo', 'focus': {'part': 'eyebrow', 'style': 'hover'},
                'annotation': 'По коду: над заголовком посетитель видит «OUS version · APAC version» — внутренние коды регионов. Нужны названия регионов, как в плашке.'}}),
            {'c': 'box', 'pad': 's', 'items': [{'c': 'button', 'v': 'link', 'text': 'Scroll to the product details ↓', 'to': 'aneurysm-tabs'}]}]},
        {'id': 'aneurysm-tabs', 'title': 'Aneurysm: product tabs and safety text', 'url': 'rapid-medical.com/us/therapies/aneurysm#overview', 'body': [page('US · Aneurysm', [5, 6, 7], {
            5: {'to': 'evidence', 'label': 'Clinical evidence ↗', 'focus': {'part': 'tabs', 'style': 'hover', 'cursor': True},
                'annotation': 'Вкладка «Clinical evidence» уводит на другую страницу (↗) — единственная вкладка-ссылка среди вкладок с содержимым. Вопрос: оставить ссылкой или показать 3 последних исследования прямо во вкладке.'},
            6: {'to': 'contact', 'label': 'Contact us'},
            7: {'annotation': 'Показания и источники — закреплённый блок в конце, свой в каждом регионе.'}}), FOOTER]},
        {'id': 'evidence', 'title': 'Evidence: COMANECI studies', 'url': 'rapid-medical.com/us/evidence#comaneci', 'body': [HEADER, page('US · Evidence', [0, 1, 3], {
            3: {'annotation': 'По коду: ссылка ведёт на #comaneci, страница прокручивается к вкладкам, но открыта первая вкладка — TIGERTRIEVER™. Вкладки не читают якорь (Tabs.tsx). Врач видит не те исследования. Исправить.'}})]},
        {'id': 'webinars', 'title': 'Webinars: request a recording', 'url': 'rapid-medical.com/us/webinars', 'body': [HEADER, page('US · Webinars', None, {
            2: {'to': 'webinar-sent', 'label': 'Submit', 'annotation': 'Регион формы подставлен из адреса (Americas). Темы — названия вебинаров региона.'}})]},
        {'id': 'webinar-sent', 'title': 'Webinar request sent', 'url': 'rapid-medical.com/us/webinars', 'body': [HEADER, page('US · Webinars', [0, 1]),
            {'c': 'box', 'pad': 'l', 'items': [dict(THANKS, annotation='По коду: тот же текст, что у контактной формы. Врач не знает, когда и как придёт запись. Предложение: «We will email you a link to the recording within 2 working days» — срок за клиентом.')]}]},
        {'id': 'contact', 'title': 'Contact: demo request', 'url': 'rapid-medical.com/contact-us?region=us&topic=demo', 'height': 900, 'body': [HEADER, page('Contact', None, {
            1: {'to': 'contact-sent', 'label': 'Submit', 'annotation': 'Тема «Request a demo» и регион Americas выбраны по адресу (?region=us&topic=demo). Неизвестные значения в адресе игнорируются.'}})]},
        {'id': 'contact-sent', 'title': 'Demo request sent', 'url': 'rapid-medical.com/contact-us?region=us&topic=demo', 'body': [HEADER, page('Contact', [0]),
            {'c': 'box', 'pad': 'l', 'items': [dict(THANKS, annotation='Почта форм ещё не настроена (BACKLOG): без SMTP заявка видна только в админке, раздел Requests.')]}]},
        {'id': 'aneurysm-phone', 'title': 'Aneurysm on a phone', 'device': 'mobile', 'body': [HEADER_M, page('US · Aneurysm', [0, 1, 2], {
            0: {'to': 'contact-phone', 'label': 'Request a demo'}})], 'notes': ['На телефоне вкладки продукта становятся аккордеоном (по коду). Шапка — меню-«бургер».']},
        {'id': 'contact-phone', 'title': 'Contact on a phone', 'device': 'mobile', 'body': [HEADER_M, page('Contact')],
         'notes': ['12 полей на телефоне. Вопрос: убрать Country и State/Province из контактной формы, как в компактной (вебинары, карьера).']},
    ],
}
json.dump(flow, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('written', len(flow['screens']), 'screens')
