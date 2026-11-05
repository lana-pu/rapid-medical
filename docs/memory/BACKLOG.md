# BACKLOG — Rapid Medical

Единственный список «что не сделано». Заведён при ретрофите 2026-11-05 по коду `59169da`, README
(«Known content issues», Deploying), `.gitignore`, `next.config.ts`. Поиск `TODO|FIXME|XXX|HACK` по `src/`,
`scripts/`, `content/seed/`, `tests/` — **явных TODO в коде нет**; пункты ниже — из README и чтения кода.
Пометка «по коду» = найдено чтением, не воспроизведено запуском.

## P0 — до запуска в прод / до передачи редакторам

> Сейчас ничего не подключено и сайт нигде не работает (2026-11-05), поэтому пункты ниже — блокеры
> **запуска**, а не горящие дыры. Структура сайта ещё будет прорабатываться и код может заметно
> поменяться: чинить имеет смысл перед подключением Vercel/передачей редакторам, а не сейчас.

1. **Обход согласования через форму.** Editor при `requireApproval = on` публикует *неопубликованную*
   запись, выбрав `status = published` в форме: `saveWithWorkflow()` вызывает `publish()` без `canPublish()`
   (`src/admin/workflow.ts`). По коду.
2. **Расписание игнорирует согласование.** `publishDue()` публикует все наступившие `publishAt` без проверки
   `approved`, хотя UI пишет «Publishes … at that time, if approved» (`WorkflowPanel.tsx`). Любая роль может
   поставить расписание (`scheduleAction` без проверки роли). По коду.
3. **Site settings без проверки роли.** Форма `/admin/settings` (`requireUser`) пишет сразу в live любую
   группу, включая `workflow.requireApproval` (editor может выключить согласование) и `integrations`.
   Согласование и `setting_drafts` при этом обходятся. По коду.
4. **Stored XSS через Integrations.** `gaMeasurementId` вставляется строкой в inline-скрипт
   (`gtag('config','${id}')`), `userwayAccount` — в URL скрипта (`src/components/site/Integrations.tsx`);
   формат не валидируется, задать может любая роль (п. 3) или через on-page `saveField`
   (`settings:integrations`). Нужна валидация формата (`G-[A-Z0-9]+`) и/или экранирование. По коду.
5. **API админки принимает сессию без 2FA.** `/api/admin/upload`, `/api/admin/media` (PATCH/DELETE),
   `/api/admin/submissions.csv` проверяют `getSession()`, но не `totpPending` → после ввода одного пароля
   можно выгрузить CSV с персональными данными заявок, загружать/удалять медиа. По коду.
6. **Нет лимита попыток 2FA.** `/admin/login/2fa` не считает неудачи (только пишет `login_failed` в аудит) —
   перебор 6-значного TOTP после пароля. По коду.
7. **Права ролей не применены.** Delete (bulk), Unpublish, Discard, Restore, Schedule, удаление медиа,
   Products, Redirects — доступны editor. Сначала решить модель (см. «Решения за владельцем»), затем
   проверки в `src/admin/actions.ts`, `inline.ts`, `api/admin/*`.
8. **Осиротевшие черновики ломают cron.** Bulk delete удаляет строку, но не `drafts`/`revisions`
   (`drafts.recordId` без FK). Черновик с `publishAt` → `publish()` бросает «Record not found» →
   `/api/cron/publish` падает и не публикует остальные. По коду, не воспроизведено.
9. **Почта форм не настроена.** Без `SMTP_*` заявки только в консоли; получатели на Duda неизвестны
   (README Known issue). Настроить SMTP + `MAIL_TO` (и маршрутизацию, если нужна — `src/lib/forms.ts`).
10. **Медиа-загрузки на Vercel невозможны** без S3 (`STORAGE_DRIVER=s3` + `S3_*` + перенос `public/uploads`
    в бакет — «todo when hosting is decided»). Блокирует работу редакторов на staging/prod.

## P1 — важно, сразу после P0

