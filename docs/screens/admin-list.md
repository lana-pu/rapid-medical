# Экран: Список записей (`/admin/{resource}`)

Основа: описано по коду 2026-11-13 (как работает сейчас). Один экран на все типы записей, колонки и фильтры берутся из
описания ресурса. Хлебные крошки и откуда открываются списки — [admin-sections](admin-sections.md); форма записи —
[admin-record-edit](admin-record-edit.md).
Код: `src/app/admin/(dashboard)/[resource]/page.tsx`, `src/admin/engine.ts` (`listRows`, `bulk`),
`src/components/admin/BulkBar.tsx`, `src/admin/actions.ts` (`bulkResource`), `src/admin/resources.ts` (`listColumns`).

## Что показано
- Крошки «Website › {раздел}», заголовок — название списка (Therapies, Publications…), подпись «{N} items»,
  кнопка **+ New {тип записи}** (например, «+ New publication») → `/admin/{resource}/new`.
- Таблица: колонки ресурса (ниже), первая колонка — ссылка на запись. Статус — как в базе (`published` / `draft`),
  регион — US / OUS / APAC или «global», список регионов — «US, OUS» или «all», флажок — «✓», событие — «Upcoming» / «Past».
- Пусто: «Nothing here.» По 50 строк, внизу «‹ Prev · Page X of Y · Next ›» (если страниц больше одной).

| Ресурс | Колонки |
|---|---|
| `solutions` (Therapies) | Name · Slug · Region · Product · Status |
| `publications` | Title · Date · Product · Regions · Featured · Status |
| `events` | Title · Date · City · When · Status |
| `news` | Title · Date · Source · Featured · Status |
| `webinars` | Title · Speaker · Product · Regions · Status |
| `team` | Name · Title · Order · Status |
| `jobs` (Jobs) | Title · Location · Department · Status |
| `pages` (Text pages) | Title · Slug · Region · No-index · Status |
| `site-pages` (Site pages) | Name · Page · Region · Status |
| `products` | Name · Slug · Family · Evidence tab in · Order |
| `redirects` | From · To · 301 · Hits |

## Поиск, фильтры, сортировка
- «Search…» — по названию записи (поле-подпись ресурса: Name / Title, у redirects — From), без учёта регистра.
- Фильтры появляются, только если такая колонка есть в списке: **Any status** (Published · Draft), **Any region**
  (названия регионов и «Global»), **Any region** для списка регионов («Shown in US/OUS/APAC»; записи «all» видны в любом),
  **Any product**, **Featured?** (Featured · Not featured). **Apply** применяет, **Reset** (если что-то задано) сбрасывает.
- Клик по заголовку колонки — сортировка по ней, повторный — в обратную сторону (стрелка ↑ / ↓). По умолчанию —
  по полю ресурса: порядок, id, имя, заголовок — по возрастанию; даты — новые сверху.
- Параметры живут в адресе (`?q=&status=&region=&regions=&productId=&featured=&sort=&dir=&page=`).

## Массовые действия
- Галочки у строк и «Select all» (только строки текущей страницы). Когда что-то отмечено, над таблицей панель
  «{N} selected»: **Publish** и **Unpublish** (у ресурсов со статусом) и **Delete** (у всех).
- **Delete** спрашивает «Delete {N} item(s)? This cannot be undone.» и удаляет строки из базы безвозвратно.
- **Publish / Unpublish** у ресурсов со статусом идут как по одной записи из формы ([admin-record-edit](admin-record-edit.md)):
  публикуется и черновик правок; при Unpublish правки остаются в записи, расписание отменяется.
- Site pages (Home, About…): Unpublish и Delete не выполняются.
- После действия: «Published {N} item(s).» / «Unpublished {N} item(s).» / «Deleted {N} item(s).», публичные пути ресурса
  обновляются. Журнал: publish / unpublish по записи; delete — одна строка `bulk` со списком id.

## Права
Любая роль после двухшагового входа. `resource` не из списка → 404.
