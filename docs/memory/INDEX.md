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

## Находки (findings) — `findings/`

- [pre-launch-audit](findings/pre-launch-audit.md) — дефекты кода, чек-лист перед запуском (2026-11-05)
- [admin-ux-review](findings/admin-ux-review.md) — разбор текущей админки, основа для единой (2026-11-06)
- [admin-editor-best-practices](findings/admin-editor-best-practices.md) — практики для нетехнических редакторов, разбор прототипа v0.1 (2026-11-07)
- [block-inventory](findings/block-inventory.md) — все секции сайта, состав коллекции блоков (2026-11-07)
- Атлас исследования инструмента — `docs/research/` (этап 07 бенчмарк, 2026-11-08)
- [client-brief-lesson-content](findings/client-brief-lesson-content.md) — что клиент сказал о содержимом урока инструмента: структура секции, материал по этапам, статусы (2026-11-08)

## Сессии — `sessions/`

| Дата | Задача | Файл |
|---|---|---|
| 2026-11-09 | Сверка библиотеки блоков с сайтом; текстовые страницы, Contact и About на блоках | [2026-11-09-blocks-pages.md](sessions/2026-11-09-blocks-pages.md) |
| 2026-11-08 | Механизм блоков: реестр с вариантами, страницы терапий на блоках, витрина `/style-guide` | [2026-11-08-blocks-foundation.md](sessions/2026-11-08-blocks-foundation.md) |
| 2026-11-08 | Инструмент Tigertriever: модель контента в спеке, прототип Content Studio v0.1, сверка с материалами клиента, учебный прототип v0.3 | [2026-11-08-tigertriever-content-studio.md](sessions/2026-11-08-tigertriever-content-studio.md) |
| 2026-11-08 | Единая админка: модель работы, правка на странице, коллекция блоков | [2026-11-08-unified-admin-blocks.md](sessions/2026-11-08-unified-admin-blocks.md) |
| 2026-11-06 | Ревизия, чистка, добор с Duda | [2026-11-06-revision-duda-tails.md](sessions/2026-11-06-revision-duda-tails.md) |
