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


# ---------- Study pages (idea) ----------
STUDY_REFS = [
    {'title': 'Цифры-итоги: крупно и с подписью',
     'ask': 'Как подать главные результаты исследования одним взглядом.',
     'refs': [('zipline', 'Zipline', '«The highlights»: две цифры огромным шрифтом и что они значат', 'sites/sections/baf31b25-1858-463c-bf15-611d9c669092'),
              ('wise', 'Wise', 'цифры в ряд через тонкие линии, подпись с периодом', 'sites/sections/7dfcd207-47ec-4cf2-9988-85371589abc4'),
              ('headspace', 'Headspace', 'крупная бледная цифра + логотипы научных центров', 'sites/sections/23eef34d-4eb2-49aa-8335-e1ac748100d1'),
              ('aave', 'Aave', 'цифра в карточке с маленькой визуализацией рядом', 'sites/sections/02770c29-a1ea-4602-894f-9a59a779f0ea')]},
    {'title': 'Данные как график, а не картинка',
     'ask': 'Как показать распределение, сравнение и развитие во времени.',
     'refs': [('giga', 'Giga', 'точечная матрица «каждая точка = 1%», моно-подписи — близко к мудборду «чертёж и данные»', 'sites/sections/4b7ca144-327d-4a66-b75a-647cdd01171d'),
              ('retool', 'Retool', 'сравнение двух групп полосами с подписями значений', 'sites/sections/cdbbf80f-e1c0-47c9-9829-5af516346e60'),
              ('lightdash', 'Lightdash', 'развитие по шагам: день 1 → день 5', 'sites/sections/9c6b6e83-8629-44d1-a000-f786c7e26ba5'),
              ('greptile', 'Greptile', 'обложка исследования, собранная из самих данных', 'sites/sections/cc6a01db-55b7-4b6f-8cd8-b8f4b2d19bc2')]},
]

SUCCESS_URL = 'rapid-medical.com/us/success-study-final-results'


def stat(v, l): return {'c': 'stat', 'value': v, 'label': l}


def band(title, left, right, tone=None, note=None):
    return {'c': 'section', 'pad': 'l', 'tone': tone, 'items': [S([H(title, 2), {'c': 'divider'},
            {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1}, right], 'annotation': note}], 'm')]}


MRS = ['mRS 0', 'mRS 1', 'mRS 2', 'mRS 3–6']
MRS_ROWS = [{'label': 'Baseline (n=89)', 'segments': [{'value': 50.5}, {'value': 13.4}, {'value': 8.9}, {'value': 26.8}], 'note': '73%'},
            {'label': '30 days (n=90)', 'segments': [{'value': 45.5}, {'value': 23.3}, {'value': 11.1}, {'value': 19.8}], 'note': '80%'},
            {'label': '≤180 days (n=90)', 'segments': [{'value': 55.5}, {'value': 18.8}, {'value': 7.7}, {'value': 17.6}], 'note': '82%'}]
RR_ROWS = [{'label': 'End of procedure (n=90)', 'segments': [{'value': 78.8}, {'value': 6.6}, {'value': 14.4}], 'note': '86%'},
           {'label': '≤180 days (n=75)', 'segments': [{'value': 89.3}, {'value': 5.3}, {'value': 5.3}], 'note': '95%'}]
SAFETY = {'c': 'table', 'columns': ['', 'All (n=90)', 'Ruptured (n=32)', 'Unruptured (n=58)'], 'rows': [
    ['Thromboembolic events', '5 (5.5%)', '3 (9.4%)', '2 (3.4%)'],
    ['Symptomatic thromboembolic events', '0', '0', '0'],
    ['Mortality', '4 (4.4%)', '4 (12.5%)', '0'],
    ['Coil entanglement / total coils', '1/356 (0.3%)', '0/134', '1/222 (0.5%)']]}


