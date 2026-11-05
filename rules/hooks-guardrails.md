# Hooks — детерминированная защита

Hook — shell-скрипт, который Claude Code выполняет в ключевых точках (PreToolUse, PostToolUse, PreCompact).
Срабатывает всегда, не зависит от того, прочитал ли AI правило. JSON приходит через **stdin**
(скрипты парсят его `python3`), блокировка — `exit 2`, напоминание — текст в stderr + `exit 0`.

## Где живут
- Скрипты — `.claude/hooks/` в корне воркспейса (общие для всех проектов).
- Подключение к проекту — `projects/<slug>/.claude/settings.local.json` (копия
  `.claude/project-settings.template.json`, пути вида `$CLAUDE_PROJECT_DIR/../../.claude/hooks/…`).
  Делает `/init-project`. Файл локальный, в git проекта не попадает.
- Хуки, которые пишет сам проект (например, против хардкода в UI), — в `projects/<slug>/.claude/hooks/`
  и в его `settings.json`.

## Общие хуки
| Скрипт | Когда | Что делает |
|---|---|---|
| `pre-tool-use-bash.sh` | Bash | 🔴 блок: рекурсивный rm по корню/дому, force-push в main/master, `reset --hard origin/main`, `dd` в `/dev/`, fork-бомба, `chmod -R 777` по корню. Ловит паттерн в тексте команды целиком — в т.ч. внутри heredoc; документацию с такими строками писать через Write |
| `pre-tool-use-write.sh` | Edit/Write | 🔴 блок записи секретов (`sk-`, `sk_live_`, `ghp_`, `AKIA…`, `glpat-`, `xox…`, `AIzaSy…`) |
| `pre-tool-use-security-reminder.sh` | Bash | перед `git commit/push` с кодом в индексе — напомнить `/security-check` |
| `post-tool-use-security-counter.sh` | Edit/Write | 5 правок в API/auth/схеме/.env без аудита → напомнить `/security-check` |
| `post-tool-use-infra-reminder.sh` | Edit/Write | правка docker/nginx/.env/deploy/vercel/CI → обновить `docs/memory/infrastructure.md` |
| `post-tool-use-savesession-reminder.sh` | Bash | после `git push` → `/save-session` |
| `context-alert.sh` | Edit/Write/Bash | после 40 вызовов (дальше каждые 20) → обновить `docs/memory/state.md` |
| `pre-compact-snapshot.sh` | PreCompact | снимок (ветка, 10 коммитов, грязные файлы, state.md) в `docs/memory/snapshots/`, хранит 10 |
| `post-tool-use-module-index.sh` | Edit/Write (корень воркспейса) | промт в `modules/` не упомянут в AGENTS.md модуля → предупредить |

`.claude/scripts/security-check-mark.sh` (из корня проекта) — маркер «аудит прогнан», глушит напоминалки на 10 минут.

## Когда ослаблять
Ложная блокировка (нужно записать `sk-test…` в документацию) — временно закомментировать паттерн и
вернуть. Не обходить через `--no-verify`.
