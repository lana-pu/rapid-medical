# Замена моков на реальные запросы к БД (UI не переписывается) + производительность

Запускай, когда прототип работает на моках, а база и схема уже готовы. Результат: в слое данных реальные запросы вместо моков с идентичными сигнатурами, UI не трогается; страницы на реальных данных не «висят».

Нужно на входе: слой мок-API (напр. FSD: `src/entities/<entity>/api/mock-*.ts`), применённая схема и singleton-клиент БД (`src/shared/db.ts`) — см. `db-schema-migrations-seed.md`.

Стек по умолчанию: Next.js App Router + Prisma + FSD. Другой стек/ORM — адаптируй примеры. Каждую переведённую сущность коммить отдельным атомарным коммитом (по правилам коммитов проекта, если есть `docs/rules/commits.md`).

## 1. Замена моков
В каждом `src/entities/<entity>/api/`:
1. Переименуй `mock-<entity>.ts` → `<entity>-api.ts`.
2. Замени тело функций: вместо in-memory массива — запросы через `@/shared/db`.
3. Сигнатуры оставь идентичными (`get<Entity>ById`, `list<Entities>`, `create`, `update`, `delete`).

```ts
// было (mock-user.ts)
let items: User[] = [...]
export async function getUserById(id: string): Promise<User | null> {
  await delay()
  return items.find(i => i.id === id) ?? null
}

// стало (user-api.ts)
import { db } from '@/shared/db'
import type { User } from '../model/types'

export async function getUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } })
}
```

Параметры списка (`search`, `limit`, `offset`, `userId`) → `where` / `take` / `skip`:

```ts
export async function listEntities(params?: { search?: string; limit?: number; offset?: number; userId?: string }) {
  return db.entity.findMany({
    where: {
      ...(params?.userId && { userId: params.userId }),
      ...(params?.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    },
    take: params?.limit ?? 20,
    skip: params?.offset,
    orderBy: { createdAt: 'desc' },
  })
}
```

Мутации (create/update/delete/toggle) переводи так же, как чтение — не оставляй их на моках.

## 2. Проверки после замены
1. Импорты из UI — только через публичный `index.ts` слайса: `import { listProducts } from '@/entities/product'`, не из `api/<entity>-api.ts` напрямую. Прямые импорты переделай.
2. `npx tsc --noEmit` — типы сходятся.
3. `grep -r "mock-" src/entities` — пусто.
4. Моки вне слоя данных:
   ```bash
   grep -rniE "mock|fixture|dummy|placeholder|hardcod|заглушк" src --include=*.ts --include=*.tsx | grep -v "src/entities/"
   ```
   Плюс просмотри `src/widgets`, `src/features`, `src/app` на инлайновые массивы-данные в компонентах. Данные, которые должны жить в БД, перенеси в `entities/<entity>/api/` и подключи к БД. Статику (тексты, конфиг, навигацию, токены) не трогай.
5. `npm run dev` → прокликай страницы: данные из БД (видны seed-записи).

Ломается — чини, но не переписывай UI. Если UI всё же пришлось менять — значит сигнатура мока была не та: зафиксируй finding в `docs/memory/findings/` и адаптируй.

## 3. Производительность — в этой же задаче
1. **`loading.tsx`** рядом с каждым `page.tsx` с данными — скелетон, повторяющий каркас страницы (из компонентов UI-кита). Показывается мгновенно при переходе.
2. **Стриминг через Suspense**: каркас (шапка, меню) рендерится сразу, блоки с данными — в `<Suspense fallback={<Skeleton/>}>`, медленные секции — каждая в свой.
3. **Обвязка не тормозит навигацию**: общий layout приложения (меню/шапка) не перемонтируется при переходах — не вешай на него тяжёлый общий `await`. Данные обвязки (профиль, счётчики) — лёгким закэшированным запросом или внутри своего `<Suspense>`. Навигация — через `<Link>`.
4. **Лёгкие запросы** в `entities/<entity>/api/`: `select` только нужных полей; пагинация с лимитом по умолчанию (напр. 20), не `findMany` без лимита; связи точечно через `select`/`include`, без N+1 (никаких запросов в цикле); независимые запросы страницы — параллельно через `Promise.all`.
5. **Индексы** под частые `where`/`orderBy` (`userId`, `status`, `createdAt`) — `@@index` в схеме + миграция.
6. **Картинки** — `next/image`, не голый `<img>`.
7. **Кэш тяжёлых чтений — осторожно.** Часто читаемые и редко меняющиеся данные (каталог, публичные страницы, агрегаты дашборда) — `unstable_cache` с `revalidate` и тегами, и ОБЯЗАТЕЛЬНО инвалидация на запись (`revalidatePath` / `revalidateTag` после create/update/delete). Личные мутабельные списки агрессивно не кэшируй — иначе свежее не покажется после перезагрузки.
8. **Меньше клиентского JS**: страницы — серверные компоненты по умолчанию, `"use client"` только на интерактивных кусках; тяжёлые клиентские виджеты (графики, редакторы, карты) — через `next/dynamic`.

В конце покажи: `git diff --stat`, новые файлы в `src/entities/*/api/`, любую страницу с данными из БД, мгновенный скелетон при переходе и подгрузку секциями (в Network страница не ждёт один большой запрос). Корректность сохранения на всех экранах — проверь `persistence-smoke-check.md`.

## Нюансы

- В моках есть поля, которых нет в схеме → добавь в схему (миграция) или убери из моков.
- ORM возвращает `Date` для timestamp; если UI ждал строки — форматируй (`toLocaleDateString()`), сериализация JSON превращает в строку.
- Если без `delay()` не виден loading-state и это критично — искусственная задержка только при `NODE_ENV === 'development'`.
