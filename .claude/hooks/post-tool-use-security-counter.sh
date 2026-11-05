#!/usr/bin/env bash
# PostToolUse(Edit|Write): считает правки в чувствительных местах. JSON из stdin.
set -euo pipefail
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null || echo "")
echo "$FILE" | grep -qE 'src/app/|pages/api/|/api/|src/middleware|src/proxy\.ts|auth|schema\.(prisma|ts)|drizzle/|\.env' || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}"
MARK=".claude/.cache/security-check-mark"
if [ -f "$MARK" ]; then
  AGE=$(( $(date +%s) - $(cat "$MARK" 2>/dev/null || echo 0) ))
  [ "$AGE" -lt 600 ] && exit 0
fi
mkdir -p .claude/.cache
CNT=".claude/.cache/security-edit-count"
N=$(( $(cat "$CNT" 2>/dev/null || echo 0) + 1 )); echo "$N" > "$CNT"
if [ "$N" -ge 5 ]; then
  echo "🟡 Накопилось $N правок в security-relevant местах без /security-check. Прогони /security-check." >&2
  echo 0 > "$CNT"
fi
exit 0
