# Хуки-guardrails для кода — блок опасных команд и записи секретов, снимок контекста, напоминания о security-check

Запускай при настройке нового проекта/воркспейса или когда хуков защиты ещё нет.

Результат: детерминированный слой защиты, который срабатывает всегда (правило в AGENTS.md можно «забыть» в длинной сессии, хук — нет):
- блокировка опасных shell-команд (`rm -rf /`, `git push --force` в main, `dd of=/dev/…`);
- блокировка записи секретов (`sk-…`, `ghp_…`, `AKIA…`, приватные ключи) в файлы кода;
- снимок состояния перед сжатием контекста и напоминание обновить `state.md` в длинной сессии;
- напоминания прогнать `/security-check` (не блокируют).

Общий механизм «как завести хук» — в `ai-config`; здесь — конкретные хуки, стерегущие код.

## Шаг 0 — Окружение

| Инструмент | Регистрация | Блокировка |
|---|---|---|
| Claude Code | `.claude/settings.json`, события `PreToolUse` / `PostToolUse` / `PreCompact`, matcher `Bash`, `Edit\|Write\|MultiEdit` | `exit 2`, причина в stderr уходит агенту |
| OpenAI Codex | `.codex/hooks.json` (или `[hooks]` в `.codex/config.toml`), те же имена событий; подтвердить через `/hooks` | `exit 2` или JSON `permissionDecision: "deny"` |
| Cursor 1.7+ | `.cursor/hooks.json`: `beforeShellExecution` (команды), `afterFileEdit`/`preToolUse` (запись) | `exit 2` или JSON `{"permission":"deny"}`; `"failClosed": true` — блок даже при падении хука |
| AI без хуков | текстовый fallback в `AGENTS.md` (в конце промта) | — |

Скрипты ниже читают JSON события из stdin (формат Claude Code; поля `.command` / `.file_path` для Cursor учтены). Для Codex/Cursor сверь имена полей в их документации и поправь jq-пути. Нужен `jq` (`brew install jq` / `apt install jq`).

Хуки кладутся в `.claude/` корня, который открыт в редакторе (корень воркспейса или проекта); пути в регистрации — через `$CLAUDE_PROJECT_DIR`.

## Шаг 1 — `.claude/hooks/pre-tool-use-bash.sh`

```bash
#!/usr/bin/env bash
# PreToolUse (Bash): блокирует опасные команды. exit 2 = блок.
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // .command // empty')
[ -z "$CMD" ] && exit 0

BLOCKED_PATTERNS=(
  'rm -rf /([[:space:]]|\*|$)'
  'rm -rf ~/?([[:space:]]|$)'
  'rm -rf \.\./?([[:space:]]|$)'
  'rm -rf /(var|etc|usr|home)/?([[:space:]]|$)'
  'git push.*(--force|[[:space:]]-f([[:space:]]|$)).*(main|master)'
  'git push.*(main|master).*(--force|[[:space:]]-f([[:space:]]|$))'
  'git reset --hard.*origin/(main|master)'
  ':\(\)[[:space:]]*\{.*:\|:&'
  'mkfs\.'
  'dd if=.*of=/dev/'
  'chmod -R 777 /([[:space:]]|$)'
  'chown -R .* /([[:space:]]|$)'
)

for p in "${BLOCKED_PATTERNS[@]}"; do
  if printf '%s' "$CMD" | grep -qE -- "$p"; then
    echo "BLOCKED by hook: опасный паттерн '$p'. Если действие действительно нужно — попроси пользователя выполнить вручную." >&2
    exit 2
  fi
done
exit 0
```

## Шаг 2 — `.claude/hooks/pre-tool-use-write.sh`

