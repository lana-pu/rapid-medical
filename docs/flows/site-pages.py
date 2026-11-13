# Generates site-pages.json next to this file. Run: python3 docs/flows/site-pages.py
# Site pages one by one, from the least disputed: "as is" (real block lists from rm-pages.json) → proposal after a
# Mobbin check. Each accepted proposal goes to docs/DESIGN.md (block contract) in the same step.
# Order and status: docs/flows/site-pages.md.
import json
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / 'site-pages.json'
RM = json.load(open(HERE / 'rm-pages.json', encoding='utf8'))['pages']


def rm(page, i, **extra):
    b = RM[page][i]
    return dict({'c': 'rm-' + b['type'], 'v': b['variant']}, **dict(b['data'], **extra))


def page(name, idx=None, extra=None):
    blocks = RM[name]
    idx = range(len(blocks)) if idx is None else idx
    return {'c': 'rm-page', 'items': [rm(name, i, **((extra or {}).get(i, {}))) for i in idx]}


def T(text, v='body', **kw): return dict({'c': 'text', 'v': v, 'text': text}, **kw)
def H(text, level=2, **kw): return dict({'c': 'heading', 'level': level, 'text': text}, **kw)
def I(label, **kw): return dict({'c': 'input', 'label': label}, **kw)
def G(items, cols=2, **kw): return dict({'c': 'grid', 'cols': cols, 'gap': 's', 'items': items}, **kw)
def S(items, gap='m', **kw): return dict({'c': 'stack', 'gap': gap, 'items': items}, **kw)


HEADER = {'c': 'rm-header', 'region': 'us'}
FOOTER = {'c': 'rm-footer', 'region': 'us'}

# ---------- Contact Us ----------
TOPICS = RM['Contact'][1]['data']['topics']
OFFICES = next(b for b in RM['About'] if b['type'] == 'officesMap' and b['variant'] == 'offices')['data']['offices']
CONTACT_URL = 'rapid-medical.com/contact-us?region=us&topic=demo'


def intro(phone=False):
    return [
        {'c': 'eyebrow', 'text': 'Contact us'},
        H('Let’s connect', 1),
        T('Tell us what you need. We send your request to the right team for your country.', 'lead',
          annotation='Подзаголовок объясняет, что будет с заявкой, а не просит «a few contact details» (Dovetail: «We’ll route your message to the right person»). Сейчас текст зашит в код — сделать редактируемым. Формулировка — за клиентом.'),
    ]


def next_steps(phone=False):
    return S([
        H('What happens next', 4),
        {'c': 'bullets', 'items': ['We reply by email within [1 business day — ждём цифру от Rapid Medical].',
                                   'Orders and IFU requests go straight to customer service for your region.'],
         'annotation': 'Срок ответа видят до отправки (Dovetail, Harvest, Zapier). Цифру даёт клиент; без неё строку не показываем. Вторая строка — правда по коду: заказы и IFU уходят на адреса региона (spec → Contact Us).'},
    ], 's')


def offices(phone=False):
    cards = [S([H(o['label'] if o['label'] != 'Headquarters' else 'Headquarters · Israel', 5),
                {'c': 'link', 'text': o['phone']},
                T(o['ordersEmail'], 'small')], 'xs') for o in OFFICES]
    return S([H('Prefer to call?', 4), S(cards, 'm')], 's',
             annotation='Телефоны и почта заказов рядом с формой: врачу с заказом или вопросом по устройству «прямо сейчас» быстрее позвонить (находка 17 UX-прохода). Данные те же, что на About (Settings → Contact details), без новой сущности. Приём — Salesforce «Questions? Talk to an expert», Savor, Upwork.' )


