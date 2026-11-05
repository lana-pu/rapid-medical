#!/usr/bin/env bash
# Маркер «аудит прогнан недавно» — глушит напоминалки на 10 минут. Запускать из корня проекта.
cd "${CLAUDE_PROJECT_DIR:-.}"
mkdir -p .claude/.cache
date +%s > .claude/.cache/security-check-mark
exit 0
