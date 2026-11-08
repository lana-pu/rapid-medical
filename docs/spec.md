# Rapid Medical — спецификация

> Восстановлена по коду (ретрофит 2026-11-05, состояние `59169da`). Источник правды — код; где код
> молчит, вопрос вынесен в `docs/memory/BACKLOG.md → Решения за владельцем`. Ничего здесь не выдумано:
> пометка «не подтверждено» = не проверялось / не видно из репозитория.

## Продукт

**Что.** Корпоративный маркетинговый сайт Rapid Medical (производитель нейроваскулярных
медицинских изделий: TIGERTRIEVER™, COMANECI™, DRIVEWIRE™ / COLUMBUS™) + собственная контент-админка.
Заменяет четыре сайта на Duda (`www.`, `us.`, `ous.`, `apac.rapid-medical.com`) одним Next.js-приложением.

**Для кого.**
- **Посетители** — клиницисты (нейроинтервенционисты) и дистрибьюторы; контент и регуляторные тексты
  отличаются по регионам (US / OUS / APAC). Ищут: терапии и устройства, клинические публикации (Evidence),
  вебинары, контакты/заказы, вакансии.
- **Редакторы** — маркетинговая команда Rapid Medical: правят тексты и медиа без разработчика
  (формы админки + on-page editor), публикуют через редакционный процесс.

**Ключевые возможности.** Региональные терапии с регуляторными текстами; Evidence с вкладками по
продуктам; формы (контакт / вебинар / карьера) с сохранением в БД и e-mail; админка, сгенерированная
из декларативного описания ресурсов; черновики поверх live, preview-ссылки, согласование, отложенная
публикация, история ревизий; on-page editor; медиапайплайн (WebP-варианты, постеры видео); 301 со
старых доменов Duda; статическое демо на GitHub Pages.

**Стадия (со слов владелицы, 2026-11-05).** Продукт существует на уровне документации и демо. Внешние
сервисы **не подключены**: нет Vercel, Neon, домена, SMTP, S3 — сайт нигде не работает в проде.
Демо повторяет текущие сайты Duda и нужно прежде всего, чтобы собрать с них информацию.

**Задача по сайту:** миграция с Duda и визуальный редизайн. Структуру сильно не меняем, юзабилити улучшаем
попутно. **Админка проектируется заново** и детально: она запутанная, и в ней будет вход сразу в два продукта
(ADR-005). Целевая модель работы: редакторы и дизайнер, шаблоны страниц, комментарии вместо согласования (ADR-006);
разделы «Доступы» и «Редакционный процесс» ниже описывают текущий код.

**Инструмент Tigertriever** — отдельный продукт в этом же репозитории: офлайн-обучение врачей плюс онлайн Content
Studio, материалы в `docs/tigertriever/`. Пользователи пересекаются, поэтому админка общая: вход, затем выбор,
сайт или инструмент. Модель контента инструмента отличается от сайта — см. раздел «Инструмент Tigertriever» ниже
(предложение, кода нет).

## Платформа

