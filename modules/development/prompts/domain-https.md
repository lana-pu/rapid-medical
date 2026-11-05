# Домен + nginx + HTTPS (Certbot) + канонический хост + заголовки + кэш статики

Запускай, когда приложение уже открывается по IP через nginx и нужно привязать домен.

Нужно на входе: приложение на VPS за nginx (`development/prompts/vps-docker-compose.md`), купленный домен, `.env.deploy` с `SERVER_IP`.

Результат: сайт открывается по `https://<domain>`, http → https и не-канонический хост → основной отдают 301, заданы security headers, статика Next.js кэшируется.

Доступ к серверу и домен — из `.env.deploy`; на сервер подключаешься по SSH сам. Секреты и токены пользователь кладёт в `.env.deploy`, не в чат.

## Шаг 0 — Домен

`DOMAIN=` пусто → попроси вписать в `.env.deploy` (например, `app.example.com`).

## Шаг 1 — DNS

1. Спроси канонический хост: голый домен (`example.com`, www → 301 на него) или `www` (наоборот). Не ответил → `www`. Один хост основной, второй всегда 301 — иначе для поиска это два сайта.
2. Спроси регистратора / DNS-провайдера. Дай точный путь в его кабинете до DNS-записей; не уверен в интерфейсе — сверься с документацией провайдера (context7 / справка), не выдумывай пункты меню.
3. Записи:

   | Type | Host | Value | TTL |
   |---|---|---|---|
   | A | `@` | `<SERVER_IP>` | Auto / 3600 |
   | A | `www` | `<SERVER_IP>` | Auto / 3600 |

   - `@` — сам домен (у некоторых провайдеров поле пустое или пишется домен — уточни для конкретного).
   - Вместо `A www` можно `CNAME www → <domain>` (у части провайдеров с точкой в конце); для `@` CNAME нельзя.
   - Поддомен (`app.example.com`) → одна A-запись `Host=app`, www не нужен.
   - Удалить «парковочные» A/AAAA/CNAME провайдера; AAAA — только если у сервера реально есть IPv6.
4. **Автоматически через API** — только для провайдера с документированным API и только после явного подтверждения: токен с минимальным правом (редактирование DNS этой зоны), пользователь кладёт его в `.env.deploy`; ты создаёшь записи и проверяешь `dig`; временный токен — напомни отозвать. Сомневаешься в провайдере или безопасности — ручная инструкция.
5. Пропагация (с сервера): `dig <domain> +short`, `dig www.<domain> +short` → IP сервера. Нет — ждать 5–30 мин; проверить другим резолвером `dig @8.8.8.8 <domain>`.

## Шаг 2 — Домен в nginx + rate limit

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

Зона rate limit задаётся в контексте `http` (внутри `server` nginx её не примет). Создай `/etc/nginx/conf.d/ratelimit.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=web:10m rate=30r/s;
```

В `/etc/nginx/sites-available/<project-name>` меняются только `server_name` (`_` → домены), убирается `default_server`, добавляется `limit_req`. **`proxy_pass` не трогай и не подставляй 3000 вслепую** — оставь адрес из текущего конфига (`grep proxy_pass /etc/nginx/sites-available/<project-name>`) или возьми из левой части `ports` в `docker-compose.yml`.

```nginx
server {
    listen 80;
    server_name <domain> www.<domain>;

    limit_req zone=web burst=50 nodelay;

    location / {
        proxy_pass http://127.0.0.1:<APP_PORT>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

`sudo nginx -t && sudo systemctl reload nginx` (симлинк в `sites-enabled` уже есть).

## Шаг 3 — HTTPS

```bash
sudo certbot --nginx -d <domain> -d www.<domain>
sudo systemctl status certbot.timer     # active — авто-продление
curl -I https://<domain>                # 200
```

Оба имени в одном сертификате — иначе редирект с не-канонического хоста упрётся в ошибку сертификата. Cloudflare с включённым proxy (оранжевое облако) → на время выпуска отключить proxy или использовать DNS challenge.

## Шаг 4 — Канонический редирект

Основной `www` → в основном HTTPS-блоке `server_name www.<domain>;`, голый домен — отдельным блоком:

```nginx
server {
    listen 443 ssl;
    server_name <domain>;
    ssl_certificate     /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    return 301 https://www.<domain>$request_uri;
}
```

Основной голый домен — зеркально. Канонический хост должен совпадать с `rel="canonical"` и sitemap приложения.

## Шаг 5 — Security headers

В HTTPS server-блок (созданный certbot):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

HSTS добавь, если certbot его не поставил (`curl -I` не показывает `Strict-Transport-Security`). Content-Security-Policy — отдельно, под реальные источники скриптов/стилей приложения.

## Шаг 6 — Кэш статики и сжатие

В HTTPS server-блок, выше `location /` (в `location` с `add_header` серверные заголовки не наследуются — продублируй в них security headers или вынеси их в `include`-сниппет):

```nginx
location /_next/static/ {
    proxy_pass http://127.0.0.1:<APP_PORT>;
    proxy_set_header Host $host;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}
location /_next/image {
    proxy_pass http://127.0.0.1:<APP_PORT>;
    proxy_set_header Host $host;
    add_header Cache-Control "public, max-age=86400" always;
}
```

HTML (`location /`) долгим кэшем не накрывать — только файлы с хэшем в имени.

Сжатие (если не включено) — в `http` блоке `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1024;
# brotli on; brotli_types ...;   # если собран модуль ngx_brotli
```

`sudo nginx -t && sudo systemctl reload nginx`. Проверка кэша — `curl -I` на реальный файл из `/_next/static/chunks/...` (путь из исходника страницы) → `Cache-Control: … immutable`.

## Шаг 7 — Проверка

```bash
curl -I http://<domain>          # 301 → https
curl -I https://<domain>         # 200 (или 301 на www, если основной www)
curl -I https://www.<domain>     # 200 или 301 на основной
```

В браузере: сайт открывается, замок, http и не-канонический хост редиректят. Онлайн-проверка заголовков — securityheaders.com (`https://securityheaders.com/?q=<domain>`), цель — не ниже B.

## После выполнения

Покажи заголовки `curl -I` обоих хостов, оценку securityheaders.com, подтверждение открытия в браузере. Обнови разделы «Домен» и «nginx» в `docs/memory/infrastructure.md`.
