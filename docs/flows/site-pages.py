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


MOB = 'https://mobbin.com/'


def ref(page, name, source, caption, path):
    return {'c': 'ref', 'src': f'refs/{page}/{name}.webp', 'source': source, 'caption': caption, 'url': MOB + path}


def ref_screen(sid, title, page_slug, themes):
    body = []
    for t in themes:
        body.append({'c': 'section', 'pad': 's', 'items': [S([H(t['title'], 3), T(t['ask'], 'muted'),
                                                              {'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [ref(page_slug, *r) for r in t['refs']]}], 'm')]})
    return {'id': sid, 'title': title, 'body': body}


CONTACT_REFS = [
    {'title': 'Раскладка: форма и «зачем писать» рядом',
     'ask': 'Вопрос: оставить одну колонку (как сейчас) или две — слева текст, срок ответа, контакты, справа форма?',
     'refs': [('dovetail', 'Dovetail', 'тема первой, пояснения сбоку от полей, срок ответа под заголовком', 'sites/sections/9f8b5502-cee7-4eb1-8aff-9dcd26e9e308'),
              ('upwork', 'Upwork', 'слева заголовок и пара строк, справа короткая форма', 'sites/sections/c1e43d04-ad70-4402-ba1f-2ff400c94a0f'),
              ('savor', 'Savor', 'почта и адрес в колонке рядом с формой', 'sites/sections/ae1f5fe6-9420-45e4-b097-64ae2aa8c06e'),
              ('salesforce', 'Salesforce', 'рядом с формой — «Questions? Talk to an expert» и телефон', 'screens/5de38a69-8a1d-4912-bd5e-450e03a9c9f7'),
              ('framer', 'Framer', 'форма в карточке на тёмном фоне, слева заголовок', 'sites/sections/914df681-c24d-4800-bd11-9c144d0175fb'),
              ('mailchimp', 'Mailchimp', 'одна колонка: сначала тема, адрес компании ниже', 'sites/sections/65b34003-22ca-464c-b49d-91471fe066b4')]},
    {'title': 'Тема обращения: список или видна сразу',
     'ask': 'Вопрос: у нас 7 тем в выпадающем списке. Показать их кнопками-чипами сразу?',
     'refs': [('slack', 'Slack', 'темы чипами, ниже — свободный ввод', 'sites/sections/18717c77-0049-4c84-b21d-797bee5f295b'),
              ('harvest', 'Harvest', 'выбор продукта карточками с подписью', 'sites/sections/3a55ba42-2d51-4f8a-9bc1-439dd3d2ad0b'),
              ('sigma', 'SIGMA', 'отдел — радиокнопками в строку', 'sites/sections/2c678388-a130-4efe-95c0-ce7b35419b7a')]},
    {'title': 'Ошибки в полях',
     'ask': 'Вопрос: как показывать ошибку — у поля, сводкой сверху или и так и так?',
     'refs': [('square', 'Square', 'ошибка у поля + плашка «заполните обязательные поля»', 'screens/2d04b11c-f3d4-4937-a056-1e1898bec97d'),
              ('claude', 'Claude', 'рамка и текст под полем, остальное не трогается', 'screens/34e3cb61-99c3-4184-a302-74d9b03bdd0e'),
              ('evernote', 'Evernote', 'иконка в поле и одна строка объяснения', 'screens/11ca9c45-d92d-4a2d-ae18-f968c89c8095')]},
    {'title': 'После отправки',
     'ask': 'Вопрос: сейчас «Thank you for contacting us». Говорить, что и куда ушло, и когда ждать ответ?',
     'refs': [('hotjar', 'Hotjar', 'называет адрес, на который придёт ответ', 'screens/1cd0a18c-fdf9-45d5-b764-d14ac7dd0ab3'),
              ('zapier', 'Zapier', 'часы работы и срок ответа', 'screens/053f9a95-f2d0-4cbe-a89f-3f707dbf8276'),
              ('deputy', 'Deputy', 'подтверждение и ссылка «вернуться»', 'screens/2cb200a1-53e4-424d-bb0b-d1d17d766714')]},
]


ASIS_NOTE = 'Как есть (снимок сайта 2026-11-11): заголовок и одна форма из 12 полей. Тема — выпадающий список из 7 пунктов; Region — 4 варианта против 3 регионов сайта; телефонов и срока ответа нет — они только на About.'

flow = {
    'title': 'Site pages — one by one, from the least disputed',
    'project': 'Rapid Medical',
    'description': 'Страницы сайта по одной: «как есть» (настоящие блоки из rm-pages.json) → проверка на Mobbin → предложение. Структуру сайта не меняем (миграция с Duda): меняем раскладку и поведение внутри страницы. По каждой странице: показ → обсуждение → решение → DESIGN.md → следующая страница. Черновик предложения — повод для разговора, не решение. Порядок и статус страниц — docs/flows/site-pages.md. Серые экраны: визуальный стиль не обсуждаем, он решается отдельно (мудборды).',
    'start': 'contact-asis',
    'groups': [
        {'title': '1 · Contact Us — как есть', 'screens': ['contact-asis', 'contact-asis-phone']},
        {'title': '1 · Contact Us — примеры из Mobbin', 'screens': ['contact-mobbin']},
        {'title': '1 · Contact Us — черновик к обсуждению (не решение)', 'screens': ['contact-new', 'contact-error', 'contact-sent', 'contact-new-phone']},
    ],
    'links': [
              {'from': 'contact-asis', 'to': 'contact-asis-phone', 'label': 'на телефоне'},
              {'from': 'contact-asis-phone', 'to': 'contact-mobbin', 'label': 'как у других'},
              {'from': 'contact-mobbin', 'to': 'contact-new', 'label': 'черновик'},
              {'from': 'contact-new', 'to': 'contact-error', 'label': 'отправка с ошибкой'},
              {'from': 'contact-new', 'to': 'contact-new-phone', 'label': 'на телефоне'}],
    'screens': [
        {'id': 'contact-asis', 'title': 'Contact Us · as is', 'url': CONTACT_URL, 'height': 900,
         'body': [HEADER, page('Contact', None, {1: {'annotation': ASIS_NOTE}}), FOOTER]},
        {'id': 'contact-asis-phone', 'title': 'Contact Us · as is, phone', 'device': 'mobile', 'url': CONTACT_URL,
         'body': [HEADER, page('Contact'), FOOTER],
         'notes': ['На телефоне форма начинается после заголовка; тема — выпадающий список, ошибки — мелкий текст справа от подписи (находка 1).']},
        ref_screen('contact-mobbin', 'Contact Us · examples from Mobbin', 'contact', CONTACT_REFS),
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