| Слой | Что | Где |
|---|---|---|
| Фреймворк | Next.js 16.4 (App Router), React 19.3, TypeScript 5 | `package.json`, `next.config.ts` |
| Рендеринг | Динамический (cookies в layout), `cacheComponents: false`; после публикации `revalidatePath()` | `next.config.ts`, `src/admin/actions.ts` |
| Middleware | `src/proxy.ts` (Next 16 «proxy») — legacy-редиректы, грубый гейт `/admin`, регион-cookie, security headers | `src/proxy.ts` |
| БД | PostgreSQL 16, Drizzle ORM 0.45, миграции `drizzle/0000…0008` | `src/db/schema.ts`, `drizzle/` |
| Стили | Tailwind 4 + CSS-токены, нейтральный дизайн | `src/app/globals.css`, `docs/DESIGN.md` |
| Rich text | Tiptap 3 → HTML, санитайз `sanitize-html` на выводе | `src/components/admin/RichText.tsx`, `src/lib/html.ts` |
| Медиа | `sharp` (WebP 480/960/1600 + blur), `ffmpeg` (постер видео), драйвер `local` / `s3` | `src/lib/media.ts`, `src/lib/images.ts`, `src/lib/storage.ts` |
| Auth | Серверные сессии в БД, bcrypt, TOTP (`otplib`), preview-JWT (`jose`) | `src/lib/auth.ts`, `src/lib/preview.ts` |
| Почта | `nodemailer` по SMTP; без SMTP — `console.log` | `src/lib/mail.ts` |
| Тесты | Vitest (unit), Playwright (e2e), CI на GitHub Actions | `tests/`, `.github/workflows/ci.yml` |
| Хостинг | Не подключён (Vercel+Neon описаны в README, но не настроены); работает только демо на GitHub Pages | `docs/memory/infrastructure.md` |

Новый тип контента = таблица в `src/db/schema.ts` + запись в `src/admin/resources.ts`; списки, формы,
валидация и сохранение генерируются (`src/admin/engine.ts`).

## Регионы и URL

| Регион | Код | Охват (по `REGION_LABELS` / `regionForCountry`) |
|---|---|---|
| Americas | `us` | Северная и Латинская Америка |
| Europe, Middle East, LatAm & Australia | `ous` | всё, что не `us`/`apac` |
| Asia & Pacific | `apac` | Азия + Ближний Восток (IL, SA, AE, TR, EG …) |

Расхождение: подпись `ous` говорит «Middle East / Latin America», а `regionForCountry` относит Ближний
Восток к `apac`, Латинскую Америку — к `us` (см. BACKLOG → Решения за владельцем).

- **Регион в пути**, не в cookie: `/{us|ous|apac}/…` (см. ADR-002). Неверный сегмент → 404.
- Cookie `rm_region` (1 год) — последний посещённый регион, только чтобы выбрать меню «Our Therapies»
  и CTA на главной. Cookie `rm_geo` (30 дней) — предложенный по стране регион (заголовки
  `x-vercel-ip-country` / `cf-ipcountry` / `x-country-code`); жёсткого гео-редиректа нет.
- **Legacy-хосты** (`us.` / `ous.` / `apac.rapid-medical.com`, `*-rapid-medical.juuced.co`) → 301 на
  `NEXT_PUBLIC_SITE_URL/{region}{path}`; корень → `/therapies`, `lvo|mvo|aneurysm|vasospasm|access` →
  `/therapies/{slug}`.
- Прочие старые пути — таблица `redirects` (проверяется перед 404 в catch-all страницах); промахи
  пишутся в `not_found_log`.
- `/{region}` → редирект на `/{region}/therapies`; `/{region}/contact-us` → `/contact-us?region=…`.
- Терапии в сиде: US — lvo, aneurysm, access; OUS и APAC — lvo, mvo, aneurysm, vasospasm, access.

## Данные

Все таблицы — `src/db/schema.ts`. Enum-ы: `region` (us/ous/apac), `status` (draft/published),
`user_role` (admin/approver/editor), `review_status` (editing/in_review/changes_requested/approved),
`submission_status` (new/in_progress/done/spam).

### Контент (ресурсы админки)

