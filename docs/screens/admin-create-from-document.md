# Экран: Create from a document (`/admin/create-from-document`)

Бриф: `docs/briefs/create-from-document.md`. Решения: 2026-11-14 (вайрфреймы imp-new, imp-prompt, imp-review в
`docs/flows/site-pages.md`), 2026-11-18 (только PDF; реестр — документ главнее; проверка в карточке записи), 2026-11-18
(страница по ссылке — ссылка + вставленный текст: BusinessWire и NeuroNews отдают серверу 403, сайт никуда не ходит).

## Вход
Publications & news → «Create from a document» (кнопка в шапке списка и в его срезах Evidence и News).

## Шаг 1 — PDF (`/admin/create-from-document`)
- «Upload a PDF»: через общую загрузку медиатеки (тип по содержимому файла, PDF до 50 МБ; страницы рисуются, текст
  достаётся). После загрузки — сразу шаг 2.
- Ниже — PDF из медиатеки, новые сверху, поиск по имени; «Use this PDF» → шаг 2.
- «Or a page on the web» (пресс-релиз, статья) → «Start from a link» → шаг 2 для страницы.

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
   У исследования и публикации ответ может нести **сравнение групп** (`comparisons`: группы со значением, n, p-value,
   конечная точка) и **матрицу точек** (`matrices`: N из M) — блоки набора инфографики (DESIGN.md, 2026-11-18). Каждое
   значение — со своей цитатой и проверяется так же. Каждая цифра, которую покажет блок, — отдельная проверка: значение,
   его n (в той же цитате), p-value (по своей цитате `pQuote`; нет цитаты — «Check»), а у шкалы в % — что цитата даёт
   именно проценты (ревью безопасности 2026-11-18: «%» не дописывается без сверки). Шкала без `unit` в ответе — % только
   если все значения записаны с «%». Ещё три блока набора (2026-11-18): **распределение** (`distributions`: шкала
   категорий, серии, точки времени с n и долями — доли одной точки в одной цитате, в сумме 100 ± 1,5 %, иначе «Check»),
   **таблица** (`tables`: столбцы с n и цитатой, строки с ячейками и цитатой — все числа строки в её цитате) и **карта
   центров** (`centres`, только у исследования: название, город, страна — название ищется в тексте целыми словами,
   от 6 букв; отдельная проверка — город или страна есть в тексте). Цитата
   короче 6 знаков (без пробелов и знаков) — «Check: the quote is too short to check»; от 6 до 11 — засчитывается,
   если стоит в документе один раз, иначе «too short to tell where it stands» (2026-11-20). Название,
   подписи и формулировка конечной точки — текст, его, как и вывод, проверяет человек при чтении черновика.
6. «Build the draft» → материал-черновик → его карточка с «Built from {file}».
Ошибка (нет JSON, нет заголовка или вывода, не тот номер NCT…) — сообщение над кнопкой словами; всё введённое остаётся.
Ответ ИИ читается терпимо (проверка на настоящих документах 2026-11-18): числа без кавычек — как текст, пустое поле —
«не указано». Часть, которая не подходит (таблица шире столбцов, лишняя группа), **откладывается** с причиной, остальное
идёт в черновик; в карточке — «Left out of the draft — the rest of the AI answer is used» со списком и подсказкой
попросить ИИ поправить эти части.

## Шаг 2 для страницы (`/admin/create-from-document/link`)
Та же форма, что для PDF, с отличиями:
- Вместо файла — блок **«0. The page»**: «Link to the page» (https, обязательно; это и есть ссылка на оригинал — отдельного
  поля нет) и «Text of the page» (обязательно, от 200 знаков): «Open the page, select the text from the headline to the
  end, copy and paste it here». Сайт страницу **не скачивает** — сверка идёт по вставленному тексту.
- Вид: без «Document» (IFU — всегда PDF). По умолчанию — новость; подсказка по адресу: BusinessWire, PR Newswire,
  GlobeNewswire → новость; doi.org, PubMed → публикация.
- Полный текст: «Copy the text onto the page» (по умолчанию) или «Link to the original only»; «Show the PDF» нет.
- Инструкция для ИИ — про текст, не про PDF; шаг «In your AI chat: paste the instructions, then the same page text».
- Проверки — «Checked against the page text», «✓ Found in the page text», «Built from {адрес}».
Ошибки: нет ссылки или не https; текста меньше 200 знаков («Paste the whole text of the page»); вид «Document».

## Карточка записи — «Checked against the PDF» (`#checks`)
У материала, собранного из документа: «Built from {file}», «N of M checked», реестр («ClinicalTrials.gov NCT… added» /
«not reached: …»). Строки: значение, подпись, статус — ✓ Found in the PDF / ✓ Confirmed by {кто}, {когда} / Check:
{причина}. У «Check» — цитата (как прислал ИИ) и «Looks right». Пока есть «Check» — над кнопками «Publish is closed:
check N values below»; сервер отказывает в публикации тем же текстом (кнопка, «сохранить и опубликовать», массовая
публикация и «Publish all» в редакторе пропускают такой материал, расписание ждёт).

**В редакторе на странице** — то же самое: инструмент «Checked against the PDF» в рейке, жёлтая обводка у цифр с «Check»,
«Publish now» выключена до конца проверки (`docs/screens/on-page-editor.md → Проверка по PDF`).

**Граница проверки (ревью безопасности 2026-11-18).** Запрет публикации смотрит на проверки, сохранённые при сборке
черновика: он ловит непроверенный ответ ИИ. Правка цифр человеком после «Looks right» — обычная правка редактора (как на
любой странице), видна в журнале и истории; заново против PDF она не сверяется. Если понадобится — пересчитывать
проверки по секциям перед Publish.

## Страница материала
Материал с секциями (собранный из документа) — его страница из секций (`/{region}/evidence/{id}-{slug}` или
`/news-events/{id}-{slug}`), правится на странице. Без секций — прежний шаблон публикации или новости.

## Данные
`materials.documentCheck` (миграция 0033): `skipped` (отложенные части ответа с причиной), `mediaId` (у страницы — null), `file` (имя PDF или адрес страницы без https://), `nct`, `registry` (`{ok}` / `{ok:false, error}`), `items[]`
(`id`, `part` figures/passport/comparison/distribution/matrix/table/centres, `block` и `fields` — блок и поля, которые
редактор обводит, `label`, `value`, `quote`, `status` ok/check/confirmed, `reason`, `confirmedBy`,
`confirmedAt`). Код: `src/lib/document-import.ts`, `src/lib/clinicaltrials.ts`, `src/admin/document-actions.ts`.
