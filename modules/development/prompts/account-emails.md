# Письма аккаунта — welcome, подтверждение email, код входа, сброс и смена пароля

Запускай сразу после настройки auth, если есть регистрация/логин по email. Это обязательная часть auth, не маркетинг. Пропустить можно, только если входа по email нет (только OAuth или закрытый админ-доступ).

Нужно на входе: настроенный auth (`auth-setup.md`); домен для отправки писем.

Результат: папка `src/emails/` с TSX-шаблонами писем аккаунта на общих компонентах, функция отправки `src/lib/email.ts`, письма подключены к auth-flow. Продуктовые письма (заказы, инвайты, дайджест) — отдельно, `product-emails.md`, на этом же провайдере.

Стек по умолчанию: React Email + Resend. Если в проекте уже есть провайдер (SMTP, Postmark, SES…) — используй его; React Email работает в любой Node.js-среде.

## 1. Ключ провайдера
Проверь `RESEND_API_KEY` в `.env.local` и `.env.production`. Нет строки — добавь `RESEND_API_KEY=` с пустым значением в оба файла и скажи пользователю, в какой файл и строку вписать ключ из кабинета resend.com. Ключ пользователь вписывает в файл сам — не в чат и не в терминал; ты читаешь его только из env.
Нет аккаунта — напомни зарегистрироваться и верифицировать домен; объясни, какие DNS-записи добавить (SPF/TXT, DKIM, при необходимости MX, DMARC).

## 2. Установка
`npm install @react-email/components react-email resend`

## 3. Структура `src/emails/`

```
src/emails/
├── components/
│   ├── Layout.tsx       — обёртка (Html, Head, Body, Container) + токены из docs/DESIGN.md
│   ├── Heading.tsx
│   ├── Paragraph.tsx
│   ├── Button.tsx       — CTA-ссылка
│   └── Footer.tsx       — имя продукта, контакты, копирайт
├── welcome.tsx          — { name, productUrl }
├── verify-email.tsx     — { verifyUrl, expiresInHours }
├── login-code.tsx       — { code, expiresInMinutes }   (magic link / OTP)
├── password-reset.tsx   — { resetUrl, expiresInHours }
└── password-changed.tsx — { name, supportEmail, changedAt }
```

Требования:
- все письма используют общие `Layout` и `Footer` — правка в одном месте меняет все письма;
- стили совместимы с почтовыми клиентами: inline или `@react-email/components`, без внешнего CSS (Gmail/Outlook его режут);
- динамические данные — через типизированные props;
- язык писем — язык продукта; цвета/шрифты — из `docs/DESIGN.md`, если он есть.

## 4. Live preview
В `package.json`: `"email:dev": "email dev --dir src/emails"`. Запусти `npm run email:dev` — галерея всех шаблонов в браузере.

## 5. Footer
Заполни реальным именем продукта, support-email (спроси, если не знаешь), при необходимости — логотип и ссылки.

## 6. Функции отправки — `src/lib/email.ts`

```ts
import { Resend } from 'resend'
import WelcomeEmail from '@/emails/welcome'
import VerifyEmail from '@/emails/verify-email'
import LoginCodeEmail from '@/emails/login-code'
import PasswordResetEmail from '@/emails/password-reset'
import PasswordChangedEmail from '@/emails/password-changed'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = '<Имя продукта> <noreply@<домен>>'

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  await resend.emails.send({ from: FROM, to: user.email, subject: 'Добро пожаловать!',
    react: WelcomeEmail({ name: user.name, productUrl: process.env.NEXT_PUBLIC_APP_URL! }) })
}

export async function sendVerificationEmail(email: string, verifyUrl: string) {
  await resend.emails.send({ from: FROM, to: email, subject: 'Подтвердите email',
    react: VerifyEmail({ verifyUrl, expiresInHours: 24 }) })
}

export async function sendLoginCodeEmail(email: string, code: string) {
  await resend.emails.send({ from: FROM, to: email, subject: `Код для входа: ${code}`,
    react: LoginCodeEmail({ code, expiresInMinutes: 10 }) })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await resend.emails.send({ from: FROM, to: email, subject: 'Восстановление пароля',
    react: PasswordResetEmail({ resetUrl, expiresInHours: 1 }) })
}

export async function sendPasswordChangedEmail(user: { name: string; email: string }) {
  await resend.emails.send({ from: FROM, to: user.email, subject: 'Ваш пароль изменён',
    react: PasswordChangedEmail({ name: user.name, supportEmail: '<support-email>',
      changedAt: new Date().toLocaleString('ru-RU') }) })
}
```

## 7. Подключение к auth-flow (better-auth; другая библиотека — аналогичные хуки)
- **Подтверждение email** (если `requireEmailVerification: true`): в `emailAndPassword` колбэк `sendVerificationEmail: ({ user, url }) => sendVerificationEmail(user.email, url)` — ссылку генерирует библиотека.
- **Welcome**: после создания пользователя (хук регистрации / онбординг) → `sendWelcomeEmail(...)`.
- **Вход по коду / magic link** (если есть): после генерации кода → `sendLoginCodeEmail(email, code)`.
- **Сброс пароля**: колбэк `sendResetPassword: ({ user, url }) => sendPasswordResetEmail(user.email, url)`.
- **Смена пароля**: после успешной смены и после завершения сброса → `sendPasswordChangedEmail(...)` — чтобы человек узнал, если пароль сменил не он.

## 8. Проверка
Зарегистрируйся тестовым email: письмо приходит во «Входящие» (не в спам) за ~10 секунд; в дашборде провайдера статус Delivered. Попало в спам — проверь SPF/DKIM/DMARC.

## 9. Документация и коммит
- `docs/spec.md` — какие письма аккаунта отправляются и когда.
- `docs/memory/infrastructure.md` — провайдер, домен отправителя, ENV-переменные.
- Коммит: `src/emails/`, `src/lib/email.ts`, `package.json`, изменения auth.

В конце покажи: галерею `email:dev`, отправленное письмо в дашборде провайдера, полученное письмо.

## Новый шаблон позже
Создавай в `src/emails/` по образцу существующих: тот же `Layout`/`Footer`, те же токены; функцию отправки — в `src/lib/email.ts`.

## Нюансы

- Нет своего домена — для тестов `onboarding@resend.dev`, но письма доходят только на подтверждённый адрес. Для боевой отправки нужен DNS домена.
- На новом домене первые недели часть писем уходит в спам — нормально, пока копится репутация.
- Magic link вместо кода — адаптируй `login-code.tsx` или сделай `login-magic-link.tsx` по образцу.
