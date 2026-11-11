# Экран: Страница терапии `/{region}/therapies/{slug}`

Код: `src/app/(site)/[seg]/therapies/[slug]/page.tsx`. Данные: `solutions` (одна строка на slug+region).
Восстановлено по коду `59169da`.

## Доступ
Публичный. Регион не из `us|ous|apac` → 404. Запись не найдена или не `published` → 404
(в preview — видны черновики и pending-правки).

## Данные
`getSolution(region, slug)` (+ `product`), `getSolutionRegions(slug)` — в каких ещё регионах есть эта терапия.
Поля — см. `docs/spec.md → Данные → solutions`. Метаданные: `metaTitle` || «{navLabel} – {REGION}»,
`metaDescription` || первые 160 символов `heroBody`.

## Блоки
Страница — список блоков (`src/blocks/`), который `solutionToBlocks()` (`src/blocks/from-solution.ts`) собирает
из полей записи при показе. Правила показа ниже реализованы в адаптере и компонентах блоков.

| Порядок | Блок · вариант | Из полей |
|---|---|---|
| 1 | Hero · `video` (есть `heroVideoUrl`) или `image` | hero*, `breadcrumb`, регионы |
| 2 | Text · `lead` | intro* |
| 3 | Text and media · `mediaRight` / `mediaLeft` по очереди, `threeColumn` при `secondaryImageUrl` | `benefits[]`, по блоку на ряд; ряды подряд стоят в одной полосе |
| 4 | Product details · `pills` | вкладки ниже |
|  | — Product overview | Text (`overviewBody`), Columns · `features`, группа «Specifications»: Device diagram, Spec table · `table` / `images`; Call to action · `buttons` |
|  | — How it works | Columns · `steps`, Call to action · `buttons` |
|  | — In-Practice | Call to action · `panel` (вебинары), People · `physicians`, Call to action · `buttons` |
|  | — Clinical evidence | вкладка-ссылка |
| 5 | Video · `band` | `closingTitle`, `closingEmbedUrl` |
| 6 | Call to action · `band` | `closingBody` |
| 7 | Indications and references | `regulatoryHtml`, `referencesHtml` |

## Структура и правила показа
| Блок | Условие / правило |
|---|---|
| Hero | Фон-видео `heroVideoUrl` (постер — `heroImageUrl`); без видео — картинка `heroImageUrl` справа. Eyebrow: `breadcrumb` или «Our solutions / {navLabel}» + ссылки «{REGION} version» на другие регионы. CTA `heroCta` — если есть `href` |
| Intro | Если заполнено хоть одно из `introTitle/Body/VideoUrl/ImageUrl` |
| Benefits | Для каждого блока: текст (eyebrow, title, body, footnote, link) + медиа. Приоритет медиа: `stats` (круги) → `chart` (SVG, только если `categories` не пусто) → видео/картинка. С `secondaryImageUrl` — раскладка в 3 колонки; иначе 2 колонки, чётные блоки зеркально |
| Табы (pills; аккордеон на мобильном) | **Product overview** — всегда. **How it works** — если есть шаги. **In-Practice** — если есть элементы или `webinarCtaEnabled`. **Clinical evidence** — ссылка на `/{region}/evidence#{product.slug}` (без продукта — `#browse-by-product`) |
| Overview | `overviewBody`; `overviewFeatures` (2×2) или, если их нет, legacy `overviewImageUrl`. Specifications: `annotatedImage` (маркеры); `specs` таблица, иначе `specImageUrls` (кроме совпадающей с диаграммой); сноска `specs.note` || `specNote` |
| Action links | Под каждым табом: первая — primary, остальные — secondary; `actionNote` рядом. **Решение 2026-11-10 (кода нет):** кнопок во вкладках нет — см. «Действия на странице» ниже |
| Webinar CTA | В табе In-Practice при `webinarCtaEnabled`: «Request to view» → `/{region}/webinars` (текст захардкожен) |
| Closing band | Если `closingTitle` или `closingEmbedUrl`. `.mp4` → фоновое видео, иначе iframe (YouTube → embed) |
| Questions band | Если `closingBody`; префикс «Questions?» из текста срезается; кнопка «Contact us» → `/contact-us?region={region}` |
| Regulatory / References | `regulatoryHtml`, `referencesHtml` через `safeHtml` (санитайзер) |

## Действия на странице — решение 2026-11-10 (аудит Emily, кода нет)
Два действия для двух аудиторий вместо шести:
- **Request a demo** (главная, для тех, кто изучает продукт) — в hero и в финальном блоке → `/contact-us?region=&topic=demo`.
- **Customer support** (второстепенная, для действующих клиентов) — только в финальном блоке → контактная форма,
  где тема выбирается: заказ (`orders`), IFU (`ifu`, новая тема), вопрос по продукту (`support`).
- Вкладки — только содержание, без кнопок. Полоса «Questions? Contact us» заменяется финальным блоком с этими двумя
  кнопками. «Request to view» (вебинары) и ссылки на материалы в тексте остаются.
- Открыто (вопрос клиенту, MLR): должна ли ссылка на IFU быть прямой; если да — ссылка рядом с показаниями, не кнопка.

## Действия посетителя
Переключение табов; переход на версию другого региона; CTA / action links (URL, `mailto:`); Evidence;
Webinars; Contact us. Внешние ссылки (`http…`, `mailto:`) — `<a>`, `http` открываются в новой вкладке.

## On-page editor
Почти все тексты и медиа обёрнуты в `<E>/<EMedia>` (hero, intro, benefits.*, overviewBody,
overviewFeatures.*, маркеры диаграммы, specImageUrls.*, specNote, howItWorks.*, inPractice.*,
actionLinks.* (label+href), actionNote, closingTitle/Body, regulatory/references как rich).
Не редактируются на странице: `overviewTitle`, `breadcrumb`, таблица `specs`, `chart`, `stats` в benefits
кроме value/label, `heroVideoUrl` без картинки-слота, порядок и состав блоков, slug, SEO.

## Валидация (админ-форма, `src/admin/resources.ts` + `engine.ts`)
- Обязательны: `navLabel`, `slug` (нормализуется в `a-z0-9-`), `region`, `heroTitle`.
- Уникальность `slug + region` → «A record with this slug/region already exists.»
- `url`-поля: `http(s)://`, `mailto:` или путь `/…`. `json`-поля (`chart` в benefits — внутри repeater, `annotatedImage`) — валидный JSON.
- Внутри repeater-ов (benefits, steps, inPractice, actionLinks) обязательность и формат подполей
  **на сервере не проверяются** — только JSON-массив (см. BACKLOG).
- Сохранение опубликованной страницы → pending-черновик (см. `docs/spec.md → Редакционный процесс`).
