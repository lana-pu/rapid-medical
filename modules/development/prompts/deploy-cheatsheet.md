# Шпаргалка деплоя — повседневные сценарии на своём сервере

Запускай для типовых операций на уже настроенном VPS: «обнови прод», «глянь логи», «откати», «добавь ENV», «сделай бэкап БД», «сайт тормозит».

Нужно на входе: настроенный деплой (`deploy.sh` на сервере, `.env.deploy` локально) — если нет, сначала `development/prompts/vps-docker-compose.md`. Факты об инфре — `docs/memory/infrastructure.md`.

Общие правила для всех сценариев:
- Доступ к серверу — из `.env.deploy`; подключаешься по SSH сам; значения секретов в чат не выводишь и не запрашиваешь.
- Всегда явный путь проекта на сервере `/var/www/<project-name>` (на сервере может быть несколько проектов).
- Нет домена — вместо `https://<domain>` используй `http://<SERVER_IP>`.
- Деструктивное (`docker compose down`, миграции, `git reset --hard`, `systemctl restart docker`, `prune`) — только после «ок» пользователя.
- Другой стек вместо docker-compose (PM2 и т.п.) — те же сценарии, команды по фактическому `deploy.sh`.

## 1. Обновить прод после правок

Изменения закоммичены и запушены в `main`.

1. Локальный `scripts/security-precheck.sh` (если настроен — `development/prompts/security-precheck-deploy-gate.md`).
2. `./scripts/deploy-remote.sh` (или по SSH `/var/www/<project-name>/deploy.sh`).
3. `curl -I https://<domain>` → 200.
4. Упало → `docker compose logs --tail=50 web`, предложи починку до повторного запуска.

Ничего не пушить в git без подтверждения. Миграции применяет `deploy.sh` — проверь в логах, что прошли.

## 2. Что-то сломалось / не отвечает

Пользователь описывает симптом («504 на /dashboard», «белая страница», «500»). По SSH:

1. `docker compose ps` — статусы.
2. `docker compose logs --tail=200 web` — ошибки приложения.
3. `docker compose logs --tail=100 db` — жива ли БД (если есть).
4. nginx не отдаёт → `sudo journalctl -u nginx --since "10 minutes ago"`, `sudo nginx -t`.
5. `df -h`, `free -h` — диск и память.
6. Гипотеза + 1–2 варианта починки от меньшего к большему: рестарт контейнера → пересборка → откат коммита.

## 3. Откат к предыдущей версии

1. `cd /var/www/<project-name>`, `git log --oneline -5` — показать, пользователь выбирает коммит.
2. `git checkout <hash>` (не `git reset --hard`), `docker compose up -d --build` (без `git pull`).
3. `curl -I https://<domain>` → 200.
4. После подтверждения — ADR в `docs/memory/decisions/` (откат, причина, откаченные коммиты).
5. Локально разобрать плохой коммит (`git show <bad-hash>`), предложить исправление. Откат — временная мера: исправить и выкатить заново, затем вернуть сервер на ветку (`git checkout main`).

## 4. Новый ENV-секрет на сервере

Переменная уже работает локально (`.env.local`, имя в `.env.example`).

1. В `/var/www/<project-name>/.env.production` добавь строку `<KEY>=`; попроси пользователя вписать значение прямо на сервере.
2. После подтверждения — `chmod 600 .env.production`.
3. `docker compose up -d web` (пересоздать контейнер, чтобы `env_file` перечитался; `restart` не перечитывает env_file).
4. `curl -I https://<domain>` → 200; есть тестовый эндпоинт фичи — один `curl`.

Значение секрета не запрашивать и не выводить в саммари.

## 5. Внеплановый бэкап БД (перед миграцией / пересборкой схемы)

1. По SSH: `/usr/local/bin/backup-db.sh`.
2. `ls -lh /var/backups/postgres | head -3` — свежий файл и его размер.
3. Подтверди, что бэкап на месте — можно делать рискованное.

Скрипта нет — сначала создай по `development/prompts/postgres-docker-on-vps.md`.

## 6. Сайт работает, но тормозит

Прогони и покажи вывод, затем диагноз:

```bash
free -h                      # RAM и swap
vmstat 1 5                   # si/so не нули → активный swap = тормоза
ps aux --sort=-%mem | head   # кто ест RAM (распухший dockerd?)
docker stats --no-stream     # память/CPU по контейнерам
uptime; nproc                # load average vs число ядер
df -h                        # забит ли диск
```

| Диагноз | Действие |
|---|---|
| swap идёт, dockerd на сотни МБ | `docker builder prune -f`, при раздутии `sudo systemctl restart docker`; по-нормальному — сборка в CI, на сервере только pull (`development/prompts/deploy-strategy-adr.md`) |
| один контейнер ест всю RAM | поставить/понизить его `mem_limit` |
| load > числа ядер постоянно | упор в CPU → VPS мощнее |
| диск ~100% | `docker image prune -a`, чистка логов |

Fix-команды — только после «ок». Признак «пора на 2 ГБ+»: swap постоянно (не только на деплое) или регулярные OOM-kill.

## Какой сценарий когда

| Ситуация | № |
|---|---|
| Обычный деплой после правок | 1 |
| Что-то лежит | 2 |
| Задеплоил и сломал прод | 3 |
| Добавил ENV / API-ключ | 4 |
| Перед опасной операцией с БД | 5 |
| Работает, но медленно | 6 |
| Первый подъём на новом VPS | `development/prompts/vps-docker-compose.md` |

## Антипаттерны

- Пушить в `main` без локальной проверки.
- `git reset --hard` на сервере «чтобы откатиться» — использовать `git checkout <hash>`.
- `.env.production` в git.
- Миграции БД без свежего бэкапа.
