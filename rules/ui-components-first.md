# UI Components First — всё через компоненты, без хардкода

## Принцип
Любой UI собирается из компонентов UI-кита (`src/shared/ui/`; в монорепо — общий пакет
`packages/ui`, до сборки кита — `components/ui/`). Хардкод классов в страницах, фичах,
виджетах запрещён. Меняется визуал → меняется компонент, а не место использования.

## Жёсткие правила

1. Все базовые элементы — компоненты UI-кита. Минимум: Button, Card, Input, Textarea,
   Select, Checkbox, Radio, Switch, Badge, Avatar, Modal, Dialog, Tabs, Tooltip, Toast,
   Skeleton, EmptyState, ErrorState.
2. Состояния (hover, focus, disabled, loading) — внутри компонента, не на местах использования.
3. Темизация только через токены из `docs/DESIGN.md`:
   - ✅ `bg-primary`, `text-foreground`, `rounded-md`
   - 🔴 `bg-[#1A1C1E]`, `text-white`, `rounded-[6px]`
   Нужного токена нет — сначала добавить токен в DESIGN.md, потом использовать.
4. Хардкод классов в страницах / фичах / виджетах запрещён. Нужного варианта нет —
   добавить variant в существующий компонент.
5. Семантика через композицию (Slot / `asChild`, например Button как ссылка) — не плодить
   LinkButton, AnchorButton и т.п.

## Самопроверка после UI-генерации

После каждой большой UI-генерации:

```bash
grep -rnE '#[0-9a-fA-F]{3,8}\b|\[[0-9]+px\]' src/app src/pages src/widgets src/features src/shared/ui 2>/dev/null
```

Нашлось — переделать через токены или добавить вариант компонента.

## Hook-страховка
`.claude/hooks/post-tool-use-edit.sh` — автоматический grep на хардкод после каждой правки
UI-файла (настройка — `modules/development/prompts/hardcode-guard-hook.md`). Второй слой защиты.
