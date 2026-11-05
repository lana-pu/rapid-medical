#!/usr/bin/env bash
# PostToolUse: счётчик длины сессии, напоминание обновить state.md. Счётчик — свой на каждый проект.
KEY=$(printf '%s' "${CLAUDE_PROJECT_DIR:-$PWD}" | cksum | cut -d' ' -f1)
COUNTER_FILE="/tmp/claude-session-call-count-$KEY"
THRESHOLD=40
COUNT=0
[ -f "$COUNTER_FILE" ] && COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
COUNT=$((COUNT + 1)); echo "$COUNT" > "$COUNTER_FILE"
if [ "$COUNT" -eq "$THRESHOLD" ] || { [ "$COUNT" -gt "$THRESHOLD" ] && [ $(( (COUNT - THRESHOLD) % 20 )) -eq 0 ]; }; then
  echo "⏱️  Сессия длинная ($COUNT инструментов). Обнови docs/memory/state.md — что сделано, что осталось." >&2
fi
exit 0
