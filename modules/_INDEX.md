# modules/_INDEX.md — полная карта библиотеки

Читать по триггеру «нужен модуль / какой промт запустить». Модулей ровно пять; внутри каждого —
`AGENTS.md` (индекс «Когда → Файл»), `prompts/`, `rules/`.

| Триггер | Модуль | Индекс |
|---|---|---|
| Новый проект, подключить репозиторий, настройка AI, память, save-session, правила, скиллы, README, пополнение библиотеки | ai-config | `ai-config/AGENTS.md` |
| Исследование продукта по этапам, что строим и для кого, спека продукта и экранов, PRD, правка спеки, бриф лендинга | product | `product/AGENTS.md` |
| DESIGN.md, UI-кит, FSD, экраны, вайрфреймы и флоу, адаптив, UX-аудит, картинки, лендинг, правка визуала | design | `design/AGENTS.md` |
| Код, БД, auth, письма, файлы, AI-фичи, админка, API, тесты, git, ENV, деплой, домен, security, хуки | development | `development/AGENTS.md` |
| SEO-мета, robots/sitemap, GEO, аналитика, вычитка текстов | seo-geo | `seo-geo/AGENTS.md` |

## Типичный путь продукта с нуля
1. `ai-config/init-project` → (`product/research-pipeline`, если нужно исследование) → `product/product-concept-interview` → `product/screens-spec-*` → `product/spec-review-and-prd`
2. `design/design-system` → `ui-kit` → `fsd-architecture` → `screen-visual-spec` → `screens-prototype` → `responsive-audit` → `ux-audit`
3. `development/git-github-setup` → `env-secrets` → `deploy-strategy-adr` → деплой → `domain-https` → `server-security-basics` → `security-check`
4. `development/db-*` → `mocks-to-real-db` → `auth-setup` → письма → `file-storage` → `auth-security-hardening` → `persistence-smoke-check`
5. Расширения по спеке: AI, админка, API, алерты, uptime
6. Публичная упаковка: `product/landing-research-brief` → `design/landing-build` → `seo-geo/*` → `development/legal-pages`, `pwa` → `design/adaptive-audit`
7. Защита и консолидация: `development/app-map` → `screens-spec` → `global-spec` → `test-cases` → `hardcode-guard-hook` → `ai-config/memory-setup`, `rules-setup`, `feature-registry` → `development/hide-dev-pages` → `ai-config/readme-network` → `mvp-release-save`

Ретрофит существующего проекта — тот же путь, но каждый шаг начинается со сверки «что уже есть в коде».

Проверка индексации: `../.claude/scripts/check-modules-indexed.sh`.
