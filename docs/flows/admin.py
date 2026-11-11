# Generates admin.json next to this file. Run: python3 docs/flows/admin.py
# Admin of the website beyond on-page editing: lists and forms, media, requests, page templates, people.
# Grounds: findings/admin-ux-review.md (scenario rows), ADR-006, findings/admin-editor-best-practices.md.
import json
from pathlib import Path

OUT = Path(__file__).with_name('admin.json')
RM = json.load(open(Path(__file__).with_name('rm-pages.json'), encoding='utf8'))['pages']

SIDEBAR = [
    {'group': 'Website'}, {'label': 'Pages', 'badge': 34}, {'label': 'Evidence', 'badge': 102}, {'label': 'News', 'badge': 53},
    {'label': 'Webinars', 'badge': 5}, {'label': 'Jobs', 'badge': 0}, {'label': 'Team', 'badge': 6},
    {'group': 'Inbox'}, {'label': 'Requests', 'badge': '3 new'},
    {'group': 'Shared'}, {'label': 'Media library'}, {'label': 'People and roles'}, {'label': 'Activity'},
    {'group': 'Admin only'}, {'label': 'Site settings'},
]


def shell(active, content, height=760):
    items = [dict(i, on=True) if i.get('label') == active else i for i in SIDEBAR]
    return [
        {'c': 'appbar', 'logo': 'Rapid Medical', 'nav': ['Website', 'Training tool'], 'active': 0,
         'actions': [{'c': 'input', 'v': 'search', 'placeholder': 'Search pages, studies, files'}, {'c': 'avatar', 'name': 'Emily R'}]},
        {'c': 'split', 'cols': '230px minmax(0,1fr)', 'height': height, 'items': [{'c': 'sidebar', 'items': items}, content]},
    ]


def page_head(title, actions=None, sub=None):
    left = {'c': 'stack', 'gap': 'xs', 'items': [{'c': 'heading', 'level': 2, 'text': title}] + ([{'c': 'text', 'v': 'muted', 'text': sub}] if sub else [])}
    return {'c': 'row', 'justify': 'between', 'items': [left, {'c': 'row', 'gap': 's', 'items': actions or []}]}


B = lambda text, v='secondary', **kw: dict({'c': 'button', 'v': v, 'text': text}, **kw)
REGIONS = ['Americas', 'Europe & Middle East', 'Asia & Pacific']

# real publications (Evidence, US snapshot)
PUBS = [
    ['Radially adjustable Tigertriever demonstrates higher reperfusion compared to self-expanding stent retrievers', 'TIGERTRIEVER™', 'All regions', 'Jul 2026'],
    ['Distal Thrombectomy Reconsidered: Lessons from DISTALS and ORIENTAL-MEVO', 'TIGERTRIEVER™', 'All regions', 'Apr 2026'],
    ['Long-term outcomes of temporary stent-assisted coil embolization for the treatment of intracranial aneurysms', 'COMANECI™', 'All regions', 'Feb 2026'],
    ['Comaneci-assisted embolization of wide-necked aneurysms: results from the SUCCESS post market study', 'COMANECI™', 'Americas', 'Nov 2025'],
    ['Early Experience with the Drivewire 24: A Newly FDA-approved Steerable Microwire', 'DRIVEWIRE™', 'Americas', 'Jun 2025'],
]
NEW_PUB = 'Use of Drivewire 24 guidewire in neurointervention: initial clinical experience and technical notes'


def pub_rows(new=None):
    rows = []
    if new: rows.append({'on': True, 'cells': [new, 'DRIVEWIRE™', 'Americas, Europe & Middle East', 'Sep 2026', {'c': 'badge', 'text': 'Live', 'tone': 'success', 'dot': True}]})
    rows += [[t, p, r, d, {'c': 'badge', 'text': 'Live', 'tone': 'success', 'dot': True}] for t, p, r, d in PUBS]
    return rows


