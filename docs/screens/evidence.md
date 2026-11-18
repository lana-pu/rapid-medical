# Экран: Evidence `/{region}/evidence`

Код: `src/app/(site)/[seg]/evidence/page.tsx`. Восстановлено по коду `59169da`.

## Блоки
Страница хранится списком блоков по региону (`site_pages`, key `evidence`, ADR-007); без записи те же блоки собирает
`evidenceToBlocks()` (`src/blocks/from-settings.ts`). Раскладка — `docs/DESIGN.md → Evidence` (решение 2026-11-15,
ветка `site-redesign`, миграция `0026`).

| Порядок | Блок · вариант | Из полей |
|---|---|---|
| 1 | Hero · `bannerCompact` (без изменений) | регион, `title`, `intro` (текст клиента), фоновое видео `heroVideoUrl` |
| 2 | Publications · `overview`, источник `featuredPublications` | «общая линия»: слева «ключ — значение» — `statLabel` (по умолчанию «Clinical publications») и число публикаций региона из базы, ниже строки по продуктам (число — ссылка на `#{product}`); справа `forefrontText`. Ниже — «Featured publications»: отмеченные `featured` (до 6) карточками: картинка (если есть), год · журнал, заголовок, «Read ↗» / «Download PDF» |
| 3 | Publications · `library`, якорь `#browse-by-product`, источник `publicationsByProduct` | «общая линия»: `browseTitle` («Browse by product») слева; справа архив — см. ниже |

## Доступ
Публичный. Регион не из `us|ous|apac` → 404.

## Данные
| Источник | Что |
|---|---|
| `materials` (`showInEvidence`, с 2026-11-18) | `getPublications(region)`: опубликованные, `regions` пусто или содержит регион; по дате ↓ |
| `materials` featured | `getFeaturedPublications(region, 6)`: то же + регион в `featuredRegions` — свой набор у каждого региона (решение 2026-11-18; с Duda: US — Radially, Long-term outcomes, SUCCESS US; Europe — Radially, Long-term outcomes, Challenging the limits; Asia & Pacific — DW24 early experience, Advancing beyond… T13, Anch'Or Harpoon) |
| `products` | `getProductsForRegion(region)`: `regions` пусто или содержит регион; `name`/`fullName` заменяются `aliases[region]` |
| `site_settings.evidence` | `title`, `heroVideoUrl`, `intro`, `statValue`, `statLabel`, `statIconUrl`, `forefrontText`, `featuredTitle`, `browseTitle` |

## Структура и правила
1. **Hero** — как было: «{регион}», `title`, `intro`, фоновое видео.
2. **Обзор.** Число — из базы, по региону (в Americas 35 = TIGERTRIEVER™ 19 + COMANECI™ 12 + DRIVEWIRE™ 4), то же,
   что в архиве; набранное `statValue` («85+») больше не показывается. Отмеченные публикации — вместо карусели; когда у
   публикации появятся тип исследования, N и главная цифра, её карточка станет Key study (решение 2026-11-15).
3. **Архив:** поиск по заголовку, авторам и журналу (все слова, без учёта диакритики); фильтр по продукту — чипы «All N»
   и продукты региона с числом; сортировка «Newest first / Oldest first»; «Showing X of N» или «Nothing found. Try fewer
   words or another product.»; по 20, «Show more». Строка: год · заголовок · «первый автор et al. · журнал» (номера
   аффилиаций убираются; «All authors» раскрывает полный список на месте) · бейдж продукта · «doi:…»/«Read ↗» (`url`),
   «Download PDF». Продукты и семейства — как раньше: вкладка семейства (TIGERTRIEVER™) включает подпродукты без своей
   вкладки в регионе. Якорь `#{product.slug}` (ссылки «N publications →» с карточек терапий) прокручивает к архиву и
   включает фильтр продукта, в том числе при смене якоря на открытой странице; неизвестный якорь — «All».
4. Блок «3 последние публикации с картинкой» убран (решение 2026-11-15: повторял отмеченные; публикации — в архиве).
5. Позже (данных пока нет): Key studies, вход по клиническому вопросу, фильтры по типу и показанию («N not yet
   classified — Show them»), идущие исследования — `docs/flows/site-pages.md → Evidence`.

Пустые состояния: нет отмеченных → нет «Featured publications»; продукт без публикаций → нет чипа и строки в обзоре;
публикаций 0 → обзор без чисел, архив «Nothing found».

## Действия
Смена региона; листание карусели; переключение вкладок; внешние ссылки на статьи/PDF (новая вкладка).

## On-page editor
Редактируются: `title`, `intro`, `statValue`/`statLabel`, `forefrontText`, `featuredTitle`, `browseTitle`
(группа `settings:evidence`); у публикаций — `title` и `imageUrl`.
Не выводятся вовсе, хотя есть в настройках: `forefrontImageUrl`, `forefrontImage2Url`.

## Валидация (админ-форма Evidence)
Обязательны `title`, `publishedOn` (формат `YYYY-MM` или `YYYY-MM-DD`; хранится 1-е число месяца).
`url`, `pdfUrl` — `http(s)://`, `mailto:` или `/путь`. `regions` — подмножество `us|ous|apac`, пусто = все.
