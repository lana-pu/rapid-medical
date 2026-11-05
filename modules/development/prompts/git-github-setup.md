# Git + GitHub — аутентификация, `.gitignore`, спека-гейт, первый push

Запускай, когда у проекта ещё нет git-репозитория или remote на GitHub.

Результат: аутентификация в GitHub настроена (gh CLI или SSH-ключ), `git init` с защитой секретов, pre-commit спека-гейт, private-репозиторий на GitHub, первый push.

Принцип работы: команды выполняет AI. От пользователя — только действия в браузере, которые AI не может сделать сам (одноразовый код OAuth, вставка публичного ключа в веб-форму GitHub). Секреты в чат не вводятся.

## Шаг 1 — Способ аутентификации

Покажи пользователю коротко и спроси выбор:
- **gh CLI (OAuth)** — самый простой: подтверждение в браузере, токены gh обновляет сам.
- **SSH-ключ** — настроить один раз; удобно при нескольких проектах и устройствах; тот же механизм потом для входа на VPS.

Логин+пароль для git по HTTPS GitHub не принимает; PAT — длинный пароль с правами и сроком, при утечке даёт доступ, нужно обновлять — не рекомендуется как основной способ.

Карта доступов (минимальные права): моя машина ↔ GitHub — полный доступ (gh/SSH-ключ, настраиваем сейчас); сервер ↔ GitHub — только чтение одного репо через отдельный read-only deploy key (`development/prompts/vps-docker-compose.md`), личный ключ на сервер не кладём; моя машина ↔ сервер — SSH-ключ, доступ в `.env.deploy`.

### Вариант gh CLI

1. Установи: macOS `brew install gh` · Ubuntu/Debian `sudo apt install gh` · Windows `winget install GitHub.cli`.
2. `gh auth login` → GitHub.com, HTTPS, Login with web browser. Пользователь вводит одноразовый код в браузере; сам код в чат не выводи и не запрашивай.
3. Проверь: `gh auth status` → «Logged in to github.com as <username>».

### Вариант SSH-ключ

1. Спроси, нужна ли passphrase (защита при потере ноутбука). Сгенерируй: `ssh-keygen -t ed25519 -C "<email на GitHub>" -f ~/.ssh/id_ed25519`.
2. `eval "$(ssh-agent -s)"` и `ssh-add ~/.ssh/id_ed25519`. На macOS добавь в `~/.ssh/config`:
   ```
   Host github.com
     AddKeysToAgent yes
     UseKeychain yes
     IdentityFile ~/.ssh/id_ed25519
   ```
3. Покажи `~/.ssh/id_ed25519.pub` (публичная часть, не секрет). Пользователь добавляет её: https://github.com/settings/keys → New SSH key → Authentication Key.
4. Проверь: `ssh -T git@github.com` → «Hi <username>! You've successfully authenticated…».
5. Remote был по HTTPS → `git remote set-url origin git@github.com:<user>/<repo>.git`.

## Шаг 2 — `git init` и защита секретов до первого `git add`

В корне проекта: `git init` и `git branch -M main`. Сразу приведи `.gitignore` к каноничному блоку (дефолт create-next-app ненадёжен: `.env*` заигнорит и `.env.example`, старые шаблоны пропускают `.env.production` / `.env.deploy`):

```
# env (секреты) — никогда в git
.env
.env.*
!.env.example
```

Также игнорируются `node_modules`, `.next`.

Проверка, что ни один реальный env-файл не попадёт в коммит:

```bash
git add -A && git status --short          # .env / .env.local / .env.production в списке быть НЕ должно
git check-ignore .env.local .env.production .env.deploy   # каждая существующая — выводится
```

Env-файл виден в `git status` → поправь `.gitignore`, при необходимости `git rm --cached <файл>` — до коммита.

## Шаг 3 — Спека-гейт (pre-commit хук)

Не даёт закоммитить изменения кода без правки спеки — срабатывает на любом `git commit`, кто бы ни коммитил.

```bash
mkdir -p scripts/hooks && git config core.hooksPath scripts/hooks
```

`scripts/hooks/pre-commit` (`chmod +x`):

```sh
#!/bin/sh
# Спека-гейт: код в src/ нельзя закоммитить без обновления спеки.
# Обход для не-поведенческих правок: SKIP_SPEC=1 git commit ...
[ "$SKIP_SPEC" = "1" ] && exit 0
staged=$(git diff --cached --name-only)
echo "$staged" | grep -qE '(^|/)src/.+\.(tsx?|jsx?)$' || exit 0
echo "$staged" | grep -qE '^docs/(spec\.md|screens/.+\.md)$' && exit 0
echo "Изменён код в src/, но спека не тронута (docs/spec.md или docs/screens/*.md)."
echo "Обнови спеку в этом же коммите. Не-поведенческая правка — SKIP_SPEC=1 git commit ..."
exit 1
```

Если есть `scripts/optimize-staged-images.sh` (`design/prompts/image-optimization.md`) — вставь сразу после shebang строку `sh scripts/optimize-staged-images.sh`. Один pre-commit на проект. Секрет-сканер в тот же хук — `development/prompts/bash-write-hooks.md`.

Хук проверяет, что спеку **тронули**, а не что обновили верно; смысл сверяет `development/prompts/prototype-verification.md`.

## Шаг 4 — Первый коммит и push

```bash
git add .
git commit -m "chore: initial commit"     # включает и src/, и docs/ — гейт пропустит
```

Репозиторий (по умолчанию **private**):
- gh: `gh repo create <project-name> --private --source=. --push`
- SSH без gh: пользователь создаёт пустой private-репо на https://github.com/new, затем
  `git remote add origin git@github.com:<user>/<project-name>.git` и `git push -u origin main`.

Покажи: `git log --oneline`, `git remote -v`, URL репозитория (`gh repo view --web`).

## Правила коммитов

- **Один коммит — одна завершённая мысль** (одна страница, одна правка стиля, одна зависимость), формат `тип: что сделано` (`feat:`, `fix:`, `chore:`, `docs:`). Не «WIP», «fix bugs», «всё за вторник».
- Перед коммитом проект собирается: `npm run build` (или `npx tsc --noEmit`). Упало — не коммить: `git stash`, починить, `git stash pop`.
- Смешанные изменения → разбить на логические коммиты, стейджить по файлам, не `git add -A` вслепую.
- Никогда `git push --force` в `main`.

## Безопасность ключей (проверь сам)

- `~/.ssh/id_ed25519` — права 600 (`-rw-------`), `~/.ssh` — 700. Иначе `chmod`.
- Никогда не делать `git init` в домашней папке.
- Чужая/временная машина → после работы `ssh-add -d ~/.ssh/id_ed25519`, удалить ключ, убрать публичный ключ на GitHub.
- Потерян ноутбук → пользователь удаляет публичный ключ в github.com/settings/keys; на новом устройстве — новый ключ; на VPS — заменить ключ в `authorized_keys`.

## Edge cases

- Нет аккаунта GitHub → https://github.com/signup.
- Ветка `master` → `git branch -M main` перед push.
- Windows + WSL2 → ключи генерировать и работать в WSL.
- Несколько GitHub-аккаунтов → разные Host в `~/.ssh/config`:
  ```
  Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
  ```
  и remote `git@github.com-personal:<user>/<repo>.git`.
