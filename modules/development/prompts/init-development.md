# Инициализация приложения — Next.js + TypeScript + Tailwind + стартовые зависимости

Запускай, когда у проекта уже есть документация (`docs/spec.md`, `AGENTS.md`), но ещё нет кода приложения.

Нужно на входе: `docs/spec.md` с описанием продукта.

Результат: рабочий скелет приложения (`npm run dev` и `npm run build` проходят), стек записан в `docs/spec.md`.

## Рекомендованный стек

| Слой | Рекомендация | Альтернативы |
|---|---|---|
| Фреймворк | Next.js 16 (App Router, React) | Next.js 15, Remix, Astro |
| Язык | TypeScript (strict) | JavaScript (не рекомендуется) |
| Стили | Tailwind CSS v4 (по умолчанию в Next.js 16) | Tailwind v3 (с Next.js 15), CSS Modules |
| UI-компоненты | shadcn/ui | Radix UI напрямую, Headless UI, MUI |
| Иконки | lucide-react | react-icons, Heroicons |
| Архитектура | Feature-Sliced Design | своя структура |

Если под задачу продукта явно лучше другой стек — предложи его. Дальше команды даны для рекомендованного стека; при замене — адаптируй.

## Шаг 0 — Подтверди стек

Покажи пользователю стек одним сообщением и спроси, подходит ли (например, «хочу Next.js 15», «без TypeScript», «не Tailwind»). Без возражений — берём как есть. Запиши итог в `docs/spec.md`:

```markdown
## Стек
- Frontend: Next.js 16 (App Router)
- Язык: TypeScript (strict)
- Стили: Tailwind CSS v4
- UI: shadcn/ui + lucide-react
- Архитектура: Feature-Sliced Design
- Deploy: <если ещё не выбран — см. development/prompts/deploy-strategy-adr.md>
```

## Шаг 1 — Создать Next.js проект

В корне проекта (или в папке приложения, если проект — монорепо):

```bash
npx create-next-app@latest . \
  --typescript --tailwind --app --eslint --src-dir \
  --import-alias "@/*" --no-turbopack --no-agents-md
```

- `--src-dir` — код в `src/` (нужно для FSD); `--app` — App Router; `--import-alias "@/*"` — импорты вида `@/shared/ui/button`.
- `--no-agents-md` — не перезаписывать существующие `AGENTS.md` / `CLAUDE.md`.
- Если в папке уже есть git-репозиторий — добавь `--disable-git`, чтобы create-next-app не делал свой «Initial commit». Если git ещё нет — инициализируй его по `development/prompts/git-github-setup.md`.
- Если CLI отказывается работать в непустой папке (там уже `docs/`, `AGENTS.md`) — создай приложение во временной папке и перенеси содержимое в проект, не затирая существующие `docs/`, `AGENTS.md`, `CLAUDE.md`, `.gitignore` (слить, а не заменить).
- Выбран Next.js 15 → `create-next-app@15`; Tailwind будет v3 (конфиг `tailwind.config.ts` вместо `@theme`).

## Шаг 2 — Проверь структуру

- `AGENTS.md`, `docs/` — в корне проекта, не перезаписаны и не задвоены.
- Обёртки ассистента (`.claude/`, `.codex/`, `.cursor/`) — не внутри папки приложения, а в корне воркспейса/проекта, который открыт в редакторе.
- Если рядом с `AGENTS.md` нужен `CLAUDE.md` — это ссылка/импорт на `AGENTS.md`, не копия.

## Шаг 3 — Дополнительные зависимости

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react
```

`cva` — варианты компонентов; `clsx` + `tailwind-merge` — утилита `cn()`; `lucide-react` — иконки.

## Шаг 4 — Утилита `cn`

```typescript
// src/shared/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Шаг 5 — Очисти стартовую страницу

`src/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-semibold">Проект готов к работе</h1>
    </main>
  );
}
```

`src/app/globals.css` — только базовый слой Tailwind, демо-стили create-next-app удалить:
- Tailwind v4: `@import "tailwindcss";`
- Tailwind v3: `@tailwind base; @tailwind components; @tailwind utilities;`

## Шаг 6 — pnpm (только если используется pnpm)

Если при установке `sharp` / `unrs-resolver` появилось предупреждение о заблокированных build-scripts — добавь в `package.json` и повтори `pnpm install`:

```json
{ "pnpm": { "onlyBuiltDependencies": ["sharp", "unrs-resolver"] } }
```

## Шаг 7 — Проверка (обязательно)

```bash
npm run dev     # http://localhost:3000 — «Проект готов к работе»
npm run build   # без ошибок и без TypeScript warning
```

Есть ошибки — почини до следующих шагов.

## Границы промта

Здесь только скелет. Дальше по порядку: `design/prompts/design-system.md` (DESIGN.md) → `design/prompts/ui-kit.md` (shadcn + UI-кит) → `design/prompts/fsd-architecture.md` (FSD-слои). Темы и токены — только через DESIGN.md.
