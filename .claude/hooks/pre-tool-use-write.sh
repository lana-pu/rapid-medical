#!/usr/bin/env bash
# PreToolUse(Edit|Write): блокирует запись секретов в код. JSON из stdin.
set -euo pipefail
INPUT=$(cat)
CONTENT=$(printf '%s' "$INPUT" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("tool_input",{});print((d.get("content") or "")+"\n"+(d.get("new_string") or ""))' 2>/dev/null || echo "")
SECRET_PATTERNS=(
  'sk-[A-Za-z0-9]{20,}'
  'sk_live_[A-Za-z0-9]{24,}'
  'pk_live_[A-Za-z0-9]{24,}'
  'ghp_[A-Za-z0-9]{36}'
  'gho_[A-Za-z0-9]{36}'
  'github_pat_[A-Za-z0-9_]{82}'
  'AKIA[0-9A-Z]{16}'
  'glpat-[A-Za-z0-9_-]{20}'
  'xox[bp]-[0-9]+-[A-Za-z0-9]+'
  'AIzaSy[A-Za-z0-9_-]{33}'
)
for pattern in "${SECRET_PATTERNS[@]}"; do
  if printf '%s' "$CONTENT" | grep -qE "$pattern"; then
    echo "🔴 BLOCKED by hook: попытка записать секрет (паттерн '$pattern'). Секреты живут в .env.local/.env.production, не в коде." >&2
    exit 2
  fi
done
exit 0
