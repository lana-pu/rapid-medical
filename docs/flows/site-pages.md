# Страницы сайта на вайрфреймах — порядок и статус

Флоу: `site-pages.py` → `site-pages.json` → артефакт (приватная ссылка): https://claude.ai/artifact/Dyud46HRkPumSyPiZXrMVA. Сборка:
`python3 docs/flows/site-pages.py && python3 .claude/skills/wireframes/scripts/build.py docs/flows/site-pages.json <scratchpad>/site-pages.html --pack docs/flows/pack.js`,
публиковать тем же путём файла.

## Цикл на каждую страницу
1. **Как есть** — настоящие блоки из `rm-pages.json` (обновить: `blocks-kit/snapshot.sh`), десктоп и телефон.
2. **Mobbin** — 2–4 поиска по типу страницы и её состояниям; приёмы с названиями сайтов — в заметках экранов.
3. **Предложение** — та же структура сайта, другая раскладка и поведение внутри страницы; состояния (ошибка, пусто, успех)
   отдельными экранами; телефон.
4. **Дизайн-система** — новый токен, вариант блока, правило поля → `docs/DESIGN.md` в том же шаге, с пометкой «предложение»
   до решения владелицы. Общий компонент вайрфреймов — в `.claude/skills/wireframes/assets/kit.js` (репозиторий Studio).
5. Решение владелицы → спека экрана `docs/screens/*.md` → код.

## Порядок (от наименее спорных)
Спорность — насколько страница зависит от решений клиента, MLR и визуального направления.

| # | Страница | Статус |
|---|---|---|
| 1 | Contact Us | предложение готово 2026-11-13, ждёт владелицы |
| 2 | Текстовая страница (Privacy, Terms, исследования) + 404 | — |
| 3 | Выбор региона | — |
| 4 | Careers + Open positions + вакансия | — |
| 5 | About Us | — |
| 6 | News & Events + событие | — |
| 7 | Webinars | — |
| 8 | Evidence | — |
| 9 | Обзор терапий | — |
| 10 | Терапия (LVO, Aneurysm) | — |
| 11 | Home | — |

## Contact Us — что решить владелице
1. Две колонки (зачем и контакты слева, форма справа) — вариант Form `split`.
2. Тема чипами первым полем вместо выпадающего списка.
3. Страна вместо Region + Country + State; регион выводится из страны. Зависит от карты «страна → регион» (вопрос к Emily, BACKLOG №9).
4. Срок ответа на странице — нужна цифра от клиента.
5. Телефоны и почта заказов на странице контактов (те же данные, что на About).

Референсы Mobbin: [Dovetail](https://mobbin.com/sites/sections/9f8b5502-cee7-4eb1-8aff-9dcd26e9e308),
[Slack](https://mobbin.com/sites/sections/18717c77-0049-4c84-b21d-797bee5f295b),
[Harvest](https://mobbin.com/sites/sections/3a55ba42-2d51-4f8a-9bc1-439dd3d2ad0b),
[Upwork](https://mobbin.com/sites/sections/c1e43d04-ad70-4402-ba1f-2ff400c94a0f),
[Savor](https://mobbin.com/sites/sections/ae1f5fe6-9420-45e4-b097-64ae2aa8c06e),
[Salesforce](https://mobbin.com/screens/5de38a69-8a1d-4912-bd5e-450e03a9c9f7),
[Square — ошибки](https://mobbin.com/screens/2d04b11c-f3d4-4937-a056-1e1898bec97d),
[Hotjar — подтверждение](https://mobbin.com/screens/1cd0a18c-fdf9-45d5-b764-d14ac7dd0ab3),
[Zapier — подтверждение](https://mobbin.com/screens/053f9a95-f2d0-4cbe-a89f-3f707dbf8276).
