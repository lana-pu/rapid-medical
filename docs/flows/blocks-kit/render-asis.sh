#!/bin/sh
# Snapshot of the screens "as is" (site-pages: ids with "asis") drawn by the code before the redesign → ../rm-render-asis.json.
#   docs/flows/blocks-kit/render-asis.sh
# History does not change: run it only when the "as is" screens change. It checks out that code next to the project
# (git worktree, removed at the end), gives its BlockList the same `slot` hook as today's, starts its dev server on
# port 3141 and snapshots through it. Then ./render.sh (or make-pack.py) puts it into pack.js.
set -e
BASE=99932794   # main on 2026-11-15, the last commit before the site-redesign branch (merged as PR #2)
PORT=3141
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
OLD="$ROOT/../$(basename "$ROOT")-asis"
LOG="$OLD.dev.log"
cleanup() {
  [ -n "$PID" ] && kill "$PID" 2>/dev/null || true
  pkill -f "$OLD/node_modules/.bin/next" 2>/dev/null || true
  git -C "$ROOT" worktree remove --force "$OLD" 2>/dev/null || true
  rm -f "$LOG"
}
trap cleanup EXIT
[ -d "$OLD" ] || git -C "$ROOT" worktree add --detach "$OLD" "$BASE" >/dev/null
python3 - "$OLD/src/blocks/render.tsx" <<'PY'
import sys; p = sys.argv[1]; s = open(p).read()
if 'slot?' not in s:
    s = s.replace("export async function BlockList({ blocks: all }: { blocks: Block[] }) {",
                  "export async function BlockList({ blocks: all, slot }: { blocks: Block[]; slot?: (i: number, node: ReactNode) => ReactNode }) {", 1)
    s = s.replace("      <Mark i={i} uid={b.uid} info={b.uid ? info(b, b.uid) : undefined} />\n      {node}",
                  "      <Mark i={i} uid={b.uid} info={b.uid ? info(b, b.uid) : undefined} />\n      {slot ? slot(i, node) : node}", 1)
    assert 'slot ? slot(i, node)' in s, 'BlockList of the old code changed: patch render.tsx by hand'
    open(p, 'w').write(s)
PY
# Turbopack refuses a symlinked node_modules; an APFS clone of today's is instant (the old code runs on it)
[ -d "$OLD/node_modules" ] || cp -cR "$ROOT/node_modules" "$OLD/node_modules"
cp "$ROOT/.env" "$OLD/.env"
(cd "$OLD" && exec npx next dev -p $PORT >"$LOG" 2>&1) & PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null --max-time 5 "http://localhost:$PORT/" && break; sleep 2; done
node "$HERE/render.cjs" "http://localhost:$PORT" --asis --root "$OLD"
python3 "$HERE/make-pack.py"