def success_hero(phone=False):
    passport = S([line('Design', T('Multicenter, single-arm, prospective', 'small')), {'c': 'divider'},
                  line('Regulation', T('FDA-regulated post-market', 'small')), {'c': 'divider'},
                  line('Patients', T('90 · wide-neck aneurysms', 'small')), {'c': 'divider'},
                  line('Centers', T('17 in the US', 'small')), {'c': 'divider'},
                  line('Enrollment', T('Nov 2020 – Oct 2023', 'small')), {'c': 'divider'},
                  line('Imaging', T('Independent core lab (UCLA)', 'small'))], 's',
                 annotation=None if phone else '«Паспорт исследования» — первое, что проверяет врач: дизайн, сколько пациентов, кто оценивал снимки. Таблица «ключ — значение» из Contact Us. Всё — с постера.')
    stats = {'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [stat('95%', 'successful occlusion at ≤6 months'), stat('82%', 'good clinical outcome (mRS 0–2) at 6 months'),
                                                          stat('0', 'symptomatic thromboembolic events'), stat('0.3%', 'coil entanglement · 1 of 356 coils')],
             'annotation': None if phone else 'Итоги — 4 цифры крупно, как «The highlights» у Zipline и Wise. Только цифры и формулировки из одобренного постера (MLR).'}
    head = [{'c': 'eyebrow', 'text': 'Clinical study · COMANECI™ · Americas'}, H('SUCCESS', 1),
            T('SUccess in Comaneci-assist Coils Embolization Surveillance Study', 'muted'),
            T('A high rate of aneurysm occlusion with Comaneci in wide-neck aneurysms, sustained at 6 months, with a favorable safety profile.', 'lead',
              annotation=None if phone else 'Вывод исследования — одной фразой под названием. Расшифровка акронима — как на постере (буквы SUCCESS). Текст — из «Conclusions» постера, формулировку утверждает клиент.')]
    if phone:
        return S(head + [{'c': 'divider'}, stats, passport], 'l')
    return S(head + [{'c': 'divider'}, {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [passport, {'c': 'spacer', 'size': 1}, stats]}], 'l')


def success_desktop():
    return [HEADER,
            {'c': 'section', 'pad': 'l', 'items': [success_hero()]},
            band('Occlusion holds over time',
                 S([T('Successful occlusion (Raymond Roy I + II) rose from 86% at the end of the procedure to 95% at follow-up.', 'body'),
                    {'c': 'segmented', 'items': ['Both', 'End of procedure', '≤180 days'], 'active': 0}], 'm'),
                 {'c': 'bars', 'legend': ['Raymond Roy I', 'Raymond Roy II', 'Raymond Roy III'], 'rows': RR_ROWS, 'caption': 'P = 0.05'},
                 'surface', 'Графики — из чисел, а не картинкой: читаются на телефоне, находятся поиском и AI-ассистентами, одинаковы по стилю на всех исследованиях. Данные вносятся таблицей в админке (блок BarChart в коде уже есть). Переключатель по времени — как шаги у Lightdash.'),
            band('More patients with a good outcome over time',
                 T('Good clinical outcome (mRS 0–2): 73% at baseline, 80% at 30 days, 82% at 6 months (P < 0.05).', 'body'),
                 {'c': 'bars', 'legend': MRS, 'rows': MRS_ROWS}),
            band('Who was treated',
                 S([line('Mean age', T('62 (29–82)', 'small')), {'c': 'divider'}, line('Female', T('63%', 'small')), {'c': 'divider'},
                    line('Mean neck size', T('3.46 mm (1.5–8.2)', 'small'))], 's'),
                 {'c': 'dots', 'total': 90, 'cols': 18, 'groups': [{'n': 32, 'label': 'Ruptured · 32 (36%)'}, {'n': 58, 'label': 'Unruptured · 58 (64%)'}], 'caption': 'Each dot is one patient'},
                 'surface', 'Матрица «одна точка — один пациент» (Giga): 90 человек видно сразу, без процентов в уме. Тот же приём — для DISTALS «4 из 10».'),
            band('Safety', T('No symptomatic thromboembolic events. All deaths were in ruptured cases; hemorrhages and perforations were unrelated to Comaneci.', 'body'),
                 SAFETY, None, 'Полная таблица безопасности текстом, как на постере: честно и проверяемо. На телефоне — прокрутка вбок.'),
            band('Where the study was done',
                 T('17 US centers, from SUNY Buffalo to UCLA. Data adjudicated by an independent imaging core lab.', 'body'),
                 {'c': 'media', 'kind': 'map', 'label': 'US map · 17 centers (из аффилиаций авторов постера)', 'ratio': '21/9'},
                 'surface', 'Карта центров — компонент WorldMap уже есть (About). Список центров и авторов — раскрывается под картой. Приём — Headspace (научные центры).'),
            {'c': 'section', 'pad': 'l', 'items': [S([{'c': 'divider'}, {'c': 'row', 'gap': 'm', 'wrap': True, 'items': [
                {'c': 'button', 'v': 'primary', 'text': 'Download the poster (PDF)'}, {'c': 'button', 'v': 'secondary', 'text': 'Discuss SUCCESS with our team'},
                {'c': 'link', 'text': 'COMANECI™ for aneurysms →'}, {'c': 'link', 'text': 'All COMANECI™ publications →'}],
                'annotation': 'Что дальше: постер целиком (для тех, кому нужен оригинал), разговор с командой (Contact Us, тема demo), терапия и все публикации по продукту (Evidence, вкладка COMANECI).'},
                T('Refer to the Instructions for Use for indications, contraindications, warnings and precautions.', 'caption')], 'm')]},
            FOOTER]