1. **Согласие на cookies / GA.** GA4 и UserWay грузятся без баннера согласия (в коде нет consent) — риск
   для EU-посетителей (OUS). Решение — за владельцем, реализация — P1.
2. **Индексация staging и демо.** `robots.ts` разрешает всё на любом хосте (`*.vercel.app`, GitHub Pages) →
   дубли контента в Google. Нужен `noindex` вне боевого домена.
3. **Нет `hreflang`/`canonical`** между региональными версиями одной терапии (grep пуст) — при
   регион-в-пути (ADR-002) это важно для SEO.
4. **SVG в загрузках** (`image/svg+xml` разрешён, отдаётся с того же origin) + MIME берётся из `file.type`
   клиента → stored XSS через медиатеку при прямом открытии файла. Запретить SVG или отдавать с
   `Content-Disposition`/другого домена; проверять сигнатуру файла.
5. **CSV-инъекция формул** в экспорте заявок (поля от посетителей начинаются с `= + - @`) —
   `src/app/api/admin/submissions.csv/route.ts`.
6. **Доверие `x-forwarded-for`** (первый адрес) для лимитов и аудита — подделывается клиентом вне
   доверенного прокси. Брать IP из заголовка платформы.
7. **Лимитер форм в памяти инстанса** (`src/lib/forms.ts`, «Replace with Redis/Upstash in multi-instance
   hosting») — на Vercel фактически не работает между инстансами. NB: README говорит «move the *login* rate
   limiter to Redis», но логин-лимитер уже в Postgres (`login_attempts`); в памяти — лимитер форм.
8. **`CRON_SECRET` пустой → `/api/cron/publish` открыт** (дефолт в compose пустой). Сделать обязательным в prod.
9. **Без SMTP в лог уходят ПДн и токен сброса пароля** (`src/lib/mail.ts`) — на Vercel это логи проекта.
10. **Настройки-пустышки** (поле есть, эффекта нет): `integrations.geoSuggest` (подсказка работает всегда),
    `branding.ogImageUrl` / `logoPngUrl` / `faviconUrl` (OG-картинка захардкожена `/og-image.jpg`),
    `evidence.forefrontImageUrl` / `forefrontImage2Url`. Подключить или убрать.
11. **Контент из Duda (README, нужен человек):**
    - US Aneurysm встраивает OUS-картинки overview/spec и ссылку на `apac.rapid-medical.com` (флаг в
      `content/seed/solutions.ts:439`).
    - Access (Drivewire) — текста нет, копия «запечена» в картинки; в админке плейсхолдеры.
    - Спецификации — скриншоты (`specImageUrls`); заменить таблицами `specs` «once the design is settled».
    - Кейс «Dr. Rishi Gupta – TICI 3» (US LVO) был Wix-PDF-viewer — нужен настоящий PDF.
    - APAC MVO «Comfort of control» и часть APAC-блоков — с OUS-картинками.
    - В инвентаре краула (`content/audit.md`, APAC Aneurysm) ссылка `mailto:info@rapidmedical.com` (без
      дефиса) — проверить, не перенесена ли опечатка в живой контент (в `content/seed` не найдена).
12. **Медиа в git (~270 МБ).** После включения S3 — вернуть `/public/uploads/` в `.gitignore`.

## P2 — улучшения и долги

1. `revalidate` у ресурсов не включает `/apac` (`solutions`, `publications`, `webinars`, группа `regional`);
   страницы сейчас динамические (cookies), эффект не проверен — привести в соответствие.
