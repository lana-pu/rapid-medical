# Экран: Website or training tool (`/admin/start`)

Основа: флоу редактора `docs/flows/site-editor.json` (экран choose), находка №9 («после входа — выбор, а не список
системных разделов»), `spec.md → Инструмент Tigertriever`. Код: `src/app/admin/start/page.tsx`.

## Когда
После входа (и кода двухшагового входа) открывается этот экран, если вход был без конкретного адреса (`next`). Ссылка из
письма или закладка на страницу админки ведёт сразу туда.

## Вид
Логотип, имя человека, вопрос «What do you want to work on?» и две большие карточки:
| Карточка | Подпись | Мета | Действие |
|---|---|---|---|
| **Website** | Pages, Evidence, News, Team, Jobs, Webinars | «{N} things need your attention» (как на `/admin`) или «Everything is live» | → `/admin` |
| **Training tool** | TIGERTRIEVER courses, stages and videos | «Not built yet» | неактивна (кода инструмента нет; Content Studio — прототип) |
Внизу — My account и выход.

## Состояния
| Состояние | Что видно |
|---|---|
| Нет сессии | → `/admin/login?next=/admin/start` |
| Двухшаговый вход не пройден | → `/admin/login/2fa` |