def success_phone():
    return [HEADER, {'c': 'section', 'pad': 'm', 'items': [S([success_hero(True), {'c': 'divider'},
            H('Occlusion holds over time', 3), {'c': 'segmented', 'items': ['End of procedure', '≤180 days'], 'active': 1},
            {'c': 'bars', 'legend': ['RR I', 'RR II', 'RR III'], 'rows': RR_ROWS[1:]}, {'c': 'divider'},
            H('Who was treated', 3), {'c': 'dots', 'total': 90, 'cols': 15, 'groups': [{'n': 32, 'label': 'Ruptured · 32'}, {'n': 58, 'label': 'Unruptured · 58'}]},
            {'c': 'divider'}, {'c': 'button', 'v': 'primary', 'text': 'Download the poster (PDF)', 'full': True}], 'l')]}, FOOTER]


def distals_desktop():
    passport = S([line('Design', T('Randomized: TIGERTRIEVER™ 13 vs best medical care', 'small')), {'c': 'divider'},
                  line('Regulation', T('FDA-approved IDE study', 'small')), {'c': 'divider'},
                  line('Randomized', T('98 · 51 treatment, 47 control', 'small')), {'c': 'divider'},
                  line('Registry', {'c': 'link', 'text': 'NCT05152524'}), {'c': 'divider'},
                  line('Presented', T('ESOC, May 2026', 'small'))], 's')
    stats = {'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [stat('3×', 'successful reperfusion at 24 h without sICH'), stat('Zero', 'symptomatic ICH in the T13 arm'),
                                                          stat('41%', 'vs 33% recovered with little to no disability'), stat('2×', 'more patients reported perfect health (EQ-5D)')]}
    compare = {'c': 'bars', 'rows': [{'label': 'TIGERTRIEVER™ 13 (n=51)', 'segments': [{'value': 86.3, 'label': '86.3%'}]},
                                     {'label': 'Control (n=47)', 'segments': [{'value': 27.7, 'label': '27.7%'}]}], 'caption': 'Primary endpoint · efficacy and safety composite · P < .00001'}
    people = {'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [
        S([T('Treatment (n=29)', 'strong'), {'c': 'dots', 'total': 10, 'cols': 10, 'groups': [{'n': 4, 'label': '4 out of 10 patients'}]}], 's'),
        S([T('Control (n=36)', 'strong'), {'c': 'dots', 'total': 10, 'cols': 10, 'groups': [{'n': 3, 'label': '3 out of 10 patients'}]}], 's')]}
    return [HEADER,
            {'c': 'section', 'pad': 'l', 'items': [S([{'c': 'eyebrow', 'text': 'Clinical study · TIGERTRIEVER™ 13 · Global'}, H('DISTALS', 1),
                T('The first randomized trial of a device designed for distal stroke: more blood flow restored, with no increase in sICH.', 'lead'),
                {'c': 'divider'}, {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [passport, {'c': 'spacer', 'size': 1}, stats]}], 'l')],
             'annotation': 'Тот же шаблон на втором исследовании: паспорт, 4 итога. Сейчас на Duda DISTALS — лендинг с графиками-картинками; данные те же, меняется подача.'},
            band('Primary endpoint', T('Successful reperfusion at 24 hours without symptomatic intracranial hemorrhage.', 'body'), compare, 'surface',
                 'Сравнение двух групп — полосами (Retool). Было: картинка столбцов с кругами «3x».'),
            band('90-day outcomes', T('Patients admitted with moderate to severe disability (mRS 2–5) who achieved excellent outcomes (mRS 0–1).', 'body'), people, None,
                 '«4 из 10» против «3 из 10» — две матрицы по 10 точек вместо человечков-картинки.'),
            {'c': 'section', 'pad': 'm', 'items': [T('TIGERTRIEVER™ 13 is not indicated for DMVO in all markets. Refer to the appropriate IFU for indications and contraindications.', 'caption')]},
            FOOTER]


