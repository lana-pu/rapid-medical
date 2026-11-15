# Экран: Карьера `/careers`

Код: `src/app/(site)/careers/page.tsx`. Страница хранится списком блоков (`site_pages`, key `careers`, ADR-007); без записи
те же блоки собирает `careersToBlocks()` (`src/blocks/from-settings.ts`). Данные: настройки `careers`, записи `jobs`.
Раскладка — `docs/DESIGN.md → Careers` (решение 2026-11-14, ветка `site-redesign`).

## Блоки
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `bannerCompact`, источник `openPositions` | `heroTitle` (по умолчанию «Unlock your potential»), `heroSub`, `heroBody`, `heroVideoUrl`, постер `heroImageUrl`; кнопка — см. ниже | всегда |
| 2 | Gallery · `quotes` | `quotes[]` | есть цитаты |
| 3 | Columns · `principles` | `principlesTitle`, `principlesBody`, `principlesImageUrl` (графика «WE ARE RAPID»), `principles[]` | всегда |
| 4 | Jobs · `roles`, якорь `#open-positions`, источник `openRoles` | заголовок «Open positions», строка под списком «Applications go through Spark Hire.»; роли — записи `jobs` | всегда |
| 5 | Form · `split`, якорь `#general-interest` | заголовок «Submit general interest», `eeoStatement`; форма `careers`, темы General interest · Internship · Other | всегда |

**Кнопка в шапке** ведёт вниз по странице: есть вакансии — «See open positions ↓» → `#open-positions`, нет — «Send us
your details ↓» → `#general-interest`.

**Принципы:** графика «WE ARE RAPID» как была; под ней пять принципов, у каждого крупная первая буква (R·A·P·I·D),
название и строка. Окончательный вид графики — на этапе графического дизайна.

**Open positions** («общая линия»): слева заголовок и «N roles», справа роли. Над списком фильтры — отдел (чипы «All» и
отделы; роли без отдела — «Other») и город (список «All locations»); фильтр показывается, если вариантов больше одного.
Роли сгруппированы по отделам (подпись отдела, строки с тонкими линиями): название (ссылка на страницу вакансии) · город ·
«Apply ↗» (ссылка заявки из записи — в новой вкладке, иначе письмо на `applyEmail`; нет ни того, ни другого — только
страница вакансии). Видно первые 6, остальные — кнопкой «Show all N roles»; смена фильтра снова сворачивает список.
Ничего не подходит под фильтры — «No roles match these filters.». Нет вакансий — «No open positions right now.», строка
«We still read every application…» и ссылка «Send us your details ↓»; секция не пропадает, строки про Spark Hire нет.
Пока вакансии — записи `jobs` в админке; подключение Spark Hire (API / виджет / ссылка) — вопрос к Emily (BACKLOG №22).

**Общая заявка** («общая линия»): слева заголовок, первое предложение `eeoStatement` и «Read our EEO statement» —
раскрывает полный текст на месте. Справа форма кандидата: Area of interest (чипы), First / Last Name, Email, LinkedIn or
CV link (`meta.linkedin`), Country (список; State / Province — для США и Канады), Message («What would you like to work
on?»), подписка, Submit на всю ширину. Без Organization, Phone и Region: регион письма — из страны, как в Contact Us.

`/open-positions` — 308 на `/careers#open-positions` (миграция `0022_careers_roles` добавила секцию в хранимую страницу и
перевела форму на `split`). Страница вакансии `/open-positions/{slug}` остаётся: «← All positions» ведёт на
`/careers#open-positions`, форма — та же форма кандидата с выбранной вакансией.

## Проход по юзабилити 2026-11-13
- Кнопка в шапке страницы не ведёт на пустой список: при нуле вакансий — к общей заявке (с 2026-11-15 — «Send us your
  details ↓», см. выше).
