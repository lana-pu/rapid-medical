#!/usr/bin/env bash
# PostToolUse(Edit|Write): правка инфры → напомнить обновить docs/memory/infrastructure.md. Не блокирует.
set -euo pipefail
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null || echo "")
echo "$FILE" | grep -qE 'docker-compose|nginx|\.env|deploy[^/]*\.sh|Dockerfile|vercel\.json|\.github/workflows/' || exit 0
echo "🟡 Инфра изменилась ($FILE) — обнови docs/memory/infrastructure.md в этом же шаге." >&2
exit 0
