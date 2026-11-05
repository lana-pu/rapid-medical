# /security-check — аудит безопасности по стадии проекта + авто-запуск по триггерам

Запускай, когда пользователь пишет «проверь безопасность», «есть ли уязвимости», «security check», «OWASP», «аудит безопасности», «проверь auth / IDOR / secrets»; перед деплоем; после каждого нового вектора атаки (деплой на новый сервер, auth, загрузки файлов, AI-фичи, платежи/вебхуки); перед публичным запуском; раз в месяц на проде.

Нужно на входе: код проекта; для серверных разделов — доступ по SSH (`.env.deploy`) и `docs/memory/infrastructure.md`.

Результат: отчёт `docs/audits/security-check-<YYYY-MM-DD>.md` (раздел × статус), 🔴 починены, ⚠️ в бэклоге, проектный `docs/security-checklist.md` пополнен. Критерий запуска в прод: 🔴 = 0.

## Шаг 0 — Источники и параметры

- Полный перечень пунктов A–N и формат отчёта — `development/prompts/security-check-template.md`.
- `docs/security-checklist.md` — растущий список «что проверять» в этом проекте (нет — создай из разделов A–N и дополняй новыми векторами после каждого аудита). Сверяться с ним целиком, чтобы ничего не пропустить.
- `docs/security-todo.md` (или общий бэклог проекта) — бэклог находок, не путать с чек-листом.
- Параметры: URL прода, доступ по SSH, глубина (быстрый / полный).

## Шаг 1 — Объём по стадии

Определи стадию по проекту (есть ли деплой, auth, загрузки, вебхуки) и прогони:

| Стадия | Обязательно | Частично | N/A до появления |
|---|---|---|---|
| После деплоя (auth ещё нет) | L, H, G, I | A (заглушки чувствительных роутов помечены «требует логина»), M | B, C, D, E, F, J, K, N |
| После auth | + A, D, E, B | K | F, J |
| После загрузок / AI / платежей | + F, J, B (AI-вход), C | | |
| Перед публичным запуском / месячно | все A–N | | |

Ключевые проверки стадии «после деплоя» — выполнять реально:
- **L:** `USER` в Dockerfile не root; `stat` прав `.env.production` = 600; `sudo ufw status` — только 22/80/443; `sshd -T | grep -E 'passwordauthentication|permitrootlogin'` → `no`; `fail2ban-client status sshd`; бэкапы и `.env` не в репо.
- **H:** `curl -I https://<domain>` — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS.
- **G:** `git ls-files | grep -E '^\.env'` (кроме `.env.example`) пусто; хук записи секретов установлен; `git log -p --all | grep -E 'sk-|ghp_|AKIA'` пусто.
- **I:** в nginx есть `client_body_timeout`, `client_header_timeout`, `client_max_body_size`.
- **M:** `grep -E 'ignoreBuildErrors|ignoreDuringBuilds' next.config.*` — не `true`.

Каждый пункт — реальной командой или чтением файла, не «теоретически да». Не так → 🔴 (чинить сейчас) или ⚠️ (бэклог).

## Шаг 2 — Отчёт

`docs/audits/security-check-<YYYY-MM-DD>.md`: таблица «раздел / статус (✅ / ⚠️ / 🔴 / N/A) / что проверял / что нашёл» + детальные 🔴 по формату из шаблона. Новые векторы, которых не было в `docs/security-checklist.md`, — допиши туда.

## Шаг 3 — Починка

Спроси: всё / только 🔴 / показать диффы / не чинить. По каждой 🔴: конкретное действие (chmod, правка nginx, вынос секрета, чистка истории) + перепроверка. ⚠️ → `docs/security-todo.md`.

## Шаг 4 — Закрытие

- Тесты проекта, если есть.
- Каждая 🔴 → ADR в `docs/memory/decisions/`.
- Если есть `.claude/scripts/security-check-mark.sh` — запусти (глушит напоминания хуков на 10 минут, `development/prompts/bash-write-hooks.md`).
- save-session со slug `security-check-<YYYY-MM-DD>`; в `docs/memory/state.md` — дата аудита и итог.

Покажи: отчёт, список починенного, что ушло в бэклог.

## Edge cases

- HTTPS ещё не настроен → HSTS пропустить.
- Staging → другие правила (debug и тестовые данные допустимы).
- Идёт инцидент → приоритет C, D, E.
- 🔴 5+ на стадии «после деплоя» → базовая настройка сервера пропущена: пройти `development/prompts/server-security-basics.md` и `development/prompts/domain-https.md`, затем аудит заново.

## Авто-запуск по ключевым словам (настроить один раз)

**Claude Code** — обёртка `.claude/skills/security-check/SKILL.md` (ссылка на рецепт, не копия):

```markdown
---
name: security-check
description: Полный аудит безопасности веб-приложения по 14 разделам OWASP-style (auth/IDOR, XSS, CSRF, injections, file uploads, secrets, HTTP headers, webhooks, deployment hardening). Триггеры — "проверь безопасность", "есть ли уязвимости", "security check", "OWASP", "аудит безопасности", "проверь auth", "проверь IDOR", "проверь secrets".
---

# /security-check

Прочитай `modules/development/prompts/security-check.md` (путь от корня воркспейса) и выполни.
```

Проверка: фраза «проверь безопасность» запускает скилл.

**Codex / Cursor** — правило-триггер в `AGENTS.md`:

```markdown
## Security check — авто-запуск
Если пользователь пишет «проверь безопасность» / «есть ли уязвимости» / «security check» / «аудит безопасности», или перед каждым деплоем — прочитай `modules/development/prompts/security-check.md` и выполни. Найденные 🔴 чини до коммита/деплоя.
```

Проектную специфику (свои приоритеты, свои edge cases из реальных аудитов, свой формат отчёта) добавляй в `docs/security-checklist.md`, а не правкой этого рецепта.
