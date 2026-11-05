---
name: security-check
description: Полный аудит безопасности веб-приложения OWASP-style (auth/IDOR, XSS, CSRF, инъекции, загрузки файлов, секреты, HTTP-заголовки, вебхуки, деплой) + backend-скоуп (БД, сессии, API-ключи, AI, админка). Триггеры — «проверь безопасность», «есть ли уязвимости», «security check», «OWASP», «аудит безопасности», «проверь auth», «проверь IDOR», «проверь secrets», перед деплоем.
model: opus
---

# /security-check

Корень воркспейса — папка с `modules/` (из проекта это `../../`).
1. Рецепт: `<корень>/modules/development/prompts/security-check.md` (шаблон разделов —
   `security-check-template.md`, backend-скоуп — `security-check-backend-scope.md` там же).
2. Растущий чек-лист проекта — `docs/security-checklist.md`, если есть.
3. Отчёт — `docs/audits/security-check-<YYYY-MM-DD>.md`. 🔴 чинить сразу (с подтверждением), ⚠️ → `docs/memory/BACKLOG.md`.
4. В конце — `bash <корень>/.claude/scripts/security-check-mark.sh` (глушит напоминалки на 10 минут).
