# DESIGN — Rapid Medical

> **Статус: визуального дизайна нет — намеренно.** Текущий вид — нейтральная заготовка
> (README → Design: «Deliberately neutral… Swap tokens and restyle the primitives when the visual design
> is ready; page templates don't need to change»). Брендовый цвет, шрифты, сетка — **не определены**
> (`--accent` помечен «placeholder – brand color TBD»). Ниже — опись того, что реально есть в коде на `59169da`.

## Как устроено
- **Tailwind 4** (`@import "tailwindcss"`, плагин `@tailwindcss/turbopack`), конфиг-файла нет —
  токены объявлены в `src/app/globals.css` через `:root` + `@theme inline` → утилиты `bg-accent`,
  `text-muted`, `border-border`, `bg-surface` и т.д.
- **Примитивы** — `src/components/site/primitives.tsx`; составные блоки — `src/components/site/blocks/`,
  медиа — `src/components/site/Media.tsx`. Страницы собираются только из них (плюс Tailwind-утилиты
  раскладки).
- Тёмной темы нет. Админка стилизована отдельно, напрямую палитрой Tailwind `neutral-*` (токены не использует).

## Токены (текущие значения)

| Токен | CSS-переменная | Tailwind | Значение | Комментарий |
|---|---|---|---|---|
| Фон | `--background` | `bg-background` | `#ffffff` | |
| Текст | `--foreground` | `text-foreground` | `#111111` | |
| Приглушённый текст | `--muted` | `text-muted` | `#6b6b6b` | |
| Акцент | `--accent` | `bg-accent`, `text-accent` | `#111111` | placeholder, бренд-цвет TBD |
| Текст на акценте | `--accent-foreground` | `text-accent-foreground` | `#ffffff` | |
| Поверхность | `--surface` | `bg-surface` | `#f5f5f5` | |
| Граница | `--border` | `border-border` | `#e5e5e5` | |
| Шрифт | `--font-sans` | `font-sans` | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | системный стек, веб-шрифтов нет |

Типографика и отступы — дефолтная шкала Tailwind (собственных токенов нет). Контейнер `max-w-6xl px-4`,
секция `py-12 md:py-16`.

## Примитивы и блоки

Инвентарь всех секций сайта и предложенный состав коллекции блоков: `memory/findings/block-inventory.md`.

| Компонент | Файл | Что делает |
|---|---|---|
| `Container`, `Section` | primitives | Ширина `max-w-6xl`, вертикальный ритм секций |
| `Eyebrow`, `H1`, `H2`, `Lead` | primitives | Заголовочная иерархия (H1 `text-3xl → md:text-5xl`, H2 `text-2xl → md:text-3xl`) |
| `Btn` (`primary` / `secondary`) | primitives | primary — `bg-accent`; secondary — обводка `foreground`. Внешние ссылки → `<a>` |
| `Img` | primitives | `srcset` WebP-вариантов, размеры, blur-плейсхолдер для файлов медиатеки; пустой `src` → серый блок |
| `Prose` (+ `.prose-rm`, `.prose-rm-sm`) | primitives, globals.css | Вывод санитизированного rich text |
| `Video`, `MediaBlock`, `Embed`, `VideoHero` | Media.tsx | Фон-видео с затемнением `bg-black/50`, YouTube-embed, автопостер |
| `Tabs` (`pills` / `underline`) | Tabs.tsx | Пилюли на десктопе, аккордеон на мобильном |
| `StatRow`, `StatBadge`, `StatCircles` | blocks/Stats.tsx | Счётчики, «47% FPE»-круги |
| `BarChart` | blocks/BarChart.tsx | SVG-графики bar / stackedBar (вместо скриншотов) |
| `FeatureGrid`, `AnnotatedImage`, `PracticeList`, `Banner`, `Gallery`, `Principles` | blocks/Blocks.tsx | Блоки страниц терапий / карьеры |
| `Carousel`, `NewsTimeline` | blocks/ | Карусель, лента по годам |
| `SpecTableView` | SpecTable.tsx | Таблица спецификаций |
| `WorldMap` | WorldMap.tsx | Интерактивная карта (d3-geo, данные `public/map/countries-50m.json`) |

## Отступления от токенов (хардкод, по коду)
- Тёмные полосы и hero: `bg-neutral-900`, `bg-black`, `text-white`, оверлей `bg-black/50` — therapy page,
  `Banner`, `VideoHero`.
- Ошибки формы: `bg-red-50`, `text-red-600/700`.
- `WorldMap.tsx`: инлайн-хексы `#0b1420`, `#121b29`, `#26354d`, `#289988`, `#2fd17b`, `#fff`.
- Редактор/админка: `amber`, `emerald`, `blue`, `green` из палитры Tailwind; `#a3a3a3`, `#2563eb`,
  `#e0ecff` в стилях Tiptap (`globals.css`).
Это кандидаты на токены при редизайне (BACKLOG).

## Будущий дизайн
_Плейсхолдер._ Заполнить, когда появится дизайн: бренд-палитра (акцент, вторичные, семантические
success/warning/error), тёмные поверхности (сейчас `neutral-900`/`black`), типографика (шрифт, шкала,
межстрочные), сетка и брейкпоинты, радиусы, тени, motion (видео-фоны, карусели), иконки, правила
доступности (контраст, фокус). Источник макетов, сроки и ответственный — не определены
(см. BACKLOG → Решения за владельцем). Порядок изменений: DESIGN.md → токены в `globals.css` →
примитивы/блоки → страницы.
