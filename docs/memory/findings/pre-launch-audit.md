# Перед запуском: дефекты кода

Перенесено из `BACKLOG.md` 2026-11-05: на текущей стадии это не задачи, а чек-лист перед подключением
Vercel и передачей админки редакторам. Админка будет проектироваться заново (ADR-005), поэтому часть пунктов
может отпасть сама. Перед запуском пройти список заново. «По коду» = найдено чтением, не воспроизведено.

## P0 — до запуска в прод / до передачи редакторам

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
10. Мёртвый код: переменная `allProducts` на Evidence.
11. Спеки экранов, помеченные в `docs/spec.md` «спека не написана».

## Дополнения ревизии 2026-11-05

Уточнения к пунктам выше:
- P0-1: второй путь без `canPublish` — restore ревизии со `status=published` на неопубликованной записи.
- P0-4: JS-инъекция есть только у `gaMeasurementId`; `userwayAccount` — не XSS. `saveField` пишет в
  `setting_drafts`, посетителям значение попадёт только после публикации.
- P0-5: то же у GET `/api/admin/media`.
- P0-8: падает каждый запуск cron; записи, опубликованные до сбоя, остаются без revalidate; из UI сироту не убрать.
- P1-4: шире, чем SVG: расширение берётся от клиента, `x.html` с типом `application/pdf` ляжет как HTML.
- P2-4: то же в `login/page.tsx`; публичный open redirect `/api/preview?exit=1&redirect=…`.

Новые:
1. **Правки опубликованных публикаций, новостей и вебинаров с датой не публикуются.** Дата из `drafts.data`
   приходит строкой, `publish()` отдаёт её в timestamp-колонку → `value.toISOString is not a function`
   (`workflow.ts`). Падение подтверждено на уровне drizzle, весь поток не запускался. Ломает форму, on-page
   Publish, bulk и cron. По серьёзности P0.
2. **Страницы админки полагаются на layout.** 7 страниц dashboard не вызывают `requireUser` сами, proxy
   проверяет только формат cookie. Гипотеза: RSC-запрос может обойти layout. Проверить до запуска
   (`next/dist/docs/01-app/02-guides/authentication.md`).
3. Link-поповер on-page editor: `href` не сохраняется в `heroCtaHref`, `actionLinks.*.href`, `blocks.*.links.*.href`
   (поле типа text отвергает значение `url`), подпись при этом сохраняется.
4. Unpublish не снимает расписание: cron возвращает снятую страницу.
5. Расписание разбирается в часовом поясе сервера, в UI пояс не показан.
6. Approved не сбрасывается при правке неопубликованной записи.
7. Bulk publish сообщает «Published N», даже если записи пропущены.
8. Удаление медиа не проверяет `drafts`, `setting_drafts`, `revisions`.
9. Recovery-коды в URL; смена пароля админом не отзывает сессии.
10. `scripts/export-demo.ts` выгружает страницы заявок, пользователей и журнала: на боевой БД это утечка ПДн.
11. Dev-зависимости: `npm audit` — 2 critical (`vitest`/`tinypool`), в прод не попадают.
