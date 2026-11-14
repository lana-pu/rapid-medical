# Evidence: как другие показывают клинические данные (2026-11-14)

Повод: на звонке клиент сказал, что Evidence «в таком виде никто читать не будет». Ресёрч — агент по сайтам конкурентов и
смежных областей + Mobbin. Пометки: **[✓]** страница открыта и прочитана, **[~]** — по поиску / описаниям. Скриншоты
(не в git) — `docs/flows/refs/evidence/`, экран примеров во вайрфреймах (`docs/flows/site-pages.md`).

## Наш Evidence сейчас
Шапка с видео и общим абзацем → счётчик «85+» (в базе 102) и карусель featured → «Featured publications» (те же статьи)
→ вкладки по продуктам: месяц · заголовок · длинный список авторов · журнал (часто пустой) · Read / PDF. Нет поиска,
фильтров, типа исследования, N, вывода. В списке смешаны статьи и пресс-релизы (например, «DISTALS Trial Overwhelmingly
Positive…»). У публикации в базе: title, authors, journal, doi, url, pdfUrl, publishedOn, product, regions, featured,
imageUrl.

## Нейроваскулярные конкуренты
- **Penumbra** https://www.penumbrainc.com/clinical-evidence/ [✓] — фильтры Category и Disease State; карточка: тег,
  название, 1–2 фразы с дизайном (RCT / prospective multicenter), «Learn More» → PubMed / ClinicalTrials.gov. Цифр, N,
  журнала нет.
- **Stryker Trevo NXT** https://www.stryker.com/us/en/neurovascular/products/trevo-nxt.html [✓] — доказательства на
  странице продукта: «7,000+ patients in RCTs, registries…», ключевые исследования с главной цифрой (DAWN 49% vs 13%),
  сноска «исследование на Trevo XP», ссылки с DOI, блок экономической ценности.
- **Medtronic Solitaire** https://www.medtronic.com/us-en/healthcare-professionals/products/neurological/revascularization-stroke/solitaire/clinical-evidence.html [✓]
  — три крупные цифры (87.9% реперфузия, 56.5% mRS 0–2, 1.4% sICH), сноски с определениями конечных точек. Минус: у цифр
  нет N и когорты.
- **Terumo Neuro (MicroVention)** https://www.terumoneuro.com/clinical-studies [✓] — вкладки по терапевтическим
  областям, внутри продукты; переключатель региона NA / EMEA / CHAPLA; счётчики (пациенты, страны, исследования,
  публикации); «публикуем независимо от исхода». Страница исследования
  https://www.terumoneuro.com/clinical-studies/web-wise-ruptured [✓]: 143 пациента / 29 центров / 7 стран, дизайн,
  эффективность и безопасность цифрами по подгруппам, PDF публикации, IFU по регионам, связанные исследования, форма
  «Request more information». **Ближайший к нам образец.**
- **phenox** https://phenox.net/international/coating/ [✓] — лендинг одного RCT: «FINAL RESULT», вывод фразой, PDF.
- **Imperative Care** — доказательства только в новостях. **Cerenovus, Balt** — страниц не нашли.

## Смежные области
- **Shockwave Medical** https://shockwavemedical.com/clinical-evidence/ [✓] — поиск и фильтры слева (Disease State,
  Product, Specialty — по роли читателя, Technology), сортировка, «1–9 of 14». Страница исследования
  https://shockwavemedical.com/clinical-evidence/disrupt-cad-iii/ [✓]: дизайн, N=384 / 47 центров, конечные точки, панель
  цифр, публикации 1 и 2 года, слайды конгресса, видео с PI и раскрытием. **Лучший образец страницы исследования.**
- **iRhythm** https://www.irhythmtech.com/providers/evidence [✓] — сгруппировано **по клиническим вопросам**; запись:
  заголовок-вывод, главный результат жирным, Study Design (N, дизайн, компаратор), Key Findings, DOI. Полный список
  отдельно по годам: https://irhythmtech.com/providers/evidence/list-of-clinical-articles [✓]. **Двухуровневая схема.**
- **Edwards PARTNER 3** https://edwards.com/healthcare-professionals/conditions-procedures/tavr/transcatheter-aortic-valve-replacement [✓]
  — страница вокруг одного RCT, цифры «A vs B (P)», кривые, брошюра PDF, NEJM.
- **Boston Scientific WATCHMAN** https://www.watchman.com/en-us-implanter/clinical-evidence.html [✓] — «Recent studies» и
  «Active trials», Download Center с one-pager'ами.
- **Intuitive** [~] — «Evidence Navigator»: PDF-сводки по процедурам с числом публикаций и датой среза.
- **Consensus** https://consensus.app/ [✓/~] — «Study Snapshot» (находка, дизайн, N, журнал), бейджи RCT / highly cited,
  фильтры по дизайну, году, рангу журнала, размеру выборки.
- **Semantic Scholar TLDR** https://www.semanticscholar.org/product/tldr [✓] — вывод статьи одной фразой (~20 слов).
- **JAMA Visual Abstracts** https://jamanetwork.com/pages/visual-abstracts [✓ галерея] — визуальные абстракты RCT.
- **UpToDate** [~] — GRADE: сила рекомендации и качество доказательств.

## Хорошие практики
1. Сначала вывод и главная цифра, потом библиография (iRhythm, Stryker, Medtronic, Edwards).
2. Единая карточка исследования: дизайн · N · центры/страны · первичная конечная точка · главный результат · журнал/год · DOI/PDF.
3. Уровень доказательности виден: бейдж RCT / проспективное многоцентровое / регистр / ретроспективное / мета-анализ.
4. Два уровня: 5–10 ключевых исследований с цифрами, ниже архив с поиском (iRhythm).
5. Группировка по клиническому вопросу / показанию, а не только по продукту (iRhythm, Terumo).
6. Фильтры по нескольким осям + сортировка + счётчик (Shockwave).
7. Отдельная страница у ключевого исследования (Shockwave, Terumo WISE) — у нас это «страница из документа».
8. Регион в данных: IFU и доступность по региону на странице исследования (Terumo) — закрывает MLR.
9. Оговорки сносками: определения конечных точек, несопоставимость, «на предыдущей версии устройства».
10. Счётчик с расшифровкой (пациенты, страны, исследования, RCT), а не одно «85+».
11. Текущие исследования — сигнал для инвесторов (WATCHMAN «Active trials»).
12. Вывод в одну фразу у каждой статьи архива (Semantic Scholar) — через MLR.

## Анти-паттерны
Список «название + 12 авторов + дата» (наш); крупные цифры без N и источника (Medtronic); карточки без цифр, только
«Learn more» (Penumbra, WATCHMAN); доказательства только в новостях (Imperative Care); голый счётчик и карусель.