def form(state='empty', phone=False):
    err = state == 'error'
    filled = state in ('error',)
    chips = {'c': 'chips', 'label': 'What do you need?', 'required': True, 'items': TOPICS, 'active': 0,
             'annotation': 'Тема — первым полем и видна целиком: 7 вариантов чипами вместо выпадающего списка. Тема решает, куда уйдёт письмо, поэтому её выбирают осознанно. Предвыбрана по адресу (?topic=demo). Приём: Slack, Harvest, NEON, SIGMA (видимые варианты), Mailchimp, Discord, Dovetail (тема первой).' if state == 'empty' else None}
    first = I('First name', required=True, value='' if err else None, placeholder='', error='Enter your first name.' if err else None)
    last = I('Last name', required=True, value='Lee' if filled else None)
    email = I('Email', required=True, value='anna.lee@hospital' if filled else None,
              error='Enter a full email address, like name@hospital.org' if err else None)
    phone_f = I('Phone', value='+1 214 555 0142' if filled else None)
    org = I('Organization', value='Baylor Scott & White' if filled else None)
    country = I('Country', v='select', required=True, value='United States',
                annotation='Страна вместо «Region» (4 значения против 3 регионов сайта) + Country + State. Регион для маршрутизации выводится из страны: снимает путаницу с Ближним Востоком и Латинской Америкой (находки 4 и 7). Предвыбрана по IP. Решение: какая карта «страна → регион» верная — вопрос к Emily (BACKLOG, решения №9).' if state == 'empty' else None)
    state_f = I('State', v='select', value='Texas' if filled else None, placeholder='Select…',
                hint='Only for the US and Canada' if state == 'empty' else None)
    msg = {'c': 'textarea', 'label': 'Message', 'value': 'We’d like a hands-on TIGERTRIEVER session for our neuro team in March.' if filled else None,
           'placeholder': 'Anything that helps us prepare: device, procedure, dates'}
    opt = {'c': 'checkbox', 'label': 'Send me news and event invitations from Rapid Medical'}
    legal = T('By sending this form you agree to our Privacy Statement.', 'small')
    send = {'c': 'button', 'v': 'primary', 'text': 'Send request', 'to': 'contact-sent', 'label': 'Send request'} if not err else {'c': 'button', 'v': 'primary', 'text': 'Send request'}
    if phone:
        send['full'] = True
    req = T('* required', 'caption')
    summary = {'c': 'alert', 'tone': 'danger', 'title': '2 fields need attention',
               'text': 'First name · Email',
               'annotation': 'Ошибка с сервера: введённое остаётся на месте (сейчас форма стирается целиком — находка 1). Сверху — сводка со ссылками на поля, у поля — что исправить. Приём: Square (сводка + поле), Claude, GoFundMe, Evernote (текст под полем). Цвет ошибки — новый токен --danger (DESIGN.md).'}
    rows = [chips]
    if phone:
        rows += [first, last, email, phone_f, org, country, state_f]
    else:
        rows += [G([first, last]), G([email, phone_f]), org, G([country, state_f])]
    rows += [msg, opt, legal, {'c': 'row', 'gap': 'm', 'align': 'center', 'items': [send, req]} if not phone else S([send, req], 's')]
    if err:
        rows = [summary] + rows
    return {'c': 'box', 'border': not phone, 'pad': 'l' if not phone else None, 'gap': 'm', 'items': rows}


def sent(phone=False):
    return {'c': 'box', 'border': not phone, 'pad': 'l' if not phone else None, 'gap': 'm', 'items': [
        {'c': 'badge', 'text': 'Request sent', 'tone': 'success', 'dot': True},
        H('Thank you, Anna', 3),
        T('Your demo request went to the Americas team. We’ll reply to anna.lee@hospital.org.', 'body',
          annotation='Подтверждение говорит, что и куда ушло, и на какой адрес ждать ответ (Hotjar показывает адрес, Zapier — срок ответа). Текст — по форме: у события «You’re registered…», у Careers свой (находка 2). Письмо-подтверждение посетителю кодом не предусмотрено — его не обещаем.'),
        {'c': 'table', 'columns': ['', ''], 'rows': [['Topic', 'Request a demo'], ['Country', 'United States · Texas']]},
        {'c': 'row', 'gap': 'm', 'wrap': True, 'items': [
            {'c': 'button', 'v': 'secondary', 'text': 'Explore our therapies'},
            {'c': 'link', 'text': 'Send another request', 'to': 'contact-new', 'label': 'новая заявка'}]},
    ]}


def strip(o):
    if isinstance(o, dict): return {k: strip(v) for k, v in o.items() if k != 'annotation'}
    if isinstance(o, list): return [strip(x) for x in o]
    return o


