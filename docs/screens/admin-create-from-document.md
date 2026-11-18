# Экран: Create from a document (`/admin/create-from-document`)

Бриф: `docs/briefs/create-from-document.md`. Решения: 2026-11-14 (вайрфреймы imp-new, imp-prompt, imp-review в
`docs/flows/site-pages.md`), 2026-11-18 (только PDF; реестр — документ главнее; проверка в карточке записи).

## Вход
Publications & news → «Create from a document» (кнопка в шапке списка и в его срезах Evidence и News).

## Шаг 1 — PDF (`/admin/create-from-document`)
- «Upload a PDF»: через общую загрузку медиатеки (тип по содержимому файла, PDF до 50 МБ; страницы рисуются, текст
  достаётся). После загрузки — сразу шаг 2.
- Ниже — PDF из медиатеки, новые сверху, поиск по имени; «Use this PDF» → шаг 2.

## Шаг 2 — что это и сводка (`/admin/create-from-document/{mediaId}`)
Слева файл: имя, страниц, ссылка открыть. PDF без текста (скан) — предупреждение: цитаты проверить не получится,
каждая цифра будет «Check».
1. **Kind** — пять вариантов; подсказанный отмечен «Suggested from the file» с причиной (`suggestKind`). Смена вида
   меняет значения по умолчанию ниже и инструкцию.
2. **Details** — Date (сегодня), Regions (пусто = все), Product, Link to the original (https), NCT number (найден в
   тексте; только у исследования идёт в реестр).
3. **Full text on the page** — Copy the text / Show the PDF / Link to the original only. По умолчанию: публикация — link,
   остальные — PDF. У документа — всегда PDF (выбор скрыт).
4. **Where it appears** — Evidence, News & Events, Highlight (включён). По умолчанию: исследование — Evidence + News;
   публикация — Evidence; новость — News; случай и документ — нигде.
5. **Summary with your own AI** (нет у документа; у него — Title): «Copy instructions for AI» (кнопка копирует текст,
   под ней — «Copied»; текст виден в раскрывашке) → «In your AI chat: attach the PDF and paste the instructions» →
   «Paste the answer here» (поле).
6. «Build the draft» → материал-черновик → его карточка с «Built from {file}».
Ошибка (нет JSON, не тот формат, не тот номер NCT…) — сообщение над кнопкой словами; всё введённое остаётся.

## Карточка записи — «Checked against the PDF» (`#checks`)
У материала, собранного из документа: «Built from {file}», «N of M checked», реестр («ClinicalTrials.gov NCT… added» /
«not reached: …»). Строки: значение, подпись, статус — ✓ Found in the PDF / ✓ Confirmed by {кто}, {когда} / Check:
{причина}. У «Check» — цитата (как прислал ИИ) и «Looks right». Пока есть «Check» — над кнопками «Publish is closed:
check N values below»; сервер отказывает в публикации тем же текстом (кнопка, «сохранить и опубликовать», массовая
публикация и «Publish all» в редакторе пропускают такой материал, расписание ждёт).

## Страница материала
Материал с секциями (собранный из документа) — его страница из секций (`/{region}/evidence/{id}-{slug}` или
`/news-events/{id}-{slug}`), правится на странице. Без секций — прежний шаблон публикации или новости.

## Данные
`materials.documentCheck` (миграция 0033): `mediaId`, `file`, `nct`, `registry` (`{ok}` / `{ok:false, error}`), `items[]`
(`id`, `part` figures/passport, `label`, `value`, `quote`, `status` ok/check/confirmed, `reason`, `confirmedBy`,
`confirmedAt`). Код: `src/lib/document-import.ts`, `src/lib/clinicaltrials.ts`, `src/admin/document-actions.ts`.
