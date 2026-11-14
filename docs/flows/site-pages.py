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


US = next(o for o in OFFICES if o['label'] == 'USA')
MAIN_TOPICS = ['Request a demo', 'Product question / Support', 'Customer Service / Orders', 'Other topic ▾']


def strip(o):
    if isinstance(o, dict): return {k: strip(v) for k, v in o.items() if k != 'annotation'}
    if isinstance(o, list): return [strip(x) for x in o]
    return o


def line(k, v):
    return {'c': 'row', 'justify': 'between', 'align': 'center', 'items': [T(k, 'small'), v]}


def contacts(note=False):
    return S([line('Response time', T('[1 business day]', 'small')), {'c': 'divider'},
              line('Call Americas', {'c': 'link', 'text': US['phone']}), {'c': 'divider'},
              line('Orders', T(US['ordersEmail'], 'small')), {'c': 'divider'},
              {'c': 'link', 'text': 'All offices and addresses →'}], 's',
             annotation='Контакты — короткой таблицей с тонкими линиями: подпись слева, значение справа (In Common With, SOTF). Строки одной высоты держат колонку. Срок ответа — цифра от клиента; телефон и почта заказов — своего региона (Contact details).' if note else None)


def form(state='empty', phone=False):
    err = state == 'error'
    note = state == 'empty' and not phone
    chips = {'c': 'chips', 'label': 'What do you need?', 'items': MAIN_TOPICS, 'active': 0,
             'annotation': 'Три частые темы видны сразу, остальные (IFU, Meetings & Events, Investor relations, Other) — под «Other topic». Какие темы частые — гипотеза: проверить по заявкам в админке. Предвыбрана по адресу (?topic=demo).' if note else None}
    first = I('First name', required=True, value='' if err else None, error='Enter your first name.' if err else None)
    last = I('Last name', required=True, value='Lee' if err else None)
    email = I('Email', required=True, value='anna.lee@hospital' if err else None,
              error='Enter a full email address, like name@hospital.org' if err else None,
              annotation='Ошибка — только у поля: рамка и что исправить. Введённое остаётся (находка 1, уже чинится в коде). Без сводки сверху.' if err else None)
    phone_f = I('Phone', value='+1 214 555 0142' if err else None)
    org = I('Organization', value='Baylor Scott & White' if err else None)
    country = I('Country', v='select', required=True, value='United States',
                annotation='Одно поле «Country» вместо Region + Country + State. Регион для писем — из страны (находки 4 и 7). Зависит от ответа Emily; можно отложить.' if note else None)
    msg = {'c': 'textarea', 'label': 'Message', 'value': 'We’d like a hands-on TIGERTRIEVER session for our neuro team in March.' if err else None}
    opt = {'c': 'checkbox', 'label': 'Send me news and event invitations'}
    send = {'c': 'button', 'v': 'primary', 'text': 'Send request', 'full': True,
            'annotation': 'Кнопка на всю ширину формы закрывает её снизу — форма читается одним блоком (Butter, Melius).' if note else None}
    if not err: send.update(to='contact-sent', label='Send request')
    legal = T('By sending, you agree to our Privacy Statement.', 'caption')
    if phone:
        rows = [chips, first, last, email, phone_f, org, country, msg, opt, S([send, legal], 's')]
    else:
        rows = [chips, G([first, last]), G([email, phone_f]), G([org, country]), msg, opt, S([send, legal], 's')]
    return S(rows, 'm')


LEAD = 'Tell us what you need — we’ll get it to the right team.'


def contact_desktop(state):
    """Variant A: title, hairline, two columns that start on the same line."""
    note = state == 'empty'
    sent = state == 'sent'
    title = H('Thanks, Anna — your request is on its way' if sent else 'Let’s connect', 1)
    left = S([T('The Americas team will reply to anna.lee@hospital.org.' if sent else LEAD, 'lead',
                annotation='Подтверждение — одна фраза: кому ушло и куда ждать ответ (Hotjar, Zapier). Текст по типу формы. Письмо-подтверждение не обещаем: в коде его нет.' if sent else None)]
             + ([{'c': 'link', 'text': 'Send another request', 'to': 'contact-new', 'label': 'новая заявка'}] if sent else [])
             + [contacts(note)], 'xl')
    right = form(state) if not sent else {'c': 'box', 'tone': 'surface', 'pad': 'l', 'gap': 's', 'items': [
        T('Your request', 'strong'), T('Request a demo · United States', 'small'), T('Anna Lee · Baylor Scott & White', 'small')]}
    rule = {'c': 'divider'}
    if note:
        rule['annotation'] = 'Композиция A — «общая линия»: заголовок, тонкая линия, под ней две колонки стартуют на одной высоте: текст и контакты слева, форма справа (YLLW, In Common With, Yellowbird). У каждой колонки есть верхний край и ширина по сетке 4/8 — ничего не висит.'
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([
        title, rule, {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1}, right]}], 'l')]}, FOOTER]


