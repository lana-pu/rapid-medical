# 2026-11-27 — Settings: Where requests go отдельной настройкой, обзор строками, Save полосой, без полей-обманок

**Задача:** последнее пространство на полоске админки — Settings — тем же циклом, после того как владелица закрыла
Media («goon»).

## Что сделано
- Разбор «как сейчас» (12 экранов, 1280 и 390): обзор повторял колонку десятью карточками; Contact details — 2300 px,
  Save только внизу; **четыре поля сайт не читал** (Logo PNG, Social sharing image, Favicon, «Suggest region by
  visitor country»); **три разных числа** для Google (обзор 19, текст 17, фильтр 12); второй заголовок в Redirects;
  роли без объяснения; 80 сессий сырой строкой браузера, «0 recovery codes left» зелёным.
- Mobbin: Framer, Shopify, Etsy Pattern, Lyssna, Vercel, Airwallex, Mercury, Base44. Черновик:
  https://claude.ai/artifact/RhBC3cgZcJkwE45q6v4p9r.
- Владелица: «куда уходят заявки — отдельно, адреса по умолчанию, но editable» → в черновик добавлен экран Where requests
  go и вопрос 5; затем «ok» на все пять рекомендаций.
- Код (`a24f2b40`):
  - **Where requests go** — группа `requests`: Main address по региону (Americas / everywhere else), адрес у каждой темы
    Contact Us и у каждой формы; пусто → главный адрес региона → другой главный → `MAIL_TO`; несколько через запятую,
    неверный — «use email addresses… Nothing was saved.» Прежние 4 адреса читаются из `contact`, пока группу не
    сохранят (`inherit` у группы, `routingOf`). Письмо заявки и копия в готовом ответе — отсюда (`recipientFor`).
  - Обзор строками в пяти блоках; колонка Settings — те же блоки. Крошка «Settings › блок», пояснение под заголовком.
  - `SettingsForm` — Save полосой внизу (над нижней панелью на телефоне), «Unsaved changes», Discard, вопрос при уходе.
  - Repeater: `folded`, `summary` (строка «Ltd. · Headquarters»), `fold` у под-полей («Map pin»).
  - Подключены `ogImageUrl`, `faviconUrl` (`generateMetadata` в `(site)/layout.tsx`; `favicon.ico` → `public/`, иначе
    файловый значок перекрывает настройку — так в доке Next) и `geoSuggest`. Logo PNG убран из формы, значение в базе.
  - Одно число страниц для Google; `seoProblemCount` удалён.
  - Redirects: `ResourceListView({ embedded })` без своей шапки, «47 redirects» и New redirect в строке вкладок; колонка
    `kind: "to"` — «/old → /new».
  - People — таблица с подписями колонок, ⋯, «What each role can do» (по `spec.md → Доступы`).
  - My account & security — две строки, предупреждение при 0 кодов, входы от новых словами (`src/lib/device.ts`), 5 + Show more.
  - Regional notices — два блока, `/apac` в revalidate; пояснения у Social links, Branding, Integrations; «Activity log».
- Спека: `screens/admin-settings.md` («Иерархия», «Поля, которые сайт не читал», «Where requests go»), `spec.md →
  Уведомления, Интеграции`, `admin-account.md`, `admin-people.md`, `admin-not-found-log.md`, `admin-seo.md`,
  `admin-activity.md`.
- Скриншоты «было → стало»: https://claude.ai/artifact/CNLjmHiR2kBv2KDqd1DZuW.

## Изменённые файлы
- `src/lib/contact-topics.ts`, `src/lib/forms.ts`, `src/lib/device.ts` (новый), `src/admin/settings.ts`, `src/admin/fields.ts`,
  `src/admin/resources.ts`, `src/admin/seo.ts`
- `src/app/(site)/layout.tsx`, `src/app/layout.tsx`, `public/favicon.ico` (из `src/app/`)
- `src/app/admin/(dashboard)/(settings)/*` (layout, settings/page, Overview, users, account, activity, redirects),
  `(seo)/seo/page.tsx`, `(content)/[resource]/page.tsx`, `(inbox)/submissions/[id]/page.tsx`
- `src/components/admin/SettingsForm.tsx` (новый), `Repeater.tsx`, `ResourceForm.tsx`, `OldLinksTabs.tsx`
- `tests/unit/regions.test.ts`, `tests/unit/device.test.ts` (новый), `tests/e2e/admin.spec.ts`
- Спеки — выше.

## Принятые решения
- Where requests go — отдельная настройка, адрес у каждой темы и формы, Main address по региону (2026-11-27).
- Обзор строками; Save полосой; офисы свёрнуты; три поля подключить, Logo PNG убрать (2026-11-27).

## Находки
- Перенос `favicon.ico` (подготовлен `git mv`) попал в коммит параллельной сессии `316500a7` — она закоммитила общий
  индекс. При параллельной работе не держать staged изменения между шагами; `git mv` — прямо перед своим коммитом.
- Скриншоты подряд в одном 30-секундном окне TOTP: второй вход отклоняется (защита от повтора кода) — ждать новое окно.
- `npx eslint tests` находит старое `any` в `tests/unit/page-tree.test.ts`; `npm run lint` (src, scripts) — 0 ошибок.

## Открытые вопросы / следующие шаги
- Вписать info@ USA / INTL в Main address, когда клиент подтвердит адреса (BACKLOG п. 23).
- e2e общим прогоном (Settings, Where requests go, My account — тесты обновлены).
- Settings — последнее пространство полоски; что дальше — решает владелица.

## Связанное
- Предыдущая сессия: 2026-11-24-admin-media.md
