# Generates linkedin-post.json next to this file. Run: python3 docs/flows/linkedin-post.py
# LinkedIn post from a study page: where it starts, what the draft is built from, the link, the checks, what a doctor
# sees in the feed, and how a request is traced back to the post. Brief: docs/briefs/linkedin-leads.md.
# The study page itself and «Create from a document» live in site-pages.py (another track) — not repeated here.
import json
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / 'linkedin-post.json'


def T(text, v='body', **kw): return dict({'c': 'text', 'v': v, 'text': text}, **kw)
def H(text, level=2, **kw): return dict({'c': 'heading', 'level': level, 'text': text}, **kw)
def S(items, gap='m', **kw): return dict({'c': 'stack', 'gap': gap, 'items': items}, **kw)
def R(items, gap='s', **kw): return dict({'c': 'row', 'gap': gap, 'items': items}, **kw)
def B(text, v='secondary', **kw): return dict({'c': 'button', 'v': v, 'text': text}, **kw)
def line(k, v): return {'c': 'row', 'justify': 'between', 'align': 'center', 'items': [T(k, 'small'), v]}


HEADER = {'c': 'rm-header', 'region': 'us'}
FOOTER = {'c': 'rm-footer', 'region': 'us'}
EDITOR_URL = 'rapid-medical.com/admin/editor/success-study-final-results'
SLUG = 'success-study-final-results'
CAMPAIGN = 'success-final-results-2026-11'
LINK = f'rapid-medical.com/{SLUG}?utm_source=linkedin&utm_medium=social&utm_campaign={CAMPAIGN}'

# ---------- the post, slot by slot (every number is one of the checked numbers on the page) ----------
SLOTS = [
    ('Hook', 'Study conclusion + key number', 'Final results of the SUCCESS study: successful aneurysm occlusion with COMANECI™ rose from 86% at the end of the procedure to 95% at 6-month follow-up.'),
    ('Context', 'Study passport', '90 consecutive patients with wide-neck intracranial aneurysms, treated at 17 US centers. FDA-regulated post-market study; imaging adjudicated by an independent core lab (UCLA).'),
    ('Findings', 'Key numbers (3 of 4)', '→ 95% successful occlusion (Raymond Roy I–II) at 6 months\n→ 82% good clinical outcome (mRS 0–2) at 6 months\n→ 0 symptomatic thromboembolic events'),
    ('Credit', 'Authors from the document', 'Lead author: Jason M. Davies, Jacobs Institute, University at Buffalo, with the SUCCESS Study investigators.'),
    ('Link', 'Page link with UTM', f'Full results, charts and the poster: {LINK}'),
    ('Safety line', 'Product regulatory line', 'Refer to the Instructions for Use for indications, contraindications, warnings and precautions.'),
    ('Hashtags', 'Therapy + product', '#aneurysm #neurointervention #COMANECI'),
]
POST = '\n\n'.join(s[2] for s in SLOTS)
# wireframe only: let the long UTM link wrap inside the field (zero-width spaces), counts use POST
POST_SHOWN = POST.replace('?', '?​').replace('&', '&​').replace('/', '/​')
FOLD = 210  # hypothesis: LinkedIn shows about this many characters on a computer before «…see more»
SHORT = POST[:FOLD].rsplit(' ', 1)[0] + '…'
SHORT_PHONE = POST[:140].rsplit(' ', 1)[0] + '…'
COUNT = f'{len(POST):,} / 3,000 characters'

NUMBERS = ['86%', '95%', '90', '17', '82%', '0']


# ---------- editor chrome ----------
def toolbar(live=True):
    right = [{'c': 'badge', 'text': 'Live', 'tone': 'success', 'dot': True},
             B('LinkedIn post', 'primary' if live else 'secondary', to='post-draft', label='LinkedIn post',
               annotation='Вход — из страницы исследования в редакторе: пост живёт рядом с тем, на что ссылается. Кнопка активна только у опубликованной страницы, где все блоки проверены по PDF: пост ведёт на эту страницу и берёт из неё цифры. До Publish кнопка честно неактивна с подсказкой «Publish the page first — the post links to it».')]
    return {'c': 'toolbar', 'left': [B('← Pages', 'ghost'), S([T('SUCCESS Study – Final Results', 'strong'), T('Study · COMANECI™ · Americas · Europe & Middle East · Asia & Pacific', 'caption')], 'xs')],
            'right': right}