def contact_phone():
    return [HEADER, {'c': 'section', 'pad': 'm', 'items': [S([H('Let’s connect', 1), {'c': 'divider'}, T(LEAD, 'lead'), form('empty', True), {'c': 'divider'}, contacts()], 'l')]}, FOOTER]


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
    {'title': 'Композиция: что держит страницу вместе',
     'ask': 'Решено 2026-11-14: композиция «общая линия» (YLLW, In Common With). Вариант «одна карточка» отклонён.',
     'refs': [('yllw', 'YLLW', 'заголовок, линия, под ней текст и форма стартуют на одной высоте', 'sites/sections/a45b58fa-4ac0-49f8-957e-47be93d4f4e1'),
              ('incommonwith', 'In Common With', 'контакты таблицей с тонкими линиями, форма рядом на той же линии', 'sites/sections/dd7619d6-0abf-4c9a-843e-e4cb41a86415'),
              ('yellowbird', 'Yellowbird', 'две половины через вертикальную линию', 'sites/sections/71e78a07-6cd1-4922-84ab-0fb803376279'),
              ('maxima', 'Maxima Therapy', 'текст и форма в одной белой карточке на цветном фоне', 'sites/sections/939927f7-47b9-47b3-ad9f-0a2945a3927d'),
              ('farfetch', 'FARFETCH', 'карточка по центру на сером, заголовок внутри', 'sites/sections/a046c674-043c-4f20-a1d4-9dc978a2315d'),
              ('mural', 'Mural', 'цветная полоса с заголовком, форма-карточка под ней', 'sites/sections/55f5288b-8d0a-43c7-9d44-9406ca32ac85'),
              ('melius', 'Melius', 'картинка и форма в одной рамке, кнопка на всю ширину', 'sites/sections/6365c06c-9c38-42b6-9e19-ebb4c797f9d2'),
              ('butter', 'Butter', 'поля одной высоты, кнопка на всю ширину закрывает форму', 'sites/sections/b81ebfe7-e775-4add-ba78-ee2feab9a432')]},
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


# ---------- Text page + 404 ----------
TEXT_REFS = [
    {'title': 'Юридические страницы: как читать длинный текст',
     'ask': 'Решено 2026-11-14: композиция «общая линия» как у Contact Us — дата, оглавление и документы слева (Miro, Zendesk, ClickUp).',
     'refs': [('miro', 'Miro', 'оглавление слева, даты публикации и вступления в силу под заголовком', 'sites/sections/47c3e6ab-e2e1-401e-baa3-79e8954e5919'),
              ('dub', 'Dub', '«On this page» справа, разделы пронумерованы', 'sites/sections/825205b6-8aa3-4195-893d-0c348638a02e'),
              ('webflow', 'Webflow', 'полоса «Legal» со ссылками на все документы, ниже оглавление списком', 'sites/sections/2ec91fae-596b-46bc-99eb-34d3ddf3a461'),
              ('clickup', 'ClickUp', 'слева список всех политик, текущая выделена', 'sites/sections/c855064d-d56d-4e1b-ac14-08c72838c9af'),
              ('zendesk', 'Zendesk', 'документы раздела слева, крупный заголовок справа — та же «общая линия»', 'sites/sections/0f40c501-8122-49db-8dd0-0342fbdfd4c8'),
              ('vimeo', 'Vimeo', 'важное уведомление плашкой до оглавления', 'sites/sections/cd6d49ec-3655-468e-92e3-1934a2053c34')]},
    {'title': 'Страницы исследований: не картинка, а текст и цифры',
     'ask': 'Вопрос: SUCCESS Study сейчас — одна картинка-скриншот. Делать такие страницы текстом: дата и источник, ключевые цифры, PDF? (Содержание — за клиентом и MLR.)',
     'refs': [('elicit', 'Elicit', 'дата, заголовок, вывод крупно, разделы с подписями капсом', 'screens/5b5f1c66-1ce8-4620-a0b6-79e407ebcbe3'),
              ('copilot', 'Microsoft Copilot', 'разделы через тонкие линии, узкая колонка текста', 'screens/d77fe48b-77a6-4da7-a14a-54d00682b7dc'),
              ('hims', 'Hims', 'одна цифра крупно и сноска с условиями исследования', 'screens/5e50843e-b295-4b23-9bff-bd1ba2526f3f')]},
    {'title': '404: куда идти дальше',
     'ask': 'Решено 2026-11-14: 404 отложена до графического дизайна — там сделать что-то запоминающееся.',
     'refs': [('littleamps', 'Little Amps Coffee', 'заголовок слева, «404» справа на той же линии, одна кнопка', 'sites/sections/a04a13b7-ed87-42e6-b3a1-ed653c00ea4d'),
              ('klarna', 'Klarna', 'крупный заголовок и два выхода', 'sites/sections/573d3727-5257-4575-9dbb-26cd9623424f'),
              ('apple', 'Apple', 'вместо кнопки — поиск и карта сайта', 'sites/sections/30ac6f25-887c-4761-bf4f-d2c08e7ca01f'),
              ('becane', 'Becane', 'надпись «404 error» над заголовком, всё по левому краю', 'sites/sections/8177c87f-f68e-498f-8fa0-670a2d5ca8c1')]},
]