| Таблица | Admin slug | Ключевые поля | `status` по умолчанию | Особенности |
|---|---|---|---|---|
| `solutions` | `solutions` (Therapies) | `slug`+`region` (unique), `productId`, hero/intro, `benefits[]`, overview, `overviewFeatures[]`, `annotatedImage`, `specs` (таблица) / `specImageUrls` (legacy), `howItWorks[]`, `inPractice[]`, `actionLinks[]`, closing, `regulatoryHtml`, `referencesHtml`, SEO | `draft` | Одна строка на (терапия, регион) — регуляторика разная. «Copy to {REGION}» в админке |
| `publications` | `publications` (Evidence) | `title`, `authors`, `journal`, `publishedOn` (месяц), `url`/`pdfUrl`/`doi`, `productId`, `regions[]` (пусто = все), `featured`, `imageUrl` | `published` | |
| `news_items` | `news` | `title`, `publishedOn`, `url` (внешняя), `source`, `excerpt`, `featured` | `published` | Только внешние ссылки |
| `webinars` | `webinars` | `title`, `speaker`, `event`, `heldOn`, `videoUrl` (приватная), `productId`, `regions[]` | `published` | Доступ к записи — через форму-запрос |
| `team_members` | `team` | `slug`, `name`, `title`, `longTitle`, `bioHtml`, `photoUrl` | `published` | |
| `jobs` | `jobs` | `slug`, `title`, `location`, `department`, `descriptionHtml`, `applyUrl`/`applyEmail` | `draft` | |
| `pages` | `pages` | `slug`+`region` (unique; `region` null = глобальная), `bodyHtml`, SEO, `noindex` | `draft` | Юр. страницы, кампанийные лендинги |
| `products` | `products` | `slug`, `name`, `fullName`, `family`, `regions[]` (вкладка Evidence), `aliases` (напр. APAC → COLUMBUS™) | — | **Без workflow**: сохранение сразу live |
| `redirects` | `redirects` | `from` (host+path или path), `to`, `permanent`, `hits` | — | **Без workflow** |

JSON-формы внутри jsonb: `ActionLink`, `SpecTable`, `Stat`, `Chart` (bar/stackedBar), `Feature`,
`AnnotatedImage`, `Benefit`, `Step`, `InPracticeItem` — типы в начале `schema.ts`.

### Настройки (`site_settings`, ключ → jsonb)

Группы (`src/admin/settings.ts`): `contact` (телефоны, e-mail заказов, офисы с координатами для карты),
`social`, `home`, `about`, `careers`, `regional` (заголовок выбора локации, регуляторные сноски по
регионам), `evidence`, `therapies:us|ous|apac`, `workflow` (`requireApproval`, `notifyEmail`),
`branding`, `integrations` (`gaMeasurementId`, `userwayAccount`, `geoSuggest`).
Не используются кодом (поля есть, эффекта нет): `integrations.geoSuggest`, `branding.logoPngUrl`,
`branding.ogImageUrl`, `branding.faviconUrl`, `evidence.forefrontImageUrl`/`forefrontImage2Url`.

### Редакционные и служебные

| Таблица | Назначение |
|---|---|
| `drafts` | Отложенные изменения опубликованной записи (`resource`+`recordId` unique), `reviewStatus`, `reviewNote`, `publishAt`; `data = null` — только расписание/ревью |
| `setting_drafts` | Отложенные изменения группы настроек (из on-page editor) |
| `revisions` | Неизменяемые снимки: `created` / `draft` / `published` / `restored`; baseline «Import» перед первой правкой сид-записи |
| `audit_log` | Кто что сделал: login, login_failed, save, publish, unpublish, delete, restore, bulk, settings, user, media, review, schedule, logout |
| `media` | Медиатека: `url`, `key`, `mime`, размеры, `alt`, `variants[]`, `placeholder`, `posterUrl`, `sourceUrl` (Duda) |
| `contact_submissions` | Заявки форм: `form` (contact/webinar/careers), контакты, `meta`, `status`, `ip`, `userAgent` |
| `users`, `sessions`, `password_resets`, `login_attempts` | Аккаунты и безопасность |
| `not_found_log` | Публичные 404 (дедуп по пути) для создания редиректов |

## Доступы

