# README Network — корневой README + README в ключевых папках

Запускай, когда проект дорос до нескольких значимых папок, перед передачей проекта другому человеку и после крупной реструктуризации. Каждый README — указатель «что здесь, зачем, куда идти за деталями», а не копия спеки.

Нужно на входе: проект с кодом и `docs/`.

## Промт

```
Собери сеть README по проекту: корневой README.md + короткие README.md в ключевых
папках. Каждый — указатель (что здесь, зачем, куда за деталями), НЕ копия spec.md.

Сначала прочитай фактическое состояние:
- package.json (в монорепо — development/package.json и development/apps/*/package.json):
  имя, скрипты (dev/build/start/test), стек;
- docs/spec.md, docs/app-map.md, docs/screens/ — что за продукт и какие экраны;
- реальную структуру кода (в монорепо: development/apps/app — сервис, apps/landing —
  лендинг, packages/ui — общие токены/компоненты; иначе — src/);
- .claude/ (проекта и воркспейса) — хуки, скиллы, настройки;
- docs/memory/ и docs/rules/.

Создай / обнови файлы. Каждый 15–40 строк, ссылки относительные и кликабельные.
Не выдумывай — только из кода и docs.

--- 1. Корневой README.md ---

# <Продукт>

<1–2 предложения: что за продукт и для кого>

## Live
<публичный URL, если задеплоен>

## Стек
- Frontend / Backend / DB / Hosting — из package.json и docs/memory/infrastructure.md

## Как запустить локально
```bash
npm install
npm run dev        # http://localhost:3000
```

## Деплой
<команда деплоя, ссылка на docs/memory/infrastructure.md>

## Структура
- код (src/ или development/) — см. его README
- docs/ — спецификация, спеки экранов, тест-кейсы, память (см. docs/README.md)
- .claude/ — AI-инфраструктура (если есть в проекте)

## Документация
- docs/spec.md — спецификация
- docs/app-map.md — карта экранов
- docs/test-cases.md — тест-кейсы
- docs/memory/INDEX.md — память проекта (ADR, findings, sessions)

--- 2. docs/README.md ---
Какие документы в папке и в каком порядке читать. Таблица: файл → что описывает
(spec.md, DESIGN.md, app-map.md, screens/, test-cases.md, audits/, rules/, memory/).

--- 3. README кода (src/README.md или development/apps/app/src/README.md) ---
Архитектура. FSD — слои (app / pages / widgets / features / entities / shared) и правило
«куда что класть»; иначе — фактические папки. Правило UI-кита: компоненты из shared/ui
(или @repo/ui), без хардкода цветов/размеров (DESIGN.md).

--- 4. development/README.md (если монорепо) ---
Раскладка apps/* + packages/*, команды сборки/деплоя каждого приложения.

--- 5. .claude/README.md (если есть .claude/ в проекте) ---
Что делает каждый хук, какие скиллы, где настройки.

--- 6. docs/memory/README.md ---
Вход — INDEX.md; decisions/ — ADR, findings/ — находки, sessions/ — журнал, state.md —
текущее состояние, infrastructure.md — где что развёрнуто.

--- 7. UI-кит README (src/shared/ui/README.md или packages/ui/README.md, если есть) ---
Список основных компонентов и правило «экран собирается из этих компонентов, а не из
сырых div + классов».

ПОКАЖИ МНЕ:
- список созданных/обновлённых README;
- корневой README.md целиком;
- что все ссылки кликаются (Markdown Preview).
```

## Edge cases

- README уже есть — дополнить недостающее, сохранить написанное руками.
- Папки нет — README для неё не создавать.
- Несколько сервисов — корневой README описывает общую раскладку, плюс README на каждый сервис.
- Никаких секретов, токенов, паролей в README.
- Тянет описать поведение экрана — вместо этого ссылка на `docs/screens/<screen>.md`.
