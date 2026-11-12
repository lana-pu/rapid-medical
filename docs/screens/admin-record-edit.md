# Экран: Админка — форма записи `/admin/{resource}/{id}` и `/admin/{resource}/new`

Код: `src/app/admin/(dashboard)/[resource]/[id]/page.tsx`, `…/new/page.tsx`,
`src/components/admin/ResourceForm.tsx`, `WorkflowPanel.tsx`, экшены `src/admin/actions.ts`,
логика `src/admin/workflow.ts`, `src/admin/engine.ts`. Восстановлено по коду `59169da`.

## Доступ
Любая роль (`requireUser`: сессия + пройденная 2FA). `resource` не из `RESOURCES` или запись не найдена → 404.
Ресурсы: `solutions`, `publications`, `news`, `webinars`, `team`, `jobs`, `pages`, `products`, `redirects`.

## Данные
`getEditable()` — live-строка с наложенным pending-черновиком; список продуктов (для селекта);
до 50 ревизий; настройки workflow. Preview-ссылка — JWT на 7 дней (`/api/preview?token=…`), если у ресурса
есть `previewUrl` (solutions, team, jobs, pages).

## Форма
Генерируется из `resource.fields`, сгруппирована по `section`. Типы полей: text, slug, textarea,
markdown (Tiptap), json, link, table (редактор спецификаций, вставка из Excel), number, boolean, select,
date, image (пикер медиатеки + загрузка), url, regions, region, product, status, repeater (drag-сортировка,
свернуть, дублировать, вложенные), stringList.
- Опубликованная запись: поле `status` скрыто (управляется панелью), подсказка «saving creates pending changes».
- Неопубликованная запись: `status = published` в форме — это Publish по тем же правилам, что и кнопка (`canPublish`).
  Без права (согласование включено, роль editor, нет approve) запись сохраняется неопубликованной с сообщением
  «Saved, not published: needs approval». Сохранение из других мест (правка на странице, секции, замена файла в
  медиатеке, restore) никогда не публикует запись само (2026-11-12, ревью безопасности).
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
Общая ошибка формы: «Please fix the highlighted fields.»

## Сохранение (Save)
| Состояние записи | Результат | Уведомление |
|---|---|---|
| Новая | Вставка со `status = draft` → редирект на `/admin/{resource}/{id}` | «Saved.» |
| Не опубликована | Правка на месте; если в форме выбран `published` → сразу публикация | «Saved.» |
| Опубликована | Изменения в `drafts`, live не меняется | «Saved as pending changes…» |
| `products`, `redirects` (без workflow) | Сразу в live | «Saved.» |

## Панель workflow (только ресурсы со `status`)
| Элемент | Когда показан | Кто может |
|---|---|---|
| Live-статус, плашка «Unpublished changes by … · дата», статус ревью и заметка | всегда / при pending / при approval | — |
| «Scheduled to publish …» | если `publishAt` | — |
| **Publish / Publish changes** | есть pending или запись не live | кнопка disabled, если approval включён, роль editor и не `approved` |
| **Unpublish** | запись live | любая роль |
| **Discard changes** | есть pending | любая роль |
| Preview ↗ (+ «share this link — valid 7 days»), **Edit on site ✎** | если есть `previewUrl` | любая |
| **Review**: заметка + Submit for review / Approve / Request changes | approval включён и (pending или не live) | Approve/Request changes — admin, approver |
| **Schedule publication** (datetime-local, Set, clear) | всегда | любая роль |
| **History**: список ревизий, restore, «Compare ↗» (если > 1) | всегда | любая роль |
| **Copy to {REGION}** (в шапке) | только `solutions` | дубликат как draft в другом регионе |

Уведомления после действий — через query-параметры: `published`, `unpublished`, `discarded`, `review`,
`scheduled`, `restored`, `error`.

## Известные расхождения (код ↔ заявленная модель) — см. BACKLOG P0
- Подсказка расписания говорит «if approved», но `publishDue()` не проверяет одобрение.
- Unpublish, Discard, Schedule, restore, bulk delete — без проверки роли.
