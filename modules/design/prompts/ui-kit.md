# UI-кит в `src/shared/ui/` + витрина `/style-guide`

Запускай после DESIGN.md, до сборки экранов.

Нужно на входе: скелет приложения (`package.json`, `src/`, `tsconfig.json`, зависимости `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `src/shared/lib/utils.ts` с `cn()`, `npm run dev` работает) — если нет, сначала `development/prompts/init-development.md`; готовый `docs/DESIGN.md` — если нет, сначала `design/prompts/design-system.md`.

Результат: полный набор компонентов в `src/shared/ui/`, все стили через токены DESIGN.md, интерактивная витрина `/style-guide`.

Пути `src/…` — от корня приложения (где `package.json`), `docs/…` — от корня проекта. Стек — из `docs/spec.md` (раздел «Стек»): Tailwind v4 → токены через `@theme` в CSS; v3 → `tailwind.config.ts`.

## Архитектура: мягкий Atomic Design внутри `shared/ui/`

Снаружи — FSD, внутри `shared/ui/` — Atomic Design как способ мышления, **не как файловая структура**. Файлы плоско: `shared/ui/button/`, `shared/ui/modal/`, без подпапок `atoms/molecules/`.

| Уровень | Примеры | Признак | Зависимости |
|---|---|---|---|
| Atom | Button, Input, Icon, Badge | не делится | только `shared/lib/utils` |
| Molecule | FormField, SearchBar, Card | 2–3 атома | атомы `shared/ui/` |
| UI-organism | Modal, Toast, DataTable | сложная логика, без домена | атомы + молекулы, внешние либы |

Компонент знает о домене (`user: User`, `product`, `order`) → он не в `shared/ui/`, а в `entities/<name>/ui/` (UserCard), `features/<name>/ui/` (LoginForm), `widgets/` (Header). Если пользователь просит доменный компонент в `shared/ui/` — откажи и предложи правильное место. Правило целиком — `ui-kit-atomic` (в `rules/`, если есть).

## Главные правила

1. Один компонент = один файл, варианты через проп `variant` в `cva()`, не `PrimaryButton` + `GhostButton`.
2. Все состояния (`hover`, `focus-visible`, `disabled`, `loading`) — внутри компонента.
3. Курсор в базовых классах `cva()`: интерактивное → `cursor-pointer`, `disabled` → `cursor-not-allowed`, `loading` → `cursor-wait` (Tailwind 3+ снимает pointer у `<button>`).
4. Стили только через токены: `bg-primary`, `text-foreground`, `rounded-md`. Никаких `bg-[#…]`, `[16px]`, конкретных шрифтов. Нужного токена нет → сначала добавить в DESIGN.md (+ lint), потом использовать.
5. Типы пропов через `VariantProps<typeof xVariants>`.

## Установка shadcn

```bash
npx shadcn@latest init
```

Style: New York · Base color: ближайший к `colors.primary` из DESIGN.md (slate/gray/zinc/neutral) · CSS variables: Yes. Затем синхронизируй сгенерированные CSS-переменные (`src/app/globals.css` или `tailwind.config.ts`) со значениями из `docs/DESIGN.md`.

## Режим pixel-perfect (если UI-кит есть в Figma)

Применяется, если в Figma есть библиотека компонентов. Это точный перенос, а не «адаптация под shadcn».

1. Попроси **одну** ссылку на страницу UI Kit (ПКМ по странице → Copy link to selection).
2. `get_metadata` → список компонентов, классифицируй atoms / molecules / UI-organisms.
3. Покажи карту (компоненты с variants/sizes/states по группам) и жди подтверждения — пользователь может убрать лишнее или добавить недостающее.
4. Иди atoms → molecules → organisms. Для **каждого** компонента обязательные 5 шагов:
   1. `get_design_context` на node-id — точные размеры, padding, gap, radius, цвета, шрифт (size/weight/line-height), все состояния и variants.
   2. `get_screenshot` → `docs/figma-snapshots/<component>.png`.
   3. Сборка в `src/shared/ui/<name>/` через `cva()` с точными значениями (через токены; токена нет — сначала в DESIGN.md).
   4. Локальный скриншот: `/style-guide` → Playwright `browser_navigate` → `browser_take_screenshot` → `docs/local-snapshots/<component>.png`.
   5. Сверка side-by-side: размеры, padding/gap, радиусы, цвета, шрифт, все состояния, иконки. Есть расхождение → **стоп**, спроси: «Figma [X], в коде [Y] — правим токены / вариант / оставляем с обоснованием?»
5. Запрещённые слова (сигнал перехода к интерпретации): «адаптируй», «возьми за основу», «по образу и подобию», «примерно как», «интерпретируй», «упростим», «приведём к shadcn». Возникло желание — повтори `get_design_context` и перенеси точные значения.
6. Компоненты нарисованы как отдельные frames, а не component set с variants → сообщи, что это антипаттерн Figma, предложи объединить, но не блокируй: собери один React-компонент с variants, 5 шагов — для каждого frame.
7. После UI-кита в этом режиме обязателен `design/prompts/figma-code-connect.md`.

## Порядок и состав

По одному компоненту, начиная с `Button` (эталон). Каждый собирается **полностью** — со всеми вариантами, размерами и состояниями из списка, даже если сейчас не нужны.

**Atoms:**
1. `Button` — variants: default, primary, secondary, outline, ghost, destructive, link; sizes: sm, md, lg, icon; states: default, hover, focus-visible, active, disabled, loading (спиннер, блок); props: `asChild`, `leftIcon`, `rightIcon`.
2. `Input` — types: text, email, password, number, tel, url, search; sizes: sm/md/lg; states: default, hover, focus, invalid, disabled, readonly; props: `leftIcon`, `rightIcon`, `clearable`.
3. `Textarea` — sizes sm/md/lg; states default/focus/invalid/disabled; `autoResize`, `maxLength` со счётчиком.
4. `Checkbox` — default/checked/indeterminate/disabled/invalid; sm/md.
5. `Radio` + `RadioGroup` — default/checked/disabled.
6. `Switch` — off/on/disabled; sm/md.
7. `Label` — `htmlFor`; variants default, required (звёздочка).
8. `Badge` — default, secondary, destructive, outline, success, warning; sm/md.
9. `Avatar` — xs…xl, fallback-инициалы.
10. `Spinner` — sm/md/lg, опц. подпись.
11. `Icon` — обёртка над lucide-react, sm/md/lg, `currentColor`.
12. `Skeleton` — text, circular, rectangular.

**Molecules:**
13. `FormField` — Label + Input/Textarea/Select + ошибка + hint; `error` переводит поле в invalid.
14. `Select` — single/multi; default/open/disabled/invalid; поиск, очистка.
15. `Combobox` — Select с поиском и клавиатурной навигацией.
16. `Card` — default, elevated, outlined, interactive; слоты header/content/footer.
17. `Tabs` — default (underline), pills; horizontal/vertical.
18. `Tooltip` — top/right/bottom/left; hover/click.
19. `Breadcrumb` — разделитель настраивается, последний без ссылки.
20. `Pagination` — sm/md, первая/последняя, многоточие.

**UI-organisms:**
21. `Dialog`/`Modal` — sm…full; focus trap, portal, Esc, click-outside; слоты header/content/footer.
22. `Sheet`/`Drawer` — left/right/top/bottom.
23. `Toast` — default, success, error, warning, info; action, автозакрытие + ручное.
24. `AlertDialog` — default, destructive.
25. `DropdownMenu` — items, separators, submenus, клавиатура.
26. `Popover` — placement как у Tooltip.
27. `Table`/`DataTable` — sorting, header/body/footer, pagination, row selection; `columns` + `data` пропами.
28. `Form` — `react-hook-form` + `zod`, связка с FormField.
29. `CommandPalette` (Cmd+K) — опционально.
30. `EmptyState` — icon/illustration, title, description, action.

**Полнота — жёсткое правило.** Если при сборке экрана не хватает variant/size/state — это блокер: не хардкодить на экране, не делать локальную копию в `features/`/`entities/`, а дополнить `cva()` в `shared/ui/<component>`, добавить в витрину и только потом продолжить экран.

## Эталон Button

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"
import { Spinner } from "@/shared/ui/spinner"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-11 px-8", icon: "h-10 w-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), loading && "cursor-wait")}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Остальные компоненты — по этому образцу.

