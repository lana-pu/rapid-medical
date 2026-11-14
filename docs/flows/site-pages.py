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


def ref(page, name, source, caption, path, ext='webp'):
    return {'c': 'ref', 'src': f'refs/{page}/{name}.{ext}', 'source': source, 'caption': caption, 'url': path if path.startswith('http') else MOB + path}


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


# ---------- News & Events ----------
NEWS_REFS = [
    {'title': 'Верх раздела: главная новость и лента без повторов',
     'ask': 'Решено 2026-11-14: без карусели — главная крупно и 3 рядом, лента без повторов.',
     'refs': [('cohere', 'Cohere', 'одна главная новость крупно, ниже лента: дата в левой колонке, заголовок справа', 'sites/sections/f69a1b3c-6ba4-4179-b582-56d2e975aa3f'),
              ('canva', 'Canva', 'главная крупно + 3 рядом списком, без карусели', 'sites/sections/f2c4e533-861b-4e23-8b91-d7fd68b49c09'),
              ('anthropic', 'Anthropic', 'featured-карточки + контакты для прессы рядом', 'sites/sections/1b865afc-0b4a-47df-aa83-4417633c5bb3'),
              ('airtable', 'Airtable', '«Top stories» с подписью раздела над карточкой', 'sites/sections/70ed3e3c-c7b2-4b46-9cdd-80981ad21bae')]},
    {'title': 'Лента: виды материалов и куда ведёт ссылка',
     'ask': 'Решено: фильтр по виду (All · News · Studies · Company updates), «↗ источник» у внешних ссылок, дата в своей колонке.',
     'refs': [('wix', 'Wix', 'фильтр-метки «Press Releases · In the News · Company Updates» и метка вида на карточке', 'sites/sections/29512bfc-9455-41ce-9e68-747c125e9a68'),
              ('qatalog', 'Qatalog', 'строки: дата · заголовок · стрелка ↗ — видно, что ссылка внешняя', 'sites/sections/85686f39-90c9-488b-b73c-25c3f920d425'),
              ('headspace', 'Headspace Health', 'заголовок раздела слева, лента справа — «общая линия»', 'sites/sections/6ff103ae-a58a-4929-8f9b-e7cc58b36099')]},
    {'title': 'Страница новости',
     'ask': 'Решено: заголовок, «ключ — значение» слева (дата, вид, продукт, оригинал, поделиться), полный текст справа, материалы продукта внизу.',
     'refs': [('upwork', 'Upwork', 'крупный заголовок, вводка курсивом, «город — дата —» в начале текста, «Share» сбоку', 'sites/sections/566d805d-5d8d-4c7a-aae3-f63974151edb')]},
    {'title': 'События: предстоящие и прошедшие',
     'ask': 'Решено: пустое состояние строкой, ближайшее событие карточкой, остальные и архив — строками.',
     'refs': [('sketch', 'Sketch', 'переключатель «Upcoming events / Past events»', 'sites/sections/8c0f223c-c7c6-407b-a93c-185a6f940927'),
              ('slack', 'Slack', 'честное пустое состояние «There are currently no upcoming events»', 'sites/sections/8d4f0086-b2ce-4730-a20f-8e3b5524e313'),
              ('customerio', 'Customer.io', 'ближайшее событие крупно, остальные строками: город, дата, тип', 'sites/sections/ca975cb9-511e-4117-ace5-17ae19799a84'),
              ('koto', 'Koto', 'прошедшие строками: номер, название, дата, описание — моно-подписи', 'sites/sections/52eb4549-452c-4e5f-882b-8bd6771150bd')]},
]

PAST_EVENTS = [('2026', [('Oct 12', 'From Physics to Practice', 'Busan · Park Hyatt Busan', ''), ('Sep 15–16', 'TIGERTRIEVER™ Workshop in partnership with Kaneka', '', ''),
                         ('Sep 3', 'DRIVEWIRE™ 24 in Clinical Practice', 'Marseille', 'ESMINT'), ('Jun 1', 'More than Conventional', 'Paris · Hôtel Regina Louvre', 'LINNC')]),
               ('2025', [('Oct 22', 'Meet The Experts Dinner event at DGNR 2025', '', 'DGNR')])]


def past_events(phone=False):
    rows = []
    for year, items in PAST_EVENTS:
        rows.append(H(year, 4))
        for d, t, place, cong in items:
            meta = ' · '.join(x for x in (place, cong) if x)
            rows.append({'c': 'row', 'gap': 'm', 'align': 'start', 'items': [T(d, 'small'), dict(S([T(t, 'strong')] + ([T(meta, 'caption')] if meta else []), 'xs'), grow=True)]})
            rows.append({'c': 'divider'})
    return {'c': 'section', 'pad': 'l', 'items': [S([H('Past events', 2)] + rows, 's')]}


def news_events_asis(phone=False):
    page_ = page('News & Events', None, {1: {'annotation': None if phone else 'Карусель: 5 отмеченных featured (или последних). Клик по новости — уход на BusinessWire / NeuroNews: своих страниц у новостей нет.'},
                                        2: {'annotation': None if phone else 'Лента по годам начинается с тех же новостей, что в карусели (находка 15). Все 53 — внешние ссылки; исследования (SUCCESS, DISTALS) в ленте — только если заведены новостью.'}})
    items = [HEADER, page_, past_events(phone), FOOTER]
    if not phone:
        items[2]['items'][0]['annotation'] = 'Предстоящих событий сейчас нет (последнее — 12 окт 2026), и блок «Upcoming events» пропадает целиком; на странице остаётся только архив внизу. Ссылка «← News & Events» со страницы прошедшего события ведёт на якорь предстоящих, которого нет (находка 21).'
    return items


def event_past():
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([
        {'c': 'link', 'text': '← News & Events'}, {'c': 'eyebrow', 'text': 'ESMINT · Marseille'}, H('DRIVEWIRE™ 24 in Clinical Practice', 1),
        T('Real-World Experience from Two Perspectives with Dr. Rui de Carvalho and Dr. Markus Holtmannspötter', 'lead'),
        T('September 3, 2026', 'muted'),
        {'c': 'alert', 'tone': 'info', 'title': 'This event has taken place',
         'annotation': 'Как есть: после даты — плашка и описание; итогов (recap) нет — и больше ничего. Нет связи с тем, что представили (исследования, видео докладов), и с ближайшими событиями.'},
        {'c': 'media', 'kind': 'page', 'label': 'Event description', 'ratio': '21/9'}], 'm')]}, FOOTER]


# ---------- News & Events — decided ----------
TOP = [('News', 'Jul 2026', 'Rapid Medical Announces FDA Clearance of DRIVEWIRE™ 35 and First Stroke Cases', 'WhatsApp-Image-2026-07-21'),
       ('Study', 'May 2026', 'TIGERTRIEVER™ 13 Demonstrates Promising 90-Day Outcomes in DISTALS Trial', ''),
       ('News', 'Apr 2026', 'Rapid Medical™ Announces FDA Clearance of TIGERTRIEVER™ 25 and First Clinical Cases', ''),
       ('Study', 'Feb 2026', 'DISTALS Trial Overwhelmingly Positive, Demonstrating Superior Reperfusion', '')]
FEED = [('Dec 2025', 'News', 'Rapid Medical™ Completes Enrollment in DISTALS Trial Evaluating TIGERTRIEVER 13™ for Distal Vessel Occlusions', 'BusinessWire'),
        ('Dec 2025', 'Study', 'Comaneci-assisted embolization of wide-necked aneurysms: results from the SUCCESS postmarket US study', None),
        ('Sep 2025', 'News', 'Rapid Medical™ Surpasses 1,000 Cases With DRIVEWIRE™ 24 in North America and Expands Into Europe', None),
        ('Sep 2025', 'Company', 'Rapid Medical™ Appoints Industry Veteran Nir Nimrodi to Its Board of Directors', 'BusinessWire'),
        ('Jan 2025', 'News', 'Rapid Medical Announces Enrolment in “First-Ever” Study on Cognitive Benefits of Thrombectomy', 'NeuroNews'),
        ('Sep 2024', 'News', 'Rapid Completes Interim Safety Analysis of DISTALS Study Evaluating Tigertriever 13 Device', 'NeuroNews')]


def feed_row(date, kind, title, ext, to=None):
    meta = kind + (f' · {ext} ↗' if ext else '')
    r = {'c': 'grid', 'cols': '120px minmax(0,1fr)', 'gap': 'm', 'items': [T(date, 'small'), S([T(title, 'strong'), T(meta, 'caption')], 'xs')]}
    if to: r.update(to=to, label='своя страница')
    return r


