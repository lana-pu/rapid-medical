# Снимок инфраструктуры — `docs/memory/infrastructure.md`

Запускай после первой настройки деплоя (сервер, домен, безопасность) и при каждом крупном изменении инфры: новый сервис, порт, ENV, смена стратегии деплоя.

Нужно на входе: настроенный деплой (VPS / платформа) — факты берутся с реального сервера и из конфигов, не из шаблона.

Результат: `docs/memory/infrastructure.md` — единый снимок прод-инфры. Файл не подгружается в каждую сессию — AI читает его целиком, когда задача касается инфры. Секреты сюда не пишутся — только адреса, имена, пути, структура.

## Шаг 1 — Собери факты

По SSH (доступ из `.env.deploy`) и из репозитория: ОС, пользователь, структура `/var/www/<project-name>`, сервисы в `docker-compose.yml`, nginx-конфиг, статус UFW/fail2ban/certbot, путь деплоя, используемые ENV-ключи (только имена). Нестандартная структура (например, `/srv/<project>`) — фиксируй фактическую.

## Шаг 2 — Файл

```markdown
# Infrastructure — <продукт>

> Снимок прод-инфры. Обновлять при крупных изменениях. Пароли и ключи — в .env.production / .env.deploy, не здесь.

## VPS
- Провайдер: <…>
- IP: <IP>
- Пользователь (deploy): <user> (sudo)
- SSH: только по ключам, порт <22>
- ОС: Ubuntu <версия>

## Домен
- Основной (канонический): <domain>; второй хост → 301
- DNS: A <domain> → <IP>, A www → <IP>
- HTTPS: Let's Encrypt (certbot), авто-продление — certbot.timer active

## Структура на сервере
/var/www/<project-name>/
├── docker-compose.yml
├── Dockerfile
├── .env.production      ← 600, секреты
├── deploy.sh            ← 755, единая точка деплоя
└── <код / артефакты — по стратегии деплоя>

## docker-compose
- web — Next.js на 127.0.0.1:<port>, наружу через nginx, mem_limit <…>, healthcheck
- <db / другие сервисы — порт, volume, mem_limit>

## nginx
- Конфиг: /etc/nginx/sites-available/<project-name>
- Reverse-proxy → 127.0.0.1:<port>; rate limit (zone в /etc/nginx/conf.d/)
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS
- Кэш /_next/static/ immutable; gzip

## Безопасность
- SSH по ключам, root запрещён
- UFW: 22/80/443
- fail2ban: sshd + nginx (`sudo fail2ban-client status`)
- Rate limiting в приложении: 30/мин на /api/*, 5/мин на /api/auth/*
- Хуки-guardrails: .claude/hooks/ (PreToolUse Bash + Write)
- Pre-deploy gate: scripts/security-precheck.sh (если настроен); полный аудит — /security-check

## Деплой
- Стратегия: ADR-<NNN>-deploy-strategy.md
- Доступ: .env.deploy (SERVER_IP / SERVER_USER / SSH_KEY_PATH / GITHUB_URL / DOMAIN), в .gitignore, 600
- Локально: ./scripts/deploy-remote.sh → по SSH /var/www/<project-name>/deploy.sh
- Сборка образа: <на сервере / CI → GHCR → pull>
- Zero-downtime: <нет / graceful shutdown / blue-green, DRAIN_SECONDS>

## Логи
- docker compose logs -f web
- sudo journalctl -u nginx --since "10m ago"

## ENV-ключи (только имена; значения — в .env.production)
- <KEY_1>, <KEY_2>, …

## Бэкапы
- Код: GitHub
- БД: <скрипт, расписание, путь, ретеншн — или «нет БД»>
- .env.production: <где хранится копия — см. env-backup-handoff>

## Аварийные действия
- Логи: docker compose logs --tail=200 web
- Перезапуск: docker compose up -d web
- Откат: git checkout <hash> + docker compose up -d --build (development/prompts/deploy-cheatsheet.md)
```

Дополнительные сервисы (Redis, файловое хранилище, SMTP, вебхуки ботов) — каждый своим разделом.

## Шаг 3 — Индекс и сессия

1. В `docs/memory/INDEX.md` (раздел «Инфраструктура»): `- [infrastructure.md](infrastructure.md) — VPS, домен, docker-compose, nginx, безопасность`.
2. Закрой сессию через save-session (Claude Code: `/save-session`; другие AI — промт save-session из `ai-config`): slug `deploy`, описание — что поднято и где доступно. В `state.md` доступы к серверу не дублировать — ссылка на `.env.deploy` и пути к `deploy.sh` / `.env.production`.

## После выполнения

Покажи: финальный `infrastructure.md`, обновлённый `state.md`, строку в `INDEX.md`.
