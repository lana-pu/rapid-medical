# 2026-11-23 — Админка и редактор: регионы и модель прав

**Задача:** ветка работы над админкой и редактором — что в бэклоге, что не решено с регионами и правами; решения
владелицы → спека → код.

## Что сделано
- Разбор бэклога по админке и редактору; список открытого по регионам и правам.
- **Название региона `ous`** — «Europe & Middle East» везде, как на Duda (длинной подписи «Europe, Middle East, Latin
  America & Australia» на Duda нет — она была только в нашем `REGION_LABELS`). Карта стран не менялась (и так с Duda).
  Письмо Emily, вопрос 16 — только про карту стран.
- **Модель прав** (ADR-006 → «Права»): editor — тексты и картинки, страницы из шаблонов, публикация, из действий с
  секциями только Hide/Show и подпись вкладки; designer — + секции и вкладки (добавить, сдвинуть, скопировать, удалить,
  вариант), шаблоны; admin — + удаление записей, Products, Old links (Broken links и Redirects), люди, Integrations.
- **Article** («Страница из документа») — четвёртый шаблон рядом с Text, Landing, Therapy; в New page его пока нет.
- **Код прав:** сервер — `editBlocks` (`editorMayDo`, Undo/Redo editor проходит, только если `sameLayout`), удаление
  (`canDelete`), ресурсы `adminOnly` (страницы, формы, bulk, inline, коллекции редактора), Old links — `requireAdmin`.
  UI — нет кнопок, которых роли не положено: ＋ Add, ↑↓, Copy, Delete, перетаскивание, вкладки (кроме подписи), Delete
  в списках и «Delete draft», ссылки на Products / Old links / «broken links» на главной админки.
- Проверки: tsc, lint, unit 227, e2e на продакшн-сборке 81/81 (тест ролей расширен; «two editors» — второй делает Hide).

## Изменённые файлы
Коммиты `33b49d83`, `b243df49`, `5e28edd7`: `docs/spec.md` (Регионы, Доступы), ADR-006, `BACKLOG.md`, `site-ia.md`,
письмо Emily, `screens/on-page-editor.md`, `screens/admin-people.md`; `src/lib/regions.ts`, `src/lib/auth.ts`,
`src/blocks/ops.ts`, `src/admin/{page-editor,actions,resources,inline,collections,site-tree,home}.ts`, страницы
`/admin/[resource]/*`, `site/[section]`, Settings (layout, Overview, not-found-log), `BulkBar`, `WorkflowPanel`,
`PeopleTools`, `editor-ui.tsx`, `EditorOverlay.tsx`; тесты `blocks-ops`, e2e `admin`, `editor`.

## Принятые решения
- Права ролей, Article как шаблон, правка шаблона не меняет созданные страницы: ADR-006 → «Права».
- Наследование регионов не делаем (риск для регуляторных формулировок; один текст везде правит таблица регионов): ADR-006.
- Названия регионов — как на Duda, поменяем по слову клиента: `spec.md → Регионы и URL`.

## Находки
- Undo/Redo редактора идёт через `op: "set"` — без сравнения состава секций им можно было бы обойти запрет; отсюда
  `sameLayout` (подписи вкладок, скрытие и тексты — не состав).
- Демо на GitHub Pages (`demo-store`, `canDesign: false`) теперь показывает вид редактора — без Add и перестановки.

## Открытые вопросы / следующие шаги
- Кто admin (владелица или кто-то у клиента), есть ли дизайнер у клиента — BACKLOG, решения №5.
- Шаблон Article в New page (вместе с сущностью «материал», ADR-009, и «Create from a document»).
- Правка шаблонов дизайнером («Save as template»).
- Нужен ли в демо переключатель роли, чтобы показывать и вид дизайнера.

## Связанное
- ADR: ADR-006, ADR-007, ADR-009
- Предыдущая сессия: 2026-11-22-wireframes-all-on-system.md