def top_block(phone=False):
    k, d, t, img = TOP[0]
    big = {'c': 'card', 'media': {'kind': 'image', 'label': img, 'ratio': '16/9'}, 'eyebrow': f'{k} · {d}', 'title': t, 'actions': [{'c': 'link', 'text': 'Read →'}]}
    side = S(sum([[{'c': 'grid', 'cols': '96px minmax(0,1fr)', 'gap': 'm', 'align': 'start', 'items': [{'c': 'media', 'kind': 'image', 'ratio': '4/3', 'tiny': True}, S([T(f'{k2} · {d2}', 'caption'), T(t2, 'strong')], 'xs')]}, {'c': 'divider'}]
                   for k2, d2, t2, _ in TOP[1:]], []), 's')
    note = None if phone else 'Вместо карусели — главная крупно и 3 рядом (Canva, Cohere): всё главное видно сразу, без листания. Это «хайлайты» (ADR-009): самые свежие отмеченные, новые отмечены по умолчанию. Вид материала — надпись над заголовком.'
    if phone:
        return S([big, side], 'm')
    return dict({'c': 'grid', 'cols': '7fr 1fr 4fr', 'gap': 'm', 'align': 'start', 'items': [big, {'c': 'spacer', 'size': 1}, side]}, annotation=note)


def upcoming(state, phone=False):
    if state == 'none':
        body = S([T('No upcoming events right now.', 'body'), {'c': 'link', 'text': 'See past events ↓'}], 's',
                 annotation=None if phone else 'Предстоящих нет — честная строка и ссылка на архив (Slack), а не пропавший блок. Так раздел «Events» в названии страницы не теряется.')
    else:
        body = S([{'c': 'card', 'eyebrow': 'Oct 12, 2026 · 12:45 PM · Busan', 'title': 'From Physics to Practice', 'text': 'Innovation and the Future of Neurointervention · Park Hyatt Busan',
                   'actions': [{'c': 'button', 'v': 'primary', 'text': 'Register'}, {'c': 'link', 'text': 'Details →'}]},
                  feed_row('Nov 2026', 'Workshop', '[следующее событие — пример строки]', None)], 'm',
                 annotation='Когда события есть: ближайшее — карточкой с датой, местом и «Register», остальные — строками (Customer.io). Пример — как выглядело до 12 октября.')
    if phone:
        return S([H('Upcoming events', 3), body], 's')
    return {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [H('Upcoming events', 3), {'c': 'spacer', 'size': 1}, body]}


def all_news(phone=False):
    chips = {'c': 'chips', 'items': ['All', 'News', 'Studies', 'Company updates'], 'active': 0,
             'annotation': None if phone else 'Фильтр по виду материала (Wix): одна лента для новостей, исследований и апдейтов (ADR-009). Ведёт и на свои страницы, и наружу.'}
    rows = []
    for i, (d, k, t, ext) in enumerate(FEED):
        rows += [feed_row(d, k, t, ext, to='news-page' if 'DRIVEWIRE™ 24' in t else None), {'c': 'divider'}]
    if not phone:
        rows[0]['annotation'] = 'Лента начинается со следующих после главных — без повторов (находка 15). Строка: дата в своей колонке, заголовок, вид и источник. «↗ BusinessWire» — честно, что уйдёт с сайта (Qatalog); без стрелки — своя страница.'
    lst = S([chips] + rows + [{'c': 'button', 'v': 'secondary', 'text': 'Show more'}], 's')
    if phone:
        return S([H('All news', 3), lst], 's')
    return {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [H('All news', 3), {'c': 'spacer', 'size': 1}, lst]}


def past_block(phone=False):
    rows = []
    for year, items in PAST_EVENTS:
        rows.append(T(year, 'strong'))
        for d, t, place, cong in items:
            meta = ' · '.join(x for x in (place, cong) if x)
            rows += [dict(feed_row(d, 'Event', t, None), **({'to': 'event-past-new', 'label': 'событие'} if 'DRIVEWIRE' in t else {})), {'c': 'divider'}]
            if meta: rows[-2]['items'][1]['items'][1]['text'] = meta
    lst = S(rows, 's')
    if phone:
        return S([H('Past events', 3), lst], 's')
    return {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [H('Past events', 3), {'c': 'spacer', 'size': 1}, lst],
            'annotation': 'Архив событий — той же строкой, что и новости: дата, название, город · конгресс. Якорь #past-events — сюда ведёт «← News & Events» с прошедшего события.'}


def news_events_new(state='none', phone=False):
    head = [H('News & Events', 1), {'c': 'divider'}]
    if not phone:
        head[1]['annotation'] = 'Композиция «общая линия»: заголовок, линия; ниже секции — название слева (4/12), содержимое справа (7/12). Как Contact Us и текстовые страницы.'
    secs = [S(head + [top_block(phone)], 'l'), upcoming(state, phone), all_news(phone), past_block(phone)]
    return [HEADER] + [{'c': 'section', 'pad': 'l' if not phone else 'm', 'rule': i < 3, 'items': [x]} for i, x in enumerate(secs)] + [FOOTER]


def news_article():
    left = S([line('Published', T('September 3, 2025', 'small')), {'c': 'divider'}, line('Type', T('Press release', 'small')), {'c': 'divider'},
              line('Product', {'c': 'link', 'text': 'DRIVEWIRE™'}), {'c': 'divider'},
              {'c': 'link', 'text': 'Originally published on BusinessWire ↗'}, {'c': 'row', 'gap': 's', 'items': [{'c': 'button', 'v': 'secondary', 'size': 's', 'text': 'LinkedIn'}, {'c': 'button', 'v': 'secondary', 'size': 's', 'text': 'X'}, {'c': 'button', 'v': 'secondary', 'size': 's', 'text': 'Copy link'}]}], 's',
             annotation='Слева — «ключ — значение»: дата, вид, продукт (ссылка на терапию), оригинал и «поделиться» (Upwork). LinkedIn первым — туда идут посты (бриф linkedin-leads).')
    text = S([{'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [stat('1,000+', 'cases with DRIVEWIRE™ 24 in North America'), stat('Europe', 'expansion announced')],
               'annotation': 'Цифры сверху — только если они есть в тексте пресс-релиза (ИИ предлагает, цитата сверяется с текстом).'},
              {'c': 'divider'},
              T('[City], September 3, 2025 — Rapid Medical™ … [первый абзац пресс-релиза]', 'body', annotation='Текст — полный пресс-релиз, скопированный с оригинала: в начале «город, дата —», как в пресс-релизе (Upwork). Свой материал — можно копировать.'),
              {'c': 'media', 'kind': 'page', 'label': 'Full press release text — headings, quotes, About Rapid Medical', 'ratio': '16/9'}], 'm')
    related = {'c': 'section', 'pad': 'l', 'tone': 'surface', 'items': [S([H('More about DRIVEWIRE™', 3), {'c': 'divider'},
               feed_row('Jul 2026', 'News', 'Rapid Medical Announces FDA Clearance of DRIVEWIRE™ 35 and First Stroke Cases', 'BusinessWire'), {'c': 'divider'},
               feed_row('[дата]', 'Study', 'DRIVEWIRE™ 24 SVIN Poster', None)], 's')],
               'annotation': 'Внизу — другие материалы того же продукта (из записей, по полю «продукт»). Вместо тупика — следующий шаг.'}
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([{'c': 'link', 'text': '← News & Events'}, {'c': 'eyebrow', 'text': 'News · DRIVEWIRE™'},
            H('Rapid Medical™ Surpasses 1,000 Cases With DRIVEWIRE™ 24 in North America and Expands Into Europe', 1), {'c': 'divider'},
            {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1}, text]}], 'l')]}, related, FOOTER]


