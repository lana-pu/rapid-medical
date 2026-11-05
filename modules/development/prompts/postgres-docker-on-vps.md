# PostgreSQL на VPS в docker-compose + swap + ежедневный бэкап

Запускай, когда база — свой Postgres на VPS. Если выбран managed (Supabase и т.п.) — не нужен: строку подключения из дашборда провайдера положи в `DATABASE_URL` (`.env.local`, `.env.production`), бэкапы у провайдера свои.

Нужно на входе: VPS с docker-compose и скриптом деплоя (`deploy.sh`); доступы и структура сервера — в `docs/memory/infrastructure.md`.

Результат: Postgres в docker-compose, доступен только изнутри docker-сети и с `127.0.0.1` хоста; ежедневный бэкап с ретеншном 7 дней.

Плейсхолдеры: `<db>` — имя БД и пользователя (напр. slug проекта), `<project-dir>` — папка проекта на сервере (напр. `/var/www/<project>`), `<domain>` — домен.

## Шаги (на сервере, подключение по SSH по данным из infrastructure.md)

### 0. Swap — буфер на пик деплоя
На деплое blue-green ненадолго держит две версии web — на маленьком VPS без запаса возможен OOM. Если `free -h` показывает swap = 0:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf   # своп только под нехватку
sudo sysctl -p /etc/sysctl.d/99-swap.conf
free -h
```
Swap уже есть — пропусти.

### 1. Сервис db в docker-compose.yml

```yaml
services:
  web:
    # ... существующие настройки
    depends_on:
      - db
    environment:
      DATABASE_URL: "postgresql://<db>:${DB_PASSWORD}@db:5432/<db>"   # внутри сети — по имени сервиса

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: <db>
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: <db>
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"   # КРИТИЧНО: только localhost, не 0.0.0.0
    restart: unless-stopped
    mem_limit: 256m              # потолок, чтобы контейнер не выел RAM бокса; упрётся — подними лимит/VPS
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U <db>"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

### 2. Пароль и env
Сгенерируй пароль сам (`openssl rand -base64 32`), в чат его не выводи. В `<project-dir>/.env.production`:

```
DB_PASSWORD=<сгенерированный>
DATABASE_URL=postgresql://<db>:<DB_PASSWORD>@db:5432/<db>
POSTGRES_USER=<db>
POSTGRES_DB=<db>
```
`chmod 600 .env.production`. Из контейнера web обращение — по имени `db`, не `127.0.0.1`.

### 3. Запуск
`./deploy.sh` → `docker compose ps`: web и db в `Up`, у db статус `(healthy)`.

### 4. Проверка БД
`docker compose exec db psql -U <db> -d <db> -c '\l'` — в списке есть `<db>`.

### 5. Порт 5432 не торчит наружу
- на сервере: `ss -tulnp | grep 5432` → только `127.0.0.1:5432`, не `0.0.0.0:5432`;
- с локальной машины: `nc -zv <IP> 5432` → refused или timeout.

### 6. Ежедневный бэкап
`/usr/local/bin/backup-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR=/var/backups/postgres
PROJECT_DIR=<project-dir>
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
cd "$PROJECT_DIR"
docker compose exec -T db pg_dump -U <db> <db> | gzip > "$BACKUP_DIR/<db>-$STAMP.sql.gz"
find "$BACKUP_DIR" -name '*.sql.gz' -mtime +7 -delete   # ретеншн 7 дней
```

`sudo chmod +x /usr/local/bin/backup-db.sh`; в `sudo crontab -e`: `0 3 * * * /usr/local/bin/backup-db.sh`. Запусти вручную и проверь, что в `/var/backups/postgres/` появился `.sql.gz`.

### 7. Обнови `docs/memory/infrastructure.md`
Раздел «БД»:
- PostgreSQL 16-alpine в docker-compose, `mem_limit 256m`;
- внутри docker-сети — `DATABASE_URL=postgresql://...@db:5432/...`; снаружи закрыта (только `127.0.0.1:5432` на хосте);
- бэкапы: `/usr/local/bin/backup-db.sh`, ежедневно 03:00, ретеншн 7 дней, `/var/backups/postgres/`;
- swap: `/swapfile` 2 GB, `vm.swappiness=10`.
В «Структура на сервере» добавь volume `postgres-data`.

В конце покажи: `docker compose ps` (оба Up, db healthy), вывод `nc` с локальной машины, `ls /var/backups/postgres/`, раздел «БД» из infrastructure.md.

## Нюансы

- Не хватает памяти уже в покое (а не только на деплое) — сними `docker stats --no-stream`; если RAM реально занята контейнерами — увеличь VPS.
- `pg_isready` встроен в образ, ставить ничего не нужно.
- `docker compose exec` ругается «no terminal» — добавь `-T`.
