# Монорепо-сплит: сервис ⟂ лендинг ⟂ общий UI-пакет

Запускай, когда у продукта появляется второй деплой-артефакт (обычно публичный лендинг) — до вёрстки лендинга. Цель: сервис и лендинг собираются и деплоятся независимо, токены и компоненты живут в одном общем пакете. Это миграция существующего кода, идемпотентная: на готовом монорепо только проверяет сборку.

Нужно на входе: рабочее приложение (Next.js) в папке проекта и git-репозиторий. Для внутреннего продукта без публичного лендинга сплит не нужен — оставайся на одном приложении, корень держи чистым по `docs/rules/project-structure.md`.

## Целевая раскладка

```
<проект>/
├── docs/                       ← документация (не трогаем)
├── AGENTS.md / CLAUDE.md       ← правила-хаб (остаётся)
└── development/                ← весь код и конфиг
    ├── package.json            ← корень workspace: "workspaces": ["apps/*", "packages/*"]
    ├── packages/
    │   └── ui/                 ← @repo/ui: токены DESIGN.md + shared/ui (единый источник)
    │       ├── package.json
    │       └── src/
    │           ├── styles/theme.css   ← @theme токены (Tailwind v4), импортят обе apps
    │           └── ui/                 ← компоненты из бывшего src/shared/ui
    └── apps/
        ├── app/                ← сервис: бывший src/ (минус shared/ui), prisma/, конфиг
        │   └── src/{app,pages,widgets,features,entities,shared/{lib,api,config}}
        └── landing/            ← новый Next.js-проект под лендинг, импортит @repo/ui
```

Scope `@repo/ui` — плейсхолдер, можно заменить на `@<slug>/ui`. Менеджер пакетов — npm workspaces; для pnpm — `pnpm-workspace.yaml` вместо поля `workspaces`.

## Промт

