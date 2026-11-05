# Zero-downtime deploy — graceful shutdown и blue-green

Запускай, когда при деплое нельзя обрывать активные запросы (сохранение, оплата, загрузка файла, фоновая задача, WebSocket/SSE) или нельзя допускать окно 502.

Нужно на входе: деплой на VPS через docker-compose + nginx + `deploy.sh` (`development/prompts/vps-docker-compose.md`); `docs/memory/infrastructure.md`.

Результат:
- **Уровень 1 — graceful shutdown:** при остановке контейнера приложение перестаёт брать новые запросы, доделывает текущие, закрывает БД/очереди и только потом выходит. Остаётся окно 5–10 с, когда новые запросы могут получить 502.
- **Уровень 2 — blue-green:** новая версия поднимается рядом, трафик переключается после health-check, старая дорабатывает `DRAIN_SECONDS`. Окна 502 нет.

## Уровень 1 — четыре слоя за один проход

| Слой | Файл | Что делает |
|---|---|---|
| `STOPSIGNAL SIGTERM` | `Dockerfile` | мягкий сигнал вместо мгновенного kill |
| `ENV NEXT_DRAINING_PROCESS_TIMEOUT_MS=20000` | `Dockerfile` | время на дозавершение активных запросов (проверь поддержку переменной в своей версии Next.js) |
| `stop_grace_period: 30s` | `docker-compose.yml` | Docker ждёт 30 с перед SIGKILL |
| обработчик сигналов | `src/instrumentation.ts` (в проекте без `src/` — в корне) | закрывает Prisma / Redis / очереди |

```ts
// src/instrumentation.ts — Next.js подхватывает при старте
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[shutdown] ${signal} — дожидаюсь активных запросов и закрываю ресурсы`)
    try {
      const { prisma } = await import('@/shared/lib/prisma') // путь к своему клиенту БД
      await prisma.$disconnect()
    } catch {}
    // Redis.quit(), остановка очередей и фоновых задач — если используются
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}
```

Не вызывай `process.exit()` сразу в обработчике — это оборвёт активные запросы. Сверься с документацией своей версии Next.js, как standalone-сервер обрабатывает SIGTERM (в т.ч. переменная `NEXT_MANUAL_SIG_HANDLE`), и закрывай ресурсы после остановки приёма запросов.

Свой WebSocket-сервер — добавь корректное закрытие соединений.

Проверка: собери и подними, запусти долгий запрос (POST на `/api/<save>` или загрузку файла) и в этот момент `./deploy.sh` — запрос должен завершиться 200, транзакция в БД закрыта.

## Уровень 2 — blue-green

Порядок: новая версия поднимается рядом на другом порту → health-check → nginx переключает upstream (reload без обрыва) → старая дорабатывает `DRAIN_SECONDS` (по умолчанию 180) → гаснет по SIGTERM (graceful из Уровня 1).

**Обязательное условие — обратно совместимые миграции (expand-contract).** Пока работают обе версии, у них одна БД: сначала добавлять, не ломая старое (новый столбец nullable, без переименований), зачистку — отдельным деплоем позже. Перед миграциями — свежий бэкап БД.

**Память:** две копии web одновременно = двойная память. На VPS ~1 ГБ обе копии + БД должны влезть разом, поэтому образ **не собирать на сервере**: сборка раздувает dockerd, а `systemctl restart docker` убьёт обе копии. Правильно: сборка в CI/локально → GHCR → `image: ghcr.io/<user>/<repo>:<tag>` вместо `build: .`, в `deploy.sh` — `docker compose pull "$NEW_SVC"` вместо `--build`. Стратегия фиксируется в ADR стратегии деплоя (`development/prompts/deploy-strategy-adr.md`).

### `docker-compose.yml`

```yaml
services:
  web_blue:
    build: .            # на слабом VPS: image: ghcr.io/<user>/<repo>:<tag>
    env_file: .env.production
    ports: ["127.0.0.1:3000:3000"]
    stop_grace_period: 30s
    restart: unless-stopped
    mem_limit: 512m
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
  web_green:
    build: .
    env_file: .env.production
    ports: ["127.0.0.1:3001:3000"]
    stop_grace_period: 30s
    restart: unless-stopped
    mem_limit: 512m
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health >/dev/null 2>&1 || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
```

### nginx — upstream, который переписывает `deploy.sh`

```nginx
# /etc/nginx/conf.d/app-upstream.conf
upstream app { server 127.0.0.1:3000; }
```

В server-блоке сайта (`/etc/nginx/sites-available/<project-name>`) во всех `location`, где был `proxy_pass http://127.0.0.1:3000;`, — `proxy_pass http://app;` (остальные `proxy_set_header` без изменений).