def pub_form(errors=False, status=('Draft · not on the site', 'neutral')):
    err = lambda e: {'error': e} if errors else {}
    form = {'c': 'stack', 'gap': 'l', 'items': [
        {'c': 'stack', 'gap': 's', 'items': [{'c': 'heading', 'level': 4, 'text': 'Publication'},
            dict({'c': 'textarea', 'label': 'Title', 'required': True, 'value': '' if errors else NEW_PUB}, **err('Add the title as it appears in the journal')),
            {'c': 'input', 'label': 'Authors', 'value': 'Singfer U, Goodluck Tyndall R, Sousa JA, Chung E, et al.'},
            {'c': 'grid', 'cols': 2, 'gap': 's', 'items': [{'c': 'input', 'label': 'Journal', 'value': 'Journal of NeuroInterventional Surgery'},
                dict({'c': 'input', 'label': 'Published', 'v': 'date', 'required': True, 'value': '09.2026' if errors else 'Sep 2026', 'hint': 'Month and year'}, **err('Use month and year, e.g. Sep 2026'))]}]},
        {'c': 'stack', 'gap': 's', 'items': [{'c': 'heading', 'level': 4, 'text': 'Links'},
            {'c': 'input', 'label': 'DOI', 'value': '10.1136/jnis-2026-024118', 'hint': 'The link to the journal is made from it'},
            {'c': 'upload', 'label': 'Add the PDF, if the journal allows it', 'hint': 'Shown as “Download PDF”'}]},
        {'c': 'stack', 'gap': 's', 'items': [{'c': 'heading', 'level': 4, 'text': 'Where it shows'},
            {'c': 'input', 'v': 'select', 'label': 'Product', 'value': 'DRIVEWIRE™', 'hint': 'The tab on Evidence and the link from the therapy page'},
            {'c': 'stack', 'gap': 's', 'items': [{'c': 'text', 'v': 'strong', 'text': 'Regions'}, {'c': 'checkbox', 'label': 'Americas', 'on': True}, {'c': 'checkbox', 'label': 'Europe & Middle East', 'on': True}, {'c': 'checkbox', 'label': 'Asia & Pacific'}],
             'annotation': 'Регионы — обычные названия, как на сайте, а не US / OUS / APAC (словарь из находок по редактору).'},
            {'c': 'switch', 'label': 'Featured: show in the carousel at the top of Evidence', 'on': False}]},
    ]}
    side = {'c': 'box', 'pad': 'm', 'tone': 'surface', 'fill': True, 'gap': 'm', 'items': [
        {'c': 'badge', 'text': status[0], 'tone': status[1], 'dot': True},
        {'c': 'text', 'v': 'small', 'text': 'Saved automatically. Visitors see it only after you publish.'},
        B('Preview on Evidence', full=True),
        B('Publish', 'primary', full=True, to='pub-error' if not errors else 'pub-live', annotation='Одно правило: сохранение никогда не меняет сайт, меняет только Publish (разбор админки, «Четыре правила сохранения»).' if not errors else None),
        {'c': 'divider'},
        {'c': 'stack', 'gap': 'xs', 'items': [{'c': 'text', 'v': 'small', 'text': 'Publish later'}, {'c': 'input', 'v': 'date', 'value': 'Not scheduled', 'hint': 'Time zone: Israel (UTC+2)'}],
         'annotation': 'Часовой пояс виден рядом с датой — в разборе это проблема сценария №7.'},
    ]}
    side['items'] = [x for x in side['items'] if x]
    for x in side['items']:
        if isinstance(x, dict) and x.get('annotation') is None: x.pop('annotation', None)
    return {'c': 'split', 'cols': 'minmax(0,1fr) 300px', 'items': [{'c': 'box', 'pad': 'l', 'gap': 'l', 'items': [
        {'c': 'breadcrumbs', 'items': ['Evidence', 'New publication']},
        page_head('New publication'),
        *([{'c': 'alert', 'tone': 'danger', 'title': '2 fields need attention', 'text': 'Title · Published', 'annotation': 'Ошибки и у поля, и сводкой сверху со ссылками на поля (GOV.UK). Сейчас в коде — «Please fix the highlighted fields».'}] if errors else []),
        form]}, side]}


