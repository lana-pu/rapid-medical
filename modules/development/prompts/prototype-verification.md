# Проверка прототипа — спека ↔ код, хардкод, UI-кит, FSD, визуальная сверка, кликабельность

Запускай, когда все экраны собраны (на моках или с данными), перед UX-аудитом и деплоем; повторно — после крупных изменений фронта.

Нужно на входе: экраны в `src/`, `docs/spec.md`, `docs/screens/<url>.md`, `docs/DESIGN.md`.

Результат: спека совпадает с кодом по смыслу, нет хардкода и raw HTML, FSD-импорты чистые, обвязка в layout, визуальная сверка пройдена для каждого экрана, состояния и адаптив работают.

Пути `src/…` — от корня приложения, `docs/…` — от корня проекта. Режим дизайна: **A** — есть Figma; **Б/В** — без Figma.

## Шаг 0 — Спека ↔ код по смыслу

Pre-commit спека-гейт (`development/prompts/git-github-setup.md`) ловит «забыл обновить спеку»; этот шаг ловит «обновил неправильно или неполно». Сверь `docs/spec.md` и `docs/screens/<url>.md` с `src/`:

1. **Экраны:** каждый экран из индекса `spec.md` есть в `src/pages/`; нет экранов в коде, которых нет в спеке.
2. **Поведение:** действия и состояния (что по клику, default/loading/empty/error, кто что видит) реализованы; нет поведения, не описанного в спеке.
3. **Данные:** поля и сущности из «Данные» совпадают с моками/моделями в `entities/<entity>/`; лишних полей нет.
4. **Стек / адаптация:** разделы «Стек» и «Адаптация» отражают реальность.

Расхождение → код ушёл вперёд (обнови спеку) или спека описывает несделанное (доделай код или убери из спеки). Покажи список расхождений и что делаешь с каждым, исправь сразу.

## Шаг 1 — Хардкод

```bash
grep -rE '#[0-9a-fA-F]{3,8}' src/ --include='*.tsx' --include='*.ts' --include='*.css' | grep -v 'shared/ui/'  # хексы
grep -rE '\[[0-9]+px\]' src/ --include='*.tsx' --include='*.ts'                                                 # px в Tailwind
grep -rE 'style=\{\{' src/ --include='*.tsx'                                                                    # inline-стили
grep -rE 'font-\[[A-Z]' src/ --include='*.tsx'                                                                  # шрифты в коде
```

В `pages/widgets/features` → заменить на токен DESIGN.md или вариант компонента UI-кита. В `shared/ui/` допустимо только в базовом определении, лучше тоже через токены. Покажи список нарушений и план замены.

## Шаг 2 — Только UI-кит

```bash
grep -rnE '<(button|input|select|textarea)[ >]' src/pages/ src/widgets/ src/features/ --include='*.tsx'
```

Находки → `<Button>`, `<Input>`, `<Select>`, `<Textarea>` из `shared/ui/`.

## Шаг 3 — Курсоры

```bash
grep -rE '<button|onClick|onMouseDown' src/shared/ui/ --include='*.tsx' | grep -v 'cursor-'
grep -rE '<div[^>]*onClick' src/pages/ src/widgets/ src/features/ --include='*.tsx' | grep -v 'cursor-'
```

Каждая строка — интерактив без `cursor-pointer`: добавь в базовый класс `cva()` (+ `disabled:cursor-not-allowed`).

## Шаг 4 — FSD-импорты

```bash
for layer in features entities widgets; do
  for slice in src/$layer/*/; do
    name=$(basename "$slice")
    grep -rnE "from ['\"]@/$layer/" "$slice" | grep -vE "@/$layer/$name(['\"/]|$)" | grep -v '@x'
  done
done
```

Нашлось → общий код ниже (`entities/` или `shared/`) или паттерн `@x`.

## Шаг 5 — Обвязка и навигация

```bash
ls src/app/**/layout.tsx 2>/dev/null || echo "НЕТ сегментного layout"
grep -rnE "from ['\"]@/widgets/(header|sidebar|footer)" src/pages/ --include='*.tsx'
grep -rnE '<(Header|Sidebar|Footer)\b' src/pages/ --include='*.tsx'
grep -rnE '<a [^>]*href="/' src/pages/ src/widgets/ src/features/ --include='*.tsx'
```

- Нет сегментного layout или Header/Sidebar рендерятся в страницах → перенести в `src/app/(app)/layout.tsx`.
- Внутренняя ссылка через `<a href="/…">` → `<Link>` из `next/link`.
- Живая проверка: переключись между 2–3 внутренними страницами — меню не мигает; в DevTools → Network при переходе по `<Link>` нет запроса документа целиком.

