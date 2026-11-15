# Экран: Analytics (`/admin/analytics`)

Решение владелицы 2026-11-15 (`docs/analytics-admin.md`): гибрид — заявки из нашей базы и свой счётчик без cookie;
GA4 остаётся у маркетинга (ссылка). Пространство **📊 Analytics** на полоске проекта Website; без второй колонки.

## Шапка
Название, период **7 · 30 · 90 days** (`?days=`), сравнение с прошлым таким же периодом, ссылка «Google Analytics ↗»
(если в Integrations задан ID).

## Плитки (главные числа периода)
Visits · Page views · Leads (заявки без спама) · Leads per 100 visits. Под каждым — изменение к прошлому периоду
словами («+3 vs previous 30 days»).

## Блоки
1. **Headline словами** — главный источник: «LinkedIn brought 12 visits and 2 leads».
2. **Visits by day** — столбики по дням (одна серия, одна краска; подсказка с числом при наведении).
3. **Where people come from** — источники (LinkedIn, Google, Direct, Email, другие сайты, кампании): визиты и заявки.
4. **Pages that lead to requests** — страница перед формой (или первая страница визита): сколько заявок.
5. **Most visited pages** — просмотры по страницам.
6. **Leads by form** — демо, поддержка, вебинары, карьера, события; **by region** и **by country**.
7. **Materials opened** — скачивания PDF: файл и откуда.
8. **LinkedIn and campaigns** — по `utm_campaign`: визиты и заявки.
Пустой период — «No visits recorded yet» / «No leads in this period». Строки — полоски одной краски длиной по
значению, число справа.

## Дашборд
Блок «This week»: заявки за 7 дней (и к прошлым 7), визиты, главный источник; ссылка «Open analytics».

## Данные
Заявки — `contact_submissions` (`meta`: referrer, landing_page, previous_page, utm_*), кроме `spam`. Посещения и
скачивания — `page_views` (`spec.md → Аналитика → В`). Источник считается одинаково для визитов и заявок
(`src/lib/source.ts`).
