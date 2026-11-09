# ADR-003 — Редакционный процесс: live-таблица + отдельная таблица черновиков

- **Статус:** принято (ретроспективно; коммит `9d4741d` «Admin block B», дополнен `d677723` on-page editor)
- **Код:** `src/admin/workflow.ts`, `src/lib/content.ts`, `src/lib/settings.ts`, `src/db/schema.ts` (`drafts`, `setting_drafts`, `revisions`)

## Решение
- Таблица контента хранит **то, что видит сайт**. Правки опубликованной записи идут в `drafts`
  (одна строка на запись, `data` = полный снимок полей), live не трогается до Publish.
- Неопубликованные записи правятся на месте.
- Настройки-синглтоны — аналогично через `setting_drafts` (только из on-page editor; форма Site settings
  пишет сразу в live).
- Каждое сохранение/публикация/restore → неизменяемая ревизия в `revisions`.
- Preview = Next draft mode: публичный слой показывает неопубликованные строки и накладывает `drafts`.
- Согласование (`requireApproval`) — опционально, по умолчанию выключено.
- Отложенная публикация — `drafts.publishAt` + cron-эндпоинт.

## Обоснование
README: «Editing a published record never touches the site»; «Off by default — a one-person team just publishes».
**Выведено:** отдельная таблица вместо колонок `draft_*` / версионных строк — чтобы workflow был
одинаковым для всех ресурсов без изменения их схем (резолвится по `resource` + `recordId`).

## Последствия
- `drafts.recordId` без внешнего ключа (полиморфная ссылка) → удаление записи не чистит её
  черновики/ревизии; осиротевший черновик с `publishAt` ломает cron (BACKLOG P0).
- Ресурсы без `status` (`products`, `redirects`) идут мимо workflow.
- Проверки прав разнесены по экшенам; в нескольких путях их нет (BACKLOG P0).
