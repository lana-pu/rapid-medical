# INDEX — память проекта Rapid Medical

Реестр решений, находок и сессий. Активная работа — `state.md`; что не сделано — `BACKLOG.md`;
инфраструктура — `infrastructure.md`.

## Решения (ADR) — `decisions/`

| ID | Тема | Статус | Дата |
|---|---|---|---|
| [ADR-001](decisions/ADR-001-stack.md) | Стек: Next.js 16 + Drizzle + Postgres + своя админка | принято (ретро) | 2026-10-28 / зафикс. 2026-11-05 |
| [ADR-002](decisions/ADR-002-region-in-path.md) | Регион в пути URL, legacy-поддомены → 301 | принято (ретро) | 2026-11-05 |
| [ADR-003](decisions/ADR-003-drafts-vs-live.md) | Live-таблица + `drafts` / `setting_drafts` / `revisions` | принято (ретро) | 2026-11-05 |
| [ADR-004](decisions/ADR-004-storage-drivers.md) | Медиа: драйверы `local` / `s3`, медиа временно в git | принято частично | 2026-11-05 |
| [ADR-005](decisions/ADR-005-one-repo-unified-admin.md) | Один репозиторий и единая админка на сайт и инструмент | принято | 2026-11-05 |
| [ADR-006](decisions/ADR-006-admin-work-model.md) | Как люди работают в единой админке: роли, комментарии, регионы | принято | 2026-11-06 |
| [ADR-007](decisions/ADR-007-page-as-block-list.md) | Страница хранится списком блоков; синглтоны — `site_pages`; списки — источники при показе | принято | 2026-11-12 |
| [ADR-008](decisions/ADR-008-security-baseline.md) | Базовая линия безопасности: 2FA с лимитами, переадресации на свой сайт, загрузки по содержимому, обязательные секреты | принято | 2026-11-13 |
| [ADR-009](decisions/ADR-009-publications-and-news-one-type.md) | Публикации и новости — одна сущность с видом; своя страница по желанию; дизайн страницы по виду | принято направление | 2026-11-14 |
| [ADR-010](decisions/ADR-010-tool-stack-same-app.md) | Инструмент Tigertriever — в том же Next.js и той же базе; Studio — раздел админки; пакет — ZIP из зафиксированных ревизий; не Supabase | предложение | 2026-11-16 |

## Находки (findings) — `findings/`

- [pre-launch-audit](findings/pre-launch-audit.md) — дефекты кода, чек-лист перед запуском (2026-11-05)
- [admin-ux-review](findings/admin-ux-review.md) — разбор текущей админки, основа для единой (2026-11-06)
- [admin-editor-best-practices](findings/admin-editor-best-practices.md) — практики для нетехнических редакторов, разбор прототипа v0.1 (2026-11-07)
- [block-inventory](findings/block-inventory.md) — все секции сайта, состав коллекции блоков (2026-11-07)
- Атлас исследования инструмента — `docs/research/` (этап 07 бенчмарк, 2026-11-08)
- [client-brief-lesson-content](findings/client-brief-lesson-content.md) — что клиент сказал о содержимом урока инструмента: структура секции, материал по этапам, статусы (2026-11-08)
- [website-audit-ga4-oct-2026](findings/website-audit-ga4-oct-2026.md) — аудит Emily по GA4 (13.10.2026): что закрыто сборкой, что нет, предложения (2026-11-10)
- [client-email-2026-11-10](findings/client-email-2026-11-10.md) — письмо Emily: COMANECI US = только номера каталога, доступы, Mailchimp, лидов нет, запрос DAM, заголовок главной (2026-11-10)
- [duda-form-leads-2026-11-16](findings/duda-form-leads-2026-11-16.md) — выгрузки форм Duda: 197 заявок в Contact us, клиенты и дистрибьюторы без ответа; куда уходят уведомления (2026-11-16)
- [embed-external-pages-2026-11-16](findings/embed-external-pages-2026-11-16.md) — встраивать страницы журналов нельзя: 63 из 94 ссылок публикаций запрещают, остальное — чужой сайт в окне (2026-11-16)
- [create-from-document-probe-2026-11-16](findings/create-from-document-probe-2026-11-16.md) — проба «Create from a document»: текст SUCCESS и DISTALS извлекается, ClinicalTrials.gov даёт паспорт; SUCCESS — 8 центров в реестре против 17 в статье, PDF под CC BY-NC (2026-11-16)
- [publication-duplicates-2026-11-16](findings/publication-duplicates-2026-11-16.md) — дубли публикаций: 27 групп, уникальных статей 74 из 102 (проверено); пары делят регионы, посетитель дублей не видит, но число на главной считает записи (2026-11-16)
- [design-references](findings/design-references.md) — референсы визуала: решено — тёмная тема; v3 — 12 сайтов с сильной арт-дирекцией, рецепт для Rapid Medical (2026-11-11)
- [site-ux-pass-2026-11-13](findings/site-ux-pass-2026-11-13.md) — юзабилити публичного сайта глазами нового посетителя (2026-11-13)
- [evidence-benchmark-2026-11-14](findings/evidence-benchmark-2026-11-14.md) — как конкуренты и смежные компании показывают клинические данные; практики и анти-паттерны (2026-11-14)

