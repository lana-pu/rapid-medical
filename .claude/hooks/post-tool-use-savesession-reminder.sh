#!/usr/bin/env bash
# PostToolUse(Bash): git push прошёл → напомнить запустить /save-session. Не блокирует.
set -euo pipefail
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || echo "")
printf '%s' "$CMD" | grep -qE 'git push' || exit 0
echo "🟡 push прошёл — запусти /save-session (или обнови docs/memory/sessions/ + state.md)." >&2
exit 0
