# Telegram-оповещения владельцу (только исходящие, белый список chat_id)

Запускай, когда владелец/команда хочет получать в личный Telegram сообщения от сервиса: «упал», «новая заявка», «ошибка на сервере». Это не пользовательская фича — пользователи продукта бота не видят. Канал односторонний: сервис → получатели из белого списка.

Нужно на входе: серверный код приложения (куда подключить отправку); аккаунт Telegram у получателя.

## Чего здесь НЕТ
Только исходящие сообщения через Telegram Bot API (`fetch`). Не нужны: webhook и приём сообщений, библиотеки ботов (grammy и т.п.) и обработчики команд, поле `telegramId` у `User` и привязка аккаунтов, изменения модели данных.
Нужны: токен бота и белый список `chat_id` (`TELEGRAM_ALERT_CHAT_IDS`). Бот шлёт ТОЛЬКО тем, кто в списке; посторонний, написавший боту, попадает в `getUpdates`, но ничего не получает.

## 0. Сначала разбор
Уточни с пользователем: о каких событиях из `docs/spec.md` он хочет узнавать и кому слать алерты. Есть скилл `/new-feature` — используй его; нет — короткие вопросы и план, затем реализация.

## 1. Бот
Попроси пользователя: открыть `@BotFather` → `/newbot` → задать имя и username → скопировать токен.

## 2. Env
Создай/дополни `.env.local` и `.env.production`:
- `TELEGRAM_BOT_TOKEN=впиши-токен-от-BotFather` — пользователь вписывает в файл сам (не в чат, не в терминал); ты читаешь только через `process.env`;
- `TELEGRAM_ALERT_CHAT_IDS=` — белый список через запятую; заполняешь ты сам (шаг 3). `chat_id` не секрет.
Проверь, что `.env.*` в `.gitignore`.

## 3. chat_id — определяешь сам, пользователь его не ищет
1. Скажи пользователю найти бота по username и отправить ему `/start` (без этого бот не может написать первым).
2. Создай одноразовый скрипт `scripts/telegram-discover-chatid.mjs`:
```js
// запуск из корня приложения: node --env-file=.env.local scripts/telegram-discover-chatid.mjs
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) { console.error('Нет TELEGRAM_BOT_TOKEN в .env.local'); process.exit(1) }

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
const data = await res.json()

const chats = new Map()
for (const u of data.result ?? []) {
  const c = (u.message ?? u.edited_message ?? u.channel_post)?.chat
  if (!c) continue
  const who = [c.first_name, c.last_name, c.username && '@' + c.username].filter(Boolean).join(' ')
  chats.set(c.id, who || c.title || '—')
}

if (chats.size === 0) console.log('Боту ещё никто не писал. Отправь боту /start и запусти снова.')
else { console.log('chat_id → кто:'); for (const [id, who] of chats) console.log(`  ${id}\t${who}`) }
```
3. Запусти, найди `chat_id` пользователя и сам впиши в `TELEGRAM_ALERT_CHAT_IDS` в `.env.local` и `.env.production`.
4. Когда все нужные `chat_id` записаны — удали скрипт.

**Добавить получателя позже:** человек пишет боту `/start` → ты снова создаёшь и запускаешь скрипт → дописываешь его `chat_id` через запятую в оба env → перезапускаешь приложение/контейнер → удаляешь скрипт.

## 4. Функция отправки — `src/lib/telegram-alert.ts`
```ts
export async function sendTelegramAlert(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatIds = (process.env.TELEGRAM_ALERT_CHAT_IDS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean)   // белый список
  if (!token || chatIds.length === 0) return            // не настроено — молча выходим

  await Promise.all(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      }).catch(() => {})   // алерт не должен ронять основной поток
    )
  )
}
```
С `parse_mode: 'HTML'` экранируй `<`, `>`, `&` в динамических частях текста.

## 5. Куда подключить
- Глобальный обработчик серверных ошибок — текст ошибки без чувствительных данных пользователя.
- Важные бизнес-события из спеки (новый заказ, первая оплата…).
- Uptime-мониторинг — отдельным cron напрямую через тот же токен и список, не через приложение (см. `uptime-monitoring.md`).
Не спамь: только важное и редкое.

## Безопасность
- Токен — секрет: только в env (права 600), не в коде и не в репозитории.
- Белый список — и есть защита: никаких «отвечать всем, кто написал».
- В текст алертов не клади пароли, токены, персональные данные.

## После реализации
1. Тестовый `sendTelegramAlert('тест')` — приходит всем из списка.
2. Изоляция: с другого аккаунта напиши боту `/start` — этот человек алертов НЕ получает.
3. Одноразовый скрипт удалён.
4. Бот не касается пользователей продукта: нет webhook, команд, привязки.
5. ADR в `docs/memory/decisions/`: Telegram как канал оповещений владельцу (только исходящие, белый список, без webhook/библиотек); `docs/memory/infrastructure.md` — ENV и куда идут алерты.
