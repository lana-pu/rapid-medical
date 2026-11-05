#!/usr/bin/env bash
# PreToolUse(Bash): блокирует опасные команды. Читает JSON из stdin (Claude Code API).
set -euo pipefail
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || echo "")
BLOCKED_PATTERNS=(
  'rm -[a-zA-Z]*[rR][a-zA-Z]* +(/|/\*|~|~/|~/\*|\$HOME|\$HOME/|\.\.|\.\./|\.\./\*)( |;|&|$)'
  'rm -[a-zA-Z]*[rR][a-zA-Z]* +/(var|etc|usr|home|Users|System|Library|bin|sbin|opt)/?( |;|&|$)'
  'git push (--force|-f)( .*)? (origin )?(main|master)( |$)'
  'git reset --hard.*origin/(main|master)'
  ':\(\)\{ :\|:& \};:'
  'mkfs\.|dd if=.*of=/dev/'
  'chmod -R 777 /( |$)'
)
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if printf '%s' "$CMD" | grep -qE "$pattern"; then
    echo "🔴 BLOCKED by hook: команда содержит опасный паттерн '$pattern'. Если действие действительно нужно — попроси пользователя выполнить руками." >&2
    exit 2
  fi
done
exit 0
