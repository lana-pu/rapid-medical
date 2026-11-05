# ADR-001 — Стек: Next.js + Drizzle + Postgres + своя админка

- **Статус:** принято (зафиксировано ретроспективно 2026-11-05 по коду `59169da`; решение принято в
  коммитах `f14dfb9`…`1285784`, 2026-10-28)
- **Источник:** README, `package.json`, `src/admin/*`

## Контекст
Четыре сайта Rapid Medical на Duda (`www`, `us`, `ous`, `apac`) с дублирующимся контентом и
регион-зависимыми регуляторными текстами. Нужна одна кодовая база, редактируемая маркетингом.

## Решение
| Слой | Выбор |
|---|---|
| Приложение | Next.js 16 App Router, React 19, TypeScript; сайт и админка в одном приложении |
| БД | PostgreSQL 16 + Drizzle ORM (схема в TS, SQL-миграции в `drizzle/`) |
| Стили | Tailwind 4 + CSS-токены, нейтральные примитивы (см. `docs/DESIGN.md`) |
| CMS | **Собственная** админка, генерируемая из декларативного описания ресурсов (`src/admin/resources.ts` → `engine.ts`) |
| Rich text | Tiptap 3, хранение HTML, санитайз на выводе |
| Auth | Свои серверные сессии в Postgres, bcrypt, TOTP |
| Тесты | Vitest + Playwright, CI GitHub Actions |

## Обоснование
Видно в коде/README:
- «Adding a new content type = a table in `src/db/schema.ts` + an entry in `src/admin/resources.ts`. Lists,
  forms, validation and persistence are generated» — дешёвое расширение моделей.
- Редактирование «Webflow-Editor-style» и редакционный процесс (черновики, согласование) встроены в продукт.
- Контент мигрирован скриптами из Duda (`scripts/scrape-duda.ts` → `extract-duda.ts` → `seed.ts`).

**Выведено (не написано явно):** отказ от headless-CMS (Sanity/Contentful/Payload и т.п.) — вероятно, ради
полного контроля над региональной моделью и on-page editor без внешней подписки. Причина не
задокументирована — подтвердить у владельца.

## Последствия
- Вся безопасность админки (роли, сессии, загрузки) — на нас; см. BACKLOG (P0 по ролям).
- Модель данных меняется миграциями Drizzle, без UI-конструктора типов.
- Хостинг-агностично: Docker / Node / Vercel.
