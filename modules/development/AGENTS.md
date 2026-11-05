# development — разработка целиком

Backend + frontend, БД, auth, API, тесты, спеки поведения, деплой, security, хуки кода, AI-фичи продукта.
Стек в промтах — дефолт (Next.js, Prisma, better-auth…); в проекте с другим стеком адаптировать под него.

## Каркас и фичи
| Когда | Файл |
|---|---|
| Кода ещё нет: скелет Next.js + TS + Tailwind | `prompts/init-development.md` |
| «Сделай фичу», «добавь функцию», «реализуй» (`/new-feature`) | `prompts/new-feature.md` |
| Экраны готовы: сверить спеку и код, хардкод, визуал | `prompts/prototype-verification.md` |
| Появился второй деплой-артефакт (лендинг) — монорепо | `prompts/monorepo-split.md` |
| Приложение на `/app` или на поддомене `app.` | `prompts/app-domain-placement.md` |

## Данные и бэкенд
| Когда | Файл |
|---|---|
| Где живёт БД: managed или свой Postgres | `prompts/db-hosting-choice.md` |
| Осознанно сравнить Prisma и Drizzle | `prompts/orm-choice.md` |
| Свой Postgres на VPS, swap, ежедневный бэкап | `prompts/postgres-docker-on-vps.md` |
| Полная схема из спеки, миграции, seed | `prompts/db-schema-migrations-seed.md` |
| Перевести моки прототипа на реальную БД | `prompts/mocks-to-real-db.md` |
| Каждый экран реально сохраняет в БД — проверить | `prompts/persistence-smoke-check.md` |
| Посмотреть или поправить данные на сервере через SSH-туннель | `prompts/db-studio-tunnel.md` |
| Меняется схема БД, auth, роли, изоляция данных | `prompts/backend-change.md` |

## Auth, аккаунт, письма, файлы
| Когда | Файл |
|---|---|
| Регистрация, логин, сессии, защита роутов | `prompts/auth-setup.md` |
| После auth: cookie, rate limit, user-enumeration, CSRF | `prompts/auth-security-hardening.md` |
| Письма verify / reset / welcome / смена пароля | `prompts/account-emails.md` |
| Письма по событиям продукта | `prompts/product-emails.md` |
| Изоляция данных (IDOR), настройки, in-app уведомления | `prompts/account-settings-and-notifications.md` |
| Загружаемые файлы, аватары, видео | `prompts/file-storage.md` |

## Расширения
| Когда | Файл |
|---|---|
| AI-функции в продукте (LLM, OpenRouter) | `prompts/ai-features-openrouter.md` |
| Админка: данные, журнал действий, метрики | `prompts/admin-panel.md` |
| Отдавать данные наружу по API-ключам | `prompts/rest-api-keys.md` |
| Алерты владельцу в Telegram | `prompts/telegram-owner-alerts.md` |
| Узнавать о падении раньше пользователей | `prompts/uptime-monitoring.md` |
| Меняется AI-фича, письмо, REST API, алерт, уведомления | `prompts/extensions-change.md` |
| Сайт собирает ПД: политика, соглашение, cookie, согласие (юрисдикция — параметр) | `prompts/legal-pages.md` |
| Сделать устанавливаемым (PWA), офлайн, push | `prompts/pwa.md` |

## Спеки поведения и тесты
| Когда | Файл |
|---|---|
| Карта маршрутов и переходов (MD + HTML) | `prompts/app-map.md` |
| Создать или сверить спеки экранов `docs/screens/` с кодом | `prompts/screens-spec.md` |
| Сквозная логика `docs/screens/_global.md` | `prompts/global-spec.md` |
| BDD-сценарии критичных путей, автотесты, тест-гейт | `prompts/test-cases.md` |
| Ручной прогон в браузере: адаптив, состояния, smoke (`/ux-testing`) | `prompts/ux-testing.md` |

## Git, окружение, деплой
| Когда | Файл |
|---|---|
| Нет git/GitHub: доступ, .gitignore, спека-гейт, первый push | `prompts/git-github-setup.md` |
| Старт проекта или новая переменная окружения | `prompts/env-secrets.md` |
| Бэкап секретов, передача проекта другому разработчику | `prompts/env-backup-handoff.md` |
| Перед первой выкладкой: стратегия деплоя → ADR | `prompts/deploy-strategy-adr.md` |
| Первый подъём на свежем VPS (docker compose) | `prompts/vps-docker-compose.md` |
| Привязать домен и HTTPS | `prompts/domain-https.md` |
| «Обнови прод», «логи», «откати», «новый ENV», «тормозит» | `prompts/deploy-cheatsheet.md` |
| Деплой без обрыва запросов и 502 | `prompts/zero-downtime-deploy.md` |
| Создать снимок инфраструктуры `docs/memory/infrastructure.md` | `prompts/infrastructure-snapshot.md` |
| Изменилась инфра или бэкенд — обновить снимок | `prompts/update-infrastructure-memory.md` |
| Перед запуском закрыть `/style-guide` и dev-страницы | `prompts/hide-dev-pages.md` |

## Безопасность и хуки
| Когда | Файл |
|---|---|
| «Проверь безопасность», перед деплоем (`/security-check`) | `prompts/security-check.md` |
| Эталонный чек-лист аудита A–N | `prompts/security-check-template.md` |
| Аудит после БД, auth, интеграций (backend-скоуп) | `prompts/security-check-backend-scope.md` |
| Появился деплой-скрипт — быстрый security-гейт | `prompts/security-precheck-deploy-gate.md` |
| Сразу после подъёма VPS: SSH-ключи, UFW, fail2ban | `prompts/server-security-basics.md` |
| Хуки: блок опасных команд и записи секретов (в воркспейсе уже есть — `../../.claude/hooks/`) | `prompts/bash-write-hooks.md` |
| Хук против хардкода стилей и данных после правок UI | `prompts/hardcode-guard-hook.md` |

Правила: `../../rules/verification.md`, `../../rules/process-hygiene.md`, `../../rules/sql-nullable-not.md`,
`../../rules/hooks-guardrails.md`.