# ---------- Create a page from a document (studies, news) — idea ----------
ADMIN_URL = 'rapid-medical.com/admin/editor'
APPBAR = {'c': 'appbar', 'logo': 'Rapid Medical', 'nav': ['Website', 'Training tool'], 'active': 0, 'actions': [{'c': 'avatar', 'name': 'Emily R'}]}

POSTER_TEXT = (
    '<h3>Background</h3><p>Comaneci™ is a novel coil embolization assist device that is retrievable, radially adjustable, and designed as an adjunct to '
    'coiling of wide-necked aneurysms without limiting blood flow. Comaneci was introduced to the US market in 2019. The objective of this FDA-regulated '
    'post-market study is to assess the safety and performance of the device in US clinical practice.</p>'
    '<h3>Method</h3><p>SUCCESS is a multicenter, single arm, open, prospective study, enrolling 90 consecutive subjects in 17 US centers between November '
    '2020 and October 2023. Subjects had a wide neck (4-10 mm or dome to neck ratio &lt;2) intracranial aneurysm, ruptured or unruptured, that is suitable '
    'for coil embolization.</p>'
    '<h3>Results</h3><p>Ninety (90) consecutive subjects were enrolled with mean age 62 (range 29-82) years. Of these, 63% were female and 36% had ruptured '
    'aneurysms. Successful Occlusion (Raymond Roy I and II) at end of procedure was 86%, and 95% at 6 month follow up (Fig. 1), good clinical outcome '
    '(mRS 0-2) was 73% at baseline, 80% at 30 days follow up and 82% at 6 months follow up (Fig. 2).</p>'
    '<h3>Conclusions</h3><ul><li>Data demonstrates a high rate of successful aneurysm occlusion when using Comaneci as an assist device in wide neck '
    'aneurysms.</li><li>Safety profile is favorable with low thromboembolic rates compared with other modalities, such as balloons.</li></ul>')


def pages_list():
    return [APPBAR, {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [
        {'c': 'row', 'justify': 'between', 'items': [H('Pages', 2), {'c': 'button', 'v': 'primary', 'text': '+ New page'}]},
        {'c': 'list', 'items': [{'title': 'SUCCESS Study – Final Results', 'meta': 'Study · Americas · Europe · Asia & Pacific', 'badge': 'Live', 'tone': 'success'},
                                {'title': 'DISTALS Trial Results', 'meta': 'Study · All regions', 'badge': 'Live', 'tone': 'success'},
                                {'title': 'Rapid Medical™ Surpasses 1,000 Cases With DRIVEWIRE™ 24…', 'meta': 'News · Sep 2025', 'badge': 'Link to BusinessWire', 'tone': 'neutral'}]}]}]


