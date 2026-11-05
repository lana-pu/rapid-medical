# ai-config — настройка ассистента и сквозные механизмы

Память, правила, скиллы, старт проекта, сама библиотека. AI-функции продукта — не здесь, а в `development`.

## Старт и настройка
| Когда | Файл |
|---|---|
| Новый проект или подключить существующий репозиторий (`/init-project`) | `prompts/init-project.md` |
| Новый проект / новая машина: permissions, AGENTS.md проекта, симлинк CLAUDE.md | `prompts/ai-setup.md` |
| Завести правила проекта в `docs/rules/` и строки в AGENTS.md | `prompts/rules-setup.md` |
| Нужны PDF/Word/Excel/презентации — подключить скиллы | `prompts/install-power-skills.md` |
| Корневой README и README по ключевым папкам | `prompts/readme-network.md` |

## Память
| Когда | Файл |
|---|---|
| Нет памяти в проекте: скелет `docs/memory/`, ADR, INDEX | `prompts/memory-setup.md` |
| Конец этапа / сессии / после push (`/save-session`) | `prompts/save-session.md` |
| «Почему выбрали», «было ли уже» (`/memory-search`) | `prompts/memory-search.md` |
| Как устроена память, подключить движок agentmemory | `prompts/memory-system.md` |
| Реестр реализованных фич: создать или обновить | `prompts/feature-registry.md` |
| MVP опубликован — версия в памяти + git-тег | `prompts/mvp-release-save.md` |

## Библиотека
| Когда | Файл |
|---|---|
| Повторяющийся паттерн оформить в промт модуля и скилл | `prompts/build-your-prompt.md` |
| Пополнить или обновить библиотеку: вынести наработку проекта, вобрать чужой подход | `prompts/modules-library-maintain.md` |

Правило индексации — `../../rules/module-indexation.md`; проверка — `../../.claude/scripts/check-modules-indexed.sh`.
