# Экран: Список терапий `/{region}/therapies`

Код: `src/app/(site)/[seg]/therapies/page.tsx`, блоки собирает `therapiesToBlocks()` (`src/blocks/from-settings.ts`).
Данные: настройки `therapies:{region}`, записи `solutions` региона.

## Блоки
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `bannerCompact` | регион и ссылка «change», `title`, `intro`, `note`, `heroVideoUrl` | всегда |
| 2 | Text and media · `links`, по блоку на направление | `blocks[]`: `title`, `body`, `imageUrl`, `links[]` | в настройках есть направления |
| 2′ | Columns · `cards` | записи `solutions`: `navLabel`, `heroTitle`, ссылка на терапию | направлений в настройках нет |
| 3 | Call to action · `light` | `closingTitle`, `closingBody`; кнопка «Contact us» → `/contact-us?region={region}` | всегда |

Ряды Text and media · `links` стоят в одной белой секции.
