# Экран: People and roles (`/admin/users`), приглашение, первый вход

Основа: флоу админки `docs/flows/admin.json` (экраны people, invite), ADR-006 (роли editor / designer / admin, без approver),
находка «Описания простыми словами». Код: `src/app/admin/(dashboard)/users/page.tsx`, `src/admin/people.ts`,
`src/app/admin/welcome/page.tsx`, `src/app/admin/login/setup/page.tsx`.

## Список (только админ)
- Заголовок «People and roles», кнопка **Invite a person**.
- Строка: имя, почта, роль словами, двухшаговый вход — **On** / **Waiting for sign-in** (приглашён, ещё не вошёл) /
  **Not set up** (вошёл до того, как вход стал обязательным, или админ сбросил), последний вход, **Off** у отключённых.
- Действия у строки: роль (Editor · Designer · Admin), **Turn off** / **Turn on** (доступ), **Reset two-step sign-in**,
  **Copy invite link again** (пока человек не вошёл; старая ссылка перестаёт работать). Себя отключить или понизить нельзя.
- **Вид (2026-11-15):** роль — читаемый список (название роли видно), меняется **сразу при выборе**, без кнопки Change;
  двухшаговый вход — «Two-step: On» (подпись, а не голое «On»); редкие действия (Reset two-step sign-in, Turn off,
  Set a new password) — в меню **More ▾** у строки; Copy invite link again — на виду, пока человек не вошёл.
- **Вид (решение владелицы 2026-11-27, референсы Vercel Members, Lyssna):** подпись под заголовком «Who can sign in to
  the admin. Everyone signs in with a password and a code from their phone.»; список — таблицей с подписями колонок
  Person · Role · Two-step sign-in · Last signed in: инициалы, имя и почта, роль, «✓ On» зелёным / «Waiting for
  sign-in» / «Not set up» / «Access off», дата последнего входа, **⋯** с теми же редкими действиями. На телефоне —
  имя и почта, под ними роль, вход и дата, ⋯ справа. Под списком — **What each role can do**: три строки (Editor ·
  Designer · Admin) тем, что роль может (`spec.md → Доступы`).

## Пригласить
Окно «Invite a person»: Email, Name, «What they can do» — роли описаны тем, что человек может:
- **Editor** — changes text and pictures, builds pages from templates, publishes;
- **Designer** — the same, and adds, moves and removes sections, changes how they look, makes templates;
- **Admin** — the same, and deletes pages and records, products, old links, people, integrations.
Подпись: «They get an email with a link. Two-step sign-in is set up on the first visit.»
**Send invite** → письмо со ссылкой (если почта не подключена — только ссылка) и на экране «Invite link for {name}:
{ссылка} · Copy · valid 7 days». Повторное приглашение на ту же почту — «Already has access».

## Ссылка из приглашения (`/admin/welcome?token=…`)
«Welcome, {имя}» → пароль (10+ символов) → **Continue** → вход → настройка двухшагового входа. Просроченная или уже
использованная ссылка: «This link has expired. Ask your admin for a new one.»

## Двухшаговый вход — обязательный (флоу: «2FA on for everyone»)
- Кто вошёл паролем без настроенного второго шага, попадает на `/admin/login/setup`: QR-код, ключ вручную, пароль ещё раз
  и код из приложения → **Turn on** → 8 кодов восстановления (показываются один раз, не в адресе страницы) → **Continue**.
  Ключ выдаёт и хранит сервер до подтверждения; пароль нужен, чтобы чужая сессия не привязала свой телефон.
- Пока шаг не настроен, админка, редактор на странице и API админки не открываются.
- My account: «Two-step sign-in is on since …, N recovery codes left»; **Set up on a new phone** (с паролем) — сбрасывает
  и сразу ведёт на настройку. Выключить совсем нельзя.
- Админ может сбросить второй шаг человеку (потерян телефон) или задать новый пароль — все сессии и ссылки этого человека
  закрываются, второй шаг он настроит при следующем входе. Ссылка-приглашение работает только до первого входа.

## Права
Всё на этом экране — только админ. Журнал: `user` (invited, role, active, totpReset).
