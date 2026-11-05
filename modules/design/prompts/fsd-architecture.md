# FSD-архитектура — структура `src/` по 6 слоям

Запускай после UI-кита, до сборки экранов.

Нужно на входе: Next.js-приложение с `src/` (App Router), UI-кит в `src/shared/ui/`, `docs/spec.md` с разделами «Данные (модель)» и «Экраны».

Результат: `src/` разложен по слоям Feature-Sliced Design, импорты только вниз, постоянная обвязка в `layout.tsx`, навигация через `<Link>`.

## Слои (сверху вниз)

```
src/
├── app/        ← роутинг Next.js, провайдеры, глобальные стили, layout.tsx с обвязкой
├── pages/      ← страницы (по одной на маршрут из spec.md), только контент
├── widgets/    ← крупные блоки (Header, Sidebar, Footer) — подключаются в layout.tsx
├── features/   ← действия пользователя (LoginForm, AddToCart)
├── entities/   ← бизнес-сущности (из модели данных spec.md)
└── shared/
    ├── ui/     ← UI-кит (atom / molecule / UI-organism, без домена)
    ├── lib/    ← утилиты
    ├── api/    ← базовый api-клиент
    └── config/ ← env, константы
```

Импорты: `app → pages → widgets → features → entities → shared`. Запрещено импортировать соседний слайс того же слоя и слой выше.

Гибрид: снаружи FSD (куда класть по бизнес-роли), внутри `shared/ui/` — мягкий Atomic Design. Компонент знает о домене → уходит из `shared/ui/` в `entities/<x>/ui/` (UserCard), `features/<x>/ui/` (LoginForm), `widgets/<x>/` (Header). Правило целиком — `ui-kit-atomic` (в `rules/`, если есть).

## Шаг 1 — Структура

```bash
mkdir -p src/{app,pages,widgets,features,entities}
mkdir -p src/shared/{ui,lib,api,config}
```

Next.js воспринимает `src/pages/` как Pages Router. Чтобы FSD-слой не превращался в маршруты, создай в корне приложения (рядом с `src/`) пустую папку `pages/` с `README.md` («папка-заглушка, FSD-слой страниц — в src/pages») — Next.js тогда игнорирует `src/pages/`. Проверь `npm run build`: в выводе маршрутов не должно быть путей из `src/pages/`.

## Шаг 2 — `entities/` из модели данных

Каждая сущность из `docs/spec.md` → «Данные (модель)» — слайс:

```
src/entities/user/
├── model/types.ts       ← interface User
├── api/mock-user.ts     ← моки (заменяются при подключении БД)
├── api/getUser.ts       ← запросы (пока возвращают моки)
├── ui/UserCard.tsx
└── index.ts             ← public API
```

## Шаг 3 — `features/` из действий

Действия из раздела «Экраны» → «Действия», переиспользуемые на нескольких экранах, — слайсы `features/<action>/` с `ui/`, `model/` (хук с логикой), `api/`, `index.ts`.

## Шаг 4 — `pages/`

Каждый экран из `spec.md` → `src/pages/<screen>/ui/<Screen>Page.tsx` + `index.ts`.

## Шаг 5 — Роутинг: тонкие адаптеры в `src/app/`

```tsx
// src/app/(app)/profile/page.tsx
import { ProfilePage } from "@/pages/profile"
export default ProfilePage
```

## Шаг 6 — Постоянная обвязка в `layout.tsx`

Header / Sidebar / Footer / Nav — только в сегментном layout, никогда внутри `pages/` (иначе они перемонтируются на каждом переходе: меню мигает, состояние сбрасывается).

```tsx
// src/app/(app)/layout.tsx
import { Header } from "@/widgets/header"
import { Sidebar } from "@/widgets/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
```

```
src/app/
├── layout.tsx       ← <html>/<body>, шрифт next/font, провайдеры
├── (public)/        ← экраны без меню: лендинг, /login, /signup (свой layout или без него)
└── (app)/           ← внутренние экраны: layout.tsx с Header + Sidebar
```

Группы в скобках на URL не влияют. Состояние обвязки (открыт ли сайдбар) — в самом layout/виджете; активный пункт меню — через `usePathname()`.

## Шаг 7 — Навигация через `<Link>`

Внутренние переходы — только `<Link href>` из `next/link` (мягкая навигация, префетч, Router Cache, обвязка не перемонтируется). Из обработчиков — `router.push()` из `next/navigation`. `<a href>` — только для внешних ссылок.

## Шаг 8 — Public API

Каждый слайс экспортирует наружу только нужное через `index.ts`; снаружи импорт только `@/features/login`, не глубокие пути.

## Шаг 9 — Проверка импортов

```bash
# слайсы одного слоя не импортируют друг друга
for layer in features entities widgets; do
  for slice in src/$layer/*/; do
    name=$(basename "$slice")
    grep -rnE "from ['\"]@/$layer/" "$slice" | grep -vE "@/$layer/$name(['\"/]|$)"
  done
done
```

Нашлось → общий код вынести ниже (`entities/` или `shared/`) или использовать паттерн `@x` для cross-entity.

## После выполнения

1. `tree -L 3 src/`
2. Содержимое `index.ts` каждого слайса.
3. Подтверждение, что импорты идут только вниз и `src/pages/` не попал в маршруты.
