# Экран: Activity (`/admin/activity`)

Основа: описано по коду 2026-11-13 (как работает сейчас). Пункт меню **Activity** в группе Work
([admin-sections](admin-sections.md)); последние действия на главной админки — [admin-home](admin-home.md).
Код: `src/app/admin/(dashboard)/activity/page.tsx`, `src/lib/audit.ts`, таблица `audit_log`.

## Что показано
- Заголовок «Activity», подпись «{N} entries» (с учётом фильтров).
- Таблица, новые сверху, по 100 строк: **When** (дата и время с секундами) · **Who** (имя; у неудачного входа — введённая
  почта; у системных действий — «—») · **Action** (код действия; `publish` — зелёным, `delete` и `login_failed` — красным)
  · **What** (название записи; ссылка на форму записи, если запись из списков админки) · **Details** (подробности
  JSON-строкой, целиком — во всплывающей подсказке) · **IP**.
- Пусто: «No activity yet.»
- Внизу «‹ Prev · Page X of Y · Next ›», если страниц больше одной.

## Фильтры
**Any action** (login, login_failed, logout, save, publish, unpublish, delete, restore, bulk, settings, user, media,
schedule, request, comment) · **Anyone** (все учётные записи, включая отключённые) · «Record label…» (поиск по названию
записи) · **Apply**. Параметры в адресе: `?action=&user=&q=&page=`.

## Что пишется в журнал
Каждое действие вызывает `audit()`: кто, действие, ресурс и id записи, название, подробности, IP (первый из
`x-forwarded-for`). Запись не мешает действию: ошибка журнала только логируется.
Кто что пишет — в спеках экранов (вход — [admin-login](admin-login.md), люди — [admin-people](admin-people.md),
заявки — [admin-requests](admin-requests.md), медиатека — [admin-media](admin-media.md), настройки —
[admin-settings](admin-settings.md)). Журнал только для чтения: правки и удаления строк в админке нет.

## Права
Любая роль после двухшагового входа; видны действия всех людей. Входы, неудачные входы и выходы (с введёнными почтами и IP)
видит только админ: для остальных их нет ни в таблице, ни в фильтре действий (аудит 2026-11-13).
