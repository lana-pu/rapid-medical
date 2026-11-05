# Security check — эталонный чек-лист (14 разделов A–N) и формат отчёта

Эталон для аудита безопасности веб-приложения и основа проектного `docs/security-checklist.md`. Используется промтом `development/prompts/security-check.md` как полный перечень пунктов; можно прогнать и самостоятельно — для полного аудита перед публичным запуском.

Когда применять полностью: перед публичным запуском; регулярно в проде (раз в месяц / перед релизом). Фокусно — после каждого нового вектора атаки: деплой (L, H, G, I), auth (A, D, E), загрузки файлов / AI / вебхуки (F, J, B).

## Шаг 0 — Источники

- Этот чек-лист (A–N) — основной источник.
- `docs/security-checklist.md` проекта — накопленные пункты, специфичные для продукта (если есть).
- Правила безопасности проекта (`docs/rules/` или `rules/`, например `safety-checks` — секреты, debug-код, body-лимиты), если есть.
- `docs/memory/infrastructure.md` — реальная конфигурация сервера.
- При необходимости — Next.js Security, OWASP Cheat Sheets.

Нет файла — пометь N/A в отчёте и продолжай.

## Шаг 1 — Прогон по разделам

По каждому пункту: 🔴 / ⚠️ / ✅ / N/A + `файл:строка` + что чинить. Проверяй **реальный код и реальный сервер** (grep, curl, ssh, чтение конфигов), не описывай атаку абстрактно.

**A. Authorization & IDOR**
- Каждый API-эндпоинт (`app/api/`, server actions) проверяет сессию.
- Ресурс с владельцем: проверка `entity.userId === session.user.id` (иначе 404).
- List-эндпоинты фильтруют по пользователю / правам.
- Admin-эндпоинты дополнительно проверяют роль.

**B. Inputs & Injection**
- SQL: ORM с параметризацией; `$queryRaw` только через template literal, не склейкой строк.
- Mass assignment: в `update` не передаётся `request.body` целиком — whitelist (`z.pick`, явная деструктуризация).
- Prototype pollution: dynamic params не разворачиваются `{...params}` без проверки.
- AI-вход: пользовательский текст в промтах LLM не может переопределить системные инструкции и доступы.

**C. XSS**
- Все места вставки сырого HTML (`dangerouslySetInnerHTML` и аналоги во Vue/Svelte/Solid) — только с санитизацией.
- Сторонний HTML/Markdown — через DOMPurify / sanitize-html.
- Серверный рендер пользовательского ввода экранируется.

**D. CSRF**
- Cookie: `SameSite=Lax/Strict` + `HttpOnly` + `Secure` (прод).
- State-changing запросы (POST/PATCH/DELETE) — CSRF-token или SameSite + проверка `Origin`.

**E. Authentication / Sessions**
- Сессии можно инвалидировать (в БД, не только JWT).
- Пароли — bcrypt/scrypt/argon2 (bcrypt rounds ≥ 12), никогда plain.
- Reset-password: токен одноразовый, TTL ≤ 1 час.
- Смена email — подтверждение через старый адрес.
- Admin-пароль ≥ 16 символов.
- Нет user-enumeration на `/login` и `/forgot-password` (одинаковые ответы).
- Rate limit на `/api/auth/*` (≈ 5/мин с IP, регистрация ≈ 3/час).

**F. File uploads**
- Whitelist MIME + проверка magic bytes (`file-type`), расширение — по содержимому, не из `file.name`.
- Явный `MAX_SIZE_BYTES`.
- Имя на диске — UUID/cuid (нет path traversal).
- Защита от архивных бомб.

**G. Secrets**
- Pre-commit сканирует секреты (`sk-`, `ghp_`, `AKIA…`); PreToolUse-хук блокирует запись секретов.
- `.gitignore`: `.env`, `.env.*`, `!.env.example`.
- Нет `process.env.X || 'fallback'` для секретов — отсутствие переменной = явная ошибка.
- `chmod 600` на `.env*`.
- История git чистая: `git log --all --full-history -- '.env*'`, `git log -p | grep -E 'sk-|ghp_|AKIA'`.