def page_preview():
    return S([{'c': 'eyebrow', 'text': 'Clinical study · COMANECI™'}, H('SUCCESS', 1),
              T('A high rate of aneurysm occlusion with Comaneci in wide-neck aneurysms, sustained at 6 months, with a favorable safety profile.', 'lead'),
              {'c': 'divider'},
              {'c': 'grid', 'cols': 2, 'gap': 'm', 'items': [{'c': 'stat', 'value': '95%', 'label': 'successful occlusion at ≤6 months'},
                                                          {'c': 'stat', 'value': '82%', 'label': 'good clinical outcome at 6 months'},
                                                          {'c': 'stat', 'value': '0', 'label': 'symptomatic thromboembolic events'},
                                                          {'c': 'stat', 'value': '0.3%', 'label': 'coil entanglement · 1 of 356 coils'}]},
              {'c': 'media', 'kind': 'chart', 'label': 'Occlusion over time · bars from numbers', 'ratio': '21/6'}], 'm')


def editor(panel, toast=None):
    body = [toolbar(), {'c': 'split', 'cols': 'minmax(0,1fr) 440px', 'height': 900, 'items': [{'c': 'box', 'pad': 'l', 'items': [page_preview()]}, panel]}]
    if toast: body.append({'c': 'toast', 'text': toast[0], 'action': toast[1], 'float': True})
    return body


# ---------- the post panel ----------
def link_block(note=True):
    return S([T('Link', 'strong'),
              {'c': 'radio', 'label': 'Reader’s own region (recommended) — rapid-medical.com/' + SLUG, 'on': True},
              {'c': 'radio', 'label': 'Americas only — /us/' + SLUG},
              {'c': 'radio', 'label': 'Europe & Middle East only — /ous/' + SLUG},
              {'c': 'radio', 'label': 'Asia & Pacific only — /apac/' + SLUG},
              R([{'c': 'badge', 'text': 'Page live in all 3 regions', 'tone': 'info'}, {'c': 'badge', 'text': 'COMANECI™ on the site in all 3 regions', 'tone': 'info'}], wrap=True,
                annotation='Аккаунт LinkedIn один на все регионы, а утверждения региональные. Панель честно показывает, где живёт страница и где продукт есть на сайте, — это подсказка Emily/Alyssa, а не регуляторная проверка (регион на сайте ≠ одобрение). Если страница есть не во всех регионах, варианта «Reader’s own region» нет, а бейдж жёлтый: «Not live in Americas».' if note else None)],
             'xs', annotation='Ссылка без региона: сайт сам переводит врача в его регион по стране, как уже делает для /evidence; страна не определилась — выбор региона. Для страниц исследований это маленькая доработка (сейчас так умеют только Evidence и обзор терапий). UTM ставится сам: utm_source=linkedin, utm_medium=social, utm_campaign — своё у каждого поста, потому что в заявку сейчас попадают только source/medium/campaign.' if note else None)


def built_from():
    rows = [{'title': name, 'meta': src, 'badge': 'Checked', 'tone': 'success'} for name, src, _ in SLOTS]
    rows[3] = {'title': 'Credit', 'meta': 'Authors from the document · tag people yourself in LinkedIn', 'badge': 'Checked', 'tone': 'success'}
    return S([T('Built from the page', 'strong'), {'c': 'list', 'items': rows}], 'xs',
             annotation='Пост собирается по шаблону из уже проверенных блоков страницы — без ИИ и без новых утверждений: зацепка = вывод + главная цифра, контекст = паспорт, 3 итога = ключевые цифры, автор = из документа, ссылка, регуляторная строка продукта, хэштеги терапии. Каждая часть подписана, откуда она. Шаблон один раз проверяет MLR клиента, дальше меняются только цифры.')


