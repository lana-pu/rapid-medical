# Экран: Выбор региона `/choose-your-location`

Код: `src/app/(site)/choose-your-location/page.tsx`, блоки собирает `chooserToBlocks()` (`src/blocks/from-settings.ts`).
Данные: настройки `regional`, регион из cookie-подсказки.

Параметр `next` — куда вести после выбора; принимается только `[a-z-]+`, иначе `therapies`.

## Блоки (одна секция)
| Порядок | Блок · вариант | Из полей |
|---|---|---|
| 1 | Hero · `page` | `chooserTitle`, `chooserNote` |
| 2 | Region chooser · `default` | три региона → `/{region}/{next}`; подсказанный выделен рамкой и подписью |