| Кто | Что может (по коду) |
|---|---|
| **Посетитель** | Все публичные страницы (только `status = published`), формы. С preview-ссылкой (JWT, 7 дней) — видит черновики и pending-правки |
| **editor** | Вход в `/admin` и on-page editor; создаёт/правит любые ресурсы (кроме Users); при выключенном согласовании — публикует сам; при включённом — «Submit for review» |
| **approver** | Как editor + Approve / Request changes и публикация при включённом согласовании |
| **admin** | Всё, включая `/admin/users` (создание, роли, деактивация, сброс 2FA) |

- Жёсткие ролевые проверки — `requireAdmin()` на `/admin/users` и проверка в `src/admin/actions.ts`. Остальное — `requireUser()`
  (сессия + пройденная 2FA). Удаление, unpublish, расписание, настройки сайта, медиа, редиректы,
  продукты доступны любой роли. См. `docs/memory/findings/pre-launch-audit.md` — расхождения с заявленной моделью согласования.
- `/admin/*` без cookie `rm_admin` → `/admin/login?next=…` (проверка формата cookie в proxy; реальная
  проверка — в layout админки и части страниц/экшенов). `/api/admin/*` проверяют `getSession()` (без проверки 2FA).
- Сессия: 7 дней, httpOnly, `sameSite=lax`, отзывная. Троттлинг входа: 8 неудач на e-mail или IP за 15 мин.
- Пароль ≥ 10 символов. 2FA (TOTP) опциональна, 8 recovery-кодов. Сброс пароля — ссылка на 1 час.

## Редакционный процесс

Ресурсы со `status` (`solutions`, `publications`, `news`, `webinars`, `team`, `jobs`, `pages`) идут через
workflow (`src/admin/workflow.ts`); `products` и `redirects` сохраняются сразу.

| Ситуация | Что происходит при Save |
|---|---|
| Новая запись | Вставка со `status = draft`, ревизия `created` |
| Запись не опубликована | Правка на месте, ревизия `draft`; если в форме выбран `published` — сразу `publish()` |
| Запись опубликована | Live не трогается; изменения → `drafts`, ревизия `draft`, «pending» |

- **Publish**: черновик сливается в live, `status = published`, черновик удаляется, ревизия `published`,
  `revalidatePath` по `resource.revalidate` + preview-URL + `/sitemap.xml`.
- **Согласование** (`workflow.requireApproval`, по умолчанию выкл.): editor → `in_review` (письмо на
  `workflow.notifyEmail`); approver/admin → `approved` / `changes_requested`; публиковать может
  admin, approver или кто угодно при `approved`. Правка approved-черновика сбрасывает его в `editing`.
- **Отложенная публикация**: `drafts.publishAt`; `GET /api/cron/publish` публикует всё, у чего время
  наступило (системный актор «Scheduler»).
- **История**: `/admin/{resource}/{id}/history` — сравнение двух ревизий (или live/pending) по полям с
  подсветкой слов; restore = сохранение через тот же workflow.
- **Preview**: `/api/preview?token=…` включает Next draft mode; публичный слой (`src/lib/content.ts`)
  показывает неопубликованные строки и накладывает `drafts`; баннер «Exit preview».
- **On-page editor**: см. `docs/screens/on-page-editor.md`. Настройки-синглтоны (home, about, …) из
  редактора пишутся в `setting_drafts`; Save на форме Site settings публикует их.

## Уведомления

| Событие | Кому | Тема | Код |
|---|---|---|---|
| Отправка любой формы (contact / webinar / careers) | `MAIL_TO` (один адрес на все формы), `replyTo` = посетитель | `[Website] {form}: {topic} – {Имя Фамилия}` + ссылка в админку | `src/lib/forms.ts` |
| Черновик отправлен на ревью | `site_settings.workflow.notifyEmail` (если задан) | `[Website] Review requested: …` | `src/admin/workflow.ts` |
| Запрос сброса пароля | e-mail пользователя | `Reset your Rapid Medical admin password` | `src/app/admin/reset/page.tsx` |

Без `SMTP_HOST` письма только логируются в консоль (включая токен сброса пароля и данные заявки).
Ошибка отправки не видна посетителю (заявка всё равно сохраняется, ответ «Thank you»).

