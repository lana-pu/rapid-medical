# Экран: Главная `/`

Код: `src/app/(site)/page.tsx`. Восстановлено по коду `59169da`.

## Доступ
Публичный. В preview / editor-режиме поверх live-настроек накладывается `setting_drafts.home`.

## Данные
| Источник | Что |
|---|---|
| `site_settings.home` | `heroLine1`, `heroLine2`, `heroSub`, `heroBody`, `heroCtaLabel`, `heroCtaHref`, `heroVideoUrl`, `problemTitle`, `problemVideoUrl`, `stats[] {value,label,iconUrl}`, `solutionLine`, `engineeredTitle`, `engineeredBody`, `engineeredImageUrl`, `newsTitle` |
| `news_items` | `getFeaturedNews(4)`: опубликованные с `featured = true` по дате; если таких нет — 4 последних опубликованных |
| cookie `rm_region` | Куда ведут CTA (регион последнего визита) |

## Структура и состояния
1. **Hero** (`VideoHero`): фон-видео `heroVideoUrl` с затемнением; без видео — светлый блок с нижней границей.
   Заголовок: `heroLine1` / `heroLine2` (дефолты «EXPAND» / «WHAT’S POSSIBLE»). `heroSub`, `heroBody` —
   только если заполнены. CTA: `heroCtaLabel` (дефолт «Explore Our Therapies») → `heroCtaHref`, иначе
   `/{region}/therapies`, а без региона — `/choose-your-location`.
2. **Проблема**: `problemTitle` + `problemVideoUrl` (каждый — если заполнен); ряд `stats` (если есть);
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
`problemVideoUrl` (медиа), `stats.{i}.value|label`, `solutionLine`, `engineeredTitle`, `engineeredBody`,
`newsTitle`, заголовки новостей (`news.title`).
Не редактируются на странице (только Site settings → Home): `heroVideoUrl`, `engineeredImageUrl`,
`stats.{i}.iconUrl`; текст кнопок «Request a demo», «Continue reading», «View all news» захардкожен.

## Валидация
Нет пользовательского ввода. Поля настроек сохраняются формой Site settings без серверной валидации
типов (строки как есть; см. `src/app/admin/(dashboard)/settings/page.tsx`).
