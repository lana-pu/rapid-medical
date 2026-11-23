# 2026-11-23 — Ветки в вайрфреймах; черновик Webinars в коде

**Задача:** Home и страница терапии в вайрфреймах кодом ветки `therapy-home`; затем Webinars — следующая страница цикла:
решения владелицы → черновик к обсуждению.

## Что сделано
- `render-branch.sh <ветка>`: последний коммит ветки во временном worktree, копия локальной базы + миграции и шаги
  сборки ветки (`bootstrap.ts`), dev-сервер 3142 → `rm-render-branch-<ветка>.json`. У каждой ветки свой снимок и свой
  CSS (`.rmxb-<ветка>`); узлы помечаются `"branch": "<ветка>"`. Worktree, сервер, копия базы удаляются.
- Прототип и `site-pages`: Home и терапия — настоящие страницы `therapy-home@9f3441b1`.
- Новый узел `rm-dialog` {path, act}: окно, которое открывает настоящая страница; в снимок — только `<dialog>`.
- Webinars: показ был 2026-11-14, обсуждение 2026-11-23. Ответы владелицы: (1) отдельная страница, но на строках и
  фильтре Evidence/News — когда будет knowledge base, станет её срезом; (3) на строке дата и длительность, одна кнопка;
  (4) фильтр по продукту сам от 9 вебинаров; (5) регион без вебинаров — пустое состояние.
- Ветка `webinars-draft` (`60384c91`, worktree `../rapid-medical-webinars`): `webinars.library` на «общей линии»,
  `FilterChips` вынесен из архива Evidence (общий), окно запроса записи с формой, `durationMin` (миграция 0032,
  поле «Duration, min»), `?product=` открывает список отфильтрованным, revalidate `/apac/webinars`, спека
  `docs/screens/webinars.md` и `spec.md` в ветке. tsc, 226 тестов; e2e переписаны, не запускались.
- `site-pages`: группа «7 · Webinars — черновик в коде» — 9 экранов (как в базе, 12 с фильтром, с терапии, окно,
  отправлено = вариант А, вариант Б — эскиз, пустой APAC, телефон, окно на телефоне). Переопубликованы site-pages и прототип.

## Изменённые файлы
- main `9acc07f2`: `docs/flows/blocks-kit/{key.js,render.cjs,make-pack.py,pack.template.js,render-branch.sh}`,
  `docs/flows/site-pages.{py,json,md}`, `site-prototype.{py,json}`, `pack.js`, `rm-render-branch-*.json`
  (вместо `rm-render-branch.json`), `docs/DESIGN.md` (раздел «Вайрфреймы»).
- ветка `webinars-draft`: schema, `drizzle/0032_webinar_duration.sql`, `blocks/webinars.tsx`, `from-settings.ts`,
  `WebinarLibrary.tsx`, `FilterChips.tsx`, `PublicationLibrary.tsx`, `ContactForm.tsx`, `admin/resources.ts`, тесты, доки.

## Принятые решения
- Черновик страницы, которую ещё не закрыли, делается настоящим кодом в отдельной ветке и снимается её кодом —
  как Home/терапия; эскизом остаётся только то, что зависит от неотвеченного вопроса (вариант Б Webinars).
- Webinars: форма запроса — окном у вебинара, формы внизу страницы нет; шапка «…choose a webinar below» (тексты за клиентом).

## Находки
- В базе у 5 вебинаров нет ни даты, ни записи (`videoUrl`), регионы пустые = видны во всех регионах, поэтому
  `/apac/webinars` не пустая (№14). У «COLUMBUS 14 Guidewire» продукт — DRIVEWIRE™ (данные Duda, не трогали).
- Python в окружении не принимает вложенные кавычки в f-строках — в скриптах вайрфреймов не использовать.

## Открытые вопросы / следующие шаги
- Владелица смотрит черновик Webinars; «закрываем» → DESIGN.md (Webinars), слияние `webinars-draft` после ответа
  Emily по выдаче записи (вариант А / Б).
- Перед показом при движении веток — перезапуск `render-branch.sh <ветка>`.
- После слияния `therapy-home` / `webinars-draft` — снять пометку `branch` в флоу, обычный `render.sh`, удалить снимок ветки.

## Связанное
- Предыдущая сессия: 2026-11-22-wireframes-all-on-system.md
- `docs/flows/site-pages.md` (статус страниц), BACKLOG «Идеи» (knowledge base), вопрос к Emily про Webinars.
