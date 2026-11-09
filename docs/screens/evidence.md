# Экран: Evidence `/{region}/evidence`

Код: `src/app/(site)/[seg]/evidence/page.tsx`. Восстановлено по коду `59169da`.

## Доступ
Публичный. Регион не из `us|ous|apac` → 404.

## Данные
| Источник | Что |
|---|---|
| `publications` | `getPublications(region)`: опубликованные, `regions` пусто или содержит регион; по дате ↓ |
| `publications` featured | `getFeaturedPublications(region, 6)`: то же + `featured = true` |
| `products` | `getProductsForRegion(region)`: `regions` пусто или содержит регион; `name`/`fullName` заменяются `aliases[region]` |
| `site_settings.evidence` | `title`, `heroVideoUrl`, `intro`, `statValue`, `statLabel`, `statIconUrl`, `forefrontText`, `featuredTitle`, `browseTitle` |

## Структура и правила
1. **Hero**: eyebrow «{REGION_LABELS[region]} · change» (→ `/choose-your-location?next=evidence`), `title` (дефолт «Evidence»), `intro`.
2. **Счётчик**: `statValue` || «{кол-во публикаций}+», `statLabel` || «clinical publications»; `forefrontText` (если есть).
3. **Карусель featured** (до 6): картинка, журнал · месяц, заголовок, авторы, «Read article» → `pdfUrl` || `url` || `#`.
4. **Секция `featuredTitle`** (дефолт «Featured publications»): фактически **3 последние публикации с картинкой**,
   а не featured. Показывается, если такие есть. Ссылка «Read ›» → `pdfUrl` || `url` || `#`.
5. **Browse by product** (`#browse-by-product`): вкладка на каждый продукт региона, у которого ≥ 1 публикация.
   Вкладка семейства (например, TIGERTRIEVER™) включает публикации подпродуктов (`family = slug`), у которых
   нет своей вкладки в этом регионе. Строка: месяц, заголовок, авторы · журнал, «doi:…»/«Read» (`url`), «Download PDF».
   На каждый продукт есть якорь `#{product.slug}` для диплинка со страниц терапий.

Пустые состояния: нет featured → карусели нет; нет публикаций с картинкой → секции 4 нет; продукт без
публикаций → вкладки нет; публикаций 0 → счётчик «0+», пустые вкладки.

## Действия
Смена региона; листание карусели; переключение вкладок; внешние ссылки на статьи/PDF (новая вкладка).

## On-page editor
Редактируются: `title`, `intro`, `statValue`/`statLabel`, `forefrontText`, `featuredTitle`, `browseTitle`
(группа `settings:evidence`); у публикаций — `title` и `imageUrl`.
Не выводятся вовсе, хотя есть в настройках: `forefrontImageUrl`, `forefrontImage2Url`.

## Валидация (админ-форма Evidence)
Обязательны `title`, `publishedOn` (формат `YYYY-MM` или `YYYY-MM-DD`; хранится 1-е число месяца).
`url`, `pdfUrl` — `http(s)://`, `mailto:` или `/путь`. `regions` — подмножество `us|ous|apac`, пусто = все.
