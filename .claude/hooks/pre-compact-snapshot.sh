#!/usr/bin/env bash
# PreCompact: снимок состояния проекта перед компрессией контекста.
cd "${CLAUDE_PROJECT_DIR:-.}"
SNAPSHOT_DIR="docs/memory/snapshots"
mkdir -p "$SNAPSHOT_DIR"
TS=$(date +%Y%m%d-%H%M%S)
OUT="$SNAPSHOT_DIR/$TS.json"
STATE_FILE="docs/memory/state.md"
STATE_CONTENT='""'
[ -f "$STATE_FILE" ] && STATE_CONTENT=$(head -c 8000 "$STATE_FILE" | python3 -c 'import sys,json;print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo '""')
GIT_LOG=$(git log --oneline -10 2>/dev/null | tr '\n' '|')
DIRTY=$(git status --short 2>/dev/null | tr '\n' '|')
BRANCH=$(git branch --show-current 2>/dev/null || echo unknown)
cat > "$OUT" <<JSON
{ "timestamp": "$TS", "branch": "$BRANCH", "git_log": "$GIT_LOG", "dirty_files": "$DIRTY", "state_content": $STATE_CONTENT }
JSON
echo "📸 Снимок: $OUT" >&2
ls -t "$SNAPSHOT_DIR"/*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
exit 0
