# Экран: Analytics (`/admin/analytics`)

Решение владелицы 2026-11-15 (`docs/analytics-admin.md`): гибрид — заявки из нашей базы и свой счётчик без cookie;
GA4 остаётся у маркетинга (ссылка). Пространство **📊 Analytics** на полоске проекта Website; без второй колонки.

## Шапка
Название, подпись, под ней **главный источник словами** обычным текстом (без плашки): «In the last 30 days, LinkedIn
brought 12 visits and 2 requests». Справа — период **7 · 30 · 90 days** (`?days=`) и «Google Analytics ↗» (если в
Integrations задан ID). Сравнение — с прошлым таким же периодом.

## Иерархия (решение владелицы 2026-11-24)
Три уровня вместо десяти карточек одного веса: (1) главные числа и график одним блоком; (2) четыре панели — откуда
приходят, заявки, страницы, страны; второстепенные списки — вкладками внутри панели. Ни один прежний список не убран.

## Числа и график — один блок
- Полоса чисел: **Visits · Pages viewed · Requests** (заявки без спама) · **Requests per 100 visits**. Под числом —
  изменение к прошлому периоду: «+3 vs previous 30 days» (плюс — зелёным) или «same as previous 30 days».
- Первые три — **вкладки графика**: выбранная подсвечена, график под полосой показывает её по дням (визиты, просмотры
  или заявки). По умолчанию — Visits. Доля — просто число, без графика; при нуле визитов — «—» и «no visits to compare».
- График — столбики по дням (одна серия, одна краска; подсказка с датой и числом при наведении), даты первого и
  последнего дня под ним. Нет ничего за период — «No visits recorded yet» / «No requests in this period».

## Панели (две колонки с 896 px, ниже — одна)
| Панель | Вкладки | Колонки чисел |
|---|---|---|
| **Where people come from** | **Sources** (LinkedIn, Google, Direct, Email, другие сайты) · **LinkedIn posts & campaigns** (по `utm_campaign`) | Visits · Requests |
| **Requests** | **What they ask for** · **Region** · **Page before the form** (страница перед формой или первая страница визита) | Requests |
| **Pages** | **Most visited** · **PDFs opened** | Views · Opens |
| **Countries** | — | Visits · Requests |
- Над числами — **подписи колонок** (раньше «Direct 0 20» без подписей). Заявки — главное число: тёмным и жирнее.
- Строка — светлая полоска длиной по первому числу, название поверх, числа справа.
- Пояснения — под таблицей мелко: про UTM («Links with UTM tags… are named by their source»), про страны («From the
  visitor's network; unknown on the local build»), про PDF («PDFs opened from the site's pages»).
- **What they ask for**: у Contact Us — строка на тему (Request a demo, Instructions for Use (IFU), Support…); у
  остальных форм — одна строка на форму (Webinar recording, Job application, Event registration): какой вебинар или
  вакансия — видно в Inbox. Та же разбивка — в долях «Requests by form» на Home.
- **Страна** — словами: счётчик хранит код страны от хостинга (`US`), заявка — название из формы; в отчёте код
  переводится в название, чтобы одна страна была одной строкой (2026-11-24; раньше «US» и «United States» шли бы
  отдельно).
- Пустая вкладка — «No visits recorded yet» / «No requests in this period» / «No PDFs opened yet» / «No visits from
  tagged links yet» / «No country known yet».
- Предупреждение «There were more visits than this screen reads at once…» — над блоком чисел, как было.

## Дашборд
Блок «This week»: заявки за 7 дней (и к прошлым 7), визиты, главный источник; ссылка «Open analytics». Для его
столбиков отчёт считает и заявки по дням (`leadsByDay`, как `visitsByDay`), для полос — доли по формам и источникам
(`screens/admin-home.md → Правая колонка`).

## Данные
Заявки — `contact_submissions` (`meta`: referrer, landing_page, previous_page, utm_*), кроме `spam`. Посещения и
скачивания — `page_views` (`spec.md → Аналитика → В`). Источник считается одинаково для визитов и заявок
(`src/lib/source.ts`).
