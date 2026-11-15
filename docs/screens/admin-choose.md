# Экран: выбор проекта (`/admin`)

Решение владелицы 2026-11-15 (`docs/admin-ia.md` → «проект отдельно»). Код: `src/app/admin/(projects)/`.

## Когда
После входа (и двухшагового кода) без конкретного адреса (`next`). `/admin/start` ведёт сюда. Ссылка из письма или
закладка на экран проекта ведёт сразу туда. «Rapid Medical» в шапке проекта возвращает сюда; стрелка «←» — на предыдущую страницу (`admin-sections.md` → «Кнопки «назад»»).

## Вид
Шапка: логотип RM «Rapid Medical», справа меню аккаунта (имя, роль, My account & security, Sign out).
«Hello, {имя}», вопрос «What do you want to work on?» и карточки проектов:
| Карточка | Подпись | Состояние | Действие |
|---|---|---|---|
| **Website** | rapid-medical.com · three regions | «{N} unread messages · {M} changes to publish» или «Everything is live»; «Last published: {что}, {когда}» | → `/admin/website` |
| **Training tool** | TIGERTRIEVER courses, stages and videos | «Not built yet» | неактивна |
Полоски пространств нет: инструменты принадлежат проекту.

## Состояния
| Состояние | Что видно |
|---|---|
| Нет сессии | → `/admin/login?next=/admin` |
| Двухшаговый вход не пройден | → `/admin/login/2fa` |
| `?error=forbidden` | «That area is for admins.» |