def event_past_new():
    left = S([line('Date', T('September 3, 2026', 'small')), {'c': 'divider'}, line('City', T('Marseille', 'small')), {'c': 'divider'},
              line('Congress', T('ESMINT', 'small')), {'c': 'divider'}, {'c': 'badge', 'text': 'This event has taken place'}], 's')
    right = S([{'c': 'media', 'kind': 'page', 'label': 'Event description (or recap and photos, if filled in)', 'ratio': '21/9'},
               H('Presented at this event', 4),
               S([feed_row('[дата]', 'Study', '[материалы, привязанные к событию — исследование, видео доклада]', None)], 's',
                 annotation='«Что представили»: материалы, привязанные к событию (ADR-009, идея из п. 6). Если ничего не привязано — блока нет.')], 'm')
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [S([{'c': 'link', 'text': '← Past events', 'annotation': 'Назад — на #past-events, а не на пустой якорь предстоящих (находка 21).'},
            {'c': 'eyebrow', 'text': 'Event · ESMINT'}, H('DRIVEWIRE™ 24 in Clinical Practice', 1),
            T('Real-World Experience from Two Perspectives with Dr. Rui de Carvalho and Dr. Markus Holtmannspötter', 'lead'), {'c': 'divider'},
            {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1}, right]}], 'l')]},
            {'c': 'section', 'pad': 'm', 'tone': 'surface', 'items': [S([T('No upcoming events right now.', 'body'), {'c': 'link', 'text': 'All news and events →'}], 's')]}, FOOTER]


# ---------- Choose location ----------
REGION_REFS = [
    {'title': 'Какой регион мой: страны под регионом',
     'ask': 'Решено 2026-11-14: страны под каждым регионом (из той же таблицы, что IP) и поиск по стране.',
     'refs': [('aws', 'AWS', 'регионы группами, под каждым — конкретные места', 'screens/4060282b-6ba4-4637-a9ad-cd62b591f25b'),
              ('hm', 'H&M', 'часть света раскрывается в список стран', 'screens/7765267e-dbed-488f-bc9b-84f76f26a446'),
              ('lululemon', 'lululemon', 'боковая панель: текущий выбор сверху, регионы раскрываются', 'screens/12f18935-81ee-4da0-ba09-4e9a356b70fe'),
              ('klook', 'Klook', 'поиск по стране и «Current selection» сверху', 'screens/2e39ace1-9e86-44f1-934e-a69ac802418d')]},
    {'title': 'Подсказка и простой выбор',
     'ask': 'Решено: одно модальное окно; из шапки — с текущим регионом сверху.',
     'refs': [('kiwi', 'Kiwi.com', '«Suggested region» сверху, ниже — все', 'screens/a1262f9f-69c0-4a8f-a3af-88b0376b93b8'),
              ('gemini', 'Gemini', 'одно поле «Country» и «Apply» — без списка регионов', 'screens/ba2a28e5-3c06-47c0-a6c2-6450617af3af')]},
]

HEADER_NONE = {'c': 'rm-header'}


def region_asis(phone=False):
    ex = None if phone else {1: {'annotation': 'Как есть: три кнопки — Americas · Asia & Pacific · Europe & Middle East — без стран. Под Europe & Middle East по коду (regionForCountry) живут ещё Австралия и Африка, а Ближний Восток и Турция по IP уходят в Asia & Pacific, Латинская Америка — в Americas. В подписях региона на сайте — «Europe, Middle East, Latin America & Australia». Врач из ОАЭ или Бразилии выбирает наугад. Карта «страна → регион» — вопрос к Emily (BACKLOG, решения №9).'}}
    return [HEADER_NONE, page('Choose location', None, ex), FOOTER]


def switcher_asis():
    return [dict(HEADER, switcherOpen=True, region='us',
                 annotation='Переключатель в шапке: тот же список из трёх названий, без стран. Видна только тем, кто уже на сайте; страницу выбора видят лишь те, чью страну не определили.'),
            page('Home', [0]), FOOTER]


def banner_asis():
    return [{'c': 'rm-regionBanner', 'suggested': 'us', 'annotation': 'Плашка, когда регион страницы и регион по IP разные (врач из США открыл ссылку коллеги из Европы): «It looks like you are in Americas…». Не перекидывает сама, скрывается на 30 дней.'},
            dict(HEADER, region='ous'), page('OUS · Large vessel stroke', [0]), FOOTER]


# ---------- Choose location — decided ----------
REGIONS = [
    ('Americas', 'United States, Canada, Mexico, Brazil, Argentina, Chile, Colombia, Peru and the rest of Latin America & the Caribbean', '28 countries'),
    ('Asia & Pacific', 'China, Japan, South Korea, India, Singapore, Malaysia, Thailand, Indonesia, Israel, Saudi Arabia, UAE, Qatar, Türkiye, Egypt…', '47 countries'),
    ('Europe & Middle East', 'Europe, Australia, New Zealand, Africa and all other countries', 'all others'),
]


def region_col(name, countries, count, hit=False):
    return {'c': 'box', 'border': True, 'pad': 'm', 'gap': 's', 'items': [
        {'c': 'row', 'justify': 'between', 'items': [H(name, 4), T(count, 'caption')]},
        T(countries, 'small'),
        {'c': 'button', 'v': 'primary' if hit else 'secondary', 'text': f'Go to {name} →', 'full': True}] + ([{'c': 'badge', 'text': 'United Arab Emirates is here', 'tone': 'info'}] if hit else [])}


def region_search(value=None):
    return I('Find your country', v='search', value=value, placeholder='Start typing, e.g. Brazil')


def region_modal(state='empty', current=None, phone=False):
    hit = state == 'search'
    cols = [region_col(n, c, k, hit and n == 'Asia & Pacific') for n, c, k in REGIONS]
    srch = region_search('United Arab' if hit else None)
    items = [T('Product availability and regulatory information differ by region. Pick the region you practice in.', 'muted')]
    if current:
        items.append({'c': 'row', 'justify': 'between', 'items': [S([T('Current region', 'caption'), T(current, 'strong')], 'xs'), {'c': 'badge', 'text': 'From your location', 'tone': 'neutral'}]})
    items.append(srch)
    items.append(S(cols, 'm') if phone else {'c': 'grid', 'cols': 3, 'gap': 'm', 'align': 'start', 'items': cols})
    m = {'c': 'modal', 'title': 'Choose your location', 'wide': True, 'items': items}
    if not phone and state == 'empty' and not current:
        m['annotation'] = ('Модалка вместо отдельной страницы: посетитель остаётся там, где был. Открывается только когда регион нужен — '
                           'клик по Therapies, Evidence, региональной ссылке — и страна по IP не определилась; при первом заходе не всплывает (заслон на входе раздражает). '
                           'Страны под регионом — из той же таблицы, что IP (regionForCountry); у последнего — «all other countries». '
                           'Страница /choose-your-location остаётся запасной: прямые ссылки, без JavaScript; noindex.')
    if hit and not phone:
        m['annotation'] = 'Поиск по стране подсвечивает её регион. Неочевидное: ОАЭ — в Asia & Pacific, не в «Europe & Middle East». Израиль (головной офис) по текущей таблице тоже там — вопрос к Emily.'
    if current and not phone:
        m['annotation'] = 'Из переключателя в шапке — то же окно, сверху текущий регион и откуда он (по IP или выбран). Выбор возвращает на ту же страницу в новом регионе (/api/region).'
    return m


def region_bg(region=None):
    return [dict(HEADER, region=region) if region else HEADER_NONE, page('Home', [0]), FOOTER]


# ---------- Careers ----------
CAREERS_REFS = [
    {'title': 'Страница карьеры: культура и вакансии на одной странице',
     'ask': 'Решено 2026-11-14: вакансии на Careers, /open-positions → редирект.',
     'refs': [('linear', 'Linear', '«Join us» и сразу список ролей по отделам, регион у каждой', 'sites/sections/b94b791e-21d7-46d0-95e8-cd3ec25fc5ee'),
              ('mixpanel', 'Mixpanel', 'заголовок, строка и «See open roles», ниже фото команды', 'sites/sections/c6860f1b-d4fa-4ba3-b498-443cf317abff'),
              ('braintrust', 'Braintrust', 'ценности и условия сеткой, внизу «Explore open roles»', 'sites/sections/bd36a1b9-baf7-4794-ae3b-28929b65d147')]},
    {'title': 'Список вакансий',
     'ask': 'Решено: из Spark Hire, по отделам, роль · город · Apply ↗.',
     'refs': [('upwork', 'Upwork', 'отдел крупно слева, вакансии и город справа — «общая линия»', 'sites/sections/cf9adcf9-daec-42d3-b942-1fd3152db0a4'),
              ('dropbox', 'Dropbox', 'отдел слева с описанием и числом вакансий', 'sites/sections/feb8fff1-fb42-4d02-ba14-ac0a25053b0b'),
              ('tines', 'Tines', 'группы по отделам, строка: роль, место, стрелка', 'sites/sections/930c8997-584e-424d-9ee6-645f7232ebe3')]},
    {'title': 'Когда вакансий нет',
     'ask': 'Решено: честная строка + общая заявка; кнопка в шапке меняется по числу вакансий.',
     'refs': [('lyssna', 'Lyssna', '«We currently have no open positions» + «Send us your details anyway»', 'sites/sections/bc7affd2-b934-4719-8d32-39e0ec690399'),
              ('jeton', 'Jeton', 'нет ролей — сразу «Spontaneous application»', 'sites/sections/658f06c7-2c20-4c09-a057-ff7bce698fe2'),
              ('intercom', 'Intercom', '«Don’t see the role?» — подписка на Talent Community', 'sites/sections/9075aadc-5725-4a46-945d-a4a303726f85')]},
]