```bash
#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit): блокирует запись секретов. .env* (кроме .env.example) — законное место секретов.
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .file_path // empty')
case "$(basename "${FILE:-x}")" in .env.example) ;; .env|.env.*) exit 0 ;; esac
CONTENT=$(printf '%s' "$INPUT" | jq -r '[.tool_input.content, .tool_input.new_string, ((.tool_input.edits // [])[] | .new_string)] | map(select(. != null)) | join("\n")')
[ -z "$CONTENT" ] && exit 0

SECRET_PATTERNS=(
  '(^|[^A-Za-z0-9_])sk-([A-Za-z0-9]{20,}|(proj|ant|or)-[A-Za-z0-9_-]{20,})'
  'sk_(live|test)_[A-Za-z0-9]{24,}'
  'pk_live_[A-Za-z0-9]{24,}'
  'gh[pousr]_[A-Za-z0-9]{36}'
  'github_pat_[A-Za-z0-9_]{82}'
  '(AKIA|ASIA)[0-9A-Z]{16}'
  'glpat-[A-Za-z0-9_-]{20}'
  'xox[bp]-[0-9]+-[A-Za-z0-9-]+'
  'AIzaSy[A-Za-z0-9_-]{33}'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
)

for p in "${SECRET_PATTERNS[@]}"; do
  if printf '%s' "$CONTENT" | grep -qE -- "$p"; then
    echo "BLOCKED by hook: попытка записать секрет (паттерн '$p') в $FILE. Секреты — в .env.local / .env.production, в коде — process.env.X; в примерах — плейсхолдер, не реальный ключ." >&2
    exit 2
  fi
done
exit 0
```

`chmod +x` оба скрипта.

## Шаг 3 — Регистрация (`.claude/settings.json`)

Добавь к существующей структуре `hooks`, ничего не удаляя (если уже есть `SessionStart` и др. — оставить):

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/pre-tool-use-bash.sh\"" }] },
      { "matcher": "Edit|Write|MultiEdit", "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/pre-tool-use-write.sh\"" }] }
    ]
  }
}
```

## Шаг 4 — Тест

Тест-кейсы клади в файл (через запись файла), а не в текст shell-команды — иначе уже установленный хук заблокирует саму тестовую команду.

`.claude/hooks/test/bash-cases.txt` — по команде на строку: `rm -rf /tmp/non-existent-dir-test` (ожидается 0), `rm -rf ..` (2), `git push --force origin main` (2), `git push -u origin main` (0), `rm -rf /var/www/app/node_modules` (0).

`.claude/hooks/test/run.sh`:

```bash
#!/usr/bin/env bash
cd "$(dirname "$0")/.."
while IFS= read -r c; do
  jq -n --arg c "$c" '{tool_input:{command:$c}}' | bash ./pre-tool-use-bash.sh 2>/dev/null; echo "$? :: $c"
done < test/bash-cases.txt
P=sk-   # ключ собирается из частей, чтобы сам тест не содержал секрет-подобной строки
jq -n --arg c "const key = \"${P}thisIsLongEnoughToTrigger12345678\";" '{tool_input:{file_path:"src/test.ts",content:$c}}' \
  | bash ./pre-tool-use-write.sh 2>/dev/null; echo "$? :: write secret (ожидается 2)"
jq -n '{tool_input:{file_path:"src/test.ts",content:"const key = process.env.KEY;"}}' \
  | bash ./pre-tool-use-write.sh 2>/dev/null; echo "$? :: write clean (ожидается 0)"
