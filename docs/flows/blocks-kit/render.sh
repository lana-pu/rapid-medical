#!/bin/sh
# Wireframes on the real blocks: regenerate the flows, snapshot every rm-* node through the running site, rebuild pack.js.
#   docs/flows/blocks-kit/render.sh [dev server URL, default http://localhost:3000]
# Needs this project's dev server (npm run dev). After it: build and publish the flows as before (/wireframes).
# Screens "as is" (the site before the redesign) have their own snapshot, rm-render-asis.json, drawn once by that code;
# re-draw it only if the "as is" screens change: render-asis.sh.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
FLOWS="$HERE/.."
URL=${1:-http://localhost:3000}
for f in site-pages visitor site-prototype site-editor admin linkedin-post; do python3 "$FLOWS/$f.py"; done
python3 "$HERE/make-pack.py"   # examples.json: the Library examples are snapshotted too
node "$HERE/render.cjs" "$URL"
python3 "$HERE/make-pack.py"
