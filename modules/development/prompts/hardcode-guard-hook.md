# Хук против хардкода (стили + данные) и подсказка ADR при чтении

Запускай, чтобы детерминированно ловить хардкод стилей (хексы/пиксели мимо DESIGN.md) и данных (инлайн-моки вместо БД через `entities/api`) после каждой правки UI-файла.

Нужно на входе: проект с UI-кодом (FSD: `app/`, `pages/`, `widgets/`, `features/`) и токенами в `docs/DESIGN.md`. Для хуков — Claude Code (`.claude/settings.json`).

## Окружение

| Инструмент | Что делать |
|---|---|
| **Claude Code** | Полный workflow ниже: скрипт в `.claude/hooks/`, регистрация в `.claude/settings.json` |
| **Codex / Cursor / без hooks** | Добавь в `AGENTS.md` (секция «UI-правила»): «После каждой записи `.tsx`/`.jsx` в `app/`/`widgets/`/`features/`/`pages/` — прогони grep на хардкод стилей (`#[0-9a-fA-F]{3,8}`, `\[[0-9]+px\]`) и данных (`const (mock\|dummy\|fake\|sample\|fixture)\w*`, инлайн `= [ {`). Найдено — warning, не блокируй. Продуктовые данные — из БД через `entities/api`, статику можно оставить». |

Хуки — в `.claude/` проекта или воркспейса (где лежит `settings.json`, которым запускается сессия). Claude Code передаёт хуку JSON на stdin (`tool_input.file_path`); путь к скрипту — через `$CLAUDE_PROJECT_DIR`.

## Промт (Claude Code)

```
Поставь PostToolUse-хук: после каждой правки UI-файла — автоматический grep на хардкод
стилей и данных. Найдено — warning, без блокировки.

ШАГ 1 — Создай .claude/hooks/post-tool-use-edit.sh:

#!/usr/bin/env bash
set -uo pipefail

# Путь к файлу: из JSON на stdin (Claude Code), fallback — первый аргумент
INPUT="$(cat 2>/dev/null || true)"
FILEPATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$FILEPATH" ] && FILEPATH="${1:-}"
[ -n "$FILEPATH" ] && [ -f "$FILEPATH" ] || exit 0

STYLE_RE='#[0-9a-fA-F]{3,8}\b|\[[0-9]+px\]'
DATA_RE='const +(mock|dummy|fake|sample|fixture|placeholder)[A-Za-z0-9_]*|=[[:space:]]*\[[[:space:]]*\{'
FOUND=0

# Только UI-файлы (entities/ не входит — там данным место)
case "$FILEPATH" in
  *src/app/*|*src/pages/*|*src/widgets/*|*src/features/*|*src/views/*)
    if grep -qE "$STYLE_RE" "$FILEPATH"; then
      FOUND=1
      {
        echo ""
        echo "⚠️  POST-HOOK: хардкод стилей в $FILEPATH (хексы/пиксели в обход токенов DESIGN.md)"
        grep -nE "$STYLE_RE" "$FILEPATH" | head -10
        echo "   Правило ui-components-first: токены из DESIGN.md или variant в shared/ui."
      } >&2
    fi
    if grep -qE "$DATA_RE" "$FILEPATH"; then
      FOUND=1
      {
        echo ""
        echo "⚠️  POST-HOOK: похоже на захардкоженные данные в $FILEPATH"
        grep -nE "$DATA_RE" "$FILEPATH" | head -10
        echo "   Продуктовые данные — из БД через entities/<entity>/api/, не в компоненте."
        echo "   (Статику — навигацию, опции селекта, тексты — оставлять можно, это эвристика.)"
      } >&2
    fi
    ;;
esac
# PostToolUse: exit 2 показывает stderr модели (правка уже применена, не блокирует)
[ "$FOUND" = 1 ] && exit 2
exit 0

chmod +x .claude/hooks/post-tool-use-edit.sh

ШАГ 2 — Зарегистрируй в .claude/settings.json: ДОБАВЬ в массив PostToolUse рядом с
существующими хуками, ничего не затирая:

{ "matcher": "Edit|Write|MultiEdit",
  "hooks": [{ "type": "command",
              "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-edit.sh\"" }] }

Схема вложенная (matcher + hooks[] с type: "command"), путь через $CLAUDE_PROJECT_DIR —
плоский вариант Claude Code молча игнорирует.

ШАГ 3 — Тест: временно впиши в любой UI-файл (например widgets/header/ui/Header.tsx)
`<div className="bg-[#FF0000]">test</div>` → хук печатает warning → откати правку.

ШАГ 4 — Добавь в docs/rules/hooks-guardrails.md раздел:

### .claude/hooks/post-tool-use-edit.sh
После каждой правки файла в src/app/, src/pages/, src/widgets/, src/features/ —
grep на (1) хардкод стилей: хексы (#abc) и пиксели ([16px]); (2) хардкод данных:
mock/dummy/fixture-переменные и инлайн-массивы объектов (= [ {), которым место в БД
через entities/api. Найдено — warning, не блокировка (PostToolUse не откатывает).
Проверка данных эвристическая: статику можно оставлять. Второй слой после правил
ui-components-first и «данные из БД через entities/api».

ПОКАЖИ МНЕ:
- содержимое .claude/hooks/post-tool-use-edit.sh;
- .claude/settings.json с PostToolUse;
- warning на тестовой правке.
```

