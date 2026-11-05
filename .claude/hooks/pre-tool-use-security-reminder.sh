#!/usr/bin/env bash
# PreToolUse(Bash): перед git commit/push напоминает про /security-check. Не блокирует.
set -euo pipefail
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || echo "")
printf '%s' "$CMD" | grep -qE 'git (commit|push)' || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}"
MARK=".claude/.cache/security-check-mark"
if [ -f "$MARK" ]; then
  AGE=$(( $(date +%s) - $(cat "$MARK" 2>/dev/null || echo 0) ))
  [ "$AGE" -lt 600 ] && exit 0
fi
FILES=$(git diff --cached --name-only 2>/dev/null || true)
if echo "$FILES" | grep -qE '\.(ts|tsx|py|prisma|sql|env|sh)$'; then
  echo "🟡 В коммит идут security-relevant правки, а /security-check давно не прогоняли. Прогони /security-check по diff." >&2
fi
exit 0
