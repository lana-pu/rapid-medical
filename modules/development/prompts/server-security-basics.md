# Базовая безопасность сервера — SSH по ключам, UFW, fail2ban, rate limiting

Запускай сразу после первого подъёма приложения на VPS (или на любом сервере без этой настройки).

Нужно на входе: VPS, `.env.deploy` с `SERVER_IP`, `SERVER_USER`, `SSH_KEY_PATH` (и `SERVER_PASSWORD`, если ключ ещё не установлен).

Результат: вход только по SSH-ключу, root-логин запрещён, открыты только 22/80/443, fail2ban активен, rate limiting на API приложения.

Доступ — из `.env.deploy`, подключаешься по SSH сам; пользователь ничего не вводит в чат и терминал, только заполняет значения в файлах. Блоки — по очереди.

## Блок 1 — SSH только по ключам

1. Локальный ключ `~/.ssh/id_ed25519` есть? Нет → `ssh-keygen -t ed25519`. Можно тот же, что для GitHub, или отдельный для VPS — посоветуй (отдельный проще отозвать).
2. Проверь вход по ключу. Работает без пароля → п. 4. Нет ключа на сервере → нужен `SERVER_PASSWORD=` в `.env.deploy` (нет — попроси вписать), затем:
   `sshpass -p "$SERVER_PASSWORD" ssh-copy-id -i <SSH_KEY_PATH>.pub <SERVER_USER>@<SERVER_IP>`
3. Просит пароль после копирования → права: на сервере `chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys`, локально `chmod 600 ~/.ssh/id_ed25519`.
4. Работаешь под root → создай sudo-пользователя (`adduser <user>`, `usermod -aG sudo <user>`, скопируй `authorized_keys` с правильным владельцем), проверь вход под ним по ключу и `sudo`, обнови `SERVER_USER` в `.env.deploy`, перенеси владельца `/var/www/<project-name>` (и добавь пользователя в группу `docker`).
5. Только после этого в `/etc/ssh/sshd_config` (и проверь `/etc/ssh/sshd_config.d/*.conf` — там может быть переопределение `PasswordAuthentication yes`):
   ```
   PasswordAuthentication no
   PermitRootLogin no
   PubkeyAuthentication yes
   ```
   `sudo sshd -t && sudo systemctl restart ssh`
6. **Не закрывай текущую сессию**, пока новым подключением не проверишь вход по ключу. Сломалось — чини из открытой сессии.
7. Проверь, что пароль отклоняется (`Permission denied`). После этого удали строку `SERVER_PASSWORD` из `.env.deploy`.

## Блок 2 — UFW

```bash
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'      # 80 + 443
sudo ufw --force enable          # без --force по SSH без TTY UFW останется выключенным
sudo ufw status                  # обязано быть «Status: active»
```

`inactive` → повтори `--force enable`. Нестандартный SSH-порт → открой именно его до включения. Снаружи (IP из `.env.deploy`): `nc -zv <SERVER_IP> 22/80/443` → success, `nc -zv <SERVER_IP> 5432` → refused.

Docker публикует порты в обход UFW — поэтому сервисы в compose публикуются только на `127.0.0.1:` (проверь `docker-compose.yml`).

## Блок 3 — fail2ban

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable --now fail2ban
```

SSH защищён по умолчанию. Для nginx — `/etc/fail2ban/jail.d/nginx.conf`:

```ini
[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

`sudo systemctl restart fail2ban && sudo fail2ban-client status`.

## Блок 4 — Rate limiting в приложении (Next.js)

Файл перехвата запросов: Next.js 16 — `src/proxy.ts` с экспортом `proxy`; Next.js 15 и ниже — `src/middleware.ts` с экспортом `middleware`. Логика одинаковая:

```ts
import { NextRequest, NextResponse } from 'next/server'

// In-memory лимитер — для одного контейнера. 2+ контейнера → Redis (например, @upstash/ratelimit).
const limits = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = limits.get(key)
  if (!entry || entry.resetAt < now) {
    limits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

export function proxy(request: NextRequest) {   // Next.js ≤15: export function middleware
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  const path = request.nextUrl.pathname

  if (path.startsWith('/api/auth')) {
    if (!rateLimit(`auth:${ip}`, 5, 60_000)) return new NextResponse('Too many requests', { status: 429 })
  } else if (path.startsWith('/api/')) {
    if (!rateLimit(`api:${ip}`, 30, 60_000)) return new NextResponse('Too many requests', { status: 429 })
  }
  return NextResponse.next()
}

export const config = { matcher: ['/api/:path*'] }
```

## После выполнения

Покажи:
- `sudo ufw status` — active, 22/80/443;
- `sudo systemctl status fail2ban` — active;
- вход по ключу пускает, по паролю — отказ;
- 6 запросов подряд на `/api/auth/<любой>` → последний 429.

Обнови раздел «Безопасность» в `docs/memory/infrastructure.md`.
