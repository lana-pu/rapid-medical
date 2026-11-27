# Экран: My account (`/admin/account`)

Основа: описано по коду 2026-11-13 (как работает сейчас). Ссылка «My account & security» внизу меню админки.
Обязательный двухшаговый вход и настройка на новом телефоне — [admin-people](admin-people.md); вход и сброс пароля —
[admin-login](admin-login.md).
Код: `src/app/admin/(dashboard)/account/page.tsx`, `src/lib/auth.ts` (`listSessions`, `destroyAllSessions`,
`verifyPassword`, `hashPassword`).

## Что показано (иерархия — решение владелицы 2026-11-27, `admin-settings.md → Иерархия`; референсы Airwallex, Mercury)
- Заголовок «My account & security» (как пункт в колонке), подпись «{имя} · {почта}».
- Одна карточка из двух строк:
  - **Two-step sign-in**: «On since {дата} · a code from your phone at every sign-in.» и число кодов восстановления
    («{N} recovery codes left»); если кодов **не осталось** — предупреждение янтарным «No recovery codes left — if you
    lose the phone, an admin has to reset it.» (раньше «0 recovery codes left» шло зелёным). Справа **Set up on a new
    phone…** — открывает пояснение «the old codes stop working», поле «Confirm with your password» и кнопку.
  - **Password**: «Changing it signs you out everywhere else.»; справа **Change password…** — открывает «Current
    password», «New password (10+ characters)» и кнопку.
- **Where you are signed in**: от новых к старым, этот вход первым («this device»); устройство словами — «Chrome on
  Mac», «Safari on iPhone» (из строки браузера; не распознано — «Unknown browser»), IP, Last active; когда вошли —
  подсказкой при наведении. Видно пять строк, остальные — «Show {N} more». Кнопка **Sign out everywhere else**.
  Показываются незакончившиеся сессии (живут 7 дней).

## Действия и сообщения
| Действие | Успех | Ошибка |
|---|---|---|
| Set up on a new phone | ключ, коды восстановления и отметка «включено» стираются → `/admin/login/setup` | «Password is wrong»; 8 неверных за 15 минут — «Too many attempts. Try again in 15 minutes.» |
| Change password | «Password changed. Other sessions were signed out.» — все сессии, кроме этой, закрыты | «Current password is wrong», «Use 10+ characters»; 8 неверных за 15 минут (вместе с «Set up on a new phone», ключ `pw:{id}`) — «Too many attempts. Try again in 15 minutes.» (аудит 2026-11-13, сделано 2026-11-16) |
| Sign out everywhere else | «Other sessions signed out» | — |

Сообщения приходят в адресе (`?msg=` — зелёным, `?error=` — красным).
Журнал: `user` (`totpReset`, `own`), `user` (`passwordChanged`), `logout` (`everywhere`).

## Права
Любая роль после двухшагового входа; только своя учётная запись.
