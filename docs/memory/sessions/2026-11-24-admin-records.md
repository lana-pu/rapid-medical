# 2026-11-24 — Списки записей и форма записи: иерархия

**Задача:** следующий экран админки тем же циклом, что Home и экран страницы: Mobbin → черновик → решения → спека → код.

## Что сделано
- Разбор «как сейчас» (скриншоты), шесть экранов Mobbin (Circle, Webflow CMS, Slite, Substack, Shopify, Podia),
  черновик со сверкой «было → стало»: https://claude.ai/artifact/BRmDgGfPGSnFz8V3Rv1LbR.
- v1 владелица назвала перегруженным; v2 «тише» одобрена («ok»): без сводки-меток над списком (повторяли вкладки), без
  колонки Last change и лишних подсказок, статус в строке только необычный, статус формы не дублируется в шапке.
- Код (`ef3be4a3`):
  - Список: вкладки статуса с числами (All · On the site · Changes waiting · Scheduled · Drafts — только где есть
    записи), название в две строки, второстепенные колонки строкой под ним, миниатюра 36 px или ничего, «Changes
    waiting» / «Publishes {дата}» / «Draft» в строке, события группами Upcoming / Past, плавающая панель выбранных.
  - Форма: одна карточка с подзаголовками (разделы у News, Publications, Webinars, Team, Jobs), картинка 150 px,
    переключатели, регионы чипами, счётчики «n / 60», «n / 155» у текстов Google, одна карточка статуса справа
    (Publish later… свёрнуто, History лентой), «No changes» у неактивной Publish.
  - Дефект: на телефоне нижняя панель с Publish пряталась под навигацией админки — теперь над ней.
- Спека: `screens/admin-list.md → «Иерархия»`, `screens/admin-record-edit.md → «Иерархия»`, «Панель workflow».
- Скриншоты результата: https://claude.ai/artifact/KQPmN8EenfZED9PQfsU1Qc.

## Изменённые файлы
- `src/app/admin/(dashboard)/(content)/[resource]/page.tsx`, `[id]/page.tsx`, `new/page.tsx`
- `src/admin/engine.ts` (`ids` / `notIds` в `listRows`), `workflow.ts` (`listStates`), `fields.ts` (`max`, kind
  `number`), `resources.ts` (разделы, лимиты, колонка When убрана)
- `src/components/admin/BulkBar.tsx`, `ResourceForm.tsx`, `WorkflowPanel.tsx`, `ImageField.tsx` (`large`), `ui.tsx`
  (`StateDot`, `PageHeader` `back` / `tag`), `BackLink.tsx` (`small`)
- `tests/e2e/admin.spec.ts`, `docs/screens/admin-list.md`, `docs/screens/admin-record-edit.md`

## Принятые решения
- Статус — вкладками с числами; события — группами; форма — подзаголовками в одной карточке (рекомендации приняты).
- У записи на сайте без правок метки статуса в строке нет; колонка Status скрыта, если все записи на сайте.
- Слова статуса в форме — как в списке: On the site · Changes waiting · Draft · not on the site (было Live / Live,
  with unpublished changes). В редакторе на странице слова прежние.

## Находки
- Второстепенные колонки теперь без заголовка — сортировка по ним только через `?sort=` (в спеке).
- Локально черновиков правок нет — для проверки состояний добавлялись два временных `drafts` у news 1 и 3, удалены.

## Открытые вопросы / следующие шаги
- e2e не прогоняли (общая база, параллельная сессия); тексты статуса и «Publish later…» в e2e обновлены — проверить
  общим прогоном.
- Экран ждёт закрытия владелицей; следующий по полоске — Inbox.

## Связанное
- Предыдущая сессия: 2026-11-23-admin-page-screen.md