def careers_asis(phone=False):
    ex = None if phone else {
        0: {'annotation': 'Кнопка «View open positions» видна и при 0 вакансий и ведёт на пустую страницу (находка 5): первое действие — тупик.'},
        2: {'annotation': '5 принципов показаны дважды: картинкой «WE ARE RAPID» и текстом под ней.'},
        3: {'annotation': 'Форма «Submit general interest» — та же, что для клиентов: Organization, тема, нет поля для CV или LinkedIn (находка 20). HR при этом ведёт кандидатов в Spark Hire (на Duda был его виджет на /open-positions) — на сайте ссылки туда нет.'}}
    return [HEADER, page('Careers', None, ex), FOOTER]


def openpos_asis():
    return [HEADER, page('Open positions', None, {1: {'annotation': 'Как есть: «Join us» и строка «There are no open positions right now» со ссылкой на общую заявку. Вакансии на новом сайте — своя таблица в админке (0 записей), а HR ведёт их в Spark Hire: на Duda здесь стоял его виджет (Comeet). Две системы — двойной ввод.'}}), FOOTER]


# ---------- Careers — decided ----------
ROLES = [('Clinical', [('Clinical Specialist', 'Texas, US'), ('Clinical Specialist', 'Germany'), ('Clinical Education Manager', 'Remote, US')]),
         ('Sales', [('Territory Manager', 'California, US'), ('Territory Manager', 'Florida, US')]),
         ('Operations', [('Customer Service Representative', 'Yokneam, Israel'), ('Quality Engineer', 'Yokneam, Israel')]),
         ('R&D', [('R&D Engineer', 'Yokneam, Israel'), ('Regulatory Affairs Specialist', 'Yokneam, Israel')])]
ROLES_LIMIT = 6
EEO = RM['Careers'][3]['data'].get('note', '')


def role_row(title, place):
    return {'c': 'grid', 'cols': 'minmax(0,1fr) 180px 90px', 'gap': 'm', 'items': [T(title, 'strong'), T(place, 'small'), {'c': 'link', 'text': 'Apply ↗'}]}


def roles_block(state, phone=False):
    if state == 'empty':
        right = S([T('No open positions right now.', 'strong'),
                   T('We still read every application — send us your details below and we’ll be in touch when a role fits.', 'body'),
                   {'c': 'link', 'text': 'Send us your details ↓'}], 's',
                  annotation=None if phone else 'Вакансий нет — честная строка и сразу путь к общей заявке (Lyssna, Jeton). Секция не пропадает: кандидат видит, что смотрел туда, куда нужно.')
    else:
        total = sum(len(i) for _, i in ROLES)
        filters = {'c': 'row', 'gap': 'm', 'wrap': True, 'align': 'center', 'items': [
            {'c': 'chips', 'items': ['All'] + [d for d, _ in ROLES], 'active': 0},
            {'c': 'input', 'v': 'select', 'value': 'All locations'}]}
        rows, shown = [], 0
        for dept, items in ROLES:
            take = items[:max(0, ROLES_LIMIT - shown)]
            if not take: break
            rows += [T(dept, 'caption')] + sum([[role_row(t, pl), {'c': 'divider'}] for t, pl in take], [])
            shown += len(take)
        more = {'c': 'button', 'v': 'secondary', 'text': f'Show all {total} roles', 'full': True}
        right = S([filters] + rows + [more, T('Applications go through Spark Hire.', 'caption')], 's',
                  annotation=None if phone else f'Вакансии — из Spark Hire (там их ведёт HR), без второй таблицы в админке. Фильтры — отдел (чипы) и город. Показываем первые {ROLES_LIMIT}, остальные — по кнопке «Show all {total} roles». Строка: роль · город · «Apply ↗» (Upwork, Tines); заявка — в Spark Hire. Подключение (API / виджет / ссылка) — вопрос к Emily (BACKLOG №22). Роли на экране — пример.')
    left = S([H('Open positions', 2), T(f"{sum(len(i) for _, i in ROLES)} roles" if state != 'empty' else '0 roles', 'caption')], 'xs')
    if phone:
        return S([left, right], 'm')
    return {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1}, right]}


def candidate_form(phone=False):
    fields = [{'c': 'chips', 'label': 'Area of interest', 'items': ['General interest', 'Internship', 'Other'], 'active': 0}]
    pair = lambda a, b: [a, b] if phone else [G([a, b])]
    fields += pair(I('First name', required=True), I('Last name', required=True))
    fields += pair(I('Email', required=True), I('LinkedIn or CV link', placeholder='https://'))
    fields += [I('Country', v='select', value='United States'), {'c': 'textarea', 'label': 'Message', 'placeholder': 'What would you like to work on?'},
               S([{'c': 'button', 'v': 'primary', 'text': 'Send', 'full': True}, T('By sending, you agree to our Privacy Statement.', 'caption')], 's')]
    form = S(fields, 'm', annotation=None if phone else 'Форма для кандидатов, а не для клиентов (находка 20): без Organization и темы-заказа; вместо резюме-файла — ссылка на LinkedIn или CV. Правила полей — DESIGN.md → Формы. Куда уходит: в почту HR или в Spark Hire — уточнить вместе с подключением.')
    left = S([H('Submit general interest', 2), T('Rapid Medical is an equal opportunity employer.', 'small'), {'c': 'link', 'text': 'Read our EEO statement'}], 's',
             annotation=None if phone else 'Длинный текст EEO — свернут под ссылку: он обязателен, но не должен стоять стеной перед формой.')
    if phone:
        return S([left, form], 'm')
    return {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [left, {'c': 'spacer', 'size': 1}, form]}


def careers_new(state='roles', phone=False):
    cta = {'label': 'See open positions ↓', 'href': '#open-positions'} if state != 'empty' else {'label': 'Send us your details ↓', 'href': '#general-interest'}
    hero = dict(rm('Careers', 0, cta=cta), **({} if phone else {'annotation': 'Кнопка в шапке зависит от вакансий: есть — «See open positions ↓», нет — «Send us your details ↓». Тупика нет (находка 5).'}))
    quotes = rm('Careers', 1)
    principles = dict(rm('Careers', 2, imageUrl=None), **({} if phone else {'annotation': 'Принципы — один раз, текстом; картинка «WE ARE RAPID» с теми же словами убрана.'}))
    pad = 'm' if phone else 'l'
    return [HEADER, {'c': 'rm-page', 'items': [hero, quotes, principles]},
            {'c': 'section', 'pad': pad, 'rule': True, 'items': [dict(roles_block(state, phone), **({} if phone else {}))]},
            {'c': 'section', 'pad': pad, 'items': [candidate_form(phone)]}, FOOTER]


# ---------- About ----------
ABOUT_REFS = [
    {'title': 'Кто мы: текст и факты рядом',
     'ask': 'Решено 2026-11-14: факты слева, текст справа — «общая линия».',
     'refs': [('customerio', 'Customer.io', 'слева колонка цифр, справа «Who we are / How we got started» — «общая линия»', 'sites/sections/24205429-b78e-4d31-9572-0f87504ad25e'),
              ('faire', 'Faire', 'миссия одной крупной фразой на цветной полосе', 'sites/sections/1af96634-4256-4df0-ab2c-c84f33987abe')]},
    {'title': 'Руководство',
     'ask': 'Решено: обычный регистр, 2 строки био и «Read full bio»; совет директоров — по желанию клиента.',
     'refs': [('intercom', 'Intercom', 'фото, имя и должность, 2–3 строки био и «Read full bio»', 'sites/sections/fc292fd5-ab37-469b-b09b-dc378471521c'),
              ('airtable', 'Airtable', 'фото слева, имя, должность и биография рядом — читается без кликов', 'sites/sections/f347c49c-ac6c-4d2f-82ad-71da28f862ff'),
              ('handshake', 'Handshake', '«Leadership team» и «Board of Directors» — двумя группами', 'sites/sections/9af80987-35e3-46e8-b87d-7a6b0fbd3848')]},
    {'title': 'Офисы',
     'ask': 'Решено: офисы один раз карточками; карта — без кликов по регионам, кнопка в Contact Us.',
     'refs': [('sprout', 'Sprout Social', 'карточка офиса: фото, адрес, «Get directions»', 'sites/sections/f66a1541-7699-42a2-9780-671650c24115'),
              ('slack', 'Slack', 'карточки офисов с адресом и «Get directions»', 'sites/sections/8fa14376-c626-4c19-941c-3bf77f0d64db'),
              ('upwork', 'Upwork', 'кусочек карты у каждого офиса вместо общей карты', 'sites/sections/6579e166-e646-46d2-8745-554a7096c506')]},
]


