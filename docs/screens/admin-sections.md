# Админка по разделам сайта (`/admin/site/{раздел}`)

Основа: информационная архитектура `docs/site-ia.md` (просьба владелицы 2026-11-13: «админку в соответствии с
информационной архитектурой, чтобы было интуитивно для редакторов»). Редактор думает разделами сайта («поменять на
странице терапии», «добавить исследование в Evidence»), а не таблицами базы. Код: `src/admin/site-sections.ts`,
`src/app/admin/(dashboard)/site/[section]/page.tsx`.

## Меню слева: четыре пространства (решение владелицы 2026-11-14, `docs/admin-ia.md`)
Над всем — **шапка проекта** (2026-11-15, `docs/admin-ia.md` → «проект отдельно»): «← · RM Rapid Medical / 🌐 Website»
(стрелка — **назад, на предыдущую страницу**; «Rapid Medical» — к выбору проекта `/admin`, «Website» — Home проекта),
справа ✎ Edit site · ↗ View site · аккаунт (My account & security, Sign out).

**Кнопки «назад» (решение владелицы 2026-11-15).** Любая кнопка «назад» в админке и редакторе — стрелка в шапке,
«← Back» в записи и в новой записи, «← Back» в истории записи, ← в редакторе — возвращает **туда, откуда человек
пришёл** в этой вкладке (как кнопка браузера). Если пришли по прямой ссылке или закладке и предыдущей страницы нет —
на страницу выше: шапка → выбор проекта, запись → её коллекция, история → запись, редактор → Home проекта. Редактор
помнит страницу админки, с которой его открыли, и возвращает на неё, даже если в редакторе переходили между
страницами сайта.
Полоска слева (узкая, тёмная) — **пространства** проекта, а не страницы: 🏠 **Home** (дашборд `/admin/website`) ·
📝 **Content** · 📥 **Inbox** (число того, что ждёт) · 📊 **Analytics** · 🖼 **Media** · ⚙ **Settings**.
Вторая колонка у каждого пространства своя:
- **Content** — дерево сайта: поиск по дереву и **+ New page** сверху; страницы один раз (дерево редактора,
  `src/admin/page-tree.ts`); коллекции под своей страницей со значком ▤ и числом (Evidence → Publications, Products ·
  Webinars → Webinars · News & Events → News, Events · About → Team · Careers → Open positions → Jobs); в конце
  Menu and footer. Ветки сворачиваются (запоминается в браузере). Клик по странице — экран страницы, по коллекции —
  её записи.
- **Inbox** (`/admin/inbox`) — почта: список сообщений (формы и заметки на страницах) с папками и непрочитанными,
  письмо справа; пока письмо не открыто — список на всю ширину, как в Gmail (экран — `admin-inbox.md`).
- **Media** — без второй колонки.
- **Settings** — группы: *Site* — Contact details · Social links · Regional notices · Google defaults · Branding
  (дизайнер, админ) · Integrations (админ) · Redirects; *Team* — People and roles (админ) · Activity log;
  *You* — My account & security. Menu and footer — в Content, не здесь.
`/admin/start` ведёт на дашборд `/admin`, где выбор проекта (Website, Training tool…).

## Экран страницы (`/admin/page/…` — адрес страницы на сайте без региона, Home — `/admin/page`)
**Один экран вместо трёх вкладок** (решение владелицы 2026-11-15, разбор — `docs/admin-page-screen.md`). Сайт правят
1–2 раза в месяц, тексты согласуют внутри команды: всё нужное — на виду, без спрятанных функций; ссылки-превью для
внешних согласующих не делаем.

Шапка: крошки по дереву, название, вид страницы. Справа: **Copy link for a post**, **View ↗**.

Основная колонка:
1. **Regions** — строка на регион: название, статус словами («On the site» · «Changes not published yet» · «Not on
   the site yet»), кто и когда менял, «publishes {дата} (Israel time)», если запланировано. Действия: **Edit on page**;
   **Publish** — у региона с неопубликованными правками; **Settings** — настройки страницы этого региона. Нет версии —
   «No version — visitors there do not see this page» и **Create from {регион}** (копия черновиком, экран остаётся
   здесь с подтверждением). Страница-список (Webinars, News & Events, Open positions, Contact) — «Its texts are
   edited on the page, its items in the collections below».
