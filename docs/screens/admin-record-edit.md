# Экран: Админка — форма записи `/admin/{resource}/{id}` и `/admin/{resource}/new`

Код: `src/app/admin/(dashboard)/[resource]/[id]/page.tsx`, `…/new/page.tsx`,
`src/components/admin/ResourceForm.tsx`, `WorkflowPanel.tsx`, экшены `src/admin/actions.ts`,
логика `src/admin/workflow.ts`, `src/admin/engine.ts`. Восстановлено по коду `59169da`.

## Доступ
Любая роль (`requireUser`: сессия + пройденная 2FA). `resource` не из `RESOURCES` или запись не найдена → 404.
Ресурсы: `solutions`, `publications`, `news`, `webinars`, `team`, `jobs`, `pages`, `products`, `redirects`.

## Данные
`getEditable()` — live-строка с наложенным pending-черновиком; список продуктов (для селекта);
до 50 ревизий. Preview-ссылка — JWT на 7 дней (`/api/preview?token=…`), если у ресурса
есть `previewUrl` (solutions, team, jobs, pages).

## Форма
Генерируется из `resource.fields`, сгруппирована по `section`. Типы полей: text, slug, textarea,
markdown (Tiptap), json, link, table (редактор спецификаций, вставка из Excel), number, boolean, select,
date, image (пикер медиатеки + загрузка), url, regions, region, product, status, repeater (drag-сортировка,
свернуть, дублировать, вложенные), stringList.
- Поля `status` в форме нет (флоу админки pub-new, 2026-11-12): на сайт запись попадает только кнопкой **Publish**.
  Сохранение (автоматическое, «Create draft», правка на странице, секции, замена файла, restore) никогда не публикует.
- **Месяц и год** (`month`, флоу pub-new): поле «Published» у публикаций — выбор месяца, хранится первым числом месяца.
- **Поля `onPage` (ADR-007, 2026-11-12)** в форме не показываются: содержимое страницы правится на странице. Вместо них —
  блок «Page content» со ссылкой «Edit on page ✎». Сохранение формы оставляет их как есть (черновик поверх live).
  Терапии: в форме Basics (без breadcrumb) и SEO; текстовые страницы: без `bodyHtml`. Новая запись получает список блоков
  из шаблона (`src/blocks/templates.ts`).
- **UnsavedGuard**: предупреждение при уходе с несохранённой формой + локальная копия в `localStorage`
  (`rm-draft:{resource}:{id|new}`) с восстановлением.

## Валидация (сервер, `parseField`)
| Тип | Правило / сообщение |
|---|---|
| required (text/textarea/select/status/url/date/region/markdown) | «Required» (пустой Tiptap `<p></p>` = пусто) |
| url | `http(s)://`, `mailto:` или `/…` → иначе «Must be an absolute URL, mailto: or a path» |
| slug | нормализация в `a-z0-9-` |
| number | «Must be a number»; пусто → 0 |
| date | `YYYY-MM` или `YYYY-MM-DD` → «Use YYYY-MM or YYYY-MM-DD» |
| region | `us|ous|apac` → «Invalid region» |
| json | валидный JSON → «Invalid JSON» |
| link | `{label, href}`; без `href` → «Link needs a URL» |
| table / repeater | валидный JSON (repeater — массив); **подполя не валидируются** |
| уникальность | «A record with this slug/region already exists.» |
**Сводка ошибок** (флоу pub-error, GOV.UK): над формой «{N} field(s) need attention» и список подписей полей — ссылки
к полям; у поля — текст ошибки; фокус переходит на сводку.

## Сохранение и публикация (флоу pub-new / pub-error / pub-live)
| Состояние записи | Как сохраняется | Нижняя панель |
|---|---|---|
| Новая | кнопка **Create draft** → черновик, редирект на `/admin/{resource}/{id}` | «Draft · not on the site» · Create draft |
| Не опубликована | **автоматически** через 2 с после правки и при уходе из поля; правка на месте | «Draft · not on the site» · «Saved automatically · 10:42. Visitors see it only after you publish.» · **Publish** |
| Опубликована | автоматически; изменения в `drafts`, live не меняется | «Live» / «Live, with unpublished changes» · то же · **Publish changes** |
| `products`, `redirects` (без workflow) | кнопка **Save** → сразу в live | Save |
- Автосохранение пропускает форму с ошибками: «Not saved: {N} field(s) need attention» (сводка — по Publish).
  Ошибка сервера → «Not saved: {причина}», правка остаётся в форме.
- **Publish** в форме сохраняет её и публикует; при ошибках не публикует и показывает сводку.
- После Publish: «Live on {адрес} · View on the site ↗» (если у записи есть адрес на сайте), иначе «Published».
- В демо автосохранения нет (нет сервера): «Demo: changes are not saved».

## Панель workflow (только ресурсы со `status`)
| Элемент | Когда показан | Кто может |
|---|---|---|
| Live-статус, плашка «Unpublished changes by … · дата» | всегда / при pending | — |
| «Scheduled to publish …» | если `publishAt` | — |
| **Publish / Publish changes** | в нижней панели формы (не в панели справа: публикуется то, что в форме, а не последнее автосохранение) | любая роль (согласования нет, ADR-006) |
| **Unpublish** | запись live | любая роль; неопубликованные правки (pending) переходят в саму запись (ревизия «Unpublished: pending changes kept in the record»), одобрение сбрасывается, расписание отменяется |
| **Discard changes** | есть pending | любая роль |
| Preview ↗ (+ «share this link — valid 7 days»), **Edit on site ✎** | если есть `previewUrl` | любая |
| **Schedule publication** (datetime-local, Set, clear) — «Publish later» | всегда | любая роль; время — по Израилю, подпись «Time zone: Israel (UTC+2/+3)» по дате |
| **History**: список ревизий, restore, «Compare ↗» (если > 1) | всегда | любая роль |
| **Copy to {REGION}** (в шапке) | только `solutions` | дубликат как draft в другом регионе |

Уведомления после действий — через query-параметры: `published`, `unpublished`, `discarded`,
`scheduled`, `restored`, `error`.

## Известные расхождения (код ↔ заявленная модель) — см. BACKLOG P0
- Unpublish, Discard, Schedule, restore, bulk delete — без проверки роли.