REQUESTS = [
    {'title': 'Request a demo · Dr. Laura Mendes, Hospital São José', 'meta': 'Americas · Contact form · today, 09:14', 'badge': 'New', 'tone': 'info', 'on': True, 'to': 'request'},
    {'title': 'Webinar recording · “Tiger Trial results with ESMINT”', 'meta': 'Europe · Webinars form · today, 08:02', 'badge': 'New', 'tone': 'info'},
    {'title': 'Customer Service / Orders · Klinikum Nord', 'meta': 'Europe · Contact form · yesterday', 'badge': 'New', 'tone': 'info'},
    {'title': 'Product question / Support · DRIVEWIRE 24 sizes', 'meta': 'Asia Pacific · Contact form · Nov 7 · Daniel K', 'badge': 'In progress', 'tone': 'warning'},
    {'title': 'General interest · Clinical specialist', 'meta': 'Careers form · Nov 5 · Emily R', 'badge': 'Done', 'tone': 'success'},
]

FILES = [('tigerface wide.mp4', 'video'), ('TT_Revised-Base_V4.png', 'photo'), ('RAPID-MEDICAL_01_TIGERTRIEVER-LOGO loop.mp4', 'video'), ('tt-active-technology.jpg', 'image'),
         ('comaneci-low-profile.jpg', 'image'), ('Specifications-Resized.jpg', 'image'), ('DW24-SVIN-Poster.pdf', 'image'), ('stat-procedures.svg', 'icon')]


def media_grid(selected=None):
    cards = []
    for name, kind in FILES:
        c = {'c': 'card', 'media': {'kind': kind, 'label': name, 'ratio': '4/3'}, 'meta': name}
        if name == 'TT_Revised-Base_V4.png':
            c.update(badge='No description', tone='danger')
            if selected: c['on'] = True
            else: c.update(to='media-file', annotation='Файлы без описания видны фильтром и пометкой — для доступности и проверки перед публикацией.')
        cards.append(c)
    return {'c': 'grid', 'cols': 4, 'gap': 's', 'items': cards}


TEMPLATE_PAGE = {'c': 'rm-page', 'items': [
    {'c': 'rm-hero', 'v': 'title', 'eyebrow': 'Events', 'title': 'Add the event name', 'body': 'Add the date, the city and one sentence about the event.',
     'focus': {'part': 'title', 'style': 'selected'}},
    {'c': 'rm-text', 'v': 'default', 'title': 'Programme', 'body': 'Add the programme: time, talk and speaker for each item.'},
    {'c': 'rm-form', 'v': 'section', 'title': 'Register', 'note': 'Registration is free. We will send the details by email.', 'topics': ['Add the event name'], 'preview': True},
]}