def imp_modal(step):
    if step == 'new':
        items = [{'c': 'upload', 'label': 'Comaneci-assisted-embolization-SUCCESS.pdf · 9 pages', 'hint': 'PDF of the paper, poster, press release, IFU or brochure — or paste a link below'},
                 I('…or a link', placeholder='BusinessWire, journal, DOI'),
                 S([{'c': 'chips', 'label': 'What is it?', 'items': ['Study', 'Publication', 'News / update', 'Clinical case', 'Document (IFU, brochure)'], 'active': 0},
                    {'c': 'row', 'gap': 's', 'items': [{'c': 'badge', 'text': 'Suggested from the file', 'tone': 'info'}, T('Has Methods, Results and patient numbers', 'caption')]}], 's',
                   annotation='Вид определяется до ИИ, бесплатно, по самому файлу: адрес ссылки (businesswire → новость, doi / журнал → публикация), слова в PDF («Instructions for Use» → документ, «Methods / Results» → исследование, «About Rapid Medical» → новость). Сайт подставляет вид и объясняет почему; человек меняет одним кликом. Вид решает дальнейшие шаги: у документа нет сводки от ИИ — только PDF.'),
                 G([I('Region', v='select', value='All regions'), I('Product', v='select', value='COMANECI™')]),
                 I('ClinicalTrials.gov number', placeholder='NCT…', hint='Studies only — fills the study passport from the registry, free'),
                 S([T('Full text on the page', 'strong'),
                    {'c': 'radio', 'label': 'Copy the text into the page — readable on a phone, found by search', 'on': True},
                    {'c': 'radio', 'label': 'Show the PDF on the page'},
                    {'c': 'radio', 'label': 'Link to the original only'}], 'xs',
                   annotation='Полный текст — тремя способами. Скопировать на страницу: читается на телефоне, находится поиском. Встроить PDF: точный оригинал, быстро. Только ссылка: когда нет прав на текст (статьи в платных журналах). Свои материалы (пресс-релизы, постеры) — копировать; статьи журналов — по лицензии.'),
                 S([T('Where it appears', 'strong'),
                    {'c': 'checkbox', 'label': 'Evidence — COMANECI™ tab', 'on': True},
                    {'c': 'checkbox', 'label': 'News feed — as a new study', 'on': True},
                    {'c': 'checkbox', 'label': 'Highlights — carousels on Home, News & Events and Evidence', 'on': True}], 'xs',
                   annotation='Featured (хайлайты) по умолчанию включён у нового: карусели показывают самые свежие отмеченные (главная — 4, News & Events — 5, Evidence — featured), старые уходят сами по мере добавления новых. Снять галочку — материал не попадёт в карусели. То же меняется потом в карточке материала. Отметки по виду: исследование — Evidence + новости; новость — только новости; документ — нигде автоматически.')]
        return {'c': 'modal', 'title': 'Create from a document', 'items': items, 'wide': True,
                'actions': [{'c': 'button', 'v': 'ghost', 'text': 'Cancel'}, {'c': 'button', 'v': 'primary', 'text': 'Next', 'to': 'imp-prompt', 'label': 'Next'}]}
    items = [T('The summary on top comes from your AI assistant — ChatGPT, Claude or Copilot, whichever you already use. The site does not pay for AI.', 'muted',
               annotation='Бесплатно для проекта: сайт сам ИИ не вызывает. Инструкция уже написана; человек прогоняет её в своём чате и вставляет ответ. Полный текст сайт достаёт из PDF сам, без ИИ, — поэтому ИИ не может его исказить.'),
             S([T('1. Copy the instructions', 'strong'), {'c': 'button', 'v': 'secondary', 'text': 'Copy instructions for AI'}], 's'),
             S([T('2. In your AI chat: attach the PDF and paste the instructions', 'strong'), T('The answer lists key numbers and charts, each with the exact sentence it came from.', 'small')], 's'),
             S([T('3. Paste the answer here', 'strong'), {'c': 'textarea', 'value': 'KEY NUMBERS\n95% | successful occlusion at 6 months | “Successful Occlusion … was 86%, and 95% at 6 month follow up”\n82% | good clinical outcome (mRS 0–2) at 6 months | “… and 82% at 6 months follow up”\n…'}], 's')]
    return {'c': 'modal', 'title': 'Create from a document · summary', 'items': items, 'wide': True,
            'actions': [{'c': 'button', 'v': 'ghost', 'text': 'Back'}, {'c': 'button', 'v': 'primary', 'text': 'Build the draft', 'to': 'imp-review', 'label': 'черновик'}]}


