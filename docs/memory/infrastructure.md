# Инфраструктура — Rapid Medical

> Снимок по файлам репозитория на `59169da` (Dockerfile, docker-compose.yml, vercel.json, CI,
> .env.example, README). Значения секретов здесь не хранятся.
>
> **Факт (владелица, 2026-11-05): ничего не подключено** — Vercel, Neon, домен, SMTP, S3 не настроены.
> Живёт только статическое демо на GitHub Pages; оно нужно для сбора информации с сайтов Duda, структура
> в нём ещё не проработана. Строки ниже про Vercel/Neon — описание из README, а не работающая среда.

## Окружения

| Окружение | Как поднимается | БД | Медиа | Статус |
|---|---|---|---|---|
| Локально, Docker | `docker compose up --build` → app `:${APP_PORT:-3000}` + Postgres `:${DB_PORT:-5432}` | `postgres:16-alpine`, volume `pgdata` | `./public/uploads` смонтирован в контейнер | по README; работает у владельца — не подтверждено |
| Локально, Node | `docker compose up -d db` → `npm install` → `npm run setup` → `npm run dev` | локальный Postgres или свой `DATABASE_URL` | `public/uploads` | по README |
| Staging/prod, Vercel + Neon | Импорт `lana-pu/rapid-medical` в Vercel; build = `npm run build:vercel` (bootstrap: migrate + seed на пустой БД, затем `next build`) | Neon Postgres (`sslmode=require`) | `public/uploads` read-only; новые загрузки требуют S3 (иначе 503) | **не подключено** (2026-11-05) |
| Статическое демо, GitHub Pages | `npm run demo:export` → `out/` → ветка `gh-pages` → https://lana-pu.github.io/rapid-medical/ | только на этапе сборки (нужен `DATABASE_URL`) | копия в `out/` | **единственная живая среда**; цель — сбор информации с Duda, структура не проработана |
| Любой Node-хост (Railway, Fly, VPS, Docker) | `npx tsx scripts/bootstrap.ts && next start` | любой Postgres | для >1 инстанса — S3 + Redis для лимитера | описано в README, не используется |

Домен: `www.rapid-medical.com` фигурирует как дефолт `NEXT_PUBLIC_SITE_URL` в коде; DNS на приложение
**не переключён** (не подтверждено). Legacy-поддомены `us./ous./apac.` и `*-rapid-medical.juuced.co`
обрабатываются proxy, если DNS будет направлен на приложение.

## Переменные окружения (имена, без значений)

| Переменная | Где используется | Обязательна |
|---|---|---|
| `DATABASE_URL` | `src/db`, все скрипты | да |
| `AUTH_SECRET` | подпись preview-JWT (`src/lib/preview.ts`). В `.env.example` описан как «signing admin session cookies» — фактически сессии в БД, секрет нужен только для preview | да |
| `NEXT_PUBLIC_SITE_URL` | canonical/metadataBase, sitemap, robots, ссылки в письмах, цель legacy-редиректов | да |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `scripts/seed.ts` — первый admin (bootstrap запускает seed только при пустых `solutions` или `users`) | при первом запуске |
| `CRON_SECRET` | `/api/cron/publish` (если пусто — эндпоинт открыт) | рекомендуется |
| `STORAGE_DRIVER` | `local` (дефолт) / `s3` | нет |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | `src/lib/storage.ts`, `src/lib/media.ts` | при `s3` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO` | `src/lib/mail.ts` (без `SMTP_HOST` — лог в консоль) | для писем |
| `APP_PORT`, `DB_PORT` | `docker-compose.yml` | нет |
| `NEXT_PUBLIC_DEMO`, `NEXT_PUBLIC_BASE_PATH` | демо-сборка (`src/lib/demo.ts`, `next.config.ts`) | только демо |
| `DEMO_BASE_PATH`, `DEMO_PORT`, `DEMO_SITE_URL`, `SKIP_BUILD` | `scripts/export-demo.ts` | только демо |
| `VERCEL`, `NODE_ENV` | системные: блок загрузок на Vercel при `local`; HSTS и `secure`-cookie в production | — |

Дефолты в `docker-compose.yml` (только для локального запуска): `AUTH_SECRET=local-dev-secret-…`,
`ADMIN_EMAIL=admin@rapid-medical.com`, `ADMIN_PASSWORD=change-me-now-123`, Postgres `postgres/postgres`.

## Деплой

| Поток | Триггер | Что происходит |
|---|---|---|
| Vercel | push в `main` → автодеплой — **когда подключат**; сейчас не подключён | `build:vercel` = `tsx scripts/bootstrap.ts && next build`: ждёт БД, `scripts/migrate.ts`, сид на пустой БД (+ `migrate-media.ts`) |
| GitHub Pages (демо) | вручную: `npm run demo:export`, затем публикация `out/` в `gh-pages` | сборка с `NEXT_PUBLIC_DEMO=1` + `basePath=/rapid-medical`, обход всех публичных страниц и части админки, переписывание путей |
| Docker | `docker compose up --build` | образ `node:22-bookworm-slim` + ffmpeg; `CMD`: bootstrap → `next start -p 3000` |

Миграции: Drizzle (`drizzle/0000_init … 0008_blocks`), применяются `scripts/migrate.ts` (в bootstrap).
Генерация новых — `npm run db:generate`.

**Push-политика:** сейчас push в `main` запускает только CI (GitHub Actions), деплоя нет. После
подключения Vercel каждый push в `main` = деплой — тогда правило в `docs/rules/commits.md` ужесточается.

## Хранилище медиа
- `local`: `public/uploads/<yyyy-mm>/<name>-<hex>.<ext>` + варианты/постеры. Сейчас **~270 МБ закоммичено в
  git** (`public/uploads`, 197 файлов, 36 видео по README) — временно, «until S3 is configured» (`.gitignore`).
- `s3`: любой S3-совместимый бакет (AWS S3, Cloudflare R2, Backblaze, MinIO); `S3_PUBLIC_URL` — CDN перед бакетом.
- Перенос существующих файлов в бакет — «todo when hosting is decided» (README).
- Duda CDN (`irp.cdn-website.com`, `lirp.cdn-website.com`) разрешён в `images.remotePatterns` до конца миграции.

## Cron
`vercel.json`: `/api/cron/publish` ежедневно `0 5 * * *` (лимит Vercel Hobby; на Pro — `*/5 * * * *` по README).
Vercel подставляет `Authorization: Bearer $CRON_SECRET` сам. Вне Vercel — любой планировщик с этим заголовком.

## CI
`.github/workflows/ci.yml`: на push в `main` и на любой PR. Ubuntu, Node 22, сервис `postgres:16-alpine`,
ffmpeg. Шаги: `npm ci` → `.env` из примера → `lint` → `typecheck` → `npm test` (Vitest) →
Playwright chromium → `npm run test:e2e`; при падении — артефакт `test-results`. CI не деплоит.

## Мониторинг и логи
`GET /api/health` (select 1, 200/503). Внешнего аптайм-мониторинга, error-трекинга, бэкапов БД в репозитории
не настроено (не подтверждено вне репо).

## Ветки (локальные ссылки, без fetch)
`main` (= `59169da`), `origin/gh-pages`, `origin/docs/tigertriever-ux-2026-11-05` (UX-ресёрч по
Tigertriever, ответвлена от `5b1f8c0`, в `main` не влита).
