# Pre-deploy security gate — `scripts/security-precheck.sh`

Запускай, когда в проекте появляется деплой-скрипт (`deploy.sh` / `scripts/deploy-remote.sh`), — гейт встраивается в цепочку деплоя рядом со сборкой.

Нужно на входе: git-репозиторий проекта; настроенный деплой (`development/prompts/vps-docker-compose.md`) — для шагов 2–3.

Результат: быстрый bash-гейт (секунды), который до деплоя блокирует выкладку при секретах в коде, `.env` в репо, неправильных правах `.env.production`, опасных флагах `next.config`; предупреждает о debug-коде и security-TODO. Глубокий AI-аудит — отдельно (`development/prompts/security-check.md`).

## Шаг 1 — `scripts/security-precheck.sh`

```bash
#!/usr/bin/env bash
# Pre-deploy security gate. exit 1 → деплой блокируется.
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"
ERRORS=0; WARNINGS=0
EXCL=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.git)
CODE=(--include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx')
SCAN_PATHS=$(for d in src app pages lib components scripts apps packages; do [ -d "$d" ] && printf '%s ' "$d"; done)
SCAN_PATHS=${SCAN_PATHS:-.}

echo "Security pre-check — $(date '+%Y-%m-%d %H:%M:%S')"

echo "1. Секреты в коде"
SECRET_PATTERNS=(
  '(^|[^A-Za-z0-9_])sk-([A-Za-z0-9]{20,}|(proj|ant|or)-[A-Za-z0-9_-]{20,})'
  'sk_live_[A-Za-z0-9]{24,}'
  'pk_live_[A-Za-z0-9]{24,}'
  'gh[pousr]_[A-Za-z0-9]{36}'
  'github_pat_[A-Za-z0-9_]{82}'
  '(AKIA|ASIA)[0-9A-Z]{16}'
  'glpat-[A-Za-z0-9_-]{20}'
  'xox[bp]-[0-9]+-[A-Za-z0-9-]+'
  'AIzaSy[A-Za-z0-9_-]{33}'
  '-----BEGIN [A-Z ]*PRIVATE KEY-----'
)
for p in "${SECRET_PATTERNS[@]}"; do
  HITS=$(grep -rEn "${CODE[@]}" --include='*.json' "${EXCL[@]}" -- "$p" $SCAN_PATHS 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    echo "  🔴 секрет (паттерн $p):"; echo "$HITS" | head -5 | sed 's/^/      /'
    ERRORS=$((ERRORS+1))
  fi
done

echo "2. .env в git"
ENV_IN_REPO=$(git ls-files 2>/dev/null | grep -E '(^|/)\.env(\..*)?$' | grep -vE '(^|/)\.env\.example$' || true)
if [ -n "$ENV_IN_REPO" ]; then
  echo "  🔴 env-файлы в git: $ENV_IN_REPO → git rm --cached <file>"; ERRORS=$((ERRORS+1))
else echo "  ✅ env не закоммичены"; fi

echo "3. Debug-код"
DEBUG_HITS=$(grep -rEn "${CODE[@]}" "${EXCL[@]}" --exclude-dir=tests --exclude-dir=__tests__ 'console\.(log|debug)|debugger;' $SCAN_PATHS 2>/dev/null || true)
if [ -n "$DEBUG_HITS" ]; then
  echo "  ⚠️  console.log/debugger: $(echo "$DEBUG_HITS" | wc -l | tr -d ' ') мест"; echo "$DEBUG_HITS" | head -3 | sed 's/^/      /'
  WARNINGS=$((WARNINGS+1))
else echo "  ✅ без debug-кода"; fi

echo "4. Права на .env.production"
if [ -f .env.production ]; then
  PERMS=$(stat -c '%a' .env.production 2>/dev/null || stat -f '%Lp' .env.production 2>/dev/null)
  if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
    echo "  🔴 права $PERMS, нужно 600 → chmod 600 .env.production"; ERRORS=$((ERRORS+1))
  else echo "  ✅ права $PERMS"; fi
else echo "  ✅ .env.production нет (норма для локальной машины)"; fi

echo "5. Опасные флаги next.config"
DANGER=$(grep -rEn 'ignoreBuildErrors[[:space:]]*:[[:space:]]*true|ignoreDuringBuilds[[:space:]]*:[[:space:]]*true' $(find . -maxdepth 4 -name 'next.config.*' -not -path '*/node_modules/*' 2>/dev/null) /dev/null 2>/dev/null || true)
if [ -n "$DANGER" ]; then
  echo "  🔴 отключены TS/lint в сборке:"; echo "$DANGER" | sed 's/^/      /'; ERRORS=$((ERRORS+1))
else echo "  ✅ опасных флагов нет"; fi

echo "6. TODO про security"
SEC_TODOS=$(grep -rEni "${CODE[@]}" "${EXCL[@]}" 'TODO.*(security|auth|XSS|CSRF|inject|sanitize|escape|IDOR)' $SCAN_PATHS 2>/dev/null || true)
if [ -n "$SEC_TODOS" ]; then
  echo "  ⚠️  security-TODO:"; echo "$SEC_TODOS" | head -5 | sed 's/^/      /'; WARNINGS=$((WARNINGS+1))
else echo "  ✅ нет security-TODO"; fi

echo "-------------------------------------"
if [ "$ERRORS" -gt 0 ]; then
  echo "🔴 BLOCKED: $ERRORS критичных проблем — деплой остановлен. Почини или запусти /security-check."
  exit 1
fi
[ "$WARNINGS" -gt 0 ] && echo "⚠️  $WARNINGS предупреждений — деплой продолжается." || echo "✅ Все проверки прошли."
exit 0
```