def about_asis(phone=False):
    ex = None if phone else {
        1: {'annotation': 'Вводный текст и «What we do» — два коротких абзаца друг под другом; фактов о компании (страны, публикации, офисы) рядом нет. На странице две аудитории — врачи и инвесторы (письмо Emily 30.10).'},
        3: {'annotation': 'Руководство: 6 карточек, имена и должности КАПСОМ (так в данных с Duda), биография — по «Read bio» на месте; у карточки якорь #{slug}.'},
        4: {'annotation': 'Офисы показаны дважды: этим списком и пинами на карте ниже.'},
        5: {'annotation': 'Карта: клик по региону → Contact Us со своей картой регионов: Латинская Америка → Europe, Ближний Восток → Asia & Pacific; а определение по IP шлёт Латинскую Америку в Americas. Третья карта регионов на сайте (вопрос №9).'}}
    return [HEADER, page('About', None, ex), FOOTER]


# ---------- About — decided ----------
import html as _html
MEMBERS = RM['About'][3]['data']['members']


def tcase(s):
    keep = {'CEO', 'CFO', 'CTO', '&'}
    return ' '.join(w if w in keep else w.capitalize() for w in s.split())


def bio2(m):
    t = _html.unescape(re.sub(r'<[^>]+>', ' ', m.get('bioHtml') or '')).split('. ')
    return '. '.join(t[:2]).strip()[:210] + '…'


def person(m, phone=False):
    return S([{'c': 'media', 'kind': 'photo', 'label': tcase(m['name']), 'ratio': '1/1'},
              S([T(tcase(m['name']).replace('Dr. ', 'Dr. '), 'strong'), T(tcase(m['title']), 'small')], 'xs'),
              T(bio2(m), 'small'), {'c': 'link', 'text': 'Read full bio'}], 's')


def about_new(phone=False):
    facts = S([line('Countries', T('30+', 'strong')), {'c': 'divider'}, line('Clinical publications', T('102+', 'strong')), {'c': 'divider'},
               line('Offices', T('Israel · USA · Germany', 'small')), {'c': 'divider'}, line('Headquarters', T('Yokneam, Israel', 'small'))], 's',
              annotation=None if phone else 'Факты о компании — таблицей «ключ — значение» слева (Customer.io). Только то, что уже есть на сайте: «30+ countries» (подпись карты), «102+ clinical publications» (Evidence), офисы (Contact details). Для инвесторов и врачей — одним взглядом.')
    text = S([T(RM['About'][1]['data']['body'], 'lead'), H('What we do', 4), T(RM['About'][2]['data']['body'], 'body')], 'm')
    intro = S([H('About Us', 1), {'c': 'divider'}, text, facts] if phone else
              [H('About Us', 1), {'c': 'divider', 'annotation': '«Общая линия», как на остальных страницах: заголовок, линия, факты слева (4/12), текст справа (7/12).'},
               {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [facts, {'c': 'spacer', 'size': 1}, text]}], 'l')
    people = [person(m, phone) for m in MEMBERS]
    lead = S([H('Leadership Team', 2), T(RM['About'][3]['data']['intro'], 'muted')], 's')
    team_grid = S(people, 'l') if phone else {'c': 'grid', 'cols': 3, 'gap': 'm', 'align': 'start', 'items': people,
                                              'annotation': 'Обычный регистр вместо КАПСА (данные с Duda). 2 строки биографии сразу, «Read full bio» раскрывает на месте (Intercom), якорь #{slug} — как сейчас. Совет директоров отдельной группой — только если клиент захочет (вопрос к Emily).'}
    offices = []
    for o in OFFICES:
        offices.append({'c': 'box', 'border': True, 'pad': 'm', 'gap': 's', 'items': [
            S([T(o['label'] if o['label'] != 'Headquarters' else 'Headquarters · Israel', 'caption'), T(o['name'], 'strong')], 'xs'),
            T(o['address'].replace('\n', ', '), 'small'),
            line('Phone', {'c': 'link', 'text': o['phone']}), line('Orders', T(o['ordersEmail'], 'small')),
            {'c': 'link', 'text': 'Get directions ↗'}]})
    off = S([H('Offices', 2), S(offices, 'm') if phone else dict({'c': 'grid', 'cols': 3, 'gap': 'm', 'align': 'start', 'items': offices},
                                                                annotation='Офисы — один раз, карточками: адрес, телефон, почта заказов, «Get directions» (Slack, Sprout). Те же данные, что на Contact Us (Settings → Contact details).')], 'm')
    footprint = S([H(RM['About'][5]['data']['title'], 3),
                   {'c': 'media', 'kind': 'map', 'label': 'World map · 30+ countries · 3 offices (без кликов по регионам)', 'ratio': '21/9'},
                   {'c': 'row', 'gap': 'm', 'align': 'center', 'items': [T('Have a question?', 'body'), {'c': 'button', 'v': 'primary', 'text': 'Contact a local representative'}]}], 'm',
                  annotation=None if phone else 'Карта — картинка присутствия, без кликов по регионам: у неё была своя, третья разбивка стран по регионам. Кнопка ведёт в Contact Us, где регион выводится из страны — одна таблица на весь сайт.')
    pad = 'm' if phone else 'l'
    return [HEADER, {'c': 'section', 'pad': pad, 'items': [intro]},
            {'c': 'section', 'pad': pad, 'rule': True, 'items': [S([lead, team_grid], 'l')]},
            {'c': 'section', 'pad': pad, 'tone': 'surface', 'items': [off]},
            {'c': 'section', 'pad': pad, 'items': [footprint]}, FOOTER]


# ---------- Webinars ----------
WEB_REFS = [
    {'title': 'Библиотека: фильтр слева, карточки справа',
     'ask': 'Сейчас 5 вебинаров карточками и форма внизу. Нужен фильтр по продукту? Что на карточке?',
     'refs': [('userinterviews', 'User Interviews', 'поиск и темы слева, карточки справа — «общая линия»', 'sites/sections/ca4e36d8-5a71-41fc-a17e-b2d106d34126'),
              ('oyster', 'Oyster', 'фильтр по теме слева, у карточки — описание и «Watch now»', 'sites/sections/4a9f0301-d603-4fab-bebb-008fb213c31f'),
              ('kajabi', 'Kajabi', 'на карточке тема, длительность, спикер и одна кнопка', 'sites/sections/cc30df19-bc09-4491-a139-42ae6524375f'),
              ('clickup', 'ClickUp', 'метка «On-Demand» и «Presented by»', 'sites/sections/c3b04978-d152-4295-86a3-36cfaef01f5e')]},
    {'title': 'Доступ к записи',
     'ask': 'Сейчас: форма внизу страницы, запись присылают вручную. Форма рядом с выбранным вебинаром (окном) — или запись сразу после формы?',
     'refs': [('kajabi-gate', 'Kajabi', 'видео и короткая форма на одном экране', 'screens/49984db1-8dab-4c27-b4bf-55d2d678850d'),
              ('vimeo', 'Vimeo', 'форма перед видео: email → смотреть сразу', 'screens/b5411913-35bb-4c59-b13c-7a978b2c5f1d')]},
]


def webinars_asis(phone=False):
    ex = None if phone else {
        1: {'annotation': 'Карточки: продукт, название, спикер, событие. В коде уже есть «Request this recording» на карточке — выбирает вебинар в форме и прокручивает к ней (параллельная сессия, 2026-11-13); снимок — до этого.'},
        2: {'annotation': 'Форма внизу страницы, выбор вебинара — список «Which webinar?». Запись присылают вручную после заявки. Вебинаров нет в меню — попасть можно только со страниц терапий (site-ia, вопрос 4); в APAC вебинаров на Duda не было (№14).'}}
    return [HEADER, page('US · Webinars', None, ex), FOOTER]


