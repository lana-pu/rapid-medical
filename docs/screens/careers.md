# Экран: Карьера `/careers`

Код: `src/app/(site)/careers/page.tsx`, блоки собирает `careersToBlocks()` (`src/blocks/from-settings.ts`). Данные: настройки
`careers`, число вакансий из записей `jobs`.

## Блоки
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `bannerCompact` | `heroTitle` (по умолчанию «Unlock your potential»), `heroSub`, `heroBody`, `heroVideoUrl`, постер `heroImageUrl`; кнопка «View open positions (N)» → `/open-positions` | всегда |
| 2 | Gallery · `quotes` | `quotes[]` | есть цитаты |
| 3 | Columns · `principles` | `principlesTitle`, `principlesBody`, `principlesImageUrl`, `principles[]` | всегда |
| 4 | Form · `section`, якорь `#general-interest` | заголовок «Submit general interest», `eeoStatement`; форма `careers`, темы General interest · Internship · Other | всегда |

## Проход по юзабилити 2026-11-13
- Кнопка в шапке страницы: при открытых вакансиях — «View open positions (N)» → `/open-positions`; при нуле —
  «Submit general interest» → `#general-interest` (не ведёт на пустой список).
