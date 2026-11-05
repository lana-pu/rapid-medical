# Code Connect — маппинг Figma-компонентов на React UI-кит

Запускай после UI-кита, если дизайн ведётся в Figma и в ней есть библиотека компонентов. С Code Connect `get_design_context` экрана возвращает готовый JSX с компонентами из `@/shared/ui/` и точными props, а не сырой Tailwind-каркас — это даёт перенос Figma → код 1:1.

Нужно на входе:
- `docs/DESIGN.md` и UI-кит в `src/shared/ui/`, собранный в режиме pixel-perfect по Figma (`design/prompts/ui-kit.md`);
- Figma MCP подключён;
- компоненты в Figma оформлены как настоящие components (с variants и properties), а не frames.

## Когда пропускать

- Figma нет — пропусти целиком.
- В Figma только макеты, без библиотеки компонентов — смаппь только то, что реально оформлено компонентами; остальное сверяется скриншотами при сборке экранов. Компонентов нет вовсе — пропусти.
- Есть библиотека компонентов — пропускать нельзя.

## Шаг 1 — CLI

В корне приложения:

```bash
npm install -D @figma/code-connect
npx figma connect --version
```

## Шаг 2 — `figma.config.json` (рядом с `package.json`)

```json
{
  "codeConnect": {
    "include": ["src/shared/ui/**/*.figma.tsx"],
    "parser": "react",
    "importPaths": { "src/shared/ui/*": "@/shared/ui/*" }
  }
}
```

`importPaths` даёт в сниппетах импорт `@/shared/ui/button`, а не относительный путь.

## Шаг 3 — Personal Access Token

Публикация маппинга идёт через Figma REST API с PAT (отдельно от OAuth Figma MCP).

1. Пользователь создаёт токен на `https://www.figma.com/settings/personal-access-tokens`: scopes **Code Connect → Write**, **File content → Read**; срок — 30 дней.
2. Создай/дополни `.env.local` строкой-плейсхолдером `FIGMA_ACCESS_TOKEN=` и попроси пользователя вписать значение прямо в файл (не в чат, не в терминал). Убедись, что `.env*` в `.gitignore` (кроме `.env.example`).
3. Публикацию запускаешь ты, подставляя токен из `.env.local`.

## Шаг 4 — `.figma.tsx` на каждый компонент

Для каждого компонента UI-кита:
1. Пользователь выделяет component set в Figma → ПКМ → Copy link to selection (или node-id берётся из `get_metadata`).
2. Рядом с компонентом создай `<Component>.figma.tsx`:

```tsx
// src/shared/ui/button/Button.figma.tsx
import { figma } from "@figma/code-connect"
import { Button } from "./Button"

figma.connect(Button, "https://figma.com/file/<fileKey>/...?node-id=<nodeId>", {
  props: {
    variant: figma.enum("Variant", {
      Primary: "primary", Secondary: "secondary", Outline: "outline",
      Ghost: "ghost", Destructive: "destructive", Link: "link",
    }),
    size: figma.enum("Size", { Small: "sm", Medium: "default", Large: "lg", Icon: "icon" }),
    children: figma.children("*"),
    loading: figma.boolean("Loading"),
  },
  example: ({ variant, size, children, loading }) => (
    <Button variant={variant} size={size} loading={loading}>{children}</Button>
  ),
})
```

| Figma property | API |
|---|---|
| Variant (enum) | `figma.enum("Prop", {...})` |
| Boolean | `figma.boolean("Prop")` |
| Text | `figma.string("Prop")` |
| Instance (вложенный компонент) | `figma.instance("Prop")` |
| Children (auto layout) | `figma.children("*")` / `figma.children("Icon")` |

Имена properties и значений (`Variant`, `Primary`) должны точно совпадать с Figma (Inspect → Properties).

## Шаг 5 — Публикация

```bash
npx figma connect publish
```

Проверка: в Figma у компонента Inspect → Dev Resources показывает React-сниппет с правильным импортом и props.

## Шаг 6 — Проверка через MCP

Возьми любой экран из того же файла, сделай `get_code_connect_map` и `get_design_context` — результат должен использовать компоненты из `@/shared/ui/` с правильными props. Если генерируется свой JSX вместо твоих компонентов: проверь, что `publish` прошёл без ошибок, что экран в том же файле, что и компоненты, и что `get_code_connect_map` возвращает маппинг.

## После выполнения

1. Покажи `tree src/shared/ui/` — пары `<Component>.tsx` + `<Component>.figma.tsx`.
2. Покажи результат тестовой генерации экрана — импорты из `@/shared/ui/`.
3. Зафиксируй ADR в `docs/memory/decisions/ADR-<NNN>-code-connect.md` (следующий свободный номер): что настроено, зачем, когда обновлять.

## Когда обновлять маппинг

| Событие | Действие |
|---|---|
| Новый компонент в UI-ките | новый `*.figma.tsx` + `npx figma connect publish` |
| Изменились variants/props | обнови `*.figma.tsx` + `publish` |
| Компонент переехал из `shared/ui/` | перенеси `*.figma.tsx`, обнови `importPaths` |
| Дизайнер переименовал variant | обнови enum-маппинг |
| Истёк PAT | новый токен в `.env.local` |