def contact_desktop(state):
    right = sent() if state == 'sent' else form(state)
    left = S(intro() + [next_steps(), offices()], 'l')
    if state != 'empty': left = strip(left)
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [{'c': 'grid', 'cols': '5fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, right],
                                                         'annotation': 'Две колонки: слева — зачем и что дальше, справа — форма. Самый частый приём у B2B-контактов на Mobbin (Upwork, Framer, Salesforce, Savor, Dovetail). Новый вариант блока Form — «split» (DESIGN.md).' if state == 'empty' else None}]},
            FOOTER]


def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items() if v is not None}
    if isinstance(o, list): return [clean(x) for x in o]
    return o


ASIS_NOTE = 'Как есть (снимок сайта 2026-11-11): заголовок и одна форма из 12 полей. Тема — выпадающий список из 7 пунктов; Region — 4 варианта против 3 регионов сайта; телефонов и срока ответа нет — они только на About.'

flow = {
    'title': 'Site pages — one by one, from the least disputed',
    'project': 'Rapid Medical',
    'description': 'Страницы сайта по одной: «как есть» (настоящие блоки из rm-pages.json) → проверка на Mobbin → предложение. Структуру сайта не меняем (миграция с Duda): меняем раскладку и поведение внутри страницы. Принятое предложение сразу идёт в DESIGN.md → Коллекция блоков. Порядок и статус страниц — docs/flows/site-pages.md. Серые экраны: визуальный стиль не обсуждаем, он решается отдельно (мудборды).',
    'start': 'contact-asis',
    'groups': [
        {'title': '1 · Contact Us — как есть', 'screens': ['contact-asis', 'contact-asis-phone']},
        {'title': '1 · Contact Us — предложение', 'screens': ['contact-new', 'contact-error', 'contact-sent', 'contact-new-phone']},
    ],
    'links': [{'from': 'contact-asis', 'to': 'contact-new', 'label': 'предложение'},
              {'from': 'contact-asis', 'to': 'contact-asis-phone', 'label': 'на телефоне'},
              {'from': 'contact-new', 'to': 'contact-error', 'label': 'отправка с ошибкой'},
              {'from': 'contact-new', 'to': 'contact-new-phone', 'label': 'на телефоне'}],
    'screens': [
        {'id': 'contact-asis', 'title': 'Contact Us · as is', 'url': CONTACT_URL, 'height': 900,
         'body': [HEADER, page('Contact', None, {1: {'annotation': ASIS_NOTE}}), FOOTER]},
        {'id': 'contact-asis-phone', 'title': 'Contact Us · as is, phone', 'device': 'mobile', 'url': CONTACT_URL,
         'body': [HEADER, page('Contact'), FOOTER],
         'notes': ['На телефоне форма начинается после заголовка; тема — выпадающий список, ошибки — мелкий текст справа от подписи (находка 1).']},
        {'id': 'contact-new', 'title': 'Contact Us · proposal', 'url': CONTACT_URL, 'height': 900, 'body': contact_desktop('empty')},
        {'id': 'contact-error', 'title': 'Contact Us · proposal, fields need attention', 'url': CONTACT_URL, 'height': 900, 'body': contact_desktop('error')},
        {'id': 'contact-sent', 'title': 'Contact Us · proposal, request sent', 'url': CONTACT_URL, 'height': 900, 'body': contact_desktop('sent')},
        {'id': 'contact-new-phone', 'title': 'Contact Us · proposal, phone', 'device': 'mobile', 'url': CONTACT_URL,
         'body': [HEADER, {'c': 'section', 'pad': 'm', 'items': [strip(S(intro(True) + [form('empty', True), next_steps(True), offices(True)], 'l'))]}, FOOTER],
         'notes': ['На телефоне форма сразу под заголовком, «что дальше» и телефоны — под формой: главное действие страницы не уезжает вниз. Кнопка на всю ширину, номера — ссылки «позвонить».']},
    ],
}

OUT.write_text(json.dumps(clean(flow), ensure_ascii=False, indent=1), encoding='utf8')
print('ok:', OUT.name, len(flow['screens']), 'screens')