### Роут здоровья

`/api/health` возвращает 200 (если нет — создай `src/app/api/health/route.ts`).

### `deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/<project-name>

DRAIN_SECONDS="${DRAIN_SECONDS:-180}"
STATE_FILE=".active-color"
ACTIVE="$(cat "$STATE_FILE" 2>/dev/null || echo blue)"
if [ "$ACTIVE" = "blue" ]; then TARGET=green; TARGET_PORT=3001; OLD_SVC=web_blue
else TARGET=blue; TARGET_PORT=3000; OLD_SVC=web_green; fi
NEW_SVC="web_${TARGET}"
echo "активна $ACTIVE → деплою $TARGET (порт $TARGET_PORT)"

# 1. свежий код (миграции — expand-contract, после бэкапа)
git pull
# ./scripts/security-precheck.sh || exit 1          # если настроен гейт

# 2. новый цвет рядом со старым (на слабом VPS: docker compose pull "$NEW_SVC" && docker compose up -d "$NEW_SVC")
docker compose up -d --build "$NEW_SVC"

# 3. health-check до 60 с, иначе откат без переключения трафика
for i in $(seq 1 30); do
  if curl -fsS -m 3 "http://127.0.0.1:${TARGET_PORT}/api/health" >/dev/null 2>&1; then echo "$TARGET отвечает"; break; fi
  if [ "$i" = 30 ]; then
    echo "🔴 $TARGET не поднялся за 60 с — трафик остаётся на $ACTIVE"
    docker compose stop "$NEW_SVC"; exit 1
  fi
  sleep 2
done

# 4. переключить nginx (reload без окна 502)
echo "upstream app { server 127.0.0.1:${TARGET_PORT}; }" | sudo tee /etc/nginx/conf.d/app-upstream.conf >/dev/null
sudo nginx -t && sudo systemctl reload nginx
echo "$TARGET" > "$STATE_FILE"
echo "трафик на $TARGET"

# 5. старая версия дорабатывает открытые запросы
echo "старая версия ($ACTIVE) дорабатывает ${DRAIN_SECONDS}s..."
sleep "$DRAIN_SECONDS"

# 6. погасить старую (graceful: stop_grace_period + instrumentation.ts)
docker compose stop "$OLD_SVC"

# 7. гигиена без перезапуска демона (restart docker убьёт обе копии)
docker builder prune -f >/dev/null 2>&1 || true
echo "деплой завершён, активна $TARGET"
```

### Проверка

Деплой под нагрузкой (в соседнем терминале `while true; do curl -s -o /dev/null -w '%{http_code}\n' https://<domain>; done`) — за весь деплой ни одного 502. Долгий запрос, начатый до переключения, дозавершается.

## После выполнения

1. Покажи изменения `Dockerfile`, `docker-compose.yml`, `src/instrumentation.ts`, nginx-upstream, `deploy.sh`.
2. Покажи результат теста (активный запрос дозавершился; при blue-green — ни одного 502).
3. Обнови раздел «Деплой» в `docs/memory/infrastructure.md`: graceful shutdown / blue-green, `DRAIN_SECONDS`, где собирается образ.
