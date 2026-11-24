# Экран: Список записей (`/admin/{resource}`)

Основа: описано по коду 2026-11-13 (как работает сейчас). Один экран на все типы записей, колонки и фильтры берутся из
описания ресурса. Хлебные крошки и откуда открываются списки — [admin-sections](admin-sections.md); форма записи —
[admin-record-edit](admin-record-edit.md).
Код: `src/app/admin/(dashboard)/[resource]/page.tsx`, `src/admin/engine.ts` (`listRows`, `bulk`),
`src/components/admin/BulkBar.tsx`, `src/admin/actions.ts` (`bulkResource`), `src/admin/resources.ts` (`listColumns`).

## Что показано
**Иерархия (2026-11-24, разбор с Mobbin, черновик v2 «тише» одобрен владелицей):** главное — названия; статус говорит,
только когда он не обычный; одно число не повторяется в двух местах.
- Крошки «Site › {раздел}», заголовок — название списка (News, Publications…), подпись — где коллекция на сайте
  (`where` из описания раздела, `src/admin/site-sections.ts`); число записей — во вкладке All (если вкладок нет — «{N}
  items» в подписи). Кнопка **+ New {тип записи}** — единственная залитая.
- **Вкладки статуса с числами** над таблицей (как Circle, Substack): All · On the site · Changes waiting · Scheduled ·
  Drafts. Показаны только вкладки, где есть записи; если записи все в одном состоянии — вкладок нет. On the site — на
  сайте и без неопубликованных правок; Changes waiting — на сайте, правки сохранены и ждут Publish; Scheduled — есть
  время публикации; Drafts — не на сайте. Числа — по всей коллекции, без учёта поиска.
- Таблица: первая колонка — ссылка на запись. В ней миниатюра 36 px (у коллекций с картинкой; без картинки — пустое
  место, не серый квадрат), **название до двух строк**, под ним мелкой строкой — метки (Featured, Hidden from search,
  Temporary) и **второстепенные колонки** через «·» (Source, City, Product, Regions, Speaker, Location…). Отдельными
  колонками остаются дата, числа (Order, Used) и статус.
- **Статус в строке — только необычный**, точкой и словом (как на экране страницы): «Changes waiting» (жёлтая),
  «Publishes {дата, время по Израилю}» (синяя), «Draft» (серая). У записи на сайте без правок метки нет — это обычное
  состояние. На узком экране дата и статус уходят в строку под названием.
- **События** — группами «Upcoming · {N}» и «Past · {N}» (внутри страницы списка), колонки When нет. Нет предстоящих —
  строка «No upcoming events.»
- Пусто: «Nothing here.» (с фильтрами — «Nothing matches — clear filters»). По 50 строк, внизу «Showing 1–50 of 53 ·
  ‹ Prev · Next ›».

| Ресурс | Колонки (второстепенные — под названием) |
|---|---|
| `solutions` (Therapies) | Name · *Address · Region · Product* · Status |
| `publications` | Title · Date · *Product · Regions* · Featured · Status |
| `events` | Title · Date · *City* · Status; группы Upcoming / Past |
| `news` | Title · Date · *Source* · Featured · Status |
| `webinars` | Title · *Speaker · Product · Regions* · Status |
| `team` | Name · *Title* · Order · Status |
| `jobs` (Jobs) | Title · *Location · Department* · Status |
| `pages` (Text pages) | Title · *Address · Region* · No-index · Status |
| `site-pages` (Site pages) | Name · *Page · Region* · Status |
| `products` | Name · *Address · Family · Evidence tab in* · Order |
| `redirects` | From · *To* · Used (сколько раз сработал); «Temporary» — меткой у адреса, если редирект не постоянный |

## Поиск, фильтры, сортировка
- «Search…» — по названию записи (поле-подпись ресурса: Name / Title, у redirects — From), без учёта регистра.
- Фильтры появляются, только если такая колонка есть в списке, и стоят **в одну строку с поиском** компактными списками
  (2026-11-15): статус — вкладками над таблицей (2026-11-24), **Any region** (названия регионов и «All regions»), **Any region**
  для списка регионов («Shown in {регион}»), **Any product**, **Featured** (Featured · Not featured). Выбор **применяется
  сразу** (без Apply); поиск — по Enter. **Clear filters** (если что-то задано) сбрасывает.
- Клик по заголовку колонки — сортировка по ней, повторный — в обратную сторону (стрелка ↑ / ↓). По умолчанию —
  по полю ресурса: порядок, id, имя, заголовок — по возрастанию; даты — новые сверху. Второстепенные колонки (под
  названием) заголовка не имеют — по ним фильтруют, а сортировка через адрес (`?sort=`) работает как раньше.
- Параметры живут в адресе (`?q=&status=published|draft|changed|scheduled&region=&regions=&productId=&featured=&sort=&dir=&page=`).

## Массовые действия
- Галочки у строк и «Select all» (только строки текущей страницы). Когда что-то отмечено, у нижнего края — плавающая
  тёмная панель «{N} selected» (как Slite; на телефоне — над нижней навигацией): **Publish** и **Unpublish** (у ресурсов со статусом) и **Delete** (у всех).
- **Delete** спрашивает «Delete {N} item(s)? This cannot be undone.» и удаляет безвозвратно **только то, чего нет на
  сайте** — то же правило, что «Delete draft» на странице записи (UX-прогон 2026-11-14; списки — 2026-11-16): вместе с
  записью уходят её черновик правок и расписание. Опубликованные строки остаются; сообщение говорит, сколько и что делать.
- **Publish / Unpublish** у ресурсов со статусом идут как по одной записи из формы ([admin-record-edit](admin-record-edit.md)):
  публикуется и черновик правок; при Unpublish правки остаются в записи, расписание отменяется.
- Site pages (Home, About…): ни «+ New», ни Unpublish и Delete — их нельзя создать, снять или удалить, поэтому кнопок
  нет (раньше «+ New» вёл на 404, а Unpublish / Delete молча ничего не делали — 2026-11-16).
- После действия: «Published {N} item(s).» / «Unpublished {N} item(s).» / «Deleted {N} item(s).» — N считает строки,
  с которыми действие **выполнено**, а не отмеченные; при удалении, если опубликованные остались, — «{K} on the site
  were not deleted: unpublish them first.» Публичные пути ресурса обновляются. Журнал: publish / unpublish по записи;
  delete — одна строка `bulk` со списком удалённых id.

## Права
Любая роль после двухшагового входа. `resource` не из списка → 404.
