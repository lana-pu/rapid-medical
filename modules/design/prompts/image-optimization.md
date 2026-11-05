# Оптимизация изображений — sharp, AVIF/WebP, авто-сжатие при коммите, `sizes`

Запускай один раз на проект (Next.js), когда появляются картинки; повторно — если добавлены `<Image>` без `sizes`.

Нужно на входе: Next.js-приложение. Для авто-сжатия при коммите — git-репозиторий (если git нет — шаг 4 настрой после `development/prompts/git-github-setup.md`).

Результат: картинки сжимаются автоматически, браузер получает AVIF/WebP, мобильные грузят маленькие версии.

Команды — из корня приложения.

## Шаг 1 — sharp

```bash
npm install sharp      # или: pnpm add sharp
```

## Шаг 2 — `next.config.ts`

В `images` добавь:
- `formats: ['image/avif', 'image/webp']`
- `deviceSizes` под breakpoints проекта (из `docs/spec.md` / `docs/DESIGN.md`); типовой: `[375, 480, 768, 1024, 1440, 1920, 2560]`
- `imageSizes: [16, 32, 64, 128, 256]`
- `minimumCacheTTL: 31536000`

## Шаг 3 — `scripts/optimize-images.js`

CommonJS, `require('sharp')`, `fs`, `path`. Скрипт:
- аргумент — папка (по умолчанию `public/`) или один файл; флаг `--dry-run` — только показать;
- рекурсивно по JPG/PNG, пропуская файлы < 100 КБ;
- JPG: resize до max 2560px, quality 82, progressive, mozjpeg; PNG: resize до max 2560px, strip metadata;
- перезаписывает оригинал; печатает имя, размер до/после, % экономии.

В `package.json`:

```json
"images:opt": "node scripts/optimize-images.js public",
"images:opt:dry": "node scripts/optimize-images.js public --dry-run"
```

Проверка: `node scripts/optimize-images.js public --dry-run`.

## Шаг 4 — Авто-сжатие staged-картинок при коммите

`scripts/optimize-staged-images.sh` (`chmod +x`):
- staged-картинки: `git diff --cached --name-only --diff-filter=AM | grep -iE '\.(jpe?g|png)$'`;
- для каждой: `node scripts/optimize-images.js <путь>` и `git add <путь>`;
- нет node → предупреждение и `exit 0` (коммит не ломать).

Подключи в pre-commit хук проекта. Если уже есть `scripts/hooks/pre-commit` (спека-гейт, `git config core.hooksPath scripts/hooks`) — вставь строкой сразу после shebang: `sh scripts/optimize-staged-images.sh`. Хука нет — создай `scripts/hooks/pre-commit` с этой строкой, `chmod +x`, `git config core.hooksPath scripts/hooks`. Один pre-commit на проект.

## Шаг 5 — Первый прогон

```bash
node scripts/optimize-images.js public
```

Покажи: сколько файлов обработано, сколько места сэкономлено.

## Шаг 6 — `sizes` и `priority` у всех `<Image>`

Найди все `<Image>` в `src/` без `sizes` и добавь по реальной ширине контейнера:
- во всю ширину: `sizes="100vw"`;
- половина экрана: `sizes="(max-width: 768px) 100vw, 50vw"`;
- карточка в 3-колоночном гриде: `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`;
- hero-изображение — дополнительно `priority` (влияет на LCP).

## После выполнения

Запиши в `docs/memory/state.md`: sharp установлен; AVIF/WebP и `deviceSizes` в `next.config.ts`; `optimize-images.js` + авто-сжатие в pre-commit; итог первого прогона (файлов, МБ).

## Чек-лист

- [ ] `sharp` в dependencies
- [ ] `next.config.ts`: `formats` AVIF/WebP + `deviceSizes`
- [ ] `scripts/optimize-images.js` работает (`--dry-run` показывает файлы)
- [ ] `scripts/optimize-staged-images.sh` вызывается из pre-commit
- [ ] Первый прогон выполнен
- [ ] У всех `<Image>` есть `sizes`, у hero — `priority`