def post_text(note=True, value=POST_SHOWN):
    return S([R([T('Post text', 'strong'), T(COUNT, 'caption')], justify='between'),
              {'c': 'textarea', 'value': value},
              T(f'Before «…see more»: “{SHORT}”', 'caption',
                annotation=f'Над текстом видно, что попадёт в ленту до «…see more» (около {FOLD} знаков на компьютере, меньше на телефоне — гипотеза, проверить на странице компании). Поэтому первой идёт цифра, а не «We are excited to share…».' if note else None)], 'xs')


def format_chips(active=0):
    return {'c': 'chips', 'label': 'Format', 'items': ['Text + link preview', 'Text + image'], 'active': active,
            'annotation': 'Два формата. «Text + link preview»: LinkedIn сам рисует карточку ссылки из картинки страницы (og:image) — её мы и делаем из ключевых цифр. «Text + image»: квадратная картинка в ленте крупнее, ссылка — в тексте. Карусель из PDF — позже, если пилот покажет, что канал работает.'}


def actions(copied=False):
    return [B('Copy post text', 'primary', to='post-copied', label='copy'),
            B('Open LinkedIn ↗', 'secondary'),
            B('Other wording with your AI', 'ghost', to='post-ai', label='варианты ИИ')]


def panel_draft():
    return {'c': 'panel', 'title': 'LinkedIn post', 'items': [
        format_chips(0), link_block(), post_text(), built_from(),
        {'c': 'alert', 'tone': 'success', 'title': 'All 6 numbers in the post are on the page', 'text': ', '.join(NUMBERS) + ' — each checked against the PDF.',
         'annotation': 'Сверка цифр бесплатная и автоматическая: каждое число в тексте поста ищется среди проверенных значений страницы. Правите текст руками — проверка повторяется на лету.'}],
        'actions': actions()}


def panel_image():
    card = {'c': 'media', 'kind': 'image', 'label': '1200 × 1200 · SUCCESS · 95% successful occlusion at 6 months · 82% good outcome · COMANECI™ · rapid-medical.com', 'ratio': '1/1'}
    return {'c': 'panel', 'title': 'LinkedIn post', 'items': [
        format_chips(1),
        S([T('Image', 'strong'), dict(card, annotation='Картинка собирается из блока «Ключевые цифры» по шаблону из набора инфографики (DESIGN.md): те же цифры и подписи, в стиле сайта. Не рисуется руками и не генерируется ИИ — поэтому её проверяют один раз как шаблон. Та же картинка в формате 1200×627 — превью ссылки (og:image) самой страницы: сейчас у текстовых страниц там общая заглушка.'),
           R([B('Download image (PNG)', 'secondary'), {'c': 'segmented', 'items': ['Square', 'Landscape'], 'active': 0}])], 'xs'),
        post_text(False), link_block(False)],
        'actions': actions()}


def panel_copied():
    return {'c': 'panel', 'title': 'LinkedIn post', 'items': [
        {'c': 'stepper', 'steps': ['Copy the text', 'Post on LinkedIn', 'Paste the post link'], 'current': 2},
        T('Paste the text on the Rapid Medical page in LinkedIn and post it. Then paste the link to the post here, so requests from it are counted.', 'muted'),
        {'c': 'input', 'label': 'Link to the LinkedIn post', 'placeholder': 'https://www.linkedin.com/feed/update/urn:li:activity:…',
         'annotation': 'Публикует человек — сайт в LinkedIn ничего не отправляет (автопостинг — только если пилот покажет, что канал работает; API страниц компании требует одобрения приложения — гипотеза). Ссылка на пост нужна, чтобы связать его с заявками: у поста своя utm_campaign.'},
        post_text(False)],
        'actions': [B('Save as posted', 'primary', to='post-history', label='posted'), B('Later', 'ghost')]}


def panel_history():
    rows = [{'title': 'Final results of the SUCCESS study: successful aneurysm occlusion…', 'meta': 'Posted 20 Nov 2026 by Emily R · reader’s own region · text + link preview',
             'badge': '2 requests', 'tone': 'success', 'actions': [B('Open post ↗', 'ghost', size='s')]},
            {'title': '90 patients, 17 US centers, independent core lab — SUCCESS…', 'meta': 'Draft · not posted', 'badge': 'Draft', 'tone': 'neutral',
             'actions': [B('Continue', 'secondary', size='s')]}]
    return {'c': 'panel', 'title': 'LinkedIn post', 'items': [
        T('Posts about this page', 'strong'),
        dict({'c': 'list', 'items': rows}, annotation='У страницы — свои посты: что выложено, когда, кем и сколько заявок пришло по его ссылке (заявки — из нашей базы, по utm_campaign). Клики и охват здесь не показываем: их знает LinkedIn и GA4, не сайт — выдумывать цифры не будем.'),
        T('Clicks and reach — in LinkedIn page analytics and Google Analytics.', 'caption'),
        B('+ New post', 'secondary', to='post-draft', label='ещё пост')]}