```
Преврати продукт в монорепо (сервис + лендинг как независимые приложения с общим
пакетом UI). Это МИГРАЦИЯ существующего кода, не сборка с нуля — ничего не потеряй,
работай идемпотентно.

0. БЕЗОПАСНОСТЬ. Убедись, что git-дерево чистое, и сделай коммит текущего состояния
   как точку отката ("chore: точка отката перед монорепо-сплитом"). Незакоммиченное —
   закоммить или застэшь до начала. Весь перенос файлов — через `git mv`.

1. ОПРЕДЕЛИ ТЕКУЩУЮ РАСКЛАДКУ:
   - development/ уже есть и в нём apps/app + apps/landing + packages/ui — монорепо
     собран: только проверь сборку (шаг 7) и выходи;
   - код лежит в src/ в корне проекта (одно приложение) — делай миграцию ниже;
   - иначе — опиши, что нашёл, и предложи план переноса к целевой раскладке.

2. КАРКАС. Создай development/ и в нём корневой package.json workspace:
     { "name": "<slug>-workspace", "private": true,
       "workspaces": ["apps/*", "packages/*"] }
   (pnpm — pnpm-workspace.yaml с packages: apps/*, packages/*). Заведи apps/ и packages/.

3. СЕРВИС → apps/app. Перенеси (git mv) приложение в development/apps/app/: src/,
   prisma/ (если есть), public/, package.json, next.config.*, tsconfig.json,
   eslint.config.*, postcss.config.*, next-env.d.ts, components.json, строки .gitignore
   приложения, .env* (НЕ коммить .env). docs/ и AGENTS.md/CLAUDE.md остаются в корне.

4. ОБЩИЙ ПАКЕТ packages/ui (@repo/ui):
   - перенеси apps/app/src/shared/ui/ → packages/ui/src/ui/;
   - вынеси токены DESIGN.md (слой @theme из globals.css — цвета, шрифты, радиусы,
     отступы) в packages/ui/src/styles/theme.css; сервис и лендинг импортят его в свой
     globals.css;
   - packages/ui/package.json: name "@repo/ui", "exports" на ./src/ui и
     ./styles/theme.css, peerDependencies react/react-dom; tsconfig пакета;
   - в apps/app замени импорты @/shared/ui/... на @repo/ui (или оставь тонкий
     src/shared/ui/index.ts с реэкспортом из @repo/ui) и добавь "@repo/ui" в
     зависимости apps/app.
   После сплита общие компоненты и токены живут только в packages/ui; apps импортят
   оттуда, ничего не хардкодят у себя (цепочка DESIGN.md → UIKit → экран сохраняется).

5. ЛЕНДИНГ → apps/landing. Создай Next.js-проект (тот же стек: TS, Tailwind v4,
   App Router, --src-dir) в development/apps/landing/. Подключи "@repo/ui", импортируй
   тему из @repo/ui в globals.css, настрой alias @/*. Только рабочий каркас,
   открывающийся на / ; содержимое лендинга — отдельный промт (design/landing-build).

6. ССЫЛКИ И АЛИАСЫ. Проверь tsconfig обеих apps (paths @/*), что @repo/ui резолвится
   (npm install в development/). Найди и почини битые импорты.

7. СБОРКА. В development/: `npm install`, затем каждое приложение отдельно —
   `npm run build -w apps/app` и `npm run build -w apps/landing` — без ошибок и
   TS-warning. Подними оба dev-сервера на разных портах, убедись, что лендинг тянет
   токены/компоненты из @repo/ui.

8. ДЕПЛОЙ СЕРВИСА НА НОВОМ ПУТИ. Каждое apps/* — самостоятельный деплой-юнит со своей
   сборкой, контейнером/процессом и командой деплоя (монорепо = общий код, не общий
   билд). Настрой сервис (apps/app):
   - свой Dockerfile/билд с контекстом apps/app (`npm run build -w apps/app`);
   - свой сервис в docker-compose (app), свой образ/порт/рестарт, своя команда деплоя
     (`docker compose build app && docker compose up -d app` — без общего `up -d`).
   Деплой-юнит лендинга (контейнер + nginx + команда) настраивается вместе с его
   вёрсткой (design/landing-build).

8.1. ПУТИ В ХУКАХ, СКРИПТАХ И КОНФИГАХ. Старые пути остаются в .claude/hooks/* (проекта
   и воркспейса), в deploy.sh / remote.sh / security-precheck.sh, в .env и конфигах
   сборки. Найди и почини КАЖДОЕ под development/apps/app/... на этом же шаге:
   grep -rnE "src/app|src/proxy|(^|[^/])\bsrc/" .claude ../../.claude *.sh development/*.sh 2>/dev/null
   Хук или скрипт со ссылкой на несуществующий путь не падает, а молча перестаёт
   срабатывать. После правок прогони хуки руками (например
   `bash .claude/hooks/session-start.sh`) и убедись, что они отрабатывают.

9. ДОКИ И ПАМЯТЬ. Обнови docs/spec.md (раздел «Стек»/«Архитектура»: монорепо,
   apps/app + apps/landing + packages/ui, независимый деплой), зафиксируй ADR
   «монорепо-сплит», обнови docs/rules/project-structure.md (раздел «После
   монорепо-сплита»), запиши в docs/memory/state.md, что код переехал в development/.

9.1. ИНФРАСТРУКТУРА В ПАМЯТИ. Обнови docs/memory/infrastructure.md реальными новыми путями:
   - деплой-файлы: где deploy.sh/remote.sh, Dockerfile'ы, docker-compose; что сервис
     (development/apps/app) и лендинг (development/apps/landing) — отдельные юниты,
     packages/ui катится в оба; команда сборки/деплоя каждого;
   - окружение и секреты: КАЖДЫЙ путь к .env-файлам после переезда (корень и/или
     development/, у каждого app свой); дубли значений пометь явно (источник правды +
     копии). Сами значения не пиши — только пути и назначение.
   Проверь, что пути существуют (ls / test -f), обнови строку в docs/memory/INDEX.md.

В конце покажи `tree -L 3 development/`, результат обеих сборок, подтверди, что лендинг
использует @repo/ui и что grep из шага 8.1 пуст. Что не собирается — чини до конца;
крайний случай — откат на коммит из шага 0.
```

## Пути после сплита

- сервис — `development/apps/app/src/…`
- лендинг — `development/apps/landing/src/…`
- общие токены/компоненты — `development/packages/ui/…`
- документация — `docs/…`

## Edge cases

- Грязное дерево — сначала коммит или стэш, потом сплит; перенос только через `git mv`.
- Монорепо уже собран — гард проверяет сборку и выходит, ничего не пересоздаёт.
- Tailwind v3 (Next 15) — вместо `@theme` тема в `tailwind.config`; общий preset вынеси в `packages/ui` и подключи в обе apps.
- Сборка сломалась после переноса — не нагромождай поверх: почини импорты/алиасы или откатись на точку отката и перенеси аккуратнее.
