# Экран: Website — what needs you (`/admin`)

Основа: флоу админки `docs/flows/admin.json` (экран home), разбор админки сценарий №12 («первым — что не опубликовано и
что ждёт ответа, а не счётчики записей»), ADR-006. Код: `src/app/admin/(dashboard)/page.tsx`, `src/admin/home.ts`.

## Вход
После входа и выбора «Website» (экран выбора — `screens/admin-choose.md`) открывается этот экран. Логотип «Rapid Medical»
в меню ведёт сюда же.

## Шапка
«Hello, {имя}» и кнопка **New page** (→ `/admin/editor?new=1`, выбор шаблона).

## Needs your attention
Список дел, новые сверху, у каждого — что, кто и когда, одна кнопка действия. Пусто → «Nothing waiting. Everything is live.»
| Дело | Текст | Действие |
|---|---|---|
| Неопубликованные правки записи | «{Название} — unpublished changes by {кто} · {когда}» | Open on page (страницы) или Open (запись) |
| Правки настроек, сделанные на странице | «{Группа настроек} — unpublished changes by {кто}» | Open |
| Запланированная публикация | «{Название} — publishes {дата, время} ({часовой пояс})» | Open |
| Новые заявки | «{N} new request(s)» (статус New) | Open requests |
| Открытые комментарии на странице | «{N} open comment(s) on {страница}» | Open on page |
| Картинки без описания | «{N} picture(s) without a description» | Describe pictures |
Неопубликованные записи без правок (черновики, которые никогда не были на сайте) сюда не попадают — они в своих списках.

## Recent activity
Последние 8 действий из журнала словами: «Emily R published Large vessel stroke · 2 hours ago», «Daniel K saved Evidence
“…”», «Noa B replaced a file in 3 places». Ссылка **All activity** → `/admin/activity`. Входы и неудачные входы не показываются.

## Сводка
Три карточки со ссылками:
- **Evidence** — «{N} studies · last added {дата}»;
- **Media library** — «{N} files · {M} without description»;
- **People and roles** — «{N} people · two-step sign-in on for everyone» или «{K} without two-step sign-in»
  (карточка только у админа).

## Меню слева (все экраны админки)
По разделам сайта — см. `admin-sections.md` (2026-11-13): Find a page; Website (Home … Menu and footer); Work; Admin.
Внизу: имя и роль словами (Editor, Designer, Admin), My account, View site ↗, Edit site ✎, выход.

## Состояния
| Состояние | Что видно |
|---|---|
| Нет дел | «Nothing waiting. Everything is live.» |
| Нет журнала | «No activity yet.» |
| Нет прав на раздел | `?error=forbidden` → «That area is for admins.» |
