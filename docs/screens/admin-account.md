# Экран: My account (`/admin/account`)

Основа: описано по коду 2026-11-13 (как работает сейчас). Ссылка «My account & security» внизу меню админки.
Обязательный двухшаговый вход и настройка на новом телефоне — [admin-people](admin-people.md); вход и сброс пароля —
[admin-login](admin-login.md).
Код: `src/app/admin/(dashboard)/account/page.tsx`, `src/lib/auth.ts` (`listSessions`, `destroyAllSessions`,
`verifyPassword`, `hashPassword`).

## Что показано
- Заголовок «My account», подпись «{имя} · {почта}».
- **Two-step sign-in**: «On since {дата}. {N} recovery codes left.», «New phone? Set it up again: the old codes stop
  working.», поле «Confirm with your password», **Set up on a new phone**.
- **Change password**: «Current password», «New password (10+ characters)», **Change password**.
- **Active sessions**: Device (браузер и система) · IP · Signed in · Last seen, у текущей — «this device»; кнопка
  **Sign out other sessions**. Показываются незакончившиеся сессии (живут 7 дней).

## Действия и сообщения
| Действие | Успех | Ошибка |
|---|---|---|
| Set up on a new phone | ключ, коды восстановления и отметка «включено» стираются → `/admin/login/setup` | «Password is wrong» |
| Change password | «Password changed. Other sessions were signed out.» — все сессии, кроме этой, закрыты | «Current password is wrong», «Use 10+ characters» |
| Sign out other sessions | «Other sessions signed out» | — |

Сообщения приходят в адресе (`?msg=` — зелёным, `?error=` — красным).
Журнал: `user` (`totpReset`, `own`), `user` (`passwordChanged`), `logout` (`everywhere`).

## Права
Любая роль после двухшагового входа; только своя учётная запись.