## Проверка хардкода (после каждого компонента)

```bash
grep -E '#[0-9a-fA-F]{3,8}' src/shared/ui/<component>/*
grep -E '\[[0-9]+px\]' src/shared/ui/<component>/*
```

Нашлось → токен из DESIGN.md или новый токен (с lint).

## Витрина `/style-guide`

UI-кит без витрины — непроверяемая работа. Создай `src/app/style-guide/page.tsx`, раскладка в 2 колонки:

- **Sidebar** (sticky, ~240px): группы Foundations → Atoms → Molecules → UI-organisms; пункты — якорные ссылки; активный пункт подсвечен (IntersectionObserver или hash).
- **Foundations** — первая секция, всё из DESIGN.md, не хардкодом:
  - Colors (`#colors`) — свотчи **всех** токенов: квадрат + имя (`bg-primary`, `--color-primary`) + hex; текст на свотче — соответствующим `on-*`; при тёмной теме — пары light/dark.
  - Typography (`#typography`) — все уровни с именами токенов.
  - Spacing (`#spacing`) — шкала полосками с подписями.
  - Radii (`#radii`) — квадраты с подписями.
- **Секция компонента** (`<h2 id="button">`): Variants, Sizes, States (hover/focus — реальные CSS-состояния), **Interactive controls** (dropdown для variant/size, чекбоксы disabled/loading/invalid, переключатель type у Input; Modal/Tooltip/Toast реально открываются; Select реально выбирает), **Code snippet**, отражающий текущее состояние контролов.