def ai_modal():
    def variant(text, ok=True, bad=None):
        status = {'c': 'badge', 'text': 'All numbers on the page', 'tone': 'success'} if ok else {'c': 'badge', 'text': f'“{bad}” is not on this page', 'tone': 'danger'}
        return {'c': 'card', 'items': [T(text, 'body'), R([status, B('Use this', 'secondary', size='s')] if ok else [status], justify='between')]}
    items = [T('Want a different wording? Your AI assistant writes 3 versions from the same checked facts. The site does not call or pay for AI.', 'muted',
               annotation='Как у «Create from a document»: сайт ИИ не вызывает и за него не платит. Инструкция содержит только проверенные факты страницы и правило «не добавлять цифр и утверждений».'),
             S([T('1. Copy the instructions — they include the checked facts of this page', 'strong'), B('Copy instructions for AI', 'secondary')], 's'),
             S([T('2. Paste the answer here', 'strong'), {'c': 'textarea', 'value': 'VERSION 1\n95% occlusion at 6 months in wide-neck aneurysms…\nVERSION 2\n…'}], 's'),
             S([T('Versions', 'strong'),
                variant('95% of wide-neck aneurysms stayed successfully occluded at 6 months with COMANECI™ in the SUCCESS study — 90 patients, 17 US centers.'),
                variant('What happens after the procedure? In SUCCESS, successful occlusion rose from 86% to 95% by 6 months…'),
                dict(variant('SUCCESS: 97% of patients had a good outcome with COMANECI™…', ok=False, bad='97%'),
                     annotation='Вариант с цифрой, которой нет среди проверенных, помечен и не вставляется: ИИ мог ошибиться. Это та же сверка, что в черновике.')], 's')]
    return {'c': 'modal', 'title': 'LinkedIn post · other wording', 'items': items, 'wide': True,
            'actions': [B('Back to the draft', 'ghost', to='post-draft', label='назад')]}


# ---------- what a doctor sees ----------
def feed_post(phone=False):
    head = R([{'c': 'avatar', 'name': 'Rapid Medical'}, S([T('Rapid Medical', 'strong'), T('Company page · 1 d', 'caption')], 'xs')], 's', align='center')
    preview_card = {'c': 'card', 'media': {'kind': 'image', 'label': '1200 × 627 · page image built from key numbers', 'ratio': '1200/627'},
                    'title': 'SUCCESS Study – Final Results | Rapid Medical™', 'meta': 'rapid-medical.com'}
    return {'c': 'box', 'pad': 'm', 'border': True, 'gap': 'm', 'items': [head,
            T(SHORT_PHONE if phone else SHORT, 'body', annotation=None if phone else 'Первые строки — цифра и название исследования: это решает, нажмут ли «…see more» и ссылку.'),
            {'c': 'link', 'text': '…see more'},
            dict(preview_card, to='landing', label='клик по карточке',
                 annotation=None if phone else 'Карточка ссылки — из og:image и заголовка страницы. Сейчас у страниц исследований превью — общая картинка сайта; с этой фичей у каждой своя, из её цифр.'),
            R([T('Like', 'small'), T('Comment', 'small'), T('Repost', 'small')], 'l')]}


def feed_desktop():
    return [{'c': 'box', 'pad': 'l', 'tone': 'surface', 'items': [{'c': 'grid', 'cols': '1fr 560px 1fr', 'gap': 'l', 'items': [
        {'c': 'spacer', 'size': 1}, S([T('LinkedIn feed — approximate, grey wireframe', 'caption'), feed_post()], 's'), {'c': 'spacer', 'size': 1}]}]}]


