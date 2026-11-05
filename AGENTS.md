<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Rapid Medical

Общие принципы, библиотека промтов и правила воркспейса — в `../../AGENTS.md` (подгружается сам).
Здесь — только то, что относится к этому проекту.

## Контекст продукта
`docs/spec.md → ## Продукт` (что и для кого), индекс экранов — `docs/spec.md → ## Экраны`. Здесь не дублируем.

## Железные правила
1. **spec.md всегда актуален.** Изменение поведения (логика, состояния, данные, доступы, workflow) →
   сначала `docs/spec.md` / `docs/screens/*.md`, потом код, в одном коммите.
2. **DESIGN.md → примитивы → страницы.** Визуал сейчас намеренно нейтральный (`docs/DESIGN.md`): токены
   в `src/app/globals.css`, примитивы в `src/components/site/primitives.tsx`. Новый токен — сначала в
   DESIGN.md; хардкод цветов/пикселей в шаблонах страниц запрещён.
3. **Новый тип контента** = таблица в `src/db/schema.ts` + запись в `src/admin/resources.ts` (формы и
   списки генерирует `src/admin/engine.ts`). Сразу отразить в `docs/spec.md → ## Данные`.
4. **Регион — в пути URL** (`/us`, `/ous`, `/apac`), не в cookie (ADR-002). Правка регионального
   контента — проверить все три региона и revalidate-пути для `/apac`.
5. **Миграции — Drizzle** (`drizzle/`, `npm run db:migrate`). Не сбрасывать локальную БД с данными;
   прод-миграции идут в build (`scripts/bootstrap.ts`).

## Стадия, push и деплой
Внешние сервисы **не подключены** (Vercel, Neon, домен, SMTP, S3); живёт только статическое демо на
GitHub Pages — оно для сбора информации с Duda, структура сайта ещё не проработана (`docs/spec.md → Стадия`).
Push в `main` сейчас запускает только CI, не деплой: коммит документации можно пушить сразу, код — после
зелёных `tsc` / `lint` / `npm test`. **Когда подключат Vercel** — push в `main` снова только с явного «да»
(обновить этот раздел и `docs/rules/commits.md`).

## Когда → Файл
| Когда | Файл |
|---|---|
| Коммит, push | `docs/rules/commits.md` (+ `../../rules/commits.md`) |
| Деплой, ENV, хранилище, cron, CI | `docs/memory/infrastructure.md` |
| Почему так устроено (стек, регионы, черновики, хранилище) | `docs/memory/decisions/` |
| Аудит безопасности | `/security-check` (скоуп: админка, роли, 2FA, загрузки, формы) |
| Новая фича | `/new-feature` |
| Какой промт библиотеки запустить | `../../modules/_INDEX.md` |

## Активная работа
`docs/memory/state.md` — журнал «что произошло». Бэклог — `docs/memory/BACKLOG.md`, **единственный**
источник «что не сделано» (P0 → P1 → P2 → идеи → решения за владельцем).

## История решений
`docs/memory/INDEX.md` (ADR, findings, sessions).