Файлы:

```
src/app/style-guide/
├── page.tsx
├── _components/ComponentSection.tsx, PropControl.tsx, PreviewBox.tsx, CodeSnippet.tsx
└── _sections/button-section.tsx, input-section.tsx, …
```

**Главная `/` — редирект на витрину только в dev.** В проде главная должна отдавать продукт, а не UI-кит:

```typescript
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  if (process.env.NODE_ENV !== "production") redirect("/style-guide");
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Скоро здесь будет приложение</h1>
    </main>
  );
}
```

Когда соберётся настоящая главная (`design/prompts/screens-prototype.md`), этот файл заменяется целиком.

### Чек-лист витрины (всё «да», иначе доделать)

- [ ] Sidebar слева, прилипает при скролле; клик скроллит к секции; активный пункт подсвечивается
- [ ] Foundations первой: Colors (все токены + имя + hex), Typography, Spacing, Radii
- [ ] Все компоненты в sidebar под правильными группами
- [ ] У каждого компонента: Variants и Sizes (если > 1), States (минимум default + hover + disabled), работающие Interactive controls, Code snippet
- [ ] Modal, Tooltip, Toast, Select, Dropdown реально открываются и работают

## После выполнения

1. Покажи `tree src/shared/ui/` и `tree src/app/style-guide/`.
2. Grep по хардкоду в `src/shared/ui/` и `src/app/style-guide/` — пусто.
3. Запусти `npm run dev` **в фоне** и открой витрину в браузере пользователя (`open http://localhost:3000/style-guide` на macOS, `xdg-open` на Linux, `start` на Windows). Скажи: «UI-кит собран, витрина открыта». Dev-сервер не останавливай; служебный браузер Playwright закрыть можно.
