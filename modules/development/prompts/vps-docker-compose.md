# VPS + Docker Compose + `deploy.sh` — первый подъём приложения на сервере

Запускай, когда выбран деплой на свой VPS и сервер ещё не настроен.

Нужно на входе: свежий VPS (IP, пользователь — обычно `root`, пароль от провайдера); проект в git с remote на GitHub (`development/prompts/git-github-setup.md`); ADR стратегии деплоя (`development/prompts/deploy-strategy-adr.md`) — если там выбран не git-based способ, адаптируй шаги, сохранив одну повторяемую команду `deploy.sh`.

Результат: на сервере docker-compose с Next.js-контейнером, приложение открывается по `http://<SERVER_IP>` через nginx (ещё до домена и HTTPS); `deploy.sh` обновляет одной командой; локальный `scripts/deploy-remote.sh` запускает деплой по SSH.

Принцип: доступы к серверу пользователь вписывает в `.env.deploy`, не в чат; AI подключается по SSH сам и значения в чат не выводит. Порт приложения по умолчанию 3000 — если другой, подставляй его одинаково в Dockerfile, compose, nginx и проверки.

## Шаг 0 — `.env.deploy`

Нет файла — создай в корне проекта:

```
SERVER_IP=
SERVER_USER=root               # на свежем VPS обычно root
SERVER_PASSWORD=               # временно, до установки ключа и отключения паролей
SSH_KEY_PATH=~/.ssh/id_ed25519
GITHUB_URL=
DOMAIN=
```

- `GITHUB_URL` заполни сам: `git remote get-url origin`; https-форму приведи к `git@github.com:<user>/<repo>.git`. Remote нет — только тогда спроси.
- Добавь `.env.deploy` в `.gitignore` (если не покрыт `.env.*`), `chmod 600`.
- Попроси пользователя вписать `SERVER_IP`, `SERVER_USER`, `SERVER_PASSWORD` (и `DOMAIN`, если есть). Затем прочитай файл.
- Способ обновления кода не зафиксирован в ADR → спроси одной строкой: через GitHub (`git pull`) или иначе.

## Шаг 1 — Первый вход по паролю и установка ключа

1. Нет `~/.ssh/id_ed25519` → `ssh-keygen -t ed25519`.
2. Поставь ключ на сервер (sshpass — установи, если нет):
   `sshpass -p "$SERVER_PASSWORD" ssh-copy-id -i <SSH_KEY_PATH>.pub <SERVER_USER>@<SERVER_IP>`
3. Проверь вход по ключу без пароля; дальше — только по ключу.

Отключение паролей, запрет root, UFW, fail2ban — `development/prompts/server-security-basics.md`. До него `SERVER_PASSWORD` из `.env.deploy` не удаляй.

## Шаг 2 — Зависимости и настройка сервера

```bash
apt-get update && apt-get install -y docker.io docker-compose-plugin git curl
```

Ротация логов Docker (без неё json-логи растут до гигабайтов и забивают диск):

```bash
sudo mkdir -p /etc/docker
echo '{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

Swappiness (на малой RAM ядро иначе вытесняет горячие страницы приложения в swap):

```bash
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
sudo sysctl -p /etc/sysctl.d/99-swap.conf
```

Swap нет (`free -h`) и RAM ≤ 2 ГБ → создай swap-файл 1–2 ГБ (`fallocate`, `mkswap`, `swapon`, строка в `/etc/fstab`).

## Шаг 3 — Папка проекта и read-only доступ к репо

```bash
sudo mkdir -p /var/www/<project-name>
sudo chown <SERVER_USER>:<SERVER_USER> /var/www/<project-name>
```

Серверу — только чтение одного репо через deploy key (не личный ключ, не широкий PAT):
1. На сервере: `ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""`.
2. Добавь как read-only deploy key: `gh repo deploy-key add ~/.ssh/deploy_key.pub --title "vps-<project-name>"` (без `-w`), либо покажи `deploy_key.pub` и попроси вставить в Settings → Deploy keys репозитория.
3. В `~/.ssh/config` сервера: `Host github.com` → `IdentityFile ~/.ssh/deploy_key`.
4. `cd /var/www/<project-name> && git clone <GITHUB_URL> .`

Стратегия не git-based → репо не клонировать, предложить доставку кода/артефактов под ADR.

## Шаг 4 — Главная `/` не должна вести на UI-кит

Проверь `src/app/page.tsx`: безусловный `redirect("/style-guide")` в проде покажет витрину вместо продукта. Настоящая главная есть → `page.tsx` — адаптер на неё. Нет → обернуть редирект в `if (process.env.NODE_ENV !== "production")`. Закрыть витрину и другие dev-страницы на проде (404) — `development/prompts/hide-dev-pages.md`.

## Шаг 5 — Dockerfile (multi-stage)

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
```