def nf_page(title, lines):
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([H(title, 1)] + lines, 'm')]}, FOOTER]


import re
TERMS_HTML = RM['Terms'][1]['data']['html']
TERMS_SECTIONS = [re.sub(r'&#39;', '’', h) for h in [re.sub(r'<[^>]+>', '', h) for h in re.findall(r'<h[3-6][^>]*>(.*?)</h[3-6]>', TERMS_HTML, re.S) if not h.startswith('Last Revised')]]
TERMS_BODY = re.sub(r'^<h3>.*?</h3>\s*', '', TERMS_HTML)
LEGAL = ['Privacy Statement', 'Terms of Use', 'Compliance Statement', 'Patents']


def text_left(note=True):
    toc = S([T('On this page', 'strong')] + [{'c': 'link', 'text': t} for t in TERMS_SECTIONS], 'xs',
            annotation='«On this page» собирается сам из заголовков разделов и прилипает при прокрутке (Miro, Dub). Условие: разделы — одним уровнем заголовка; сейчас в тексте с Duda h3, h4 и h6 вперемешку — выровнять при переносе.' if note else None)
    docs = S([T('Legal', 'strong')] + [T(d, 'strong') if d == 'Terms of Use' else {'c': 'link', 'text': d} for d in LEGAL], 'xs',
             annotation='Все юридические документы рядом, текущий выделен (ClickUp, Zendesk). Переход между ними без футера. Список — те же 4 страницы из футера, новых страниц нет.' if note else None)
    return S([line('Last revised', T('January 8, 2024', 'small')), {'c': 'divider'}, toc, {'c': 'divider'}, docs], 'm')


def text_desktop():
    rule = {'c': 'divider', 'annotation': 'Та же композиция «общая линия», что у Contact Us: заголовок, линия, под ней слева (4/12) дата редакции, оглавление и документы раздела, справа (7/12) текст. Дата редакции вынесена из текста в таблицу «ключ — значение» (Miro).'}
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([H('Terms of Use', 1), rule,
            {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [text_left(), {'c': 'spacer', 'size': 1}, {'c': 'prose', 'html': TERMS_BODY, 'limit': 14}]}], 'l')]}, FOOTER]


def text_phone():
    return [HEADER, {'c': 'section', 'pad': 'm', 'items': [S([H('Terms of Use', 1), {'c': 'divider'}, line('Last revised', T('January 8, 2024', 'small')),
            I('On this page', v='select', value='1. Acceptance of the Terms'), {'c': 'prose', 'html': TERMS_BODY, 'limit': 8}], 'm')]}, FOOTER]


def study_desktop():
    left = S([line('Region', T('Americas', 'small')), {'c': 'divider'}, line('Published', T('[дата — от клиента]', 'small')), {'c': 'divider'},
              {'c': 'link', 'text': 'Download full results (PDF)'}], 's')
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([H('SUCCESS Study – Final Results', 1), {'c': 'divider'},
            {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1},
             {'c': 'media', 'kind': 'image', 'label': 'Screenshot-2025-07-21 (как сейчас)', 'ratio': '4/3',
              'annotation': 'Тот же шаблон для страниц исследований: слева регион, дата, PDF; справа содержание. Содержание пока прежнее (скриншот); перевод в текст и цифры — за клиентом и MLR (BACKLOG).'}]}], 'l')]}, FOOTER]