def feed_phone():
    return [{'c': 'box', 'pad': 's', 'tone': 'surface', 'items': [S([T('LinkedIn app — approximate', 'caption'), feed_post(True)], 's')]}]


def landing():
    return [HEADER, {'c': 'section', 'pad': 'm', 'items': [S([
        {'c': 'eyebrow', 'text': 'Clinical study · COMANECI™ · Americas'}, H('SUCCESS', 1),
        T('A high rate of aneurysm occlusion with Comaneci in wide-neck aneurysms, sustained at 6 months, with a favorable safety profile.', 'lead'),
        {'c': 'grid', 'cols': 2, 'gap': 's', 'items': [{'c': 'stat', 'value': '95%', 'label': 'occlusion at ≤6 months'}, {'c': 'stat', 'value': '82%', 'label': 'good outcome at 6 months'}]},
        B('Discuss SUCCESS with our team', 'primary', full=True, to='contact', label='заявка',
          annotation='Посетитель из LinkedIn попал сразу в свой регион (здесь — Americas по стране). Страница и её следующий шаг — из дорожки «страница исследования» (site-pages). Кнопку стоит показывать и сверху на телефоне, не только в конце: из ленты приходят на минуту.'),
        T('Full study, charts and the poster below ↓', 'caption')], 'm')]}]


def contact():
    return [HEADER, {'c': 'section', 'pad': 'm', 'items': [S([
        H('Let’s connect', 1), {'c': 'divider'},
        {'c': 'chips', 'label': 'Topic', 'items': ['Request a demo', 'Product question', 'Orders', 'Other topic ▾'], 'active': 0},
        {'c': 'input', 'label': 'About', 'value': 'SUCCESS Study – Final Results',
         'annotation': 'Форма уже знает, откуда пришли: тема demo и «About» подставлены со страницы исследования; источник (utm_*, landing_page) уходит в заявку сам — так сайт работает уже сейчас (spec → Аналитика, вариант Г).'},
        {'c': 'input', 'label': 'First name', 'required': True}, {'c': 'input', 'label': 'Last name', 'required': True},
        {'c': 'input', 'label': 'Work e-mail', 'required': True}, {'c': 'input', 'label': 'Hospital or organization'},
        B('Send request', 'primary', full=True, to='requests', label='отправлено')], 'm')]}]


def requests():
    appbar = {'c': 'appbar', 'logo': 'Rapid Medical', 'nav': ['Website', 'Training tool'], 'active': 0, 'actions': [{'c': 'avatar', 'name': 'Emily R'}]}
    rows = [{'cells': ['Dr. A. Patel', 'Request a demo', 'Americas', {'c': 'badge', 'text': 'LinkedIn · SUCCESS final results', 'tone': 'info'}, 'Today'], 'on': True},
            {'cells': ['M. Rossi', 'Product question', 'Europe & ME', {'c': 'badge', 'text': 'Google', 'tone': 'neutral'}, 'Yesterday']},
            {'cells': ['J. Kim', 'Request a demo', 'Asia & Pacific', {'c': 'badge', 'text': 'Direct', 'tone': 'neutral'}, '12 Nov']}]
    return [appbar, {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [
        R([H('Requests', 2), {'c': 'chips', 'items': ['All', 'From LinkedIn', 'Mine'], 'active': 0}], 'l', justify='between', align='center'),
        dict({'c': 'table', 'columns': ['Name', 'Topic', 'Region', 'Came from', 'When'], 'rows': rows},
             annotation='Источник заявки уже записывается сейчас — не хватает только колонки «Came from» в списке, фильтра «From LinkedIn» и названия поста вместо сырой utm_campaign. Это и есть замер пилота: сколько заявок принёс LinkedIn и какой пост.'),
        {'c': 'card', 'title': 'Dr. A. Patel · Request a demo', 'text': 'Came from: LinkedIn post «SUCCESS final results» (20 Nov) · landed on /us/success-study-final-results · sent from Contact Us',
         'meta': 'utm_source=linkedin · utm_medium=social · utm_campaign=' + CAMPAIGN, 'actions': [B('Open the post ↗', 'ghost', size='s', to='post-history', label='к посту', quiet=True)]}]}]


