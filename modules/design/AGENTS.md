# design — дизайн-система, UI-кит, экраны, адаптив, лендинг

Цепочка всегда одна: `docs/DESIGN.md` → UI-кит (`src/shared/ui/` или пакет UI в монорепо) → экраны.
Правила: `../../rules/design-system-first.md`, `../../rules/ui-components-first.md`.

## Порядок для нового интерфейса
`design-system` → `ui-kit` → (`figma-code-connect`) → `fsd-architecture` → `screen-visual-spec` →
`screens-prototype` → `responsive-audit` → `ux-audit` → `image-optimization`.

| Когда | Файл |
|---|---|
| Нет `docs/DESIGN.md`: собрать дизайн-систему из Figma или интервью | `prompts/design-system.md` |
| После DESIGN.md: UI-кит и витрина `/style-guide` | `prompts/ui-kit.md` |
| В Figma есть библиотека компонентов — связать с UI-китом | `prompts/figma-code-connect.md` |
| Перед экранами: разложить `src/` по слоям FSD | `prompts/fsd-architecture.md` |
| Перед экранами: поэкранный контракт «логика + визуал» | `prompts/screen-visual-spec.md` |
| Собрать экраны кликабельным прототипом на моках | `prompts/screens-prototype.md` |
| Экраны собраны: адаптив 320–1920 всего продукта, экстремальный контент | `prompts/responsive-audit.md` |
| Перед запуском: адаптив лендинга и публичных страниц (размеры + соотношения сторон) | `prompts/adaptive-audit.md` |
| Перед деплоем: битые кнопки, тупики, экраны без входа (статический аудит по коду) | `prompts/ux-audit.md` |
| Появились картинки: sharp, AVIF/WebP, авто-сжатие, `sizes` | `prompts/image-optimization.md` |
| Сверстать лендинг по брифу и задеплоить отдельно | `prompts/landing-build.md` |
| Меняется цвет, шрифт, отступ, вариант компонента или макет Figma | `prompts/design-change.md` |

Связанное: бриф лендинга — `../product/prompts/landing-research-brief.md`; ручной прогон в браузере —
`../development/prompts/ux-testing.md`; хук против хардкода — `../development/prompts/hardcode-guard-hook.md`.