```

Затем живая проверка: попроси AI записать строку с фейковым ключом в `src/test.ts` — запись должна быть заблокирована. Покажи вывод.

## Шаг 5 — Снимок перед сжатием контекста и напоминание о длинной сессии (Claude Code)

`.claude/hooks/pre-compact-snapshot.sh` (событие `PreCompact`):

```bash
#!/usr/bin/env bash
# Снимок состояния активного проекта перед сжатием контекста. Хранит последние 10.
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"; cd "$ROOT" || exit 0
STATE_FILE=$(find . -maxdepth 5 -path '*/docs/memory/state.md' -not -path '*/node_modules/*' 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
MEM_DIR=$(dirname "${STATE_FILE:-./docs/memory/state.md}")
PROJ_DIR=$(cd "$MEM_DIR/../.." 2>/dev/null && pwd || pwd)
SNAP_DIR="$MEM_DIR/snapshots"; mkdir -p "$SNAP_DIR"
TS=$(date +%Y%m%d-%H%M%S)
jq -n --arg ts "$TS" \
  --arg branch "$(git -C "$PROJ_DIR" branch --show-current 2>/dev/null)" \
  --arg state_file "$STATE_FILE" \
  --arg state "$(head -c 8000 "$STATE_FILE" 2>/dev/null)" \
  --arg git_log "$(git -C "$PROJ_DIR" log --oneline -10 2>/dev/null)" \
  --arg dirty "$(git -C "$PROJ_DIR" status --short 2>/dev/null)" \
  '{timestamp:$ts, branch:$branch, state_file:$state_file, state_content:$state, git_log:$git_log, dirty_files:$dirty}' \
  > "$SNAP_DIR/$TS.json"
ls -t "$SNAP_DIR"/*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
exit 0
```

`.claude/hooks/context-alert.sh` (событие `PostToolUse`, matcher `Edit|Write|MultiEdit|Bash`):

```bash
#!/usr/bin/env bash
# Счётчик вызовов инструментов за сессию; после 40 и далее каждые 20 — напоминание обновить state.md.
INPUT=$(cat)
SID=$(printf '%s' "$INPUT" | jq -r '.session_id // "default"')
CNT="${TMPDIR:-/tmp}/claude-call-count-$SID"
N=$(( $(cat "$CNT" 2>/dev/null || echo 0) + 1 )); echo "$N" > "$CNT"
T=40
if [ "$N" -ge "$T" ] && [ $(( (N - T) % 20 )) -eq 0 ]; then
  M="Сессия длинная ($N вызовов инструментов). Обнови docs/memory/state.md: что сделано, что осталось."
  jq -n --arg m "$M" '{systemMessage:$m, hookSpecificOutput:{hookEventName:"PostToolUse", additionalContext:$m}}'
fi
exit 0
```

Регистрация (добавить к существующим):

```json
"PreCompact":  [ { "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact-snapshot.sh\"" }] } ],
"PostToolUse": [ { "matcher": "Edit|Write|MultiEdit|Bash", "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/context-alert.sh\"" }] } ]
```

В `.gitignore` проекта: `docs/memory/snapshots/`. Проверка: `/compact` → появился `docs/memory/snapshots/<timestamp>.json`, `jq . <файл>` читается.

## Шаг 6 — Напоминания о `/security-check` (не блокируют)

Блокирующие хуки ловят катастрофу по шаблону; логические дыры (IDOR, обход прав, инъекции) находит только аудит `development/prompts/security-check.md`. Эти хуки напоминают о нём.

`.claude/scripts/security-check-mark.sh` — маркер «аудит прогнан» (вызывается в конце `/security-check`, глушит напоминания на 10 минут):

```bash
#!/usr/bin/env bash
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
mkdir -p "$ROOT/.claude/.cache" && date +%s > "$ROOT/.claude/.cache/security-check-mark"
```

`.claude/hooks/pre-tool-use-security-reminder.sh` (`PreToolUse`, matcher `Bash`) — перед `git commit`/`push` с security-relevant файлами:

```bash
#!/usr/bin/env bash
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // .command // empty')
printf '%s' "$CMD" | grep -qE 'git (commit|push)' || exit 0
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"; MARK="$ROOT/.claude/.cache/security-check-mark"
[ -f "$MARK" ] && [ $(( $(date +%s) - $(cat "$MARK" 2>/dev/null || echo 0) )) -lt 600 ] && exit 0
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty'); [ -n "$CWD" ] && cd "$CWD"
if git diff --cached --name-only 2>/dev/null | grep -qE '\.(ts|tsx|js|py|prisma|sql|sh)$|(^|/)\.env'; then
  jq -n '{systemMessage:"🟡 В коммит идут security-relevant правки, а /security-check давно не прогоняли — прогони его по diff."}'
fi
exit 0
```

`.claude/hooks/post-tool-use-security-counter.sh` (`PostToolUse`, matcher `Edit|Write|MultiEdit`) — после 5 правок в чувствительных местах:

```bash
#!/usr/bin/env bash
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .file_path // empty')
printf '%s' "$FILE" | grep -qE 'src/app/|pages/api/|src/(middleware|proxy)\.|prisma/schema\.prisma|(^|/)\.env' || exit 0
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"; MARK="$ROOT/.claude/.cache/security-check-mark"
[ -f "$MARK" ] && [ $(( $(date +%s) - $(cat "$MARK" 2>/dev/null || echo 0) )) -lt 600 ] && exit 0
mkdir -p "$ROOT/.claude/.cache"; CNT="$ROOT/.claude/.cache/security-edit-count"
N=$(( $(cat "$CNT" 2>/dev/null || echo 0) + 1 )); echo "$N" > "$CNT"
if [ "$N" -ge 5 ]; then
  echo 0 > "$CNT"
  M="Накопилось $N правок в security-relevant местах без /security-check — прогони его, не дожидаясь коммита."
  jq -n --arg m "$M" '{systemMessage:$m, hookSpecificOutput:{hookEventName:"PostToolUse", additionalContext:$m}}'
fi
exit 0
```

Регистрация рядом с существующими (не вместо): Claude Code — `PreToolUse` `Bash` → reminder, `PostToolUse` `Edit|Write|MultiEdit` → counter; Codex — `.codex/hooks.json`; Cursor — `beforeShellExecution` / `afterFileEdit`; без хуков — правило в `AGENTS.md`: «после ≥ 5 security-relevant правок или перед коммитом — прогони /security-check». В `.gitignore`: `.claude/.cache/`.

## Шаг 7 — Секрет-сканер на уровне git (работает при любом AI)

Если установлен `gitleaks` — добавь в pre-commit проекта (`scripts/hooks/pre-commit`, см. `development/prompts/git-github-setup.md`) сканирование staged-изменений: `gitleaks git --staged --redact` (в версиях до 8.19 — `gitleaks protect --staged --redact`). Найден секрет → коммит блокируется.

## Шаг 8 — Документация хуков

`docs/rules/hooks-guardrails.md` (или `rules/hooks-guardrails.md` воркспейса, если хуки общие):

```markdown
# Хуки — детерминированная защита

Хук — shell-скрипт, который система агента выполняет в ключевых точках (PreToolUse, PostToolUse, PreCompact, SessionStart) всегда, независимо от того, помнит ли AI правило.

## Текущие хуки
- pre-tool-use-bash.sh — PreToolUse(Bash): блок опасных команд (exit 2).
- pre-tool-use-write.sh — PreToolUse(Edit|Write|MultiEdit): блок записи секретов вне .env*.
- pre-compact-snapshot.sh — PreCompact: снимок state.md, git log, dirty-файлов, ветки → docs/memory/snapshots/ (последние 10, в .gitignore).
- context-alert.sh — PostToolUse: после 40 вызовов и каждые 20 — напоминание обновить state.md (прокси длины сессии, не токены).
- pre-tool-use-security-reminder.sh — PreToolUse(Bash): перед commit/push с security-relevant файлами — напоминание о /security-check. Не блокирует.
- post-tool-use-security-counter.sh — PostToolUse(Edit|Write|MultiEdit): после 5 правок в src/app, pages/api, proxy/middleware, prisma/schema, .env — напоминание. Маркер .claude/.cache/security-check-mark глушит на 10 минут.

## Ложное срабатывание
Нужно записать похожую на ключ строку (документация) — плейсхолдер короче шаблона или исключение в паттерне с последующим восстановлением. Не отключать хуки и не коммитить с --no-verify.
```

## После выполнения

Покажи: `tree .claude/hooks/ .claude/scripts/`, блок `hooks` из `.claude/settings.json`, результаты тестов Шага 4.

## Edge cases

- Синтаксическая ошибка в хуке → `bash -n .claude/hooks/<file>.sh`.
- Слишком жёсткие паттерны → ложные срабатывания → люди начинают обходить; расширяй осторожно.
- Codex дополнительно: `approval_policy` с обязательным подтверждением для `rm`, `git push --force`, `sudo`.

## Fallback для AI без хуков — секция в `AGENTS.md`

```markdown
## Hard rules — никогда не нарушай

### Запрещённые команды
Не выполняй и не предлагай: `rm -rf /`, `rm -rf ~`; `git push --force` / `-f` в `main`/`master`; `git reset --hard origin/main` без явного подтверждения; `sudo` без понятной причины. Если пользователь явно просит — переспроси «Это деструктивно и необратимо, уверен?» и продолжай только после повторного подтверждения.

### Запрещённая запись секретов
Не записывай в файлы значения вида `sk-…` (20+ символов), `sk_live_`/`pk_live_`, `ghp_`/`gho_`/`github_pat_`, `glpat-`, `AKIA…`, `xoxb-`/`xoxp-`, `AIzaSy…`, `-----BEGIN … PRIVATE KEY-----`. Встретилось — попроси положить значение в `.env*` (права 600), в коде — `process.env.X`.

### .env
Не редактируй `.env`, `.env.local`, `.env.production` без явного подтверждения пользователя.
```

Это слабее хуков (правило можно пропустить в шуме длинной сессии), поэтому критичное продублируй на уровне git: pre-commit со спека-гейтом и секрет-сканером срабатывает при любом коммите.
