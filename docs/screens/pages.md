# Экран: Текстовые страницы `/{slug}`, `/{region}/{slug}`

Код: `src/app/(site)/[seg]/page.tsx`, `src/app/(site)/[seg]/[slug]/page.tsx`, блоки собирает `pageToBlocks()`
(`src/blocks/from-pages.ts`). Данные: записи `pages`; `region` пустой — глобальная страница.

## Поведение
- Запись не найдена → проверка redirects, затем 404. `/{region}/contact-us` → `/contact-us?region={region}`.
- `/{region}` → `/{region}/therapies`.
- SEO: `metaTitle` или `title`, `metaDescription`, `noindex`.

## Блоки
| Порядок | Блок · вариант | Из полей |
|---|---|---|
| 1 | Hero · `page` | `title`; у региональной страницы над заголовком — название региона (не редактируется) |
| 2 | Rich text · `default` | `bodyHtml` (очищается `safeHtml`) |

Оба блока идут в одной секции. Постеры, видео и ссылки на PDF сейчас хранятся внутри `bodyHtml`; перенос в блок Media —
вместе с хранением страницы списком блоков.

## Проход по юзабилити 2026-11-13
- Заголовок вкладки: свой `metaTitle` страницы (с Duda в нём уже есть бренд) — без второго «| Rapid Medical™».
- 404: заголовок вкладки «Page not found | Rapid Medical™».
