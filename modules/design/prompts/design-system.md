# Дизайн-система — DESIGN.md

Запускай перед сборкой UI-кита и экранов, когда в проекте ещё нет `docs/DESIGN.md` (или его нужно пересобрать).

Нужно на входе: `docs/spec.md`. Для режимов 1 и 2 — подключённый Figma MCP.

Результат: `docs/DESIGN.md` в формате Google Labs `design.md` (YAML front-matter + 8 markdown-разделов): палитра, типографика, скругления, отступы, тени, z-index, анимации, базовые компоненты с состояниями. Состав и число ступеней каждой шкалы — под стилистику и референс, не по фиксированному шаблону.

## Шаг 0 — Режим (один обязательный вопрос)

Не выбирай за пользователя. Спроси одним сообщением:

1. **Есть дизайн-система в Figma** (страница Foundations / Library / Design System с variables) → переносим 1:1 через MCP.
2. **Есть Figma с макетами, отдельной DS нет** → определяем стилистику по макетам и генерируем DS.
3. **Figma нет / с чистого листа** → интервью о стилистике и генерация DS.

Если Figma уже упоминалась раньше — всё равно уточни, есть ли в ней выделенная DS с variables.

Режимы 1–2: проверь Figma MCP (`whoami`). Не отвечает — попроси пользователя перезапустить клиент (Claude Code: полностью закрыть и открыть; если не помогло — `/plugin` → disable/enable Figma).

## Режим 1 — DS в Figma (variables)

1. Попроси ссылку на страницу Foundations (ПКМ по странице → Copy link to selection) или на весь файл.
2. `get_variable_defs` — все переменные (цвета, шрифты, радиусы, отступы); `get_libraries` — если variables из внешней библиотеки.
3. Сырой ответ сохрани в `docs/figma-variables-raw.json`.
4. Пусто (в файле только raw styles) → скажи пользователю и предложи режим 2 или 3.
5. Перенеси в формат `design.md` 1:1: сколько ступеней у дизайнера — столько и в DESIGN.md, ничего не выдумывать и не выкидывать.

## Режим 2 — Figma с макетами

1. Попроси ссылку на страницу с экранами (не на отдельный фрейм).
2. `get_metadata` — карта фреймов; для 3–5 представительных (главная, форма, карточка, модалка) — `get_design_context` / `get_screenshot`.
3. Извлеки цвета (hex), шрифты и размеры, скругления, тени, отступы. Сырые наблюдения — в `docs/design-observations.md`.
4. Покажи одним сообщением, что увидел (основной и дополнительные цвета, шрифты и размеры, скругления, есть ли тёмная тема), и сразу собирай — не жди «всё верно?», пользователь поправит сам.
5. Шкалы — по факту использования в макетах (встречается 4 радиуса — фиксируем 4). Semantic (success/warning/error) добавь, если их нет в макетах, но они нужны продукту.

## Режим 3 — с нуля по интервью

8 тем, **каждая отдельным сообщением**, формулируй сам в разговорном тоне. Ответы сразу записывай в `docs/design-decisions.md`. «Не знаю» → предложи 3 варианта в том же сообщении. Неполный ответ → разумный дефолт (светлая тема, Inter, умеренные скругления, просторная плотность).

1. Стилистика: минимал (Apple) / brutalist (Linear) / soft (Notion) / playful (Duolingo) / corporate (Stripe) / cyber (Vercel) / гибрид.
2. Brand color: hex или «как у X».
3. Тема: только светлая (default) / только тёмная / обе (тогда пары light/dark для всех цветовых токенов).
4. Шрифт-пара: Inter / Geist / Manrope / Space Grotesk / JetBrains Mono акцентом / своя пара из Google Fonts. Подключать через `next/font` в `app/layout.tsx`, не `<link>` на Google CDN.
5. Скругления: острые (0–2px) / умеренные (6–8px) / мягкие (12–16px) / pill.
6. Плотность: компактная / просторная / очень просторная.
7. Тени: плоско / лёгкие тени карточек / выраженные тени модалок и поповеров.
8. Референсы (опц.): 1–3 продукта-ориентира.

