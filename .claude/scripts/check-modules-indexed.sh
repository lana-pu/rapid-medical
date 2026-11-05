#!/usr/bin/env bash
# Проверка индексации библиотеки: каждый промт/правило модуля упомянут в его AGENTS.md,
# каждый модуль — в modules/_INDEX.md, каждое правило rules/ — в rules/_INDEX.md.
# --quiet → только exit code. Запуск из корня воркспейса или откуда угодно.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
QUIET=0; [ "${1:-}" = "--quiet" ] && QUIET=1
FAIL=0
say() { [ $QUIET -eq 1 ] || echo "$@"; }
for dir in "$ROOT"/modules/*/; do
  mod=$(basename "$dir")
  idx="$dir/AGENTS.md"
  if [ ! -f "$idx" ]; then say "❌ modules/$mod: нет AGENTS.md"; FAIL=1; continue; fi
  grep -qF "$mod/" "$ROOT/modules/_INDEX.md" 2>/dev/null || { say "❌ modules/$mod не упомянут в modules/_INDEX.md"; FAIL=1; }
  for f in "$dir"prompts/*.md "$dir"rules/*.md; do
    [ -e "$f" ] || continue
    n=$(basename "$f")
    grep -qF "$n" "$idx" || { say "❌ слепой: modules/$mod/${f#$dir} — нет в modules/$mod/AGENTS.md"; FAIL=1; }
  done
done
for f in "$ROOT"/rules/*.md; do
  n=$(basename "$f"); [ "$n" = "_INDEX.md" ] && continue
  grep -qF "$n" "$ROOT/rules/_INDEX.md" 2>/dev/null || { say "❌ слепое правило: rules/$n — нет в rules/_INDEX.md"; FAIL=1; }
done
[ $FAIL -eq 0 ] && say "✅ 0 слепых промтов и правил"
exit $FAIL