`chmod +x scripts/security-precheck.sh`. Скрипт работает и на macOS, и на Linux (`stat` в обеих формах; только ERE-регулярки).

## Шаг 2 — Локальный `scripts/deploy-remote.sh`

До ssh-команды:

```bash
echo "Local pre-check..."
"$(dirname "$0")/security-precheck.sh" || exit 1

echo "Triggering remote deploy..."
set -a; source "$(dirname "$0")/../.env.deploy"; set +a
ssh -i "${SSH_KEY_PATH/#\~/$HOME}" "$SERVER_USER@$SERVER_IP" "/var/www/<project-name>/deploy.sh"
```

## Шаг 3 — Серверный `deploy.sh`

По SSH (доступ из `.env.deploy`) отредактируй `/var/www/<project-name>/deploy.sh`: гейт — после доставки кода (`git pull` или иной способ по стратегии деплоя) и до сборки:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /var/www/<project-name>
git pull                                   # если стратегия git-based

./scripts/security-precheck.sh || { echo "Security pre-check failed. Aborting deploy."; exit 1; }

docker compose up -d --build
# docker compose exec -T web npx prisma migrate deploy   # если проект на Prisma
# ...пост-деплой гигиена из текущего deploy.sh сохраняется
echo "Deployed at $(date)"
```

На сервере гейт дополнительно проверяет права реального `.env.production`.

## Шаг 4 — Тест

1. `./scripts/security-precheck.sh` → проходит (на чистом проекте).
2. Блокировка: создай временный файл с фейковым ключом **через shell** (запись через редактор заблокирует хук секретов), ключ собирается из частей:
   ```bash
   P=sk-; printf 'const k = "%stest12345678901234567890";\n' "$P" > src/test-security.ts
   ./scripts/security-precheck.sh; echo "exit=$?"     # 🔴 секрет, exit=1
   ```
   Затем удали `src/test-security.ts`.
3. `./scripts/deploy-remote.sh` → гейт проходит локально, затем на сервере, затем сборка.

## Шаг 5 — Документация

В `docs/memory/infrastructure.md`, раздел «Деплой»: `Pre-deploy gate: scripts/security-precheck.sh` и `Полный аудит: /security-check`.

Покажи: скрипт, фрагменты `deploy.sh` и `deploy-remote.sh` с гейтом, результат прогона, тест с фейковым секретом.

## Edge cases

- Ложное срабатывание на плейсхолдере ключа → сократить плейсхолдер (< 20 символов после префикса) или точечно исключить файл/паттерн.
- Большой репозиторий — 5–10 секунд, приемлемо.
- Монорепо — сканируются `apps/` и `packages/`; `next.config.*` ищется до глубины 4.
