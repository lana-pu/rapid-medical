#!/bin/sh
# Refresh docs/flows/rm-pages.json from the running site (real block lists of the pages the flows use).
# Needs a dev server with a seeded database: npm run dev  (or pass its URL: snapshot.sh http://localhost:3200)
set -e
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
URL=${1:-http://localhost:3000}
ROUTE="$ROOT/src/app/api/flows-dump"
mkdir -p "$ROUTE" && cp "$ROOT/docs/flows/blocks-kit/dump-route.ts" "$ROUTE/route.ts"
trap 'rm -rf "$ROUTE"' EXIT
sleep 2
curl -sf --retry 5 --retry-delay 3 --retry-all-errors "$URL/api/flows-dump" -o "$ROOT/docs/flows/rm-pages.tmp.json"
python3 - "$ROOT/docs/flows" <<'PY'
import json, sys, datetime, pathlib
d = pathlib.Path(sys.argv[1]); raw = json.load(open(d / 'rm-pages.tmp.json'))
out = {'snapshot': datetime.date.today().isoformat(), 'pages': raw['pages'], 'meta': raw['meta']}
json.dump(out, open(d / 'rm-pages.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
(d / 'rm-pages.tmp.json').unlink()
print('rm-pages.json:', len(out['pages']), 'pages, snapshot', out['snapshot'])
PY
