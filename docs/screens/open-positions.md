# Экран: Вакансии `/open-positions`

Код: `src/app/(site)/open-positions/page.tsx`, блоки собирает `jobsToBlocks()` (`src/blocks/from-settings.ts`). Данные: записи `jobs`.
Страница одной вакансии `/open-positions/{slug}` — шаблон записи, не собирается из блоков.

## Блоки (одна секция)
| Порядок | Блок · вариант | Из полей |
|---|---|---|
| 1 | Hero · `page` | «Join us», не редактируется |
| 2 | Jobs · `list` | название, отдел и город, ссылка на вакансию. Пусто — строка со ссылкой на общую заявку `/careers#general-interest` |