Перед сборкой шкал задай ещё один вопрос — референс по плотности набора токенов:
- Linear / Notion — минимум: 3–4 neutral, 4 уровня типографики, 3 радиуса, компактный spacing;
- Stripe / Vercel — средне: 5–7 neutral, 5–6 уровней, 4–5 радиусов;
- Material / Google — богато: 9–11 neutral, 6+ уровней, 5–6 радиусов, elevation;
- Tailwind / shadcn defaults — стандартный набор;
- «минимум, ничего лишнего».

Это ориентиры; окончательный объём диктует стилистика и реальные потребности экранов.

## Формат DESIGN.md

YAML front-matter:

```yaml
---
name: <продукт>
colors:
  primary: "<hex>"
  on-primary: "<hex>"
  background: "<hex>"
  foreground: "<hex>"
typography:
  display-lg:
    fontFamily: <Font>
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
spacing:
  unit: 8px
  container-padding: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.DEFAULT}"
---
```

Markdown-разделы в каноничном порядке: `## Overview` · `## Colors` · `## Typography` · `## Layout` · `## Elevation & Depth` · `## Shapes` · `## Components` · `## Do's and Don'ts`.

## Что обязано быть (роли, не количество)

- **Surface roles:** `background`, `foreground`, `muted`, `muted-foreground`, `border`, `card`, `card-foreground`, `popover`, `popover-foreground`, `input`, `ring` — их ожидает shadcn.
- **Brand:** `primary` + `primary-foreground` (`on-primary`). Hover/active — отдельными токенами или `color-mix()`/opacity, по стилистике.
- **Semantic:** `success`, `warning`, `error`, `info` (+ `-foreground`) — только если в продукте есть такие состояния.
- **Тема:** выбрана тёмная или обе → пары light/dark для каждого цвета; только светлая → явно `dark mode: not supported`.
- **Типографика:** минимум `body` + один уровень заголовка.
- **Spacing:** base unit + именованная шкала.
- **Радиусы:** минимум `DEFAULT`.
- **Тени:** минимум одна при наличии card/popover/modal; flat-стиль → `elevation: flat`.
- **Z-index:** слои ровно под UI-organisms продукта (modal, popover, toast, dropdown).
- **Animation:** минимум одна `duration` + один `easing`; без переходов → `motion: none`.
- **Контраст:** пары текст/фон ≥ 4.5:1 (WCAG AA), крупный текст и UI-элементы ≥ 3:1.

DESIGN.md содержит всё, что понадобится экранам, — не больше и не меньше. Сочинять токены на лету при сборке экранов запрещено.

## Проверка

```bash
npx @google/design.md lint docs/DESIGN.md
```

Ошибки структуры (битые ссылки между токенами, порядок разделов) исправь молча.

## После выполнения

1. Покажи пользователю DESIGN.md целиком и вывод lint.
2. Покажи, **что покрывает** каждая категория: цвета (тема, brand, neutral — N ступеней, surface, semantic или «нет»), типографика (уровни), радиусы, spacing (unit + шкала), тени, z-index, анимации, component refs, lint: passed. Не покрывает нужный сценарий → добавь токены сейчас.
3. Итог по режиму: 1 — «перенос из Figma; при изменениях — повторный `get_variable_defs`»; 2 — «стилистика по макетам, правки — в DESIGN.md»; 3 — «стартовая точка, токены можно править».

## Правила

- DESIGN.md — контракт. Любая правка дизайна → сначала правка DESIGN.md.
- Никаких хексов вне DESIGN.md: каждый цвет в коде ссылается на токен.
- Цепочка всегда одна: `docs/DESIGN.md` → `src/shared/ui/` → экраны.
