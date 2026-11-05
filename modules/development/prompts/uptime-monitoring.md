# Uptime-мониторинг — алерт владельцу, если сайт недоступен

Запускай, когда сервис на проде и нужно узнавать о падении раньше пользователей. Нужно любому публичному сервису, от спеки не зависит.

Нужно на входе: развёрнутый на проде сервис с доменом; доступ к серверу по SSH (данные — в `docs/memory/infrastructure.md` / `.env.deploy`) для варианта Б.

## Принцип
Мониторинг независим от приложения: если упал контейнер или сервер, код приложения (`notify`, `sendTelegramAlert`) не выполнится. Поэтому проверку делает внешний сервис или отдельный cron на сервере, который шлёт алерт напрямую (curl).

Канал алерта — уже настроенный в проекте: Telegram-бот владельца (`telegram-owner-alerts.md`) или email-провайдер (`account-emails.md`). Новых токенов не заводи. Нет ни того, ни другого — вариант А с email-уведомлением сервиса. Настроены оба — спроси, какой использовать.

## Вариант А — внешний сервис (рекомендуется, без своего кода)
UptimeRobot (free tier) или Better Stack: монитор на `https://<domain>`, проверка раз в 5 минут, алерт на email (в UptimeRobot — опционально в Telegram через их интеграцию). На сервере ничего не крутится, секретов нет. Проведи пользователя по настройке.

## Вариант Б — cron на сервере
На сервер подключаешься сам по SSH; пользователь ничего не вводит в терминал.

1. `/usr/local/bin/uptime-check.sh` — читает доступы из `.env.production` (не хардкодит), пингует сайт, при недоступности шлёт алерт.

   Telegram (переиспользуй `TELEGRAM_BOT_TOKEN` и белый список `TELEGRAM_ALERT_CHAT_IDS` — новых переменных не заводи):
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   set -a; source <project-dir>/.env.production; set +a
   curl -fsS -m 10 https://<domain> >/dev/null && exit 0
   IFS=',' read -ra CHAT_IDS <<< "${TELEGRAM_ALERT_CHAT_IDS}"
   for CHAT_ID in "${CHAT_IDS[@]}"; do
     curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
       -d "chat_id=$(echo "$CHAT_ID" | xargs)" \
       -d "text=🔴 <project> down: $(date)" >/dev/null
   done
   ```

   Email: тем же curl через API провайдера (Resend API / SMTP), доступы — из `.env.production`. Адрес получателя — плейсхолдер `MONITOR_EMAIL=` в `.env.production`, попроси пользователя вписать.

   ```bash
   chmod +x /usr/local/bin/uptime-check.sh
   chmod 600 <project-dir>/.env.production
   ```

2. Cron каждые 5 минут: `*/5 * * * * /usr/local/bin/uptime-check.sh`.
   Чтобы не спамить каждые 5 минут при долгом падении — по желанию храни флаг состояния (напр. `/tmp/uptime-down`) и шли алерт при переходе up→down и сообщение «восстановлен» при down→up.

3. Тест: останови web-контейнер на ~5 минут — алерт приходит по выбранному каналу. Подними контейнер обратно.

## После реализации
1. Покажи, что алерт приходит (тест с остановкой контейнера или временно неверным URL у внешнего сервиса).
2. ADR в `docs/memory/decisions/`: внешний сервис или свой cron, какой канал и почему.
3. `docs/memory/infrastructure.md` — раздел «Мониторинг»: что проверяется, как часто, куда уходит алерт.
