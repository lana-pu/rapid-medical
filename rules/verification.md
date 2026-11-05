# Verification — проверки перед «готово» и перед коммитом

## Принцип
Никогда не заявлять «готово» без прохождения проверок.

## Чек-лист
UI-задачи — пункты 1–7; бэкенд — 1–3, 5, 6 (spec sync), 7.

1. **Build** — `npm run build` без ошибок компиляции.
2. **Типы** — `npx tsc --noEmit` без ошибок.
3. **Lint** — `npm run lint` (если настроен).
4. **Хардкод стилей в UI-файлах:**
   ```bash
   grep -rnE '#[0-9a-fA-F]{3,8}\b|\[[0-9]+px\]' src/app src/pages src/widgets src/features src/shared/ui 2>/dev/null
   ```
5. **Console / debugger / TODO:**
   ```bash
   grep -rnE 'console\.(log|debug)|debugger|TODO|FIXME' src/
   ```
6. **Spec sync:** `docs/screens/<screen>.md` обновлён под новое поведение; `docs/test-cases.md`
   обновлён, если изменилась логика; `docs/spec.md` — если изменились данные/доступы.
7. **Public API через index.ts** (FSD): импорты не лезут в `@/<slice>/ui/X` напрямую — только
   через `@/<slice>`.
8. **Тесты** — если в проекте есть `test:all`, он зелёный.
9. **Визуальная проверка UI** — открыть изменённый экран в браузере (или headless-скриншот)
   и убедиться, что он работает, а не только собирается.