## Интеграции

| Что | Как | Статус |
|---|---|---|
| Google Analytics 4 | `next/script`, ID из Site settings → Integrations (`G-FB4LNFSBSR` на Duda по README) | Код есть; актуальный ID в БД не проверен |
| UserWay (доступность) | `cdn.userway.org/widget.js?account=…` | То же |
| Гео-подсказка региона | заголовки Vercel / Cloudflare | Работает всегда (тумблер `geoSuggest` не подключён) |
| YouTube / Vimeo | iframe в rich text и closing-блоке, whitelist хостов в санитайзере | |
| Duda CDN | `images.remotePatterns`, скрипты миграции `scripts/*duda*` | Временно, до полной миграции медиа |
| S3-совместимое хранилище | `@aws-sdk/client-s3`, `STORAGE_DRIVER=s3` | Код есть; не сконфигурировано (BACKLOG) |
| SMTP | `nodemailer` | Не сконфигурировано по умолчанию |
| Vercel Cron | `vercel.json` → `/api/cron/publish` 05:00 UTC | Не подключено (Vercel не настроен) |

## Инструмент Tigertriever (предложение, кода нет)

> Гипотеза на проектирование, 2026-11-08. Кода инструмента в репозитории нет; ниже — модель для прототипа Content Studio
> и для единой админки (ADR-005, ADR-006). Источники: `docs/tigertriever/product/active-product-ux-baseline-v0.4.md`,
> `research/admin-ux-content-workflows.md`, `research/content-taxonomy-ia.md`, `tables/feature-inventory.csv` (A-01…A-21).
> Факты по моделям, ручкам, рынкам, видео и праву публиковать — за маркетингом (`mvp-definition-v0.7.md`, раздел 6).
> Прототип Content Studio v0.1: `docs/tigertriever/prototypes/content-studio-v0.1.html` (ссылка на Artifact — в BACKLOG).

**Что это.** Два продукта в одном: офлайн-пакет для врача (ZIP, открывается без сети, тот же рендер урока, что в
предпросмотре) и Content Studio в общей админке, где маркетинг правит уроки и собирает пакеты. Учебное содержание
(тексты, видео, предупреждения, применимость к рынкам и устройствам) поставляет и отвечает за него Rapid Medical.

### Сущности

| Сущность | Поля | Правила |
|---|---|---|
| Модель | семейство (Tigertriever), название (Tiger 13, 17, 21, 25), порядок | Справочник, ведёт admin; редактор не создаёт |
| Ручка | название (Legacy slider, Precision knob), описание | Справочник, ведёт admin |
| Рынок | название, страны | **Не регионы сайта.** Свой справочник, ведёт admin |
| Конфигурация | модель × ручка × рынок | Только явно заведённые сочетания, никаких выводов «похоже на». Единица обучения и единица покрытия |
| Программа | конфигурация; разделы: Opening, 8 этапов, Closing | Шаблон фиксированный, состав и порядок этапов меняет дизайнер/admin. Этап — смысловой ключ (Deployment), один для всех конфигураций |
| Урок | конфигурация + этап; заголовок, краткая инструкция, предупреждения (обяз.), медиа: видео или кадр (обяз. для этапов), доп. материалы | Принадлежит конфигурации. Может **явно** делить ревизию с уроком другой конфигурации (общий урок). Ревизии как у сайта |
| Медиа | общая таблица `media` + для инструмента: версия файла, источник, готовность (Needs filming / Uploaded / Ready), где используется | Замена = новая версия; старые версии остаются, собранные пакеты на них не ломаются |
| Пара сравнения | конфигурация A, конфигурация B, рынок, включённые этапы, заметка о различиях | Только заведённые вручную. Этап входит в сравнение, если у обеих сторон есть урок с медиа |
| Пакет (релиз) | номер версии, рынок, конфигурации, пары, зафиксированные ревизии уроков и версий медиа, дата, размер, контрольная сумма, ZIP, статус (Built / Sent) | Неизменяемый. Новая публикация = новый пакет; старые доступны и не меняются |