SCREENS = [
    {'id': 'ed-live', 'title': 'Editor · study page is live', 'url': EDITOR_URL, 'height': 900,
     'body': [toolbar(), {'c': 'box', 'pad': 'l', 'items': [page_preview()]}, {'c': 'toast', 'text': 'Published. The page is live in 3 regions.', 'action': 'Prepare a LinkedIn post', 'float': True}],
     'notes': ['После Publish тост предлагает сразу подготовить пост — момент, когда материал свежий. Это предложение, не автоматическое действие (propose → confirm).']},
    {'id': 'post-draft', 'title': 'LinkedIn post · draft from the page', 'url': EDITOR_URL + '?panel=linkedin', 'height': 1500, 'body': editor(panel_draft())},
    {'id': 'post-image', 'title': 'LinkedIn post · text + image', 'url': EDITOR_URL + '?panel=linkedin', 'height': 1300, 'body': editor(panel_image())},
    {'id': 'post-ai', 'title': 'LinkedIn post · other wording with your AI', 'url': EDITOR_URL + '?panel=linkedin', 'height': 1000, 'body': editor(panel_draft()), 'overlay': ai_modal()},
    {'id': 'post-copied', 'title': 'LinkedIn post · copied, waiting for the post link', 'url': EDITOR_URL + '?panel=linkedin', 'height': 1000,
     'body': editor(panel_copied(), ('Post text copied. Paste it on the Rapid Medical page in LinkedIn.', 'Open LinkedIn ↗'))},
    {'id': 'post-history', 'title': 'LinkedIn post · posts about this page', 'url': EDITOR_URL + '?panel=linkedin', 'height': 900, 'body': editor(panel_history())},
    {'id': 'feed', 'title': 'LinkedIn feed · computer', 'height': 820, 'body': feed_desktop()},
    {'id': 'feed-phone', 'title': 'LinkedIn feed · phone', 'device': 'mobile', 'height': 760, 'body': feed_phone()},
    {'id': 'landing', 'title': 'Study page · from LinkedIn, phone', 'device': 'mobile', 'url': 'rapid-medical.com/us/' + SLUG + '?utm_source=linkedin…', 'body': landing()},
    {'id': 'contact', 'title': 'Contact Us · from the study page, phone', 'device': 'mobile', 'url': 'rapid-medical.com/contact-us?region=us&topic=demo&about=' + SLUG, 'body': contact()},
    {'id': 'requests', 'title': 'Admin · requests, where they came from', 'url': 'rapid-medical.com/admin/requests', 'height': 760, 'body': requests()},
]

flow = {
    'title': 'LinkedIn post from a study — draft, link, check, request',
    'project': 'Rapid Medical',
    'description': 'Путь Emily или Alyssa: опубликованная страница исследования → черновик поста из её проверенных блоков → ссылка с UTM в регион читателя → копировать и выложить → заявка с источником «LinkedIn». И путь врача: лента → страница → заявка. Основание: docs/briefs/linkedin-leads.md (цепочка из 6 звеньев), страница исследования и «Create from a document» — docs/flows/site-pages.md, DESIGN.md → «Страница из документа». Пример — SUCCESS, все цифры с постера.',
    'start': 'ed-live',
    'groups': [
        {'title': '1 · Пост из страницы (Emily / Alyssa)', 'screens': ['ed-live', 'post-draft', 'post-image', 'post-ai']},
        {'title': '2 · Выложить и связать с заявками', 'screens': ['post-copied', 'post-history']},
        {'title': '3 · Путь врача: лента → страница → заявка', 'screens': ['feed', 'feed-phone', 'landing', 'contact', 'requests']},
    ],
    'links': [{'from': 'post-draft', 'to': 'post-image', 'label': 'формат «Text + image»'},
              {'from': 'post-history', 'to': 'feed', 'label': 'пост в ленте'},
              {'from': 'feed', 'to': 'feed-phone', 'label': 'то же на телефоне'},
              {'from': 'feed-phone', 'to': 'landing', 'label': 'клик'}],
    'screens': SCREENS,
}

OUT.write_text(json.dumps(flow, ensure_ascii=False, indent=1), encoding='utf8')
print(f'{OUT.name}: {len(SCREENS)} screens · post {len(POST)} chars')