# ---------- Evidence ----------
def evidence_asis(phone=False):
    ex = None if phone else {
        0: {'annotation': 'Шапка с видео и абзацем «Clinical & scientific research play a pivotal role…» — первый экран без единого факта.'},
        1: {'annotation': 'Счётчик «85+ clinical publications» (в базе 102) и карусель featured — до 6.'},
        2: {'annotation': '«Featured publications» на деле — 3 последние с картинкой; показывает те же статьи, что карусель выше (находка 16).'},
        3: {'annotation': 'Browse by product — вкладки по продуктам, внутри — строки: месяц, заголовок, ДЛИННЫЙ список авторов · журнал (часто пустой), «Read» / «Download PDF». 57 статей у COMANECI, 28 у TIGERTRIEVER — без поиска, фильтров, типа исследования и вывода. Чтобы понять, о чём статья, нужно уйти в журнал. Клиент на звонке: «в таком виде Evidence никто читать не будет».'}}
    return [HEADER, page('US · Evidence', None, ex), FOOTER]


EV_REFS = [
    {'title': 'Конкуренты в нейроваскулярке',
     'ask': 'Лучший — Terumo: у каждого исследования своя страница с цифрами, регион и IFU. Stryker и Medtronic — главные цифры прямо на странице продукта. Penumbra — фильтры, но без цифр.',
     'refs': [('terumo-study', 'Terumo Neuro · WISE', 'страница исследования: вывод, пациенты / центры / страны, цифры по подгруппам, PDF, IFU по региону', 'https://www.terumoneuro.com/clinical-studies/web-wise-ruptured', 'png'),
              ('terumo', 'Terumo Neuro · Clinical studies', 'по терапевтическим областям, переключатель региона, счётчики с расшифровкой', 'https://www.terumoneuro.com/clinical-studies', 'png'),
              ('stryker', 'Stryker · Trevo NXT', '«7,000+ patients…», ключевые исследования с главной цифрой (DAWN 49% vs 13%)', 'https://www.stryker.com/us/en/neurovascular/products/trevo-nxt.html', 'png'),
              ('medtronic', 'Medtronic · Solitaire', 'три крупные цифры и сноски с определениями (минус: без N)', 'https://www.medtronic.com/us-en/healthcare-professionals/products/neurological/revascularization-stroke/solitaire/clinical-evidence.html', 'png'),
              ('penumbra', 'Penumbra', 'фильтры по области и показанию; в карточке дизайн, но нет цифр', 'https://www.penumbrainc.com/clinical-evidence/', 'png')]},
    {'title': 'Смежные области: лучшие образцы',
     'ask': 'Shockwave — фильтры по нескольким осям и страница исследования. iRhythm — группировка по клиническим вопросам и «вывод сначала».',
     'refs': [('shockwave', 'Shockwave Medical', 'поиск и фильтры слева (показание, продукт, специальность), «1–9 of 14», сортировка', 'https://shockwavemedical.com/clinical-evidence/', 'png'),
              ('shockwave-study', 'Shockwave · DISRUPT CAD III', 'дизайн, N / центры, конечные точки, панель цифр, слайды, видео с PI', 'https://shockwavemedical.com/clinical-evidence/disrupt-cad-iii/', 'png'),
              ('irhythm', 'iRhythm · Clinical library', 'по клиническим вопросам; запись — вывод, главный результат, дизайн, DOI; архив отдельно', 'https://www.irhythmtech.com/providers/evidence', 'png')]},
    {'title': 'Как выглядят библиотеки публикаций (Mobbin)',
     'ask': 'Строки, а не карточки; поиск и метки темы; рядом — вывод одной фразой.',
     'refs': [('anthropic', 'Anthropic', 'поиск, темы чипами, строка: название · тема · дата', 'sites/sections/d5bb06da-6fc9-42c0-a989-28c0b7321375'),
              ('openai', 'OpenAI Research', 'главное крупно, ниже «Browse» со счётчиком, фильтром и сортировкой', 'sites/sections/fec07fec-5de6-4678-bbb9-07b4f959a610'),
              ('elicit', 'Elicit', 'рядом со статьёй — краткое резюме, год, цитирования, DOI', 'screens/1be3720e-ed88-4617-8a2d-c967ba92ade9'),
              ('duolingo', 'Duolingo Research', 'миниатюра ключевого рисунка рядом со статьёй', 'sites/sections/1b97ab59-a471-4768-b849-dc51a162b6b6')]},
]


def badge_row(items):
    return {'c': 'row', 'gap': 's', 'wrap': True, 'items': [{'c': 'badge', 'text': t, 'tone': tone} for t, tone in items]}


def key_study(name, design, n, result, sub, prod):
    return {'c': 'box', 'border': True, 'pad': 'm', 'gap': 's', 'items': [
        {'c': 'row', 'justify': 'between', 'items': [T(prod, 'caption'), {'c': 'badge', 'text': design, 'tone': 'info'}]},
        H(name, 4), T(n, 'small'), {'c': 'stat', 'value': result, 'label': sub}, {'c': 'link', 'text': 'Study page →'}]}


def pub_row(year, title, tldr, badges):
    return {'c': 'grid', 'cols': '80px minmax(0,1fr) 120px', 'gap': 'm', 'items': [
        T(year, 'small'), S([T(title, 'strong'), T(tldr, 'small'), badge_row(badges)], 'xs'), S([{'c': 'link', 'text': 'PDF'}, {'c': 'link', 'text': 'Journal ↗'}], 'xs')]}


