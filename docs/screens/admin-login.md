# Экран: Вход в админку (`/admin/login`, `/admin/login/2fa`, `/admin/reset`)

Основа: описано по коду 2026-11-13 (как работает сейчас). Обязательная настройка второго шага, приглашение и первый
вход — [admin-people](admin-people.md), здесь не повторяются.
Код: `src/app/admin/login/page.tsx`, `src/app/admin/login/2fa/page.tsx`, `src/app/admin/reset/page.tsx`,
`src/lib/auth.ts` (`authenticate`, `createSession`, `codeAttemptsExhausted`, `consumeRecoveryCode`,
`createPasswordReset`, `consumePasswordReset`), `src/lib/safe-path.ts`.

## Вход (`/admin/login`)
- Карточка «Rapid Medical · Admin»: **Email**, **Password**, **Sign in**, ссылка «Forgot your password?» → `/admin/reset`.
- Уже вошедший (пароль и код пройдены) сразу уходит на `?next=` или `/admin/start`.
- Пароль верный → сессия на 7 дней (cookie `rm_admin`, в базе — устройство и IP для My account).
  - второй шаг настроен → `/admin/login/2fa` (с тем же `next`);
  - не настроен → `next`, а любой экран админки отправляет на обязательную настройку ([admin-people](admin-people.md)).
  `next` — только путь внутри `/admin` или `/api/editor` (вход в редактор на странице), остальное → `/admin/start`.
- Сообщения: «Invalid email or password.» (нет такой почты, учётная запись отключена или пароль неверный — одно и то же
  сообщение); «Too many attempts. Try again in 15 minutes.»; после сброса пароля — «Password updated. Please sign in.»
- Лимит: 8 неудачных попыток за 15 минут **по почте** и отдельно **по IP**; пока лимит исчерпан, не пускает и с верным паролем.

## Второй шаг (`/admin/login/2fa`)
- «Two-factor authentication», подпись «Enter the 6-digit code from your authenticator app, or a recovery code.»,
  поле кода, **Verify**, «Cancel and sign out» (закрывает сессию → `/admin/login`).
- Принимает код из приложения (6–8 цифр) или код восстановления (`xxxxx-xxxxx`, каждый — один раз).
- Неверный код → «That code didn’t work.». 5 неверных кодов за 15 минут → сессия закрывается, `/admin/login` с
  «Too many attempts. Try again in 15 minutes.»; пока 15 минут не прошли, первая же попытка кода снова закрывает сессию.
- Без сессии → `/admin/login`; код уже пройден → `next` или `/admin/start`.

## Сброс пароля (`/admin/reset`)
- **Запрос**: «Reset password», поле «Your email», **Send reset link**, «Back to sign in». Ответ всегда один, есть почта
  или нет: «If that address has an account, a reset link is on its way (valid 1 hour).»
  Письмо «Reset your Rapid Medical admin password» со ссылкой `/admin/reset?token=…` — только активным учётным записям.
  Без SMTP письмо пишется в лог сервера. Не больше 3 писем на адрес и 10 с одного IP за 15 минут (ответ тот же).
- **Новый пароль** (`?token=`): «Choose a new password», поле «New password (10+ characters)», **Set password**.
  Короче 10 символов → «Use at least 10 characters.». Ссылка неверна, просрочена или уже использована → форма запроса
  с «That link is invalid or has expired. Request a new one.»
- Успех: пароль заменён, ссылка использована, **все сессии** человека закрыты, **все его открытые ссылки** (другие сбросы,
  приглашения) перестают работать; так же при смене пароля в My account,
  → `/admin/login?reset=1`. Второй шаг не сбрасывается — при входе код нужен как обычно.

## Журнал действий
`login` (пароль; с `step: password`, если дальше код), `login` с `step: 2fa`, `login_failed` (почта и причина: `invalid` /
`throttled`; или `step: 2fa`), `user` с `passwordResetRequested` / `passwordReset`. Выход из меню — `logout`.

## Права
Экраны открыты всем (до входа). Прокси `src/proxy.ts` не требует cookie для `/admin/login*` и `/admin/reset`.