### Состояния и публикация

- **Save не меняет пакет.** Правки копятся в черновике урока. Статус урока и конфигурации: «In package v1.2»,
  «Unpublished changes», «Not in any package».
- **Отдельного согласования нет** (ADR-006): Publish в инструменте = собрать новый пакет. Кто имеет право нажимать —
  вопрос MED-08 к маркетингу.
- **Publish:** состав пакета (какие конфигурации и пары) → проверки → сборка → пакет vN+1 со статусом Built →
  редактор скачивает, проверяет офлайн, отмечает Sent. Блокеры: пустое обязательное поле; у этапа нет медиа или медиа
  «Needs filming»; у пары нет одной стороны. Блокер показан у места с действием «Open stage» или «Leave out of this package».
- **Changes:** тот же этап рядом: слева «In package v1.2», справа «Your draft»; изменённые поля подсвечены; список
  затронутых конфигураций и пар.
- **Общее медиа:** перед заменой показать, где ещё используется; выбор «Only this lesson» (урок получает свою ревизию)
  или «Everywhere it's used (N lessons)». Ничего не распространяется само.
- История, комментарии на месте, Undo — те же механизмы, что у сайта.

### Общее с сайтом и раздельное

| | Общее | Раздельное |
|---|---|---|
| Вход, 2FA, роли, журнал, сессии | да | |
| Выбор продукта | после входа: Website / Training tool | |
| Медиатека | таблица и загрузка | метаданные инструмента: версия, готовность, применимость |
| Черновики, ревизии, история, комментарии | механизм | |
| Единица контента | | сайт: страница из блоков; инструмент: урок в программе конфигурации |
| Публикация | кнопка Publish и проверки перед ней | сайт: живые страницы; инструмент: замороженный ZIP |
| География | | регионы сайта и рынки инструмента — разные справочники |
| Роли | editor, admin | дизайнер сайта правит оформление блоков; шаблон программы и рендер урока — за разработкой |

### Офлайн-пакет (контракт для спайка S0)

ZIP: `index.html` + `manifest.json` (версия, рынок, конфигурации, пары, зафиксированные ревизии) + медиафайлы.
Открывается с `file://`, без сетевых запросов; тот же рендер урока, что в Preview. Проверить на машинах клиента
(BACKLOG → Сейчас, п. 5); до проверки архитектуру сборки не обещать.

### Экраны Content Studio (прототип v0.1)

| Экран | Назначение |
|---|---|
| Выбор продукта | После входа: Website / Training tool |
| What's ready | Матрица конфигурации × этапы и строка пары сравнения; ячейка: In package / Changed / Ready / No video / Not started; клик → урок. Сверху «Needs your attention» |
| Урок (редактор на странице) | Урок выглядит как у врача. Клик по тексту — правка; клик по видео — панель Video: заменить, где используется. Сверху: назад, контекст (Tiger 13 · Precision knob · Europe · Positioning), статус, Undo/Redo, Comment, Changes, Preview, Publish |
| Changes | In package v1.2 и Your draft рядом для текущего урока |
| Publish | Состав, проверки, блокеры с действиями, «Publish package v1.3» → Built → Download, Mark as sent |
| Packages | Версии: дата, рынок, состав, что изменилось, Built / Sent |
| Media | Общая медиатека с фильтром готовности и «где используется» |

## Экраны (индекс)

Колонка «Спека»: ссылка — написана; «спека не написана» — экран есть в коде, спеку не делали.

### Публичные

