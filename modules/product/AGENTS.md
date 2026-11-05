# product — продуктовый этап

Что строим и для кого, спека продукта и экранов, PRD. Результат живёт в `docs/spec.md`, `docs/screens/`,
`docs/PRD.md` проекта.

## Порядок для нового продукта
Исследование (если нужно): `research-pipeline`, начиная с `research-frame`.
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
| Исследование продукта: этапы от рамки до приоритетов, что дальше, что не сделано — скилл `/research-atlas` | `prompts/research-pipeline.md` |
| Начало ресёрча: какое решение принимаем, вопросы, допущения, рамки, план — скилл `/research-frame` | `prompts/research-frame.md` |
| Контекст и рынок: аудитория, цены, ограничения, темы, требования — скилл `/desk-research` | `prompts/desk-research.md` |
| Конкуренты: карта рынка, профили, за что платят, мы в сравнении — скилл `/competitor-research` | `prompts/competitor-research.md` |
| Как работают сегодня: участники, путь, обходные приёмы — скилл `/current-process` | `prompts/current-process.md` |
| Проблема и решение: точки потерь, метрики, критические допущения — скилл `/problem-solution` | `prompts/problem-solution.md` |
| Что делать первым: таблица приоритетов фич (есть / ресёрч / конкуренты → P0–P2, правки в базе) — скилл `/feature-priorities` | `prompts/feature-prioritization.md` |

Связанное: спеки экранов по готовому коду и `_global.md` — `../development/AGENTS.md`;
новая фича целиком (`/new-feature`) — `../development/prompts/new-feature.md`.
