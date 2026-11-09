# Экран: Вебинары `/{region}/webinars`

Код: `src/app/(site)/[seg]/webinars/page.tsx`, блоки собирает `webinarsToBlocks()` (`src/blocks/from-settings.ts`).
Данные: записи `webinars` региона.

## Блоки (одна секция)
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `page` | «Webinars», вводный текст; не редактируются | всегда |
| 2 | Webinars · `cards` | картинка, название, спикер и событие, продукт | есть вебинары |
| 3 | Form · `compact` | форма `webinar`, темы — названия вебинаров или «Webinar recording request»; регион предвыбран | всегда |
