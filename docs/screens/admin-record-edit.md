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

## Иерархия (2026-11-24, разбор с Mobbin, черновик v2 «тише» одобрен владелицей)
- Шапка: «← Back» маленькой кнопкой у крошек, название записи, под ним — тип записи меткой («News item»). Статус в
  шапке не повторяется — он в карточке справа и в нижней панели. Create {регион} version — в шапке, как раньше.
- **Поля — одной белой карточкой**, разделы внутри — тихими подзаголовками с линией (не отдельными карточками). Первая
  группа без подзаголовка. Разделы коллекций: News — Picture, Where it shows; Publications — Links and PDF, Abstract,
  Where it shows; Webinars — Picture, Where it shows; Team — Photo, Where it shows; Jobs — How to apply, Where it shows;
  Events — Event, Registration, After the event (как было). Ни одно поле не пропадает.
- Картинка — превью 150 px (16:10) с кнопками Choose from library · Upload · Remove; адрес файла — мелким полем под ними.
- Да/нет-поля (Featured, Hide from search engines, Permanent) — переключателем (`role="switch"`).
- Регионы (Show in regions) — кнопками-чипами в одну строку.
- У «Title in Google» и «Description in Google» — счётчик «{n} / 60», «{n} / 155» у подписи поля (жёлтый, если больше).
- Справа **одна карточка статуса** (см. «Панель workflow»), внутри неё же — «Publish later…» и History.
- Нижняя панель: слева точка и статус словами, затем текст автосохранения; справа кнопка. Неактивная Publish — с
  видимой причиной «No changes». На телефоне панель стоит над нижней навигацией админки (раньше пряталась под ней).

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
  Терапии: в форме Basics (без breadcrumb) и «Google and sharing» (было SEO); текстовые страницы: без `bodyHtml`. Новая запись получает список блоков
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
| Не опубликована | **автоматически** через 2 с после правки и при уходе из поля; правка на месте | «Draft · not on the site» · «Saved automatically · 10:42» · **Publish** |
| Опубликована | автоматически; изменения в `drafts`, live не меняется | «On the site» / «Changes waiting» · то же · **Publish changes** (без правок — неактивна, рядом «No changes») |
| `products`, `redirects` (без workflow) | кнопка **Save** → сразу в live | Save |
- Автосохранение пропускает форму с ошибками: «Not saved: {N} field(s) need attention» (сводка — по Publish).
  Ошибка сервера → «Not saved: {причина}», правка остаётся в форме.
- **Publish** в форме сохраняет её и публикует; при ошибках не публикует и показывает сводку.
- После Publish: «Live on {адрес} · View on the site ↗» (если у записи есть адрес на сайте), иначе «Published».
- В демо автосохранения нет (нет сервера): «Demo: changes are not saved».

## Панель workflow (только ресурсы со `status`) — одна карточка справа (2026-11-24)
| Элемент | Когда показан | Кто может |
|---|---|---|
| Крупный статус точкой и словом: On the site · Changes waiting · Draft · not on the site | всегда | — |
| Жёлтая плашка «{кто} · {когда}. Visitors see the old version until you publish.» (у черновика — «…Not on the site until you publish.») | при pending | — |
| «Published {дата} by {кто}» — по последней ревизии `published` | запись на сайте | — |
| «Publishes {дата, время} (Israel time)» | если `publishAt` | — |
| **Publish / Publish changes** | в нижней панели формы (не в карточке: публикуется то, что в форме, а не последнее автосохранение) | любая роль (согласования нет, ADR-006) |
| **Unpublish** | запись live | любая роль; неопубликованные правки (pending) переходят в саму запись (ревизия «Unpublished: pending changes kept in the record»), одобрение сбрасывается, расписание отменяется |
| **Discard changes** | есть pending | любая роль |
| **Delete draft** | запись не на сайте (не `published`), не Home/About… | админ; «Delete «{название}»? This cannot be undone.» → запись и её расписание удаляются, возврат в список с «Deleted 1 item(s).». Опубликованную — сначала Unpublish (UX-прогон 2026-11-14) |
| Preview ↗ (+ «the link works 7 days»), **Edit on page ✎** | если есть `previewUrl` | любая |
| **Publish later…** — раскрывается в дату-время, Set, clear; рядом всегда видно «Time zone: Israel (UTC+2/+3)»; раскрыто, если время уже задано | всегда | любая роль |
| **History** — лентой: значок по типу (сохранено · опубликовано · восстановлено · создано), кто, когда, заметка; **Restore**; «Compare» (если > 1) | если есть ревизии | любая роль |
| **Create {регион} version** (в шапке; было «Copy to {REGION}») | только `solutions`, только регионы, где этой терапии ещё нет | дубликат как draft в этом регионе |

Уведомления после действий — через query-параметры: `published`, `unpublished`, `discarded`,
`scheduled`, `restored`, `error`.

## Известные расхождения (код ↔ заявленная модель) — см. BACKLOG P0
- Unpublish, Discard, Schedule, restore, bulk delete — без проверки роли.

## Слова в форме (прогон «глазами новичка», 2026-11-15, `docs/audits/admin-walkthrough-2026-11-15.md`)
- Slug → **Address** («The end of the page link…; if you change it, old links keep working» — редирект создаётся при
  публикации); Sort order → **Order** («Smaller numbers come first»); Meta title / Meta description → **Title in Google**
  (до 60) / **Description in Google** (до 155); Social share image → **Picture for links (LinkedIn and others)**; раздел
  SEO → **Google and sharing**.
- **Регион страницы** у созданной записи — текстом, не выпадашкой («For another region, create its version on the page's
  screen»); названия регионов в формах — короткие, как в меню регионов.
- Статус — словами: On the site · Draft · New · In progress · Done · Spam. Пустой блок History не показывается.
- В шапке записи — без технического номера («News item», а не «News item #1») (2026-11-15).
