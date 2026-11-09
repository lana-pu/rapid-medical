#!/bin/sh
# Builds the offline test ZIP from ./package. Run from this folder: sh build-zip.sh
set -e
cd "$(dirname "$0")"
rm -f tigertriever-offline-test-s0.zip
cd package
zip -q -X -r ../tigertriever-offline-test-s0.zip READ-ME-FIRST.txt index.html content.js manifest.json media
cd ..
echo "built $(pwd)/tigertriever-offline-test-s0.zip ($(du -k tigertriever-offline-test-s0.zip | cut -f1) KB)"
