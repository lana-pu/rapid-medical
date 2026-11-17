# Экран: О компании `/about-us`

Код: `src/app/(site)/about-us/page.tsx`. Страница хранится списком блоков (`site_pages`, key `about`, ADR-007); без
записи — те же блоки собирает `aboutToBlocks()` (`src/blocks/from-pages.ts`). Данные: настройки `about` и `contact`
(офисы), записи `team`, число опубликованных публикаций. Страница публичная, одна на все регионы.
Раскладка — `docs/DESIGN.md → About` (решения 2026-11-14/15, ветка `site-redesign`).

## Блоки
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `page` | заголовок «About Us», не редактируется | всегда |
| 2 | Text · `facts`, источник `companyFacts` | `intro`, `heroImageUrl`, `whatWeDoTitle` (по умолчанию «What we do»), `whatWeDoBody`; факты — см. ниже | всегда |
| 3 | People · `team`, якорь `#leadership` | заголовок «Leadership Team», `leadershipIntro`, записи `team` | всегда |
| 4 | Offices and map · `offices`, якорь `#offices` | заголовок «Global Offices», `contact.offices` | есть офисы |
| 5 | Offices and map · `map`, якорь `#map` | `mapTitle`, `mapSub`, `mapFallbackImageUrl`, `closingLine` | всегда |

**Вступление** («общая линия»): под H1 — линия; слева «ключ — значение» с фактами, справа вводный текст (`intro`) и
второй абзац с заголовком («What we do»). На телефоне сначала текст, потом факты. Картинка (`heroImageUrl`), если есть, —
широкой полосой под вступлением. Факты по порядку:
- **Countries** — поле блока `countries` (по умолчанию «30+», как в подписи карты);
- **Clinical publications** — число опубликованных публикаций всех регионов (считается, не вводится);
- **Offices** — страны офисов из Contact details (последняя строка адреса), через « · »;
- **Headquarters** — поле блока `headquarters` (по умолчанию «Yokneam, Israel»).
Пустой факт не показывается. Миграция `0021_about_facts` слила прежние блоки Text · `large` и Text · `surface` в этот блок
(текст и картинка сохранены, «What we do» — в `title2` / `body2`).

**Leadership Team:** сетка 3 колонки (телефон — столбик). Карточка — фото 1:1, имя и должность в обычном регистре (в
записях они КАПСОМ с Duda; показ — `displayCase`, текст, набранный со строчными, не меняется), две строки биографии,
«Read full bio» раскрывает её целиком на месте (с `longTitle`, если отличается), «Show less» сворачивает. Якорь
`#{slug}`, на него ведут старые `/team/{slug}` и `/{имя}` (решение 2026-11-10).

**Global Offices** (серая полоса): карточка на офис — подпись (у штаб-квартиры с страной: «Headquarters · Israel»), юрлицо,
адрес, «ключ — значение» Phone / Fax / Orders, «Get directions ↗» (Google Maps по пину офиса, без пина — по адресу; новая
вкладка). Данные — Contact details, редактируются там.

**Карта** — как была (решение 2026-11-15): офисы с координатами; клик по региону открывает `/contact-us?region=…` (США и
Канада → `us`; Латинская Америка, Европа, Австралия → `ous`; Ближний Восток и Азия → `apac`), строка «Have a question?» и
«Contact us». Заголовки «About Us», «Leadership Team», «Global Offices» и кнопка «Contact us» заданы в адаптере и на
странице не редактируются.