flow = {
    'title': 'Website admin — lists, files, requests, templates, people',
    'project': 'Rapid Medical',
    'description': 'Всё, что редактор делает не на странице сайта: публикации Evidence через форму, медиатека с заменой файла везде, заявки с ответственным, новая страница по шаблону, люди и роли. Правка страниц — во флоу «Site editor». Основа: findings/admin-ux-review.md (номера сценариев), ADR-006, findings/admin-editor-best-practices.md. Решения, которых ещё нет в коде, помечены в заметках.',
    'start': 'home',
    'groups': [
        {'title': '1 · Рабочий стол', 'screens': ['home']},
        {'title': '2 · Новая публикация в Evidence', 'screens': ['evidence', 'pub-new', 'pub-error', 'pub-live']},
        {'title': '3 · Медиатека: заменить файл на всех страницах', 'screens': ['media', 'media-file', 'media-replace']},
        {'title': '4 · Заявки с сайта', 'screens': ['requests', 'request']},
        {'title': '5 · Новая страница по шаблону', 'screens': ['page-new', 'page-created']},
        {'title': '6 · Люди и роли', 'screens': ['people', 'invite']},
    ],
    'links': [
        {'from': 'home', 'to': 'evidence', 'label': 'Evidence'}, {'from': 'home', 'to': 'media', 'label': 'Media library'},
        {'from': 'home', 'to': 'requests', 'label': '3 new requests'}, {'from': 'home', 'to': 'page-new', 'label': 'New page'},
        {'from': 'home', 'to': 'people', 'label': 'People and roles'},
    ],
    'screens': [
        {'id': 'home', 'title': 'Website: what needs you', 'url': 'rapid-medical.com/admin/website', 'body': shell(None, {'c': 'box', 'pad': 'l', 'gap': 'l', 'items': [
            page_head('Good morning, Emily', [B('New page', 'primary', to='page-new', quiet=True)]),
            {'c': 'grid', 'cols': '1.4fr 1fr', 'items': [
                {'c': 'box', 'border': True, 'pad': 'm', 'gap': 's', 'items': [{'c': 'heading', 'level': 4, 'text': 'Needs your attention'},
                    {'c': 'list', 'annotation': 'Первым — что не опубликовано и что ждёт ответа, а не счётчики записей (разбор админки, сценарий №12).', 'items': [
                        {'title': 'Large vessel stroke', 'meta': 'Unpublished changes by Svetlana P · yesterday', 'badge': 'Not live yet', 'tone': 'warning'},
                        {'title': '3 new requests', 'meta': 'Contact and webinar forms · oldest today 08:02', 'badge': 'New', 'tone': 'info', 'to': 'requests', 'quiet': True},
                        {'title': 'Webinar: Tiger Trial results with ESMINT', 'meta': 'Publishes Nov 14, 09:00 · Israel (UTC+2)', 'badge': 'Scheduled'},
                        {'title': 'TT_Revised-Base_V4.png', 'meta': 'No description · used on 2 pages', 'badge': 'Fix', 'tone': 'danger', 'to': 'media', 'quiet': True}]}]},
                {'c': 'box', 'border': True, 'pad': 'm', 'gap': 's', 'items': [{'c': 'heading', 'level': 4, 'text': 'Recent activity'},
                    {'c': 'activity', 'items': [{'who': 'Emily R', 'what': 'published Large vessel stroke', 'when': 'Today, 10:42'},
                        {'who': 'Daniel K', 'what': 'replied to a product question', 'when': 'Yesterday, 16:20'},
                        {'who': 'Svetlana P', 'what': 'added 2 studies to Evidence', 'when': 'Nov 8'}]}]}]},
            {'c': 'grid', 'cols': 3, 'gap': 's', 'items': [
                {'c': 'card', 'title': 'Evidence', 'text': '102 studies · last added Nov 8', 'to': 'evidence', 'quiet': True},
                {'c': 'card', 'title': 'Media library', 'text': '240 files · 1 without description', 'to': 'media', 'quiet': True},
                {'c': 'card', 'title': 'People and roles', 'text': '4 people · 2FA on for everyone', 'to': 'people', 'quiet': True}]}]})},

        {'id': 'evidence', 'title': 'Evidence: the list', 'url': 'rapid-medical.com/admin/website/evidence', 'body': shell('Evidence', {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [
            page_head('Evidence', [B('New publication', 'primary', to='pub-new')], 'Studies shown on the Evidence pages and linked from the therapy pages'),
            {'c': 'row', 'gap': 's', 'wrap': True, 'items': [{'c': 'input', 'v': 'search', 'placeholder': 'Search title, author, journal'},
                {'c': 'segmented', 'items': ['All products', 'TIGERTRIEVER™', 'COMANECI™', 'DRIVEWIRE™'], 'active': 0},
                {'c': 'input', 'v': 'select', 'value': 'All regions'}],
             'annotation': 'Одно название раздела везде: Evidence (сейчас Evidence в меню и Publications на главной — сценарий №4).'},
            {'c': 'table', 'columns': ['Title', 'Product', 'Regions', 'Published', 'Status'], 'rows': pub_rows()},
            {'c': 'pagination', 'page': 1, 'pages': 21}]})},

        {'id': 'pub-new', 'title': 'New publication: one form, plain sections', 'url': 'rapid-medical.com/admin/website/evidence/new', 'body': shell('Evidence', pub_form(), 900)},
        {'id': 'pub-error', 'title': 'Publish with mistakes: what to fix', 'url': 'rapid-medical.com/admin/website/evidence/new', 'body': shell('Evidence', pub_form(errors=True), 960)},

        {'id': 'pub-live', 'title': 'Published: where to see it', 'url': 'rapid-medical.com/admin/website/evidence', 'body': shell('Evidence', {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [
            {'c': 'alert', 'tone': 'success', 'title': 'Live on Evidence', 'text': 'DRIVEWIRE™ tab · Americas, Europe & Middle East', 'actions': [{'c': 'link', 'text': 'View on the site ↗'}],
             'annotation': 'Итог публикации — где появилось и ссылка, как во флоу редактора.'},
            page_head('Evidence', [B('New publication', 'primary')]),
            {'c': 'table', 'columns': ['Title', 'Product', 'Regions', 'Published', 'Status'], 'rows': pub_rows(new=NEW_PUB)}]})},

        {'id': 'media', 'title': 'Media library', 'url': 'rapid-medical.com/admin/media', 'body': shell('Media library', {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [
            page_head('Media library', [B('Upload', 'primary')], 'Pictures, videos and documents used on the website and in the training tool'),
            {'c': 'row', 'gap': 's', 'wrap': True, 'items': [{'c': 'input', 'v': 'search', 'placeholder': 'Search files'}, {'c': 'segmented', 'items': ['All', 'Pictures', 'Videos', 'Documents', 'No description (1)'], 'active': 0}]},
            media_grid()]})},

        {'id': 'media-file', 'title': 'A file: where it is used', 'url': 'rapid-medical.com/admin/media', 'height': 760,
         'body': shell('Media library', {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [page_head('Media library', [B('Upload', 'primary')]), media_grid(selected=True)]}),
         'overlay': {'c': 'drawer', 'title': 'TT_Revised-Base_V4.png', 'items': [
             {'c': 'media', 'kind': 'photo', 'label': 'TT_Revised-Base_V4.png · 1200 × 1600', 'ratio': '4/3'},
             {'c': 'input', 'label': 'Description', 'required': True, 'placeholder': 'What is in the picture, for people who cannot see it', 'focus': True},
             {'c': 'stack', 'gap': 's', 'items': [{'c': 'text', 'v': 'strong', 'text': 'Used on 2 pages'},
                 {'c': 'list', 'items': [{'title': 'Large vessel stroke', 'meta': 'Europe & Middle East · “Gain active control”', 'thumb': 'page'}, {'title': 'Large vessel stroke', 'meta': 'Asia & Pacific · “Gain active control”', 'thumb': 'page'}]}],
              'annotation': 'Видно, где файл стоит. Сейчас удалить используемый файл нельзя, а заменить — только в каждом поле отдельно (сценарий №5).'}],
          'actions': [B('Download', 'ghost'), B('Replace on all pages', 'primary', to='media-replace')]}},

        {'id': 'media-replace', 'title': 'Replace everywhere: publish now or later', 'url': 'rapid-medical.com/admin/media', 'height': 760,
         'body': shell('Media library', {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [page_head('Media library'), media_grid(selected=True)]}),
         'overlay': {'c': 'modal', 'title': 'Replace TT_Revised-Base_V4.png', 'items': [
             {'c': 'grid', 'cols': 2, 'gap': 's', 'items': [{'c': 'stack', 'gap': 'xs', 'items': [{'c': 'text', 'v': 'caption', 'text': 'Now'}, {'c': 'media', 'kind': 'photo', 'label': 'TT_Revised-Base_V4.png', 'ratio': '4/3'}]},
                 {'c': 'stack', 'gap': 'xs', 'items': [{'c': 'text', 'v': 'caption', 'text': 'New'}, {'c': 'media', 'kind': 'photo', 'label': 'TT_Revised-Base_V5.png', 'ratio': '4/3'}]}]},
             {'c': 'text', 'text': 'The new file takes its place on 2 pages. The description stays.'},
             {'c': 'radio', 'label': 'Add as unpublished changes on both pages — publish them yourself', 'on': True},
             {'c': 'radio', 'label': 'Replace and publish on both pages now'}],
          'annotation': 'Решение владелицы 2026-11-11: замена файла идёт черновиком в каждую страницу, где он стоит; на сайте — после Publish (по ADR-006 одобрение = Publish).',
          'actions': [B('Cancel', 'ghost'), B('Replace', 'primary')]}},

        {'id': 'requests', 'title': 'Requests: one inbox, who answers', 'url': 'rapid-medical.com/admin/requests', 'body': shell('Requests', {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [
            page_head('Requests', [B('Export CSV')], 'Everything people send through the forms on the site'),
            {'c': 'row', 'gap': 's', 'wrap': True, 'items': [{'c': 'segmented', 'items': ['New (3)', 'In progress (1)', 'Done', 'All'], 'active': 0},
                {'c': 'input', 'v': 'select', 'value': 'All forms'}, {'c': 'input', 'v': 'select', 'value': 'All regions'}]},
            {'c': 'list', 'items': REQUESTS, 'annotation': 'Статус и ответственный у каждой заявки. Сейчас один список на все формы без ответственного и заметок (сценарий №9). Новое — нужна спека.'}]})},

        {'id': 'request', 'title': 'A request: status, owner, note', 'url': 'rapid-medical.com/admin/requests/1842', 'body': shell('Requests', {'c': 'split', 'cols': 'minmax(0,1fr) 320px', 'items': [
            {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [{'c': 'breadcrumbs', 'items': ['Requests', 'Request a demo']},
                page_head('Request a demo', [B('Reply by email', 'primary')], 'Contact form · Americas · today, 09:14'),
                {'c': 'table', 'columns': ['Field', 'Answer'], 'rows': [['Name', 'Dr. Laura Mendes'], ['Organization', 'Hospital São José'], ['Email', 'l.mendes@hsj.example'], ['Phone', '+55 11 0000 0000'], ['Region', 'Americas'], ['Country', 'Brazil'], ['Message', 'We would like a demo of TIGERTRIEVER 13 for our stroke team.'], ['Sign me up', 'Yes']]}]},
            {'c': 'box', 'pad': 'm', 'tone': 'surface', 'fill': True, 'gap': 'm', 'items': [
                {'c': 'input', 'v': 'select', 'label': 'Status', 'value': 'New'},
                {'c': 'input', 'v': 'select', 'label': 'Who answers', 'value': 'Daniel K', 'annotation': 'Ответственный и внутренняя заметка — чтобы двое не ответили одному врачу.'},
                {'c': 'textarea', 'label': 'Note for the team', 'placeholder': 'Only people in the admin see it'},
                {'c': 'activity', 'items': [{'who': 'Website', 'what': 'received the request', 'when': 'Today, 09:14'}]}]}]}, 820)},

        {'id': 'page-new', 'title': 'New page: start from a template', 'url': 'rapid-medical.com/admin/website/pages', 'height': 760,
         'body': shell('Pages', {'c': 'box', 'pad': 'l', 'items': [page_head('Pages', [B('New page', 'primary')])]}),
         'overlay': {'c': 'modal', 'wide': True, 'title': 'New page', 'items': [
             {'c': 'text', 'v': 'muted', 'text': 'Choose what the page is for. It starts with the right sections; you change the text and pictures.'},
             {'c': 'grid', 'cols': 3, 'gap': 's', 'items': [
                 {'c': 'card', 'on': True, 'media': {'kind': 'page', 'ratio': '4/3'}, 'title': 'Event', 'text': 'Date, place, programme, registration form', 'annotation': 'Шаблон — набор блоков из реестра. Нужны ли страницы мероприятий — открытый вопрос (BACKLOG, п. 18).'},
                 {'c': 'card', 'media': {'kind': 'page', 'ratio': '4/3'}, 'title': 'Landing page', 'text': 'Top of page, text and media, call to action'},
                 {'c': 'card', 'media': {'kind': 'page', 'ratio': '4/3'}, 'title': 'Text page', 'text': 'Legal and long texts'}]},
             {'c': 'input', 'label': 'Page name', 'value': 'DISTAL Summit 2027'},
             {'c': 'stack', 'gap': 's', 'items': [{'c': 'text', 'v': 'strong', 'text': 'Show in'}, {'c': 'radio', 'label': 'All regions', 'on': True}, {'c': 'radio', 'label': 'Only some regions…'}]}],
          'actions': [B('Cancel', 'ghost'), B('Create page', 'primary', to='page-created')]}},

        {'id': 'page-created', 'title': 'The new page opens in the editor', 'url': 'rapid-medical.com/events/distal-summit-2027', 'height': 900, 'body': [
            {'c': 'toolbar', 'left': [B('← Pages', 'ghost'), {'c': 'stack', 'gap': 'xs', 'items': [{'c': 'text', 'v': 'strong', 'text': 'DISTAL Summit 2027'}, {'c': 'text', 'v': 'caption', 'text': 'Event · /events/distal-summit-2027'}]}],
             'center': [B('Showing: All regions ▾', size='s')],
             'right': [{'c': 'badge', 'text': 'Draft', 'dot': True}, {'c': 'text', 'v': 'small', 'text': 'Not on the site yet'}, B('Comment', 'ghost'), B('Preview'), B('Publish', 'primary')]},
            {'c': 'rm-header'},
            dict(TEMPLATE_PAGE, annotation='Пустые места подписаны тем, что туда писать, а не «Lorem ipsum». Дальше всё как во флоу «Site editor».')]},

        {'id': 'people', 'title': 'People and roles', 'url': 'rapid-medical.com/admin/people', 'body': shell('People and roles', {'c': 'box', 'pad': 'l', 'gap': 'm', 'items': [
            page_head('People and roles', [B('Invite a person', 'primary', to='invite')]),
            {'c': 'table', 'columns': ['Person', 'Role', 'Two-step sign-in', 'Last active'], 'rows': [
                [{'c': 'row', 'gap': 's', 'items': [{'c': 'avatar', 'name': 'Svetlana P'}, {'c': 'text', 'text': 'Svetlana P'}]}, 'Admin', {'c': 'badge', 'text': 'On', 'tone': 'success'}, 'Today'],
                [{'c': 'row', 'gap': 's', 'items': [{'c': 'avatar', 'name': 'Emily R'}, {'c': 'text', 'text': 'Emily R'}]}, 'Editor', {'c': 'badge', 'text': 'On', 'tone': 'success'}, 'Today'],
                [{'c': 'row', 'gap': 's', 'items': [{'c': 'avatar', 'name': 'Daniel K'}, {'c': 'text', 'text': 'Daniel K'}]}, 'Editor', {'c': 'badge', 'text': 'On', 'tone': 'success'}, 'Yesterday'],
                [{'c': 'row', 'gap': 's', 'items': [{'c': 'avatar', 'name': 'Noa B'}, {'c': 'text', 'text': 'Noa B'}]}, 'Designer', {'c': 'badge', 'text': 'Waiting for sign-in', 'tone': 'warning'}, '—']]},
            ], 'annotation': 'Роли по сути две: редактор и дизайнер, плюс админ для людей и настроек (ADR-006). Роль approver убрана.'})},

        {'id': 'invite', 'title': 'Invite: roles in plain words', 'url': 'rapid-medical.com/admin/people', 'height': 760,
         'body': shell('People and roles', {'c': 'box', 'pad': 'l', 'items': [page_head('People and roles', [B('Invite a person', 'primary')])]}),
         'overlay': {'c': 'modal', 'title': 'Invite a person', 'items': [
             {'c': 'input', 'label': 'Email', 'value': 'noa@rapid-medical.com'},
             {'c': 'stack', 'gap': 's', 'items': [{'c': 'text', 'v': 'strong', 'text': 'What they can do'},
                 {'c': 'radio', 'label': 'Editor — changes text and pictures, builds pages from templates, publishes', 'on': True},
                 {'c': 'radio', 'label': 'Designer — the same, and changes how sections look'},
                 {'c': 'radio', 'label': 'Admin — the same, and people, settings, integrations'}],
              'annotation': 'Роль описана тем, что человек может сделать, а не названием из системы (находка «Описания простыми словами»).'},
             {'c': 'alert', 'tone': 'info', 'text': 'They get an email with a link. Two-step sign-in is set up on the first visit.'}],
          'actions': [B('Cancel', 'ghost'), B('Send invite', 'primary', to='people')]}},
    ],
}
json.dump(flow, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('written', len(flow['screens']), 'screens')