## Сессии — `sessions/`

| Дата | Задача | Файл |
|---|---|---|
| 2026-11-15 | Админка глазами пользователя: дашборд, Inbox как Gmail, экран страницы, Settings блоками, Google-тексты, медиатека по группам | [2026-11-15-admin-ux.md](sessions/2026-11-15-admin-ux.md) |
| 2026-11-15 | Закрытые страницы сайта в коде (ветка `site-redesign`): Contact, Legal, About, Careers, обзор терапий, окно региона | [2026-11-15-site-redesign-code.md](sessions/2026-11-15-site-redesign-code.md) |
| 2026-11-14 | Страницы сайта на вайрфреймах по одной: 7 закрыто, страница из документа, ADR-009, Evidence-ресёрч | [2026-11-14-site-pages-wireframes.md](sessions/2026-11-14-site-pages-wireframes.md) |
| 2026-11-12 | Рабочий редактор страниц: список блоков в базе, секции, проверка, история, Pages, демо | [2026-11-12-page-editor.md](sessions/2026-11-12-page-editor.md) |
| 2026-11-11 | Аудит Emily по GA4: регионы, кнопки продукта, аналитика, события, медиа-окно, JSON-LD | [2026-11-11-emily-audit-site.md](sessions/2026-11-11-emily-audit-site.md) |
| 2026-11-11 | Инструмент Tigertriever: атлас 00–10, учебные v0.4–v0.5, Studio (время пунктов, различия), S0 с проверкой хранения | [2026-11-11-tigertriever-learner-v05.md](sessions/2026-11-11-tigertriever-learner-v05.md) |
| 2026-11-10 | Набор для вайрфреймов (`/wireframes`), флоу редактора сайта | [2026-11-10-wireframes-kit.md](sessions/2026-11-10-wireframes-kit.md) |
| 2026-11-09 | Весь сайт на блоках: списки, Gallery, Region chooser, варианты | [2026-11-09-whole-site-on-blocks.md](sessions/2026-11-09-whole-site-on-blocks.md) |
| 2026-11-09 | Сверка библиотеки блоков с сайтом; текстовые страницы, Contact и About на блоках | [2026-11-09-blocks-pages.md](sessions/2026-11-09-blocks-pages.md) |
| 2026-11-08 | Механизм блоков: реестр с вариантами, страницы терапий на блоках, витрина `/style-guide` | [2026-11-08-blocks-foundation.md](sessions/2026-11-08-blocks-foundation.md) |
| 2026-11-08 | Инструмент Tigertriever: модель контента в спеке, прототип Content Studio v0.1, сверка с материалами клиента, учебный прототип v0.3 | [2026-11-08-tigertriever-content-studio.md](sessions/2026-11-08-tigertriever-content-studio.md) |
| 2026-11-08 | Единая админка: модель работы, правка на странице, коллекция блоков | [2026-11-08-unified-admin-blocks.md](sessions/2026-11-08-unified-admin-blocks.md) |
| 2026-11-06 | Ревизия, чистка, добор с Duda | [2026-11-06-revision-duda-tails.md](sessions/2026-11-06-revision-duda-tails.md) |