В `next.config` добавь `output: 'standalone'`. Добавь `.dockerignore` (`node_modules`, `.next`, `.git`, `.env*`).

## Шаг 6 — `docker-compose.yml`

```yaml
services:
  web:
    build: .
    env_file: .env.production
    ports:
      - "127.0.0.1:3000:3000"   # только localhost — наружу через nginx
    restart: unless-stopped
    mem_limit: 512m              # один контейнер не съест весь бокс
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 30s
```

Каждому будущему сервису (БД и др.) — свои `mem_limit`, `healthcheck`, `restart`.

## Шаг 7 — `.env.production` на сервере (не в репо)

В `/var/www/<project-name>/.env.production`: значения, которые можно сгенерировать, генерируй сам (`openssl rand -base64 32` для секретов сессий и т.п.); для значений пользователя оставь `KEY=` и скажи, какую строку заполнить на сервере. `chmod 600 .env.production`.

## Шаг 8 — `deploy.sh` на сервере

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/<project-name>
git pull                      # или иной способ доставки кода по ADR
docker compose up -d --build

# Пост-деплой гигиена: next build в BuildKit раздувает dockerd, память ОС не возвращается
docker builder prune -f
DOCKERD_RSS_MB=$(ps -o rss= -C dockerd 2>/dev/null | awk '{s+=$1} END{print int(s/1024)}')
if [ "${DOCKERD_RSS_MB:-0}" -gt 250 ]; then
  echo "dockerd ${DOCKERD_RSS_MB}MB → перезапуск, чтобы вернуть память ОС"
  sudo systemctl restart docker   # ⚠️ на секунды перезапускает ВСЕ контейнеры
fi
echo "Deployed at $(date)"
```

`chmod +x deploy.sh`. Радикальное решение вместо гигиены — сборка в CI/локально → GHCR → на сервере `docker compose pull && docker compose up -d` (фиксируется в ADR стратегии деплоя).

## Шаг 9 — Первый запуск

```bash
./deploy.sh
docker compose ps                    # web: Up (healthy)
docker compose logs --tail=50 web
curl http://127.0.0.1:3000           # HTML изнутри сервера
```

## Шаг 10 — nginx по IP (до домена)

```bash
sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/<project-name> > /dev/null <<'NGINX'
server {
    listen 80 default_server;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/<project-name> /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Снаружи (не с сервера): `curl -I http://<SERVER_IP>` → 200 от приложения, не страница nginx. Домен и HTTPS — `development/prompts/domain-https.md` (тот же конфиг: `server_name _` → домен, certbot добавит 443).

## Шаг 11 — Локальный `scripts/deploy-remote.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
set -a; source "$(dirname "$0")/../.env.deploy"; set +a
ssh -i "${SSH_KEY_PATH/#\~/$HOME}" "$SERVER_USER@$SERVER_IP" "/var/www/<project-name>/deploy.sh"
```

`chmod +x scripts/deploy-remote.sh`. Закоммить `scripts/deploy-remote.sh`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, изменение `next.config`.

## После выполнения

Покажи: `docker compose ps` и `curl http://127.0.0.1:3000 | head -20` с сервера; `curl -I http://<SERVER_IP> | head -5` снаружи; `cat scripts/deploy-remote.sh`. Попроси открыть `http://<SERVER_IP>` в браузере. Обнови `docs/memory/infrastructure.md` (`development/prompts/infrastructure-snapshot.md`).

## Edge cases

- `output: 'standalone'` ломает маршруты → классический `npm start` в контейнере (образ тяжелее).
- Порт занят → `ss -tulnp | grep 3000`, другой порт в compose (и в nginx).
- `git clone` просит логин → deploy key не настроен или URL в https-форме.
- Деплой через платформу (Vercel/Render/Railway) → этот промт не нужен.
