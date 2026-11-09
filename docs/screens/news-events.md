# Экран: Новости `/news-events`

Код: `src/app/(site)/news-events/page.tsx`, блоки собирает `newsPageToBlocks()` (`src/blocks/from-settings.ts`). Данные: записи `news`.

## Блоки
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `title` | «News & Events» в две строки, не редактируется | всегда |
| 2 | News · `carousel` | отмеченные `featured`, если их нет — самые новые; не больше 5 | есть новости |
| 3 | News · `timeline`, якорь `#all-news` | все новости по годам, «Show more» | всегда |