2. **Performance · last 30 days** — просмотры, визиты, которые начались здесь, заявки, отправленные с этой страницы
   или сразу после неё, главные источники, открытые PDF; всё по всем регионам страницы. Счётчик моложе 30 дней —
   «Counted since {дата}». Ссылка в Analytics.
3. **Google** — по региону превью сниппета: заголовок (60), адрес, описание (155) со счётчиками; длиннее — жёлтым,
   пусто — «Google will pick text from the page». **Edit** → Settings региона. У страниц без своих полей (Home,
   About, Careers, Evidence…) — «Set in Settings → Google defaults» со ссылкой.
4. **Files on this page** — PDF и картинки, которые стоят на странице (по всем регионам): имя, вид, у PDF — сколько
   раз открывали за 30 дней; **Open** → файл в медиатеке (там Replace).
5. **Collections shown on this page** — как раньше: название, число, где, **Open**, **+ New**.

Колонка справа **Details**: шаблон (вид страницы), адрес по регионам, **Recent changes** — 5 последних действий
журнала по записям страницы и **All versions** (история региона), **Open notes** — число открытых заметок на странице и
ссылка в редактор.

**Copy link for a post** — окно: регион, название кампании → ссылка на страницу с `utm_source=linkedin&utm_medium=social
&utm_campaign={кампания}` и кнопка Copy; так пост виден в Analytics → «LinkedIn posts and campaigns».

**Settings** и **All versions** — прежние форма и история записи региона (`/admin/{solutions|pages|site-pages}/{id}`,
`…/history`) с шапкой страницы: крошки, название, «Settings · {регион}» / «Versions · {регион}», переключатель
регионов и ссылка **← Page**. Вкладок больше нет.

**Смена адреса** (slug) у опубликованной страницы при публикации создаёт **редирект 301** со старого адреса на новый
(старые ссылки и посты не ломаются); редиректы, что вели на старый адрес, переводятся на новый; если на новом адресе
был редирект — он удаляется (страница снова живёт там). В журнал — «changed the address … (redirect added)».

Экраны разделов (`/admin/site/{раздел}`, ниже) остаются по прямым ссылкам; из меню ведёт дерево.

## Экран раздела
Заголовок — название раздела, под ним одна фраза, что это на сайте, и **View on the site ↗**. Ниже три блока, каждый —
только если он есть у раздела:
1. **Pages** — страницы раздела: название, регион словами, статус словами (Live · Live, with unpublished changes ·
   Draft — not live yet), **Edit on page ✎** и **Page settings** (форма: Google-тексты, адрес).
2. **Lists on these pages** — записи, из которых страницы берут списки: название, число, где показываются
   («the latest featured appear on Home»), **Open** и **+ New …**.
3. **Settings used here** — группы настроек раздела (Contact details, Menu and footer…), если роль их открывает.

### Особенности разделов
| Раздел | Страницы | Списки | Настройки |
|---|---|---|---|
| Home | Home | News (featured — на Home) | — |
| Therapies | обзор терапий ×3 + **таблица терапий**: строки по группам (Ischemic · Hemorrhagic · Access), столбцы — регионы; в ячейке статус и Edit on page, «No version» — терапии нет в регионе | Therapy pages (формы), Products | — |
| Evidence | Evidence ×3 | Publications, Products | — |
| Webinars | страница списка в каждом регионе (только View) | Webinars | — |
| News & Events | страница (только View) | News, Events | — |
| About Us | About | Team | Contact details (офисы и карта) |
| Careers | Careers | Jobs («No open positions — the list is hidden on Careers») | — |
| Contact Us | страница формы (только View) | Requests | Contact details (адреса по темам и регионам) |
| Other pages | текстовые страницы группами: **Legal** (общие), **Studies and cases**, **Not on the site** (черновики); + New page | — | — |
| Menu and footer | — | — | Menu and footer (дизайнер, админ); остальным — «Labels are edited right on the page» и View on the site |

## Хлебные крошки
Списки и формы записей показывают путь по разделам: «Website › Evidence › Publications», «Website › Therapies ›
Large vessel stroke (Americas)». Ссылка на раздел ведёт на его экран.

## Find a page (`/admin/editor`)
Тот же поиск, но карточки сгруппированы по разделам сайта в порядке меню (Home, Therapies, Evidence, About, Careers,
Other pages).