| Роут | Назначение | Спека |
|---|---|---|
| `/` | Главная: hero, проблема/статистика, «engineered» баннер, новости | [home](screens/home.md) |
| `/choose-your-location` | Выбор региона (`?next=` — куда вести), подсветка предложенного | спека не написана |
| `/{region}` | Редирект на `/{region}/therapies` | — |
| `/{region}/therapies` | Лендинг «Our Therapies» региона (настройки `therapies:{region}`) | спека не написана |
| `/{region}/therapies/{slug}` | Страница терапии | [therapy](screens/therapy.md) |
| `/{region}/evidence` | Публикации по региону, вкладки по продуктам | [evidence](screens/evidence.md) |
| `/{region}/webinars` | Список вебинаров + форма-запрос записи | спека не написана |
| `/{region}/{slug}` | Региональная страница из `pages` (лендинги) | спека не написана |
| `/{slug}` | Глобальная страница из `pages` (privacy, terms, …); промах → redirects / 404 | спека не написана |
| `/news-events` | Внешние новости | спека не написана |
| `/about-us` | О компании, руководство, офисы, интерактивная карта | спека не написана |
| `/team/{slug}` | Профиль руководителя | спека не написана |
| `/careers` | Карьера, цитаты, принципы, форма | спека не написана |
| `/open-positions`, `/open-positions/{slug}` | Вакансии и вакансия с формой | спека не написана |
| `/contact-us` | Контактная форма (`?region=&topic=`) | [contact-us](screens/contact-us.md) |
| `/sitemap.xml`, `/robots.txt` | SEO (disallow `/admin`, `/api`) | — |

### Админка

| Роут | Назначение | Спека |
|---|---|---|
| `/admin/login`, `/admin/login/2fa` | Вход, второй фактор | спека не написана |
| `/admin/reset` | Запрос и установка нового пароля | спека не написана |
| `/admin` | Дашборд: счётчики, pending-черновики, черновики настроек | спека не написана |
| `/admin/{resource}` | Список: поиск, фильтры, сортировка, пагинация, bulk publish/unpublish/delete | спека не написана |
| `/admin/{resource}/new` | Создание записи | [admin-record-edit](screens/admin-record-edit.md) |
| `/admin/{resource}/{id}` | Форма записи + панель workflow | [admin-record-edit](screens/admin-record-edit.md) |
| `/admin/{resource}/{id}/history` | Сравнение и восстановление ревизий | спека не написана |
| `/admin/settings?group=` | Site settings по группам | спека не написана |
| `/admin/media` | Медиатека: загрузка, alt, где используется, удаление | спека не написана |
| `/admin/submissions`, `/admin/submissions/{id}` | Заявки форм, статус, CSV | спека не написана |
| `/admin/not-found-log` | Битые ссылки → редирект в один клик | спека не написана |
| `/admin/activity` | Журнал действий | спека не написана |
| `/admin/account` | Пароль, 2FA, активные сессии | спека не написана |
| `/admin/users` | Пользователи и роли (только admin) | спека не написана |
| on-page editor (`/api/editor?on=1&redirect=…`) | Правка текстов/медиа на живых страницах | [on-page-editor](screens/on-page-editor.md) |

### API

| Роут | Назначение | Доступ |
|---|---|---|
| `GET /api/editor` | Вкл/выкл on-page editor (draft mode + cookie `rm_edit`) | вкл — сессия с 2FA; выкл — любой |
| `GET /api/preview` | Вкл/выкл preview по JWT | токен |
| `GET /api/cron/publish` | Публикация по расписанию | `Authorization: Bearer $CRON_SECRET` (если задан) |
| `GET /api/health` | Проба БД | публично |
| `GET/PATCH/DELETE /api/admin/media` | Пикер медиатеки, alt, удаление (отказ, если используется) | сессия |
| `POST /api/admin/upload` | Загрузка (≤ 200 МБ; png/jpg/webp/gif/svg/pdf/mp4/webm); на Vercel с `local` → 503 | сессия |
| `GET /api/admin/submissions.csv` | Экспорт заявок | сессия |
