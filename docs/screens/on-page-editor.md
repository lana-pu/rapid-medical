# Экран: On-page editor («Edit site»)

Код: `src/components/site/editable.tsx` (`<E>`, `<EMedia>`), `src/components/editor/EditorOverlay.tsx`
(клиент, грузится только в режиме редактора), `src/admin/inline.ts` (server actions), `src/lib/editing.ts`,
`src/app/api/editor/route.ts`. Демо-режим: `src/components/editor/demo-store.ts`, `DemoShell.tsx`.
Восстановлено по коду `59169da`.

## Доступ и вход
- Вход: сайдбар админки «Edit site ✎» или «Edit on site ✎» в записи → `GET /api/editor?on=1&redirect=/path`.
- Нужна сессия с пройденной 2FA (любая роль). Без сессии → `/admin/login?next=…`, после входа редактор
  включается автоматически. Выход: `/api/editor?off=1`.
- Режим активен, когда одновременно: Next draft mode включён + cookie `rm_edit=1` + валидная сессия.
- В режиме редактора сторонние скрипты (GA, UserWay) не грузятся; баннер preview скрыт.
- Статическое демо (`NEXT_PUBLIC_DEMO=1`): редактор всегда включён, сохраняет в `localStorage`, кнопка
  «View as visitor» прячет контуры.

## Что можно редактировать
Только поля, обёрнутые в `<E>`/`<EMedia>` на странице; сервер проверяет путь поля по схемам
`resources.ts` / `settings.ts` (`resolveField`) и допустимый вид правки (`allowedKind`).
| Вид | Поля | Взаимодействие |
|---|---|---|
| text | text / textarea / slug | Клик → contenteditable (plaintext). Enter — сохранить, Esc — отменить, Shift+Enter — перенос (только textarea сохраняет переносы) |
| rich | markdown (regulatory, references, тела страниц, био, вакансии) | Клик → панель с полным Tiptap |
| link | label + href | Поповер с двумя полями |
| media | image / url | Replace image / Replace video / Remove video / Clear image через медиатеку |
Структура (добавление/удаление/порядок блоков, таблицы, slug, SEO) — только в формах админки, намеренно.

## Сохранение
| Цель | Результат |
|---|---|
| Опубликованная запись | pending-черновик в `drafts` (виден в редакторе и preview, не виден посетителям) |
| Неопубликованная запись | правка на месте |
| Настройка-синглтон (`settings:home`, `about`, `careers`, `evidence`, `therapies:*`, `regional`, `contact`) | `setting_drafts` |
Ошибка → тост «Not saved: …», текст возвращается к исходному.

## Нижняя панель
| Элемент | Условие |
|---|---|
| «Editing as {имя}» | всегда |
| «N pending changes on this page ▸» (раскрывающийся список со ссылками в админку) / «No pending changes on this page» | по `pendingFor()` для всех целей на странице |
| **Publish** | есть pending и пользователь может опубликовать всё (`canPublishAll`) |
| **Submit for review** | есть pending и публиковать всё нельзя (approval включён, editor). Запрашивает заметку через `prompt` |
| **Discard** | есть pending; `confirm` «Discard all pending changes on this page?» |
| Статус / тост | «Saving…», «Saved as pending change», «Published N changes», «Blocked: …», «Nothing to publish» |

Publish публикует **все** pending-цели страницы, уважая `canPublish`; заблокированные перечисляются.
Черновики настроек при approval + роли editor блокируются; на ревью отправляются только ресурсы (не настройки).
Неопубликованная запись на странице считается «pending (not published yet)» и публикуется кнопкой Publish.

## Ограничения (по коду)
- Server actions `saveField` принимают любую цель, которую разрешает схема, — не только те, что
  выведены на странице (например, `settings:integrations.gaMeasurementId`). См. BACKLOG P0.
- Нет блокировки одновременной правки двумя редакторами: последний `saveField` перезаписывает черновик.
