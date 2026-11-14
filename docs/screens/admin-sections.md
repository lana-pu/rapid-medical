# Админка по разделам сайта (`/admin/site/{раздел}`)

Основа: информационная архитектура `docs/site-ia.md` (просьба владелицы 2026-11-13: «админку в соответствии с
информационной архитектурой, чтобы было интуитивно для редакторов»). Редактор думает разделами сайта («поменять на
странице терапии», «добавить исследование в Evidence»), а не таблицами базы. Код: `src/admin/site-sections.ts`,
`src/app/admin/(dashboard)/site/[section]/page.tsx`.

## Меню слева (решение владелицы 2026-11-14: функции отдельно от навигации, как в редакторах)
Две колонки — как в редакторе страниц (`on-page-editor.md`) и в Mintlify:
```
┌──┬─────────────────────────┬──────────────────────
│🔍│ SITE                    │
│🏠│ ▾ Home                  │   экран
│📥│ ▾ Therapies             │
│ 3│     Large vessel stroke │
│🖼│     Medium vessel stroke│
│🕘│ ▾ Evidence              │
│  │     ▤ Publications  102 │
│  │ ▾ News & Events         │
│  │     ▤ News           53 │
│✎ │     ▤ Events          5 │
│⚙ │ ▸ About … Menu and footer│
│👤│                         │
└──┴─────────────────────────┴──────────────────────
```
- **Полоска функций** (узкая, тёмная, значки с подписью при наведении): 🔍 Find a page · 🏠 Home («What needs you») ·
  📥 Requests (число новых) · 🖼 Media library · 🕘 Activity; внизу ✎ Edit site (редактор страниц) · ↗ View site ·
  ⚙ Settings (меню: Site settings · Redirects · Broken links · People and roles — админ) · 👤 аккаунт (имя, роль,
  My account & security, Sign out). Текущая функция подсвечена.
- **Дерево сайта** (колонка «Site», светлая): то же дерево, что в редакторе (`src/admin/page-tree.ts`) — каждая страница
  один раз; ветки сворачиваются (запоминается в этом браузере); текущая страница или коллекция подсвечена.
  **Коллекции — в дереве под страницей, где они показаны**, со значком ▤ и числом записей: Evidence → Publications,
  Products · Webinars → Webinars · News & Events → News, Events · About → Team · Careers → Open positions → Jobs.
  В конце — **Menu and footer** (значок ☰, весь сайт). Клик по странице → **экран страницы**, по коллекции → её
  записи (`/admin/{коллекция}`).

## Экран страницы (`/admin/page/…` — адрес страницы на сайте без региона, Home — `/admin/page`)
Хлебные крошки по дереву («Site › Therapies › Large vessel stroke»), название и вид страницы, затем:
1. **Регионы** — по строке на версию: регион, статус словами, кто и когда менял, **Edit on page ✎**, **Settings**
   (форма страницы: Google-тексты, адрес), **View ↗**. Нет версии в регионе — «No version». Страница-список
   (Webinars, News & Events, Open positions, Contact) — «Its texts are edited on the page, its items in the
   collections below».
2. **Collections on this page** — коллекции страницы: значок ▤, название, число, где показываются, **Open**, **+ New**.
3. **Pages under it** — дочерние страницы дерева со статусами.
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
