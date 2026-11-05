# product — продуктовый этап

Что строим и для кого, спека продукта и экранов, PRD. Результат живёт в `docs/spec.md`, `docs/screens/`,
`docs/PRD.md` проекта.

## Порядок для нового продукта
`product-concept-interview` → `screens-spec-from-figma` **или** `screens-spec-from-sketches-or-idea` →
`spec-review-and-prd`.

| Когда | Файл |
|---|---|
| Старт продукта: интервью «что и для кого» → `spec.md` | `prompts/product-concept-interview.md` |
| Есть Figma: скелет экранов и спека на каждый экран | `prompts/screens-spec-from-figma.md` |
| Нет Figma: экраны по скриншотам, наброскам или с нуля | `prompts/screens-spec-from-sketches-or-idea.md` |
| Спека собрана: сверка, закрытие пробелов, `PRD.md` | `prompts/spec-review-and-prd.md` |
| Меняется поведение, экран, роль, правило, модель данных | `prompts/spec-change.md` |
| Перед лендингом: сегменты, JTBD, оффер, визуальный стиль | `prompts/landing-research-brief.md` |

Связанное: спеки экранов по готовому коду и `_global.md` — `../development/AGENTS.md`;
новая фича целиком (`/new-feature`) — `../development/prompts/new-feature.md`.