2. Repeater-подполя не валидируются на сервере (`engine.ts → parseField 'repeater'`): обязательность, URL.
3. Тема контактной формы обязательна только на клиенте; в zod — нет.
4. Open redirect на `/admin/login/2fa`: при уже пройденной 2FA `redirect(sp.next)` без проверки, что путь локальный.
5. `/api/health` отдаёт текст ошибки БД публично.
6. Нет лимита на запросы сброса пароля (`/admin/reset`) — e-mail-флуд.
7. Хардкод цветов вне токенов (`neutral-900`, `black`, хексы `WorldMap.tsx`) — вынести в токены при редизайне (`docs/DESIGN.md`).
8. Секция Evidence «Featured publications» показывает 3 последние публикации **с картинкой**, а не featured.
9. `.env.example`: `AUTH_SECRET` описан как подпись session-cookie — фактически только preview-JWT.
10. Мёртвый код: экшен `deleteResource` нигде не вызывается (удаление только bulk); переменная `allProducts` на Evidence.
11. Спеки экранов, помеченные в `docs/spec.md` «спека не написана».

## Идеи

- CAPTCHA на формы, если пойдёт спам (README).
- Маршрутизация заявок по теме/региону и автоответ посетителю.
- Блокировка/предупреждение при одновременной правке одной записи двумя редакторами.
- Удаление записи из формы (сейчас только bulk) с каскадной чисткой черновиков/ревизий.
- Внешний аптайм-мониторинг `/api/health`, error-трекинг, бэкапы БД.

## Решения за владельцем

1. **Vercel:** ~~подключён ли?~~ **Не подключён, Neon тоже (2026-11-05).** Открыто на момент подключения:
   URL staging, план Hobby или Pro (частота cron: раз в сутки vs каждые 5 минут), Neon или другой Postgres.
2. **Домен и DNS:** когда переключать `www`/`us`/`ous`/`apac.rapid-medical.com`, кто управляет DNS,
   нужны ли ещё хосты `*-rapid-medical.juuced.co`? Итоговое значение `NEXT_PUBLIC_SITE_URL`.
3. **Получатели писем:** кому идут заявки contact / webinar / careers (один `MAIL_TO` или по форме/теме/региону)?
   Кто получает уведомления о ревью (`workflow.notifyEmail`)? Какой SMTP-провайдер?
4. **Хранилище медиа:** Cloudflare R2 / AWS S3 / Backblaze? Когда выносить медиа из git?
5. **Модель прав:** что разрешено editor (удаление, unpublish, Site settings, Integrations, Redirects,
   Products, медиа)? Включать ли `requireApproval` к запуску?
6. **Дизайн:** кто делает визуальный дизайн, сроки, бренд-материалы (цвета, шрифты, логотипы)?
   Связь с ресёрчем в ветке `docs/tigertriever-ux-2026-11-05`.
7. **Ветка `origin/docs/tigertriever-ux-2026-11-05`** (UX-ресёрч, JTBD, прототипы) — вливать в `main`? Она
   ответвлена от `5b1f8c0` и при прямом merge откатит последний коммит кода — нужен rebase или перенос только `docs/`.
8. **Контент-проблемы из Duda** (P1 п. 11): кто решает и в каком виде (тексты Access, PDF кейса, картинки APAC, US Aneurysm)?
9. **Регионы:** подпись OUS «Europe, Middle East, Latin America & Australia», но гео-маппинг шлёт Ближний
   Восток в APAC, Латинскую Америку — в US; в форме есть отдельный «Middle East». Какая карта правильная?
10. **Cookie consent / GDPR** для GA4 и UserWay; актуальны ли ID `G-FB4LNFSBSR` и `cDW2354yK3`?
11. **Демо на GitHub Pages:** назначение известно — сбор информации с Duda (2026-11-05). Открыто: держать
    публичным? закрыть от индексации? (в нём статические страницы админки).
12. **Staging:** закрыть паролем / `noindex`?
13. **Evidence «Featured publications»:** должна ли секция показывать отмеченные `featured` или последние?
14. **Вебинары APAC:** README упоминает только `/us/webinars`, `/ous/webinars`; страница и sitemap есть и для `/apac`. Нужна ли?
15. **ADR-001:** подтвердить причину отказа от headless-CMS (в коде не записана).
16. **Источник правды по контенту на время миграции:** Duda заморожен или правки идут параллельно?
