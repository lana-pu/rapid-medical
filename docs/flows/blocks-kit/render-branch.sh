#!/bin/sh
# Snapshot of the nodes marked "branch" (pages written in a branch not yet in main: Home and the therapy page in
# therapy-home, waiting for Emily) drawn by that branch's code → ../rm-render-branch.json.
#   docs/flows/blocks-kit/render-branch.sh [branch, default therapy-home]
# Nothing of main or of the branch's own folder is touched: the branch's last commit is checked out next to the project
# (git worktree), its migrations run on a copy of this project's database (<db>_wf_branch), its dev server runs on port
# 3142; the worktree, the server and the copy are removed at the end. Re-run when the branch moves.
set -e
BRANCH=${1:-therapy-home}
PORT=3142
PG=/Applications/Postgres.app/Contents/Versions/latest/bin
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
OLD="$ROOT/../$(basename "$ROOT")-branch"
LOG="$OLD.dev.log"
DBURL=$(grep '^DATABASE_URL=' "$ROOT/.env" | cut -d= -f2-)
DB=${DBURL##*/}
COPY="${DB}_wf_branch"
SERVER=${DBURL%/*}
cleanup() {
  [ -n "$PID" ] && kill "$PID" 2>/dev/null || true
  pkill -f "$OLD/node_modules/.bin/next" 2>/dev/null || true
  git -C "$ROOT" worktree remove --force "$OLD" 2>/dev/null || true
  "$PG/dropdb" --if-exists --maintenance-db="$SERVER/postgres" "$COPY" 2>/dev/null || true
  [ -n "$KEEP_LOG" ] || rm -f "$LOG"
}
trap cleanup EXIT

COMMIT=$(git -C "$ROOT" rev-parse --short "$BRANCH")
echo "branch $BRANCH @ $COMMIT"
# the database: a copy of this project's, then the branch's migrations — the state a merge would bring
"$PG/dropdb" --if-exists --maintenance-db="$SERVER/postgres" "$COPY"
"$PG/createdb" --maintenance-db="$SERVER/postgres" "$COPY"
"$PG/pg_dump" --no-owner --no-privileges "$DBURL" | "$PG/psql" -q -v ON_ERROR_STOP=1 "$SERVER/$COPY" >/dev/null

[ -d "$OLD" ] || git -C "$ROOT" worktree add --detach "$OLD" "$COMMIT" >/dev/null
python3 - "$OLD/src/blocks/render.tsx" <<'PY'
import sys; p = sys.argv[1]; s = open(p).read()
if 'slot?' not in s:
    s = s.replace("export async function BlockList({ blocks: all }: { blocks: Block[] }) {",
                  "export async function BlockList({ blocks: all, slot }: { blocks: Block[]; slot?: (i: number, node: ReactNode) => ReactNode }) {", 1)
    s = s.replace("      <Mark i={i} uid={b.uid} info={b.uid ? info(b, b.uid) : undefined} />\n      {node}",
                  "      <Mark i={i} uid={b.uid} info={b.uid ? info(b, b.uid) : undefined} />\n      {slot ? slot(i, node) : node}", 1)
    assert 'slot ? slot(i, node)' in s, 'BlockList of the branch changed: patch render.tsx by hand'
    open(p, 'w').write(s)
PY
[ -f "$OLD/src/components/site/chrome.ts" ] || cp "$ROOT/src/components/site/chrome.ts" "$OLD/src/components/site/chrome.ts"
# Turbopack refuses a symlinked node_modules; an APFS clone of today's is instant (same package.json)
[ -d "$OLD/node_modules" ] || cp -cR "$ROOT/node_modules" "$OLD/node_modules"
sed "s#^DATABASE_URL=.*#DATABASE_URL=$SERVER/$COPY#" "$ROOT/.env" > "$OLD/.env"
# the build's data steps (scripts/bootstrap.ts): migrations, then page layouts — e.g. homeLayout2026 rearranges Home
(cd "$OLD" && npx tsx --env-file=.env scripts/bootstrap.ts >/dev/null 2>&1)
(cd "$OLD" && exec npx next dev -p $PORT >"$LOG" 2>&1) & PID=$!
for i in $(seq 1 60); do curl -s -o /dev/null --max-time 5 "http://localhost:$PORT/" && break; sleep 2; done
WF_COMMIT="$BRANCH@$COMMIT" node "$HERE/render.cjs" "http://localhost:$PORT" --branch --root "$OLD"
python3 "$HERE/make-pack.py"
