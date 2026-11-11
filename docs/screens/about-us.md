# Экран: О компании `/about-us`

Код: `src/app/(site)/about-us/page.tsx`, блоки собирает `aboutToBlocks()` (`src/blocks/from-pages.ts`).
Данные: настройки `about` и `contact` (офисы), записи `team`. Страница публичная, одна на все регионы.

## Блоки
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `page` | заголовок «About Us», не редактируется | всегда |
| 2 | Text · `large` | `intro`, `heroImageUrl` | есть одно из полей |
| 3 | Text · `surface` | `whatWeDoTitle` (по умолчанию «What we do»), `whatWeDoBody` | всегда |
| 4 | People · `team`, якорь `#leadership` | заголовок «Leadership Team», `leadershipIntro`, записи `team` | всегда |
| 5 | Offices and map · `offices`, якорь `#offices` | заголовок «Global Offices», `contact.offices` | есть офисы |
| 6 | Offices and map · `map`, якорь `#map` | `mapTitle`, `mapSub`, `mapFallbackImageUrl`, `closingLine` | всегда |

Блоки 1 и 2 идут в одной секции. Карточка человека — фото, имя, должность и «Read bio»: биография (`bioHtml`, плюс `longTitle`, если отличается) раскрывается на месте; у карточки якорь `#{slug}`, на него ведут старые `/team/{slug}` и `/{имя}` (решение 2026-11-10). На карте — офисы с координатами; клик по
региону открывает `/contact-us?region=…` (США и Канада → `us`; Латинская Америка, Европа, Австралия → `ous`;
Ближний Восток и Азия → `apac`). Заголовки «About Us», «Leadership Team», «Global Offices» и кнопка «Contact us» заданы в
адаптере и на странице не редактируются.
