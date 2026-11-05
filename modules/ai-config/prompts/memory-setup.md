# Memory Setup — скелет и наполнение памяти проекта

Запускай в новом проекте (сразу после создания `projects/<slug>/`) или в существующем, где памяти нет / она по старой схеме / шаблоны не заполнены. Идемпотентно: существующее не перезаписывается, а дополняется.

Нужно на входе: папка проекта; желательно `docs/spec.md` (разделы «Продукт», «Платформа», «Что НЕ делаем») и список уже принятых архитектурных решений (из истории чата, коммитов, доков).

Устройство памяти — `ai-config/prompts/memory-system.md`.

## Шаг 1 — Скелет (если чего-то нет)

```
docs/memory/
├── state.md              ← шаблон ниже
├── project-context.md
├── INDEX.md              ← таблицы ADR / Findings / Sessions
├── decisions/
├── findings/
├── sessions/
├── feature-registry.md   ← (по ai-config/prompts/feature-registry.md)
└── infrastructure.md     ← где что развёрнуто (без значений секретов)
```

`state.md` (≤80 строк):

```markdown
# State — <продукт>

## Текущий шаг
<что делаем сейчас>

## Что сделано
- ...

## Активная работа
- ...

## Последние решения (до 5)
- ADR-XXX — ...

## Ключевые файлы
- docs/spec.md, docs/DESIGN.md, UI-кит: <путь>

## Доступы
<сервер, сервисы, какие переменные в .env — без значений>
```

`INDEX.md` (≤200 строк):

```markdown
# Memory Index — <продукт>

## Решения (ADR)
| ID | Название | Файл |
|---|---|---|

## Находки (Findings)
| ID | Название | Файл |
|---|---|---|

## Журнал сессий
| Дата | Задача | Файл |
|---|---|---|
```

**SessionStart-хук (Claude Code).** Если в `.claude/hooks/` (проекта или воркспейса) нет `session-start.sh` — создай лёгкий статус памяти: найти ближайший `docs/memory/` от `$CLAUDE_PROJECT_DIR` (или `projects/*/docs/memory/`), вывести наличие ✓/✗ для `state.md`, `INDEX.md`, `project-context.md`, число ADR в `decisions/`, текущий шаг из `state.md` (одна строка) — без `cat` целых файлов. Регистрация в `.claude/settings.json` (добавить, не затирать):

```json
"SessionStart": [
  { "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/session-start.sh\"" }] }
]
```

В Codex/Cursor без хуков — правило в `AGENTS.md`: «на старте сессии прочитай `docs/memory/state.md` и `docs/memory/INDEX.md`».

## Шаг 2 — `state.md`

Заменить плейсхолдеры: реальное название, текущий шаг, активная работа, реальные пути к `spec.md`, `DESIGN.md`, UI-киту. ≤80 строк.

## Шаг 3 — `project-context.md`

Из `docs/spec.md` («Продукт», «Платформа») — 2–3 предложения: что за продукт, для кого / какие роли, где открывают. Из «Что НЕ делаем» — список ограничений. Нет spec.md — спроси пользователя.

## Шаг 4 — ADR из уже принятых решений

По файлу на решение: `docs/memory/decisions/ADR-001-<slug>.md`, `ADR-002-<slug>.md`, …

```markdown
# ADR-001: <Название решения>

## Context
<Почему стоял вопрос>

## Decision
<Что выбрали>
IMPL: <путь к файлу-реализации>

## Alternatives Considered
- <вариант 1>: <почему отвергли>
- <вариант 2>: <почему отвергли>

## Consequences
<Что даёт и чего стоит>

## Status: Accepted
## Date: YYYY-MM-DD
```

Типичные: стек, ORM, деплой, архитектура UI (FSD, UI-кит), авторизация. Только реально обсуждавшиеся.

**IMPL-теги.** В `## Decision` — строки `IMPL: <путь>`: какой файл реализует решение (например `IMPL: prisma/schema.prisma`, `IMPL: src/shared/lib/db.ts`). Обязательно для ORM, деплоя, UI-кита; для выбора стека — можно `IMPL: next.config.ts` или пропустить. По IMPL проверяется, что решение отражено в коде.

**Обязательный процессный ADR «spec → test → код»** (следующим свободным номером):

```markdown
# ADR-NNN: Цепочка spec → test → код

## Context
Между сессиями AI теряет прошлую логику — без явной спеки генерирует похожее, но не
идентичное поведение, фичи незаметно дрейфуют.

## Decision
Любое изменение поведения — три шага по порядку:
1. Обновить spec (docs/screens/<screen>.md или docs/screens/_global.md).
2. Обновить тест-кейс (docs/test-cases.md) — новое поведение в Дано/Когда/Тогда.
3. Менять код.
Тесты black-box: через публичный интерфейс (HTTP API, UI), без импорта внутренностей.
IMPL: docs/screens
IMPL: docs/test-cases.md

## Alternatives Considered
- Менять только код: регрессии через 5–10 фич.
- White-box тесты: ломаются при рефакторинге, ложные срабатывания.

## Consequences
Регрессии ловятся, у AI есть «карта истины». Цена — больше шагов на простые правки.

## Status: Accepted
## Date: YYYY-MM-DD
```

## Шаг 5 — `INDEX.md`

На каждый ADR — строка: `| ADR-001 | <Название> | [ADR-001-<slug>.md](decisions/ADR-001-<slug>.md) |`.

## Шаг 6 — Миграция старой схемы

Есть `notes.md` / `architecture-decisions.md` и т.п. — разнести содержимое: решения → `decisions/`, находки → `findings/`, текущее → `state.md`; старые файлы удалить после переноса (история — в git).

## Шаг 7 — Проверка

```bash
find docs/memory -maxdepth 2 -type f | sort
bash .claude/hooks/session-start.sh   # или путь к хуку воркспейса
```

Хук показывает ✓ по файлам и ненулевое число ADR. Закоммить память (`docs/rules/commits.md`).