**H. HTTP security headers**
- `Content-Security-Policy` есть и не слишком разрешительный.
- `X-Frame-Options: DENY` или `SAMEORIGIN` (или `frame-ancestors` в CSP).
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` (camera/microphone/geolocation — выключены, если не нужны).
- HSTS (`Strict-Transport-Security`), когда HTTPS стабилен.

**I. Body size & timeouts**
- Явный лимит body на API (особенно upload); nginx `client_max_body_size`.
- Slowloris: nginx `client_body_timeout`, `client_header_timeout`.
- Таймауты на внешние fetch (`AbortSignal.timeout`).

**J. Webhooks / Payments**
- Подпись вебхука проверяется (HMAC провайдера) через `crypto.timingSafeEqual`.
- Идемпотентность: событие не обрабатывается дважды.

**K. Audit & Logging**
- Audit log admin-действий.
- В логах нет паролей, токенов, полных email/телефонов без маски, PAN, CVV.
- Ротация логов (Docker `daemon.json` / logrotate).

**L. Deployment**
- Контейнер под non-root (`USER` в Dockerfile).
- `.env.production` — 600, владелец не `www-data`.
- UFW: открыты только 22/80/443; 5432, 6379 и др. — только localhost (и в compose публикация на `127.0.0.1:`).
- SSH только по ключам, root-логин отключён.
- fail2ban активен.
- Бэкап БД есть, ротация настроена, бэкапы и `.env` не в репо.

**M. Production-конфиг**
- `next.config`: нет `ignoreBuildErrors: true` / `ignoreDuringBuilds: true`.
- `serverActions.bodySizeLimit` и лимиты middleware/proxy — явно заданы.
- Body-лимиты проверены e2e-тестом.

**N. Архитектурные ловушки**
- Кастомный `server.js` не обходит auth-проверки proxy/middleware.
- JSON-файл как хранилище — есть блокировка (`flock`) или перенос в БД.

## Шаг 2 — Отчёт

`docs/audits/security-check-<YYYY-MM-DD>.md`:

```markdown
# Security Check — <YYYY-MM-DD>

## Сводка
- 🔴 Критично (блокирует прод): N
- ⚠️ Среднее (починить): M
- ✅ В порядке: K

## Критично 🔴
### A.1 — IDOR на /api/<resource>/[id]
- **Где:** app/api/<resource>/[id]/route.ts:25
- **Что:** GET возвращает ресурс без проверки владельца
- **Атака:** пользователь A открывает /<resource>/<id-B> по URL
- **Чинить:** `if (resource.userId !== session.user.id) return 404`

## Среднее ⚠️
### …

## В порядке ✅
- …

## Не проверено / out of scope
- <причина: нет файла, нет доступа к серверу>
```

## Шаг 3 — Решение о починке

```
Найдено 🔴 N, ⚠️ M. Чиним?
- Всё → по приоритету, 🔴 первыми
- Только 🔴 → ⚠️ в бэклог
- Показать диффы → подтверждение по каждому
- Не чиним → отчёт остаётся
```

## Шаг 4 — После починки

- Прогон тестов проекта (`docs/test-cases.md` / автотесты), если есть.
- save-session со slug `security-check-<YYYY-MM-DD>`.
- Каждая 🔴 → ADR в `docs/memory/decisions/`.

## Три механизма — дополняют друг друга

| | `scripts/security-precheck.sh` | `/security-check` | Месячный cron |
|---|---|---|---|
| Тип | bash, быстрый | AI, глубокий | bash, серверный |
| Время | секунды | минуты | секунды |
| Запуск | авто (deploy gate) | по запросу / триггеру | авто (раз в месяц) |
| Покрывает | 6 типовых ошибок | 14 разделов | серверные проверки и регрессии (права, порты) |
| Чинит | нет, блокирует | да, с подтверждением | нет, шлёт отчёт |

Precheck — `development/prompts/security-precheck-deploy-gate.md`. Месячный прогон — cron-задача на сервере, запускающая precheck и серверные проверки раздела L с отправкой отчёта.

## Антипаттерны

- Один прогон в самом конце — поздно; прогонять после каждого нового вектора.
- Чинить ⚠️ без подтверждения — можно сломать рабочее.
- Игнорировать ⚠️ — со временем становятся 🔴.
- Ставить ✅ на пункт, который не понят, — сначала разобраться (что такое CSP и т.п.).