ASIS_NOTE = 'Как есть (снимок сайта 2026-11-11): заголовок и одна форма из 12 полей. Тема — выпадающий список из 7 пунктов; Region — 4 варианта против 3 регионов сайта; телефонов и срока ответа нет — они только на About.'

flow = {
    'title': 'Site pages — one by one, from the least disputed',
    'project': 'Rapid Medical',
    'description': 'Страницы сайта по одной: «как есть» (настоящие блоки из rm-pages.json) → проверка на Mobbin → предложение. Структуру сайта не меняем (миграция с Duda): меняем раскладку и поведение внутри страницы. По каждой странице: показ → обсуждение → решение → DESIGN.md → следующая страница. Черновик предложения — повод для разговора, не решение. Порядок и статус страниц — docs/flows/site-pages.md. Серые экраны: визуальный стиль не обсуждаем, он решается отдельно (мудборды).',
    'start': 'contact-asis',
    'groups': [
        {'title': '1 · Contact Us — как есть', 'screens': ['contact-asis', 'contact-asis-phone']},
        {'title': '1 · Contact Us — примеры из Mobbin', 'screens': ['contact-mobbin']},
        {'title': '1 · Contact Us — решение (закрыта 2026-11-14)', 'screens': ['contact-new', 'contact-error', 'contact-sent', 'contact-new-phone']},
        {'title': '2 · Текстовая страница — как есть', 'screens': ['text-asis', 'text-asis-study', 'text-asis-phone']},
        {'title': '2 · Текстовая страница — примеры из Mobbin', 'screens': ['text-mobbin']},
        {'title': '2 · Текстовая страница — решение (закрыта 2026-11-14)', 'screens': ['text-new', 'text-new-study', 'text-new-phone']},
        {'title': '404 — как есть (отложено до графического дизайна)', 'screens': ['nf-asis', 'nf-region']},
    ],
    'links': [
              {'from': 'contact-asis', 'to': 'contact-asis-phone', 'label': 'на телефоне'},
              {'from': 'contact-asis-phone', 'to': 'contact-mobbin', 'label': 'как у других'},
              {'from': 'contact-mobbin', 'to': 'contact-new', 'label': 'черновик'},
              {'from': 'contact-new-phone', 'to': 'text-asis', 'label': 'следующая страница'},
              {'from': 'text-asis', 'to': 'text-asis-study', 'label': 'страница исследования'},
              {'from': 'text-asis', 'to': 'text-asis-phone', 'label': 'на телефоне'},
              {'from': 'text-asis-phone', 'to': 'text-mobbin', 'label': 'как у других'},
              {'from': 'text-mobbin', 'to': 'text-new', 'label': 'решение'},
              {'from': 'text-new', 'to': 'text-new-study', 'label': 'страница исследования'},
              {'from': 'text-new', 'to': 'text-new-phone', 'label': 'на телефоне'},
              {'from': 'text-new-phone', 'to': 'nf-asis', 'label': '404'},
              {'from': 'nf-asis', 'to': 'nf-region', 'label': 'терапии нет в регионе'},
              {'from': 'contact-new', 'to': 'contact-error', 'label': 'отправка с ошибкой'},
              {'from': 'contact-new', 'to': 'contact-new-phone', 'label': 'на телефоне'}],
    'screens': [
        {'id': 'contact-asis', 'title': 'Contact Us · as is', 'url': CONTACT_URL, 'height': 900,
         'body': [HEADER, page('Contact', None, {1: {'annotation': ASIS_NOTE}}), FOOTER]},
        {'id': 'contact-asis-phone', 'title': 'Contact Us · as is, phone', 'device': 'mobile', 'url': CONTACT_URL,
         'body': [HEADER, page('Contact'), FOOTER],
         'notes': ['На телефоне форма начинается после заголовка; тема — выпадающий список, ошибки — мелкий текст справа от подписи (находка 1).']},
        {'id': 'text-asis', 'title': 'Terms of Use · as is', 'url': 'rapid-medical.com/terms-of-use', 'height': 900,
         'body': [HEADER, page('Terms', None, {1: {'annotation': 'Как есть: заголовок и сплошной текст в одну колонку. Дата редакции — подзаголовком внутри текста; оглавления нет, а Terms и Privacy — длинные (десятки разделов). Между 4 юридическими страницами переход только через футер.'}}), FOOTER]},
        {'id': 'text-asis-study', 'title': 'SUCCESS Study · as is', 'url': 'rapid-medical.com/us/success-study-final-results',
         'body': [HEADER, page('US · SUCCESS study', None, {1: {'annotation': 'Как есть: страница исследования — одна картинка-скриншот (Screenshot-2025-07-21…png). Цифры и выводы не читаются поиском и экранными читалками, на телефоне мелко. Так же устроены DISTALS и Comaneci spinal case.'}}), FOOTER]},
        {'id': 'text-asis-phone', 'title': 'Terms of Use · as is, phone', 'device': 'mobile', 'url': 'rapid-medical.com/terms-of-use',
         'body': [HEADER, page('Terms'), FOOTER], 'notes': ['На телефоне — тот же сплошной текст; чтобы найти раздел, листать до конца.']},
        {'id': 'nf-asis', 'title': '404 · as is', 'url': 'rapid-medical.com/us/old-page',
         'body': nf_page('Page not found', [T('The page you’re looking for doesn’t exist or has moved.', 'muted'), {'c': 'link', 'text': 'Back to home'}]),
         'notes': ['Как есть: заголовок, строка и одна ссылка на главную. Старые адреса Duda уходят редиректами (47), сюда попадают остальные.']},
        {'id': 'nf-region', 'title': '404 · therapy not in this region', 'url': 'rapid-medical.com/us/therapies/vasospasm',
         'body': nf_page('Vasospasm is not available in Americas', [T('Product availability differs by region. This therapy is available in:', 'muted'),
                                                                    {'c': 'bullets', 'items': ['Vasospasm — Europe & Middle East', 'Vasospasm — Asia & Pacific']},
                                                                    {'c': 'link', 'text': 'All therapies in Americas'}]),
         'notes': ['Состояние из параллельной сессии: терапия есть в других регионах — страница говорит об этом. Внутренних ссылок сюда быть не должно: переключатель региона ведёт на обзор терапий (?missing=), ссылки «версия в другом регионе» — только на существующие. Единственный внутренний источник — редирект с Duda /us/vasospasm → /us/therapies/vasospasm (site-ia, вопрос 1). Остальное — внешнее: старые закладки, поиск, ручная правка адреса. Это страховка, не основной путь.']},
        {'id': 'text-new', 'title': 'Terms of Use · decided', 'url': 'rapid-medical.com/terms-of-use', 'height': 900, 'body': text_desktop()},
        {'id': 'text-new-study', 'title': 'Study page · same template', 'url': 'rapid-medical.com/us/success-study-final-results', 'body': study_desktop()},
        {'id': 'text-new-phone', 'title': 'Terms of Use · decided, phone', 'device': 'mobile', 'url': 'rapid-medical.com/terms-of-use', 'body': text_phone(),
         'notes': ['Телефон: заголовок, линия, дата редакции, оглавление — выпадающим списком «On this page» (переход к разделу), затем текст.']},
        ref_screen('text-mobbin', 'Text page and 404 · examples from Mobbin', 'text', TEXT_REFS),
        ref_screen('contact-mobbin', 'Contact Us · examples from Mobbin', 'contact', CONTACT_REFS),
        {'id': 'contact-new', 'title': 'Contact Us · decided', 'url': CONTACT_URL, 'height': 900, 'body': contact_desktop('empty')},
        {'id': 'contact-error', 'title': 'Contact Us · proposal, field errors', 'url': CONTACT_URL, 'height': 900, 'body': contact_desktop('error')},
        {'id': 'contact-sent', 'title': 'Contact Us · proposal, request sent', 'url': CONTACT_URL, 'height': 900, 'body': contact_desktop('sent')},
        {'id': 'contact-new-phone', 'title': 'Contact Us · proposal, phone', 'device': 'mobile', 'url': CONTACT_URL,
         'body': contact_phone(),
         'notes': ['Телефон (вариант A): заголовок, линия, строка, форма; контакты — той же таблицей под формой. Номер — ссылка «позвонить».']},
    ],
}

ORDER = [sid for g in flow['groups'] for sid in g['screens']]
flow['screens'].sort(key=lambda x: ORDER.index(x['id']) if x['id'] in ORDER else len(ORDER))
OUT.write_text(json.dumps(clean(flow), ensure_ascii=False, indent=1), encoding='utf8')
print('ok:', OUT.name, len(flow['screens']), 'screens')
