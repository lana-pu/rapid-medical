# Экран: Список терапий `/{region}/therapies`

Код: `src/app/(site)/[seg]/therapies/page.tsx`, блоки собирает `therapiesToBlocks()` (`src/blocks/from-settings.ts`).
Данные: настройки `therapies:{region}`, записи `solutions` региона.

## Блоки
| Порядок | Блок · вариант | Из полей | Условие |
|---|---|---|---|
| 1 | Hero · `bannerCompact` | название региона, `title`, `intro`, `note`, `heroVideoUrl` | всегда |
| 2 | Columns · `cards`, по блоку на направление (Ischemic stroke → Hemorrhagic stroke → Access → без группы) | записи `solutions`: заголовок группы из `therapyGroup`; на карточке продукт, `navLabel`, `heroTitle`, `proofPoint` (если заполнен), ссылка на терапию | есть терапии в группе |
| 3 | Call to action · `light` | `closingTitle`, `closingBody`; кнопка «Contact us» → `/contact-us?region={region}` | всегда |

Решение 2026-11-10: страница необязательная — обзор для тех, кто не знает линейку. Собирается из записей терапий;
тексты направлений в настройках (`blocks[]`) больше не показываются, но не удалены. Картинок на карточках нет: у части
терапий в шапке видео, карточки получались разной высоты. Ссылки «change» в hero нет — регион меняется в шапке.