def imp_review():
    def item(title, meta, state):
        if state == 'auto': return {'title': title, 'meta': meta, 'badge': 'Checked', 'tone': 'success'}
        if state == 'warn': return {'title': title, 'meta': meta, 'badge': 'Check', 'tone': 'warning', 'actions': [{'c': 'button', 'v': 'secondary', 'size': 's', 'text': 'Fix'}]}
        return {'title': title, 'meta': meta, 'actions': [{'c': 'button', 'v': 'secondary', 'size': 's', 'text': 'Looks right'}]}
    rows = [item('Study passport', 'From ClinicalTrials.gov', 'auto'),
            item('Key numbers', '4 values · all 4 sentences found in the PDF', 'auto'),
            item('Occlusion over time', '5 values · 1 sentence not found in the PDF', 'warn'),
            item('Good outcome over time', '3 values · found in the PDF', 'ok'),
            item('Full text', 'Copied from the PDF · 3,180 words · matches word for word', 'auto')]
    panel = {'c': 'panel', 'title': 'Check against the PDF', 'items': [
        {'c': 'media', 'kind': 'page', 'ratio': '3/4'},
        dict({'c': 'list', 'items': rows}, annotation='Проверка бесплатная и автоматическая там, где можно: цитату из ответа ИИ сайт ищет в тексте PDF — нашлась дословно, блок проверен сам. Полный текст сверяется с PDF слово в слово. Человеку остаются только блоки с «Check» и «Looks right». Publish — когда всё проверено.')]}
    toolbar = {'c': 'toolbar', 'left': [{'c': 'button', 'v': 'ghost', 'text': '← Pages'}, S([T('SUCCESS Study – Final Results', 'strong'), T('Built from Comaneci-assisted-embolization-SUCCESS.pdf', 'caption')], 'xs')],
               'right': [{'c': 'badge', 'text': 'Draft', 'tone': 'neutral', 'dot': True}, T('3 of 5 checked', 'small'), {'c': 'button', 'v': 'secondary', 'text': 'Publish — check 2 blocks first'}]}
    preview = S([{'c': 'eyebrow', 'text': 'Clinical study · COMANECI™'}, H('SUCCESS', 1), {'c': 'divider'},
                 {'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [stat('95%', 'successful occlusion at ≤6 months'), stat('82%', 'good clinical outcome at 6 months')]},
                 dict({'c': 'bars', 'legend': ['RR I', 'RR II', 'RR III'], 'rows': RR_ROWS}, hover=True), {'c': 'divider'}, H('Full study', 3), {'c': 'prose', 'html': POSTER_TEXT, 'limit': 3}], 'm')
    return [toolbar, {'c': 'split', 'cols': 'minmax(0,1fr) 380px', 'height': 780, 'items': [{'c': 'box', 'pad': 'l', 'items': [preview]}, panel]}]


def full_text_band(mode='copy'):
    tabs = {'c': 'segmented', 'items': ['Read here', 'Original PDF'], 'active': 0 if mode == 'copy' else 1}
    left = S([line('Source', T('Peer-reviewed paper', 'small')), {'c': 'divider'}, line('Published', T('[журнал, дата — из PDF]', 'small')), {'c': 'divider'},
              {'c': 'link', 'text': 'Download PDF'}, {'c': 'link', 'text': 'Open on the journal site ↗'}], 's')
    body = S([tabs, {'c': 'prose', 'html': POSTER_TEXT}, SAFETY], 'm') if mode == 'copy' else S([tabs, {'c': 'media', 'kind': 'page', 'label': 'PDF viewer · page 1 of 9 · zoom · download', 'ratio': '3/4'}], 'm')
    return band('Full study', left, body, None,
                'Под статистикой — полный текст: скопирован на страницу (заголовки, абзацы, таблицы — как в оригинале) или встроенный PDF. Переключатель «Read here / Original PDF» — если есть и то и другое. Слева — откуда текст и ссылка на оригинал.')


def study_full_desktop():
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [success_hero()]},
            band('Occlusion holds over time', T('Successful occlusion (Raymond Roy I + II): 86% at the end of the procedure, 95% at follow-up.', 'body'),
                 {'c': 'bars', 'legend': ['Raymond Roy I', 'Raymond Roy II', 'Raymond Roy III'], 'rows': RR_ROWS}, 'surface'),
            full_text_band('copy'),
            {'c': 'section', 'pad': 'm', 'items': [S([{'c': 'divider'}, {'c': 'row', 'gap': 'm', 'wrap': True, 'items': [
                {'c': 'button', 'v': 'primary', 'text': 'Discuss SUCCESS with our team'}, {'c': 'link', 'text': 'COMANECI™ for aneurysms →'}, {'c': 'link', 'text': 'Other COMANECI™ studies →'}],
                'annotation': 'Следующий шаг обязателен: на эту страницу ведут посты LinkedIn (бриф linkedin-leads.md, звено 3). Заявка уходит в Contact Us с темой demo и UTM поста.'},
                T('Refer to the Instructions for Use for indications, contraindications, warnings and precautions.', 'caption')], 'm')]},
            FOOTER]