## Дополнительно: подсказка ADR при чтении файла

```
Добавь хук .claude/hooks/pre-read-suggest.sh — при чтении файла из src/ или docs/
ищет в docs/memory/INDEX.md проекта решения по ключевым словам из имени файла:

#!/usr/bin/env bash
INPUT="$(cat 2>/dev/null || true)"
FILEPATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"
[ -z "$FILEPATH" ] && FILEPATH="${1:-}"

case "$FILEPATH" in
  *src/*|*docs/*) : ;;
  *) exit 0 ;;
esac

# INDEX.md ближайшего проекта: поднимаемся от файла вверх
DIR="$(dirname "$FILEPATH")"; INDEX=""
while [ "$DIR" != "/" ] && [ -n "$DIR" ]; do
  [ -f "$DIR/docs/memory/INDEX.md" ] && { INDEX="$DIR/docs/memory/INDEX.md"; break; }
  DIR="$(dirname "$DIR")"
done
[ -n "$INDEX" ] || exit 0

BASENAME=$(basename "$FILEPATH" | sed 's/\.[^.]*$//' | tr '[:upper:]' '[:lower:]' | tr '-_' '  ')
MATCHES=""
for KEYWORD in $BASENAME; do
  [ ${#KEYWORD} -lt 4 ] && continue
  FOUND=$(grep -i "$KEYWORD" "$INDEX" 2>/dev/null | head -3)
  [ -n "$FOUND" ] && MATCHES="$MATCHES$FOUND"$'\n'
done

[ -n "$MATCHES" ] && printf '💡 Возможно релевантные решения из памяти для %s:\n%s' "$FILEPATH" "$MATCHES" >&2
exit 0

chmod +x .claude/hooks/pre-read-suggest.sh

Регистрация в .claude/settings.json, массив PreToolUse (добавить, не затирать):
{ "matcher": "Read", "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/pre-read-suggest.sh\"" }] }

Тест: прочитай файл авторизации (например src/shared/lib/auth.ts) — если в INDEX.md
есть ADR про авторизацию, хук выводит подсказку.
```

## Другие хуки на том же механизме

Хуки одного события выполняются вместе — добавляй в массив, не перезатирая:

- **Безопасность** (PostToolUse): правка `**/auth*`, `**/middleware*`, `**/proxy*`, `**/api/**`, миграций → «затронута security-зона, прогони `/security-check` перед коммитом»; grep на логирование секретов, `dangerouslySetInnerHTML`, отключённые проверки eslint, `process.env` с приватным ключом в клиентском файле.
- **Опасные команды и секреты** (PreToolUse, блокирующие): `pre-tool-use-bash.sh` режет `rm -rf` и подобное; `pre-tool-use-write.sh` не даёт записать реальный `.env`/ключ.
- **Доступность / UI-инварианты** (PostToolUse): кликабельные `<div>` без `cursor: pointer`/hover, `<img>` без `alt`.
- **Тест-гейт**: pre-push хук гоняет `test:all` и блокирует push при красных тестах (`development/prompts/test-cases.md`).
- **Гигиена процессов** (PreToolUse(Bash), блокирующий): перед стартом dev-сервера (`next dev`, `npm run dev`, `vite`) — освободить фиксированный порт (app `:3000`, лендинг `:3001`); браузер-скрипт с `chromium.launch`/`.launch(` без `finally` + `browser.close()` + таймаута — заблокировать с подсказкой. Плюс npm-скрипты `dev` (kill-first перед `next dev`) и `dev:stop` (глушит `:3000` и `:3001`). Правило — `docs/rules/process-hygiene.md`.

**Рецепт «добавь свой хук»:** опиши событие (`PreToolUse`/`PostToolUse` + matcher, например `Edit|Write`), что проверять (grep-паттерн или условие по пути) и реакцию (warning в stderr / `exit 2` для блокировки в PreToolUse) — AI создаст скрипт в `.claude/hooks/`, зарегистрирует в `.claude/settings.json` и допишет `docs/rules/hooks-guardrails.md`. PreToolUse — когда действие нужно **запретить** (опасная команда, секрет); PostToolUse — когда достаточно **предупредить** (хардкод, security-зона, a11y).

## Edge cases

- Структура без `src/` (например `app/` в корне) — поправь паттерны в `case`.
- Правка не-UI файла (например `prisma/schema.prisma`) — хук ничего не делает.
- PostToolUse не блокирует правку; блокировка — только PreToolUse.
- `pre-read-suggest.sh` эвристический — лишняя подсказка лучше пропущенного ADR.
- Нужен `jq`; без него хук использует fallback `$1`.
