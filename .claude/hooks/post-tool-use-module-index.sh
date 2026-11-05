#!/usr/bin/env bash
# PostToolUse(Edit|Write): новый/правленый промт в modules/ не упомянут в AGENTS.md модуля → предупредить. Не блокирует.
set -euo pipefail
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null || echo "")
[[ "$FILE" =~ /modules/([^/]+)/(prompts|rules)/([^/]+\.md)$ ]] || exit 0
MOD="${BASH_REMATCH[1]}"; NAME="${BASH_REMATCH[3]}"
ROOT="${FILE%%/modules/*}"
IDX="$ROOT/modules/$MOD/AGENTS.md"
grep -qF "$NAME" "$IDX" 2>/dev/null && exit 0
echo "🟡 $NAME не упомянут в modules/$MOD/AGENTS.md — добавь строку «Триггер → Файл», иначе промт «слепой» (rules/module-indexation.md)." >&2
exit 0
