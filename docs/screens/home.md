# Экран: Главная `/`

Код: `src/app/(site)/page.tsx`. Восстановлено по коду `59169da`.

## Блоки
Страница — список блоков, собирает `homeToBlocks()` (`src/blocks/from-settings.ts`).

**Порядок с 2026-11-19 (DESIGN.md → Home; предварительно, до подтверждения Emily — ветка `therapy-home`, не влита):**
hero (обещание) → проблема и наш ответ → наши терапии → как устроено → доказательства → новости. Всё прежнее содержимое
на месте: цифры переехали из блока проблемы в блок доказательств, новости — в формат News & Events.

| Порядок | Блок · вариант | Что |
|---|---|---|
| 1 | Hero · `banner` | `heroLine1`, `heroLine2`, `heroSub`, `heroBody`, кнопка, `heroVideoUrl` |
| 2 | Text and media · `statement` | `problemTitle`, `problemVideoUrl` / `problemImageUrl`, `solutionLine`, кнопка «Request a demo» (без цифр) |
| 3 | Columns · `cards` (источник `homeTherapies`) | «Our therapies»: те же карточки, что в обзоре терапий региона; регион не выбран — терапии всех регионов, ссылка ведёт через выбор региона |
| 4 | Text · `dark` | `engineeredTitle`, `engineeredBody`, `engineeredImageUrl`; есть заголовок или текст |
| 5 | Key numbers · `evidence` (источник `publicationCount`) | «Backed by clinical evidence»: прежние цифры (50K+, 100+, публикации) с иконками; число публикаций — из базы, то же, что на Evidence региона (регион не выбран — все); «Explore the evidence →» → `/{region}/evidence` |
| 6 | News · `highlights` (источник `featuredNews`) | `newsTitle`, главная новость крупно + 3 рядом (как на News & Events), своя страница новости, «View all news» |

**Полоса новости над шапкой (2026-11-19, по желанию):** Site settings → **News bar** → «Show the newest highlight above
the header on Home» (выключено по умолчанию; включает и выключает маркетинг). Включено — над шапкой главной тонкая
полоса: «News» · заголовок самой свежей отмеченной новости (то же, что первая в «Главном») → её страница. Нет отмеченных
новостей — полосы нет. Только на главной.

Не сделано (по желанию): Key studies на главной — после разметки публикаций (Evidence).

Существующая база переводится один раз при сборке (`homeLayout2026`, `scripts/migrate-blocks.ts`): только если на
странице ещё старый порядок (цифры внутри блока проблемы и нет блока доказательств); черновик Home — так же.

## Доступ
Публичный. В preview / editor-режиме поверх live-настроек накладывается `setting_drafts.home`.

## Данные
| Источник | Что |
|---|---|
| `site_settings.home` | `heroLine1`, `heroLine2`, `heroSub`, `heroBody`, `heroCtaLabel`, `heroCtaHref`, `heroVideoUrl`, `problemTitle`, `problemVideoUrl`, `problemImageUrl`, `stats[] {value,label,iconUrl}`, `solutionLine`, `engineeredTitle`, `engineeredBody`, `engineeredImageUrl`, `newsTitle` |
| `materials` (`showInNews`, с 2026-11-18) | `getFeaturedNews(4)`: опубликованные с `featured = true` по дате; если таких нет — 4 последних опубликованных |
| `materials` (`showInEvidence`) | число публикаций: `getPublications(region)`; без региона — все регионы без повторов |
| `solutions` | терапии региона для карточек (`getSolutionsNav`), без региона — всех регионов без повторов по slug |
| cookie `rm_region` | Куда ведут CTA (регион последнего визита) |

## Структура и состояния
1. **Hero** (`VideoHero`): фон-видео `heroVideoUrl` с затемнением; без видео — светлый блок с нижней границей.
   Заголовок: `heroLine1` / `heroLine2` (дефолты «EXPAND» / «WHAT’S POSSIBLE»). `heroSub`, `heroBody` —
   только если заполнены. CTA: `heroCtaLabel` (дефолт «Explore Our Therapies») → `heroCtaHref`, иначе
   `/{region}/therapies`, а без региона — `/choose-your-location`.
2. **Проблема**: `problemTitle` + медиа: видео `problemVideoUrl`, без видео — картинка `problemImageUrl` (она же
   постер видео; каждый — если заполнен); ряд `stats` (если есть);
   `solutionLine`; кнопка «Request a demo» → `/contact-us?region={region}&topic=demo` (без региона — без `region`).
3. **Engineered-баннер** (`Banner`): только если есть `engineeredTitle` или `engineeredBody`; фон — `engineeredImageUrl`.
4. **Новости**: заголовок `newsTitle` (дефолт «At the forefront of advancing stroke intervention»), до 4 карточек
   (месяц · источник, заголовок, «Continue reading →» — внешняя ссылка в новой вкладке), кнопка «View all news ›» → `/news-events`.

Пустые поля скрывают свой блок; пустых состояний-заглушек нет. Новостей 0 → пустой список (заголовок остаётся).

## Действия
| Действие | Результат |
|---|---|
| CTA hero | См. выше |
| Request a demo | `/contact-us` с предвыбранной темой «Request a demo» и регионом |
| Continue reading | Внешний URL новости, `target=_blank rel=noopener` |
| View all news | `/news-events` |

## On-page editor
Редактируются: `heroLine1/2`, `heroSub`, `heroBody`, CTA (label+href как ссылка), `problemTitle`,
`problemImageUrl` + `problemVideoUrl` (одно медиа: «Replace image…», «Replace video…», «Remove video (show image)» —
как у остальных секций с медиа; UX-прогон 2026-11-14: картинка раньше попадала в поле видео), `stats.{i}.value|label`, `solutionLine`, `engineeredTitle`, `engineeredBody`,
`newsTitle`, заголовки новостей (`news.title`).
Не редактируются на странице (только Site settings → Home): `heroVideoUrl`, `engineeredImageUrl`,
`stats.{i}.iconUrl`; текст кнопок «Request a demo», «Continue reading», «View all news» захардкожен.

## Валидация
Нет пользовательского ввода. Поля настроек сохраняются формой Site settings без серверной валидации
типов (строки как есть; см. `src/app/admin/(dashboard)/settings/page.tsx`).