def news_desktop():
    left = S([line('Published', T('September 2025', 'small')), {'c': 'divider'}, line('Type', T('Press release', 'small')), {'c': 'divider'},
              {'c': 'link', 'text': 'Originally published on BusinessWire ↗'}], 's',
             annotation='Сейчас новость на сайте — только заголовок и ссылка на BusinessWire: врач уходит с сайта. Здесь — своя страница с полным текстом пресс-релиза (свой материал — можно копировать) и ссылкой на оригинал.')
    text = S([{'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [stat('1,000+', 'cases with DRIVEWIRE™ 24 in North America'), stat('Europe', 'expansion announced')],
               'annotation': 'Цифры сверху — только если они есть в тексте (ИИ предлагает, цитата проверяется по документу). Паспорта у новости нет.'},
              {'c': 'divider'},
              {'c': 'media', 'kind': 'page', 'label': 'Full press release text — copied from BusinessWire (headings, paragraphs, quotes, About Rapid Medical)', 'ratio': '16/9'}], 'm')
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([{'c': 'eyebrow', 'text': 'News · DRIVEWIRE™'},
            H('Rapid Medical™ Surpasses 1,000 Cases With DRIVEWIRE™ 24 in North America and Expands Into Europe', 1), {'c': 'divider'},
            {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1}, text]}], 'l')]}, FOOTER]


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
        {'title': '2 · Текстовая страница — решение (закрыта 2026-11-14)', 'screens': ['text-new', 'text-new-phone']},
        {'title': '2a · Страница исследования — примеры из Mobbin', 'screens': ['study-mobbin']},
        {'title': '2a · Набор инфографики — на двух исследованиях', 'screens': ['study-success', 'study-success-phone', 'study-distals']},
        {'title': '2a · Создать из документа: статистика сверху, полный текст ниже (исследования и новости)', 'screens': ['imp-new', 'imp-prompt', 'imp-review', 'study-full', 'news-page']},
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
              {'from': 'text-new', 'to': 'text-new-phone', 'label': 'на телефоне'},
              {'from': 'text-asis-study', 'to': 'study-mobbin', 'label': 'как у других'},
              {'from': 'study-mobbin', 'to': 'study-success', 'label': 'идея'},
              {'from': 'study-success', 'to': 'study-success-phone', 'label': 'на телефоне'},
              {'from': 'study-success', 'to': 'study-distals', 'label': 'тот же шаблон'},
              {'from': 'study-distals', 'to': 'imp-new', 'label': 'как это собирается'},
              {'from': 'imp-review', 'to': 'study-full', 'label': 'Publish'},
              {'from': 'study-full', 'to': 'news-page', 'label': 'тот же механизм для новости'},
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
        {'id': 'text-new-phone', 'title': 'Terms of Use · decided, phone', 'device': 'mobile', 'url': 'rapid-medical.com/terms-of-use', 'body': text_phone(),
         'notes': ['Телефон: заголовок, линия, дата редакции, оглавление — выпадающим списком «On this page» (переход к разделу), затем текст.']},
        {'id': 'study-success', 'title': 'Study page · SUCCESS', 'url': SUCCESS_URL, 'body': success_desktop()},
        {'id': 'study-success-phone', 'title': 'Study page · SUCCESS, phone', 'device': 'mobile', 'url': SUCCESS_URL, 'body': success_phone(),
         'notes': ['Телефон: название и вывод, 4 итога, паспорт, график с переключателем по времени, матрица пациентов, постер. Графики из чисел перестраиваются под ширину — скриншот постера на телефоне не читается.']},
        {'id': 'study-distals', 'title': 'Study page · DISTALS, same template', 'url': 'rapid-medical.com/distals-results', 'body': distals_desktop()},
        {'id': 'imp-new', 'title': 'Admin · create from a document', 'url': ADMIN_URL, 'height': 1120, 'body': pages_list(), 'overlay': imp_modal('new'),
         'notes': ['Вход: Pages → New page → «Create from a document» (и то же из списка News). Регистр ClinicalTrials.gov — бесплатный открытый API.']},
        {'id': 'imp-prompt', 'title': 'Admin · summary with your own AI', 'url': ADMIN_URL, 'height': 820, 'body': pages_list(), 'overlay': imp_modal('prompt')},
        {'id': 'imp-review', 'title': 'Editor · check against the PDF', 'url': ADMIN_URL + '/success-study-final-results', 'height': 840, 'body': imp_review()},
        {'id': 'study-full', 'title': 'Study page · statistics on top, full study below', 'url': SUCCESS_URL, 'body': study_full_desktop()},
        {'id': 'news-page', 'title': 'News page · same mechanism, no passport', 'url': 'rapid-medical.com/news/drivewire-24-1000-cases', 'body': news_desktop()},
        ref_screen('study-mobbin', 'Study page · examples from Mobbin', 'study', STUDY_REFS),
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