def evidence_concept():
    facts = S([line('Publications', T('102', 'strong')), {'c': 'divider'}, line('Randomized trials', T('1 (DISTALS)', 'small')), {'c': 'divider'},
               line('Prospective multicenter', T('[N] in classified', 'small')), {'c': 'divider'}, line('Patients', T('[N] in classified studies', 'small'))], 's',
              annotation='Счётчик с расшифровкой вместо «85+»: публикации, RCT, проспективные, пациенты (Terumo, Stryker). Числа — из разметки; пока размечены не все, подпись «in classified», чтобы цифра не вводила в заблуждение.')
    head = S([{'c': 'eyebrow', 'text': 'Americas · change'}, H('Evidence', 1), {'c': 'divider'},
              {'c': 'grid', 'cols': '4fr 1fr 7fr', 'gap': 'm', 'align': 'start', 'items': [facts, {'c': 'spacer', 'size': 1},
               T('Clinical data behind TIGERTRIEVER™, COMANECI™ and DRIVEWIRE™ — key studies first, every publication below.', 'lead')]}], 'l')
    keys = {'c': 'grid', 'cols': 4, 'gap': 'm', 'align': 'start', 'items': [
        key_study('DISTALS', 'RCT', '98 randomized · FDA IDE', '86.3% vs 27.7%', 'reperfusion at 24 h without sICH', 'TIGERTRIEVER™ 13 · MeVO'),
        key_study('SUCCESS', 'Prospective, multicenter', '90 patients · 17 US centers', '95%', 'occlusion at 6 months', 'COMANECI™ · wide-neck aneurysms'),
        key_study('TIGER', 'Prospective, multicenter', '[N · центры — из публикации]', '[главная цифра]', '[конечная точка]', 'TIGERTRIEVER™ · LVO'),
        key_study('Meta-analysis', 'Meta-analysis', '[N исследований / пациентов]', '[главная цифра]', 'reperfusion vs self-expanding stent retrievers', 'TIGERTRIEVER™ · LVO')],
        'annotation': 'Уровень 1 — ключевые исследования (5–10): карточка с бейджем дизайна, N, главной цифрой и ссылкой на страницу исследования («страница из документа»). Как у iRhythm, Stryker, Terumo. Выбирает маркетинг (featured). Цифры — из одобренных материалов (MLR).'}
    questions = {'c': 'grid', 'cols': 4, 'gap': 'm', 'align': 'start', 'items': [
        {'c': 'card', 'eyebrow': '32 publications', 'title': 'Large vessel occlusion', 'text': 'TIGERTRIEVER™ · reperfusion, first pass, vs stent retrievers'},
        {'c': 'card', 'eyebrow': '8 publications', 'title': 'Medium & distal vessels', 'text': 'TIGERTRIEVER™ 13 · DISTALS and MeVO experience'},
        {'c': 'card', 'eyebrow': '57 publications', 'title': 'Aneurysms & vasospasm', 'text': 'COMANECI™ · wide-neck coiling, vasospasm angioplasty'},
        {'c': 'card', 'eyebrow': '5 publications', 'title': 'Access & navigation', 'text': 'DRIVEWIRE™ · guidewire experience'}],
        'annotation': 'Вход по клиническому вопросу, а не только по продукту (iRhythm, Terumo): врач ищет «что есть по MeVO», а не «вкладку TIGERTRIEVER 13». Клик — архив с этим фильтром. Числа — живые, из базы.'}
    lib_filters = {'c': 'row', 'gap': 's', 'wrap': True, 'align': 'center', 'items': [
        I('', v='search', placeholder='Search title, author, journal'), {'c': 'input', 'v': 'select', 'value': 'All products'},
        {'c': 'input', 'v': 'select', 'value': 'All indications'}, {'c': 'input', 'v': 'select', 'value': 'All study types'}, {'c': 'input', 'v': 'select', 'value': 'Newest first'}]}
    rows = [pub_row('2026', 'Radially adjustable Tigertriever demonstrates higher reperfusion compared to self-expanding stent-retrievers…',
                    '[Вывод одной фразой — ИИ-черновик, утверждает MLR]', [('Meta-analysis', 'info'), ('LVO', 'neutral'), ('TIGERTRIEVER™', 'neutral')]),
            {'c': 'divider'},
            pub_row('2025', 'Comaneci-assisted embolization of wide-necked aneurysms: results from the SUCCESS post market US study',
                    'High rate of aneurysm occlusion with Comaneci in wide-neck aneurysms, sustained at 6 months.', [('Prospective, multicenter', 'info'), ('N = 90', 'neutral'), ('COMANECI™', 'neutral')]),
            {'c': 'divider'},
            pub_row('2025', 'Advancing beyond recent randomized controlled trials: Role of Tigertriever13 for distal medium vessel occlusion',
                    '[Вывод одной фразой]', [('Review', 'info'), ('MeVO', 'neutral'), ('TIGERTRIEVER™ 13', 'neutral')]),
            {'c': 'divider'},
            {'c': 'grid', 'cols': '80px minmax(0,1fr) 120px', 'gap': 'm', 'items': [T('2024', 'small'), S([T('Using The Comaneci Temporary Assist Device to Expand a Partially Expanded Flow Diverting Stent', 'strong'),
                T('[First author] et al. · [journal] · 2024', 'small'), badge_row([('COMANECI™', 'neutral')])], 'xs',
                annotation='Неразмеченная публикация (разметка по желанию): вместо вывода — «первый автор et al. · журнал · год», из бейджей — только продукт (он есть у всех). Строка аккуратная, просто беднее.'),
                S([{'c': 'link', 'text': 'Journal ↗'}], 'xs')]},
            {'c': 'divider'},
            {'c': 'row', 'gap': 's', 'items': [T('74 publications not yet classified are hidden by the study-type filter.', 'caption'), {'c': 'link', 'text': 'Show them'}],
             'annotation': 'Фильтры по типу и показанию видят только размеченные — честная строка с числом и «Show them», чтобы ничего не терялось молча.'}]
    lib = S([{'c': 'row', 'justify': 'between', 'items': [H('All publications', 2), T('Showing 1–20 of 102', 'caption')]}, lib_filters] + rows + [{'c': 'button', 'v': 'secondary', 'text': 'Show more', 'full': True}], 'm',
            annotation='Уровень 2 — архив: поиск и фильтры по продукту, показанию, типу исследования, сортировка, счётчик (Shockwave). Строка: год · заголовок · вывод одной фразой (Semantic Scholar TLDR) · бейджи: дизайн, N, показание, продукт · PDF / журнал. Авторы — на странице статьи, не в списке. Пресс-релизы из списка уходят в новости (ADR-009: вид материала).')
    ongoing = S([H('Ongoing studies', 3), T('[Идущие исследования — например, исследование когнитивных исходов тромбэктомии (новость, янв. 2025); список — от клиента]', 'small')], 's',
                annotation='Текущие исследования — сигнал для инвесторов (WATCHMAN «Active trials»). Только если клиент готов показывать.')
    return [HEADER, {'c': 'section', 'pad': 'l', 'items': [head]},
            {'c': 'section', 'pad': 'l', 'tone': 'surface', 'items': [S([H('Key studies', 2), keys], 'm')]},
            {'c': 'section', 'pad': 'l', 'items': [S([H('Explore by clinical question', 2), questions], 'm')]},
            {'c': 'section', 'pad': 'l', 'rule': True, 'items': [lib]},
            {'c': 'section', 'pad': 'm', 'tone': 'surface', 'items': [ongoing]}, FOOTER]


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
        {'title': '2a · Создать из документа: статистика сверху, полный текст ниже (исследования и новости)', 'screens': ['imp-new', 'imp-prompt', 'imp-review', 'study-full']},
        {'title': '3 · News & Events — как есть', 'screens': ['news-asis', 'news-asis-phone', 'event-past-asis']},
        {'title': '3 · News & Events — примеры из Mobbin', 'screens': ['news-mobbin']},
        {'title': '3 · News & Events — решение (закрыта 2026-11-14)', 'screens': ['news-new', 'news-new-upcoming', 'news-new-phone', 'news-page', 'event-past-new']},
        {'title': '4 · Выбор региона — как есть', 'screens': ['region-asis', 'region-asis-phone', 'region-switcher-asis', 'region-banner-asis']},
        {'title': '4 · Выбор региона — примеры из Mobbin', 'screens': ['region-mobbin']},
        {'title': '4 · Выбор региона — решение (закрыта 2026-11-14)', 'screens': ['region-new', 'region-new-search', 'region-new-phone', 'region-switcher-new']},
        {'title': '5 · Careers и вакансии — как есть', 'screens': ['careers-asis', 'careers-asis-phone', 'openpos-asis']},
        {'title': '5 · Careers и вакансии — примеры из Mobbin', 'screens': ['careers-mobbin']},
        {'title': '5 · Careers — решение (закрыта 2026-11-14)', 'screens': ['careers-new', 'careers-new-empty', 'careers-new-phone']},
        {'title': '6 · About — как есть', 'screens': ['about-asis', 'about-asis-phone']},
        {'title': '6 · About — примеры из Mobbin', 'screens': ['about-mobbin']},
        {'title': '6 · About — решение (закрыта 2026-11-14)', 'screens': ['about-new', 'about-new-phone']},
        {'title': '7 · Webinars — как есть', 'screens': ['web-asis', 'web-asis-phone']},
        {'title': '7 · Webinars — примеры из Mobbin', 'screens': ['web-mobbin']},
        {'title': '8 · Evidence — как есть', 'screens': ['ev-asis', 'ev-asis-phone']},
        {'title': '8 · Evidence — конкуренты, смежные области, Mobbin', 'screens': ['ev-refs']},
        {'title': '8 · Evidence — черновик концепции (к обсуждению)', 'screens': ['ev-concept']},
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
              {'from': 'study-full', 'to': 'news-asis', 'label': 'следующая страница'},

              {'from': 'news-asis', 'to': 'news-asis-phone', 'label': 'на телефоне'},
              {'from': 'news-asis', 'to': 'event-past-asis', 'label': 'прошедшее событие'},
              {'from': 'event-past-asis', 'to': 'news-mobbin', 'label': 'как у других'},
              {'from': 'news-mobbin', 'to': 'news-new', 'label': 'решение'},
              {'from': 'news-new', 'to': 'news-new-upcoming', 'label': 'когда есть события'},
              {'from': 'news-new', 'to': 'news-new-phone', 'label': 'на телефоне'},
              {'from': 'event-past-new', 'to': 'region-asis', 'label': 'следующая страница'},
              {'from': 'region-asis', 'to': 'region-asis-phone', 'label': 'на телефоне'},
              {'from': 'region-asis', 'to': 'region-switcher-asis', 'label': 'переключатель в шапке'},
              {'from': 'region-switcher-asis', 'to': 'region-banner-asis', 'label': 'чужой регион по ссылке'},
              {'from': 'region-banner-asis', 'to': 'region-mobbin', 'label': 'как у других'},
              {'from': 'region-mobbin', 'to': 'region-new', 'label': 'решение'},
              {'from': 'region-new', 'to': 'region-new-search', 'label': 'поиск страны'},
              {'from': 'region-new', 'to': 'region-new-phone', 'label': 'на телефоне'},
              {'from': 'region-new', 'to': 'region-switcher-new', 'label': 'то же в шапке'},
              {'from': 'region-switcher-new', 'to': 'careers-asis', 'label': 'следующая страница'},
              {'from': 'careers-asis', 'to': 'careers-asis-phone', 'label': 'на телефоне'},
              {'from': 'careers-asis', 'to': 'openpos-asis', 'label': 'View open positions'},
              {'from': 'openpos-asis', 'to': 'careers-mobbin', 'label': 'как у других'},
              {'from': 'careers-mobbin', 'to': 'careers-new', 'label': 'решение'},
              {'from': 'careers-new', 'to': 'careers-new-empty', 'label': 'вакансий нет'},
              {'from': 'careers-new', 'to': 'careers-new-phone', 'label': 'на телефоне'},
              {'from': 'careers-new-phone', 'to': 'about-asis', 'label': 'следующая страница'},
              {'from': 'about-asis', 'to': 'about-asis-phone', 'label': 'на телефоне'},
              {'from': 'about-asis-phone', 'to': 'about-mobbin', 'label': 'как у других'},
              {'from': 'about-mobbin', 'to': 'about-new', 'label': 'решение'},
              {'from': 'about-new', 'to': 'about-new-phone', 'label': 'на телефоне'},
              {'from': 'about-new-phone', 'to': 'web-asis', 'label': 'следующая страница'},
              {'from': 'web-asis', 'to': 'web-asis-phone', 'label': 'на телефоне'},
              {'from': 'web-asis-phone', 'to': 'web-mobbin', 'label': 'как у других'},
              {'from': 'web-mobbin', 'to': 'ev-asis', 'label': 'следующая страница'},
              {'from': 'ev-asis', 'to': 'ev-asis-phone', 'label': 'на телефоне'},
              {'from': 'ev-asis-phone', 'to': 'ev-refs', 'label': 'как у других'},
              {'from': 'ev-refs', 'to': 'ev-concept', 'label': 'черновик'},
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
        {'id': 'news-asis', 'title': 'News & Events · as is', 'url': 'rapid-medical.com/news-events', 'body': news_events_asis()},
        {'id': 'news-asis-phone', 'title': 'News & Events · as is, phone', 'device': 'mobile', 'url': 'rapid-medical.com/news-events', 'body': news_events_asis(True),
         'notes': ['Телефон: карусель листается пальцем, лента по годам длинная (53 новости, «Show more»), архив событий — в самом низу.']},
        {'id': 'event-past-asis', 'title': 'Past event · as is', 'url': 'rapid-medical.com/events/drivewire-24-esmint-2026', 'body': event_past()},
        ref_screen('news-mobbin', 'News & Events · examples from Mobbin', 'news', NEWS_REFS),
        {'id': 'news-new', 'title': 'News & Events · decided', 'url': 'rapid-medical.com/news-events', 'body': news_events_new('none')},
        {'id': 'news-new-upcoming', 'title': 'News & Events · decided, with an upcoming event', 'url': 'rapid-medical.com/news-events', 'body': news_events_new('upcoming')},
        {'id': 'news-new-phone', 'title': 'News & Events · decided, phone', 'device': 'mobile', 'url': 'rapid-medical.com/news-events', 'body': news_events_new('none', True),
         'notes': ['Телефон: заголовок, главная карточка, 3 строки, события, фильтр чипами (прокручивается вбок), лента, архив. Секции — одной колонкой: название над содержимым.']},
        {'id': 'news-page', 'title': 'News page · decided', 'url': 'rapid-medical.com/news/drivewire-24-1000-cases', 'body': news_article()},
        {'id': 'event-past-new', 'title': 'Past event · decided', 'url': 'rapid-medical.com/events/drivewire-24-esmint-2026', 'body': event_past_new()},
        {'id': 'region-asis', 'title': 'Choose location · as is', 'url': 'rapid-medical.com/choose-your-location', 'height': 760, 'body': region_asis()},
        {'id': 'region-asis-phone', 'title': 'Choose location · as is, phone', 'device': 'mobile', 'url': 'rapid-medical.com/choose-your-location', 'body': region_asis(True)},
        {'id': 'region-switcher-asis', 'title': 'Region switcher in the header · as is', 'url': 'rapid-medical.com/us', 'height': 620, 'body': switcher_asis()},
        {'id': 'region-banner-asis', 'title': 'Other region by a link · as is', 'url': 'rapid-medical.com/ous/therapies/lvo', 'height': 620, 'body': banner_asis()},
        ref_screen('region-mobbin', 'Choose location · examples from Mobbin', 'region', REGION_REFS),
        {'id': 'region-new', 'title': 'Choose location · decided, modal', 'url': 'rapid-medical.com', 'height': 820, 'body': region_bg(), 'overlay': region_modal()},
        {'id': 'region-new-search', 'title': 'Choose location · decided, country search', 'url': 'rapid-medical.com', 'height': 820, 'body': region_bg(), 'overlay': region_modal('search')},
        {'id': 'region-new-phone', 'title': 'Choose location · decided, phone', 'device': 'mobile', 'url': 'rapid-medical.com', 'height': 900, 'body': region_bg(), 'overlay': region_modal('empty', phone=True),
         'notes': ['Телефон: то же окно на весь экран — поиск сверху, регионы карточками столбиком.']},
        {'id': 'region-switcher-new', 'title': 'Region from the header · decided, same modal', 'url': 'rapid-medical.com/us', 'height': 820, 'body': region_bg('us'), 'overlay': region_modal('empty', current='Americas')},
        {'id': 'careers-asis', 'title': 'Careers · as is', 'url': 'rapid-medical.com/careers', 'body': careers_asis()},
        {'id': 'careers-asis-phone', 'title': 'Careers · as is, phone', 'device': 'mobile', 'url': 'rapid-medical.com/careers', 'body': careers_asis(True)},
        {'id': 'openpos-asis', 'title': 'Open positions · as is (0 jobs)', 'url': 'rapid-medical.com/open-positions', 'height': 600, 'body': openpos_asis()},
        ref_screen('careers-mobbin', 'Careers · examples from Mobbin', 'careers', CAREERS_REFS),
        {'id': 'careers-new', 'title': 'Careers · decided, with open roles', 'url': 'rapid-medical.com/careers', 'body': careers_new('roles'),
         'notes': ['/open-positions → 301 на /careers#open-positions: вакансии живут на одной странице с культурой (Linear, Mixpanel). Страница одной вакансии на сайте не нужна — «Apply» ведёт в Spark Hire.']},
        {'id': 'careers-new-empty', 'title': 'Careers · decided, no open roles', 'url': 'rapid-medical.com/careers', 'body': careers_new('empty')},
        {'id': 'careers-new-phone', 'title': 'Careers · decided, phone', 'device': 'mobile', 'url': 'rapid-medical.com/careers', 'body': careers_new('roles', True)},
        {'id': 'about-asis', 'title': 'About · as is', 'url': 'rapid-medical.com/about-us', 'body': about_asis()},
        {'id': 'about-asis-phone', 'title': 'About · as is, phone', 'device': 'mobile', 'url': 'rapid-medical.com/about-us', 'body': about_asis(True)},
        ref_screen('about-mobbin', 'About · examples from Mobbin', 'about', ABOUT_REFS),
        {'id': 'about-new', 'title': 'About · decided', 'url': 'rapid-medical.com/about-us', 'body': about_new()},
        {'id': 'about-new-phone', 'title': 'About · decided, phone', 'device': 'mobile', 'url': 'rapid-medical.com/about-us', 'body': about_new(True)},
        {'id': 'web-asis', 'title': 'Webinars · as is', 'url': 'rapid-medical.com/us/webinars', 'body': webinars_asis()},
        {'id': 'web-asis-phone', 'title': 'Webinars · as is, phone', 'device': 'mobile', 'url': 'rapid-medical.com/us/webinars', 'body': webinars_asis(True)},
        ref_screen('web-mobbin', 'Webinars · examples from Mobbin', 'webinars', WEB_REFS),
        {'id': 'ev-asis', 'title': 'Evidence · as is', 'url': 'rapid-medical.com/us/evidence', 'body': evidence_asis()},
        ref_screen('ev-refs', 'Evidence · competitors, adjacent fields, Mobbin', 'evidence', EV_REFS),
        {'id': 'ev-concept', 'title': 'Evidence · concept draft', 'url': 'rapid-medical.com/us/evidence', 'body': evidence_concept()},
        {'id': 'ev-asis-phone', 'title': 'Evidence · as is, phone', 'device': 'mobile', 'url': 'rapid-medical.com/us/evidence', 'body': evidence_asis(True)},
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
