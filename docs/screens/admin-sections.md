# Админка по разделам сайта (`/admin/site/{раздел}`)

Основа: информационная архитектура `docs/site-ia.md` (просьба владелицы 2026-11-13: «админку в соответствии с
информационной архитектурой, чтобы было интуитивно для редакторов»). Редактор думает разделами сайта («поменять на
странице терапии», «добавить исследование в Evidence»), а не таблицами базы. Код: `src/admin/site-sections.ts`,
`src/app/admin/(dashboard)/site/[section]/page.tsx`.

## Меню слева: четыре пространства (решение владелицы 2026-11-14, `docs/admin-ia.md`)
Полоска слева (узкая, тёмная) — **пространства**, а не страницы: 📝 **Content** · 📥 **Inbox** (число того, что ждёт) ·
🖼 **Media** · ⚙ **Settings**; внизу ✎ Edit site · ↗ View site · аккаунт (My account & security, Sign out).
Вторая колонка у каждого пространства своя:
- **Content** — дерево сайта: поиск по дереву и **+ New page** сверху; страницы один раз (дерево редактора,
  `src/admin/page-tree.ts`); коллекции под своей страницей со значком ▤ и числом (Evidence → Publications, Products ·
  Webinars → Webinars · News & Events → News, Events · About → Team · Careers → Open positions → Jobs); в конце
  Menu and footer. Ветки сворачиваются (запоминается в браузере). Клик по странице — экран страницы, по коллекции —
  её записи.
- **Inbox** (`/admin/inbox`) — почта: список сообщений (формы и заметки на страницах) с папками и непрочитанными,
  письмо справа (`docs/admin-ia.md` → «Уточнения 2026-11-15»). Логотип над полоской — **дашборд** `/admin`.
- **Media** — без второй колонки.
- **Settings** — группы: *Site* — Contact details · Social links · Regional notices · Google defaults · Branding
  (дизайнер, админ) · Integrations (админ) · Redirects; *Team* — People and roles (админ) · Activity log;
  *You* — My account & security. Menu and footer — в Content, не здесь.
`/admin/start` ведёт на дашборд `/admin`, где выбор проекта (Website, Training tool…).

## Экран страницы (`/admin/page/…` — адрес страницы на сайте без региона, Home — `/admin/page`)
Шапка: хлебные крошки по дереву («Site › Therapies › Large vessel stroke»), название и вид страницы, **вкладки**
(решение владелицы 2026-11-14): **Overview** (ниже) · **Google & address** — форма страницы (Google-тексты, адрес,
расписание, Publish) одного региона, переключатель регионов справа · **History** — версии одного региона.
Вкладки Google & address и History — это форма и история записи страницы (`/admin/{solutions|pages|site-pages}/{id}`)
под той же шапкой, поэтому отдельного входа в «форму страницы» больше нет.
Overview:
1. **Регионы** — по строке на версию: регион, статус словами, кто и когда менял, **Edit on page ✎**, **Settings**
   (вкладка Google & address), **History**, **View ↗**. Нет версии в регионе — «No version». Страница-список
   (Webinars, News & Events, Open positions, Contact) — «Its texts are edited on the page, its items in the
   collections below».
2. **Collections on this page** — коллекции страницы: значок ▤, название, число, где показываются, **Open**, **+ New**.
Регионы и коллекции — **карточками**, без технических таблиц (2026-11-15); «Pages under it» убран — вложенные
страницы видны в дереве.
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