## Шаг 6 — Визуальная сверка (блокирующая)

`npm run dev`. Для каждого экрана из `spec.md`. Без Playwright MCP — тот же Playwright скриптом через `npx playwright`.

**Режим A:** пары `docs/figma-snapshots/<screen>.png` ↔ `docs/local-snapshots/<screen>.png` (нет — пересоздай: `get_screenshot` Figma frame + Playwright `browser_take_screenshot`). Сверка: layout, пропорции блоков, отступы и padding, цвета, типографика, иконки и картинки. Любое расхождение — баг, чинить.

**Режим Б/В:** Playwright на 320×800, 768×1024, 1440×900. На каждой ширине: текст не вылезает; нет подозрительно узких/широких блоков и горизонтального скролла; грид/флекс перестраиваются; ширина кнопок адекватна (форм-кнопки full-width, action — нет); картинки пропорциональны; длинный текст переносится; tap-таргеты ≥ 44×44; sticky/fixed не перекрывают контент. Extreme content на 1440: короткое и длинное имя, список из 1 и 100, пустой список, длинный email в форме.

Итог в чат:

```
Визуальная сверка — пройдена
Режим: A / Б/В · Экранов: N · Расхождений с макетом починено: M · Проблем адаптива починено: K
```

Расхождения, оставленные с обоснованием, — в `docs/visual-deviations.md`.

## Шаг 7 — Прокликивание

По основным экранам (главная, login/signup, профиль, основной флоу, настройки): default с данными; все кнопки дают реакцию; loading (задержка в моке), empty (пустой массив), error (ошибка из мока) видны; адаптив mobile + desktop. Скриншоты desktop + mobile ключевых экранов — в `docs/screenshots/`.

## Шаг 8 — Контраст

В `DESIGN.md` у каждого фонового цвета есть `on-*` пара (`primary`/`on-primary`, `background`/`foreground`). Нет — добавь. Контраст: ≥ 4.5:1 для обычного текста, ≥ 3:1 для крупного (≥ 18px или ≥ 14px bold) и UI-элементов. Проверка: `npx @google/design.md lint docs/DESIGN.md` или вручную (contrast-ratio.com).

## Шаг 9 — Анимации

```bash
grep -rE 'duration-\[[0-9]+ms\]' src/ --include='*.tsx'
grep -rE 'transition:[^;]+[0-9]+ms' src/ --include='*.css' --include='*.scss'
grep -rE '@media.*prefers-reduced-motion' src/ --include='*.css'
```

Хардкод длительностей → токены в DESIGN.md (`duration-fast: 150ms`, `duration-normal: 250ms`, `duration-slow: 400ms`) и в коде `duration-[var(--animation-duration-normal)]`. Есть заметные анимации и нет reduced-motion → добавить:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

## Шаг 10 — Тёмная тема (если планируется в DESIGN.md / spec.md)

- Tailwind v3: `darkMode: 'class'` в `tailwind.config`; v4: dark-вариант настроен в CSS (`@custom-variant dark` или `prefers-color-scheme`).
- Нет хексов в `dark:`-классах: `grep -rE 'dark:.*#[0-9a-fA-F]' src/ --include='*.tsx'`.
- У каждого цветового токена DESIGN.md есть dark-значение.

Тёмная тема не планируется → зафиксируй это решение в `docs/memory/state.md`.

## После выполнения

1. Покажи: найденные нарушения и что починено, скриншоты основных экранов, открытые вопросы.
2. Нерешённое — в `docs/prototype-issues.md`.
3. В `docs/memory/state.md`: прототип проверен, список экранов, платформа, готовность к деплою.

## Чек-лист «прототип закончен»

- [ ] Спека совпадает с кодом (экраны / поведение / данные / стек)
- [ ] `DESIGN.md` есть, lint проходит, все `on-*` заданы, контраст ≥ 4.5:1
- [ ] `shared/ui/` содержит минимум Button, Input, Card, Modal, Tabs с вариантами и состояниями
- [ ] `src/` по 6 слоям FSD, импорты только вниз
- [ ] Обвязка в `src/app/(app)/layout.tsx`, переходы через `<Link>`, меню не перезагружается
- [ ] Каждая сущность — слайс в `entities/` со своим моком; каждый экран — страница
- [ ] Все состояния (default/loading/empty/error) реализованы
- [ ] Grep по hex/px/inline-стилям/raw HTML чистый
- [ ] Анимации без хардкода длительностей; решение по тёмной теме зафиксировано
- [ ] Визуальная сверка пройдена для каждого экрана
- [ ] `npm run dev` запускается, экраны кликаются

Картинки (sharp, `sizes`, авто-сжатие) — `design/prompts/image-optimization.md`.
