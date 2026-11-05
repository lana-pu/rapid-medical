# SEO-мета: favicon, Open Graph, title, description

Запускай перед публичным запуском и после появления новых экранов. Делается для ВСЕХ приложений продукта — и лендинга, и сервиса: у сервиса тоже нужны favicon, apple-touch-icon, OG-превью и свой title/description на каждом экране.

Нужно на входе: Next.js-приложение(я); `docs/DESIGN.md`; желательно `docs/landing-brief.md` и `docs/screens/<экран>.md`.

Пути: в монорепо — `development/apps/landing/...` и `development/apps/app/...` (всё, что ниже для лендинга, продублировать в сервис); одно приложение — `src/...` и `public/...`.

## Источник картинок — СНАЧАЛА спроси

Для иконки и для OG источник может быть разным. Варианты:

1. **Figma.** Пользователь даёт ссылку на фрейм. Достань фрейм (иконка — квадратный, OG — 1200×630), экспортни PNG. В Claude Code — через Figma-интеграцию (экспорт ассета по node-id); нет интеграции — попроси PNG файлом.
2. **Готовый файл.** Путь к логотипу / готовой OG. Favicon — через `realfavicongenerator.net` (или набор размеров вручную), OG — привести к 1200×630. Ничего не дорисовывать без спроса.
3. **Генерация из продукта.** Нет ни Figma, ни файла — собери из `DESIGN.md` (цвета, шрифты), логотипа/названия, скриншотов экранов и визуального направления из `landing-brief.md`. Иконка — простая, без мелкого текста (можно image-генерацией: «simple app icon for <продукт>, flat, <цвет>, no text»). OG — логотип + крючок на брендовом фоне (HTML→PNG или Dynamic OG). Покажи 2–3 варианта на выбор.

Не уверен — рекомендация: есть Figma/бренд-ассет → он; нет → генерация из DESIGN.md и скриншотов с подтверждением. Выбранные источники зафиксируй в `docs/spec.md` (раздел «SEO»).

## favicon

Минимальный набор (в `public/` КАЖДОГО приложения):

```
public/
├── favicon.ico              ← 16×16, 32×32, 48×48 в одном файле
├── icon.png                 ← 192×192 (Android)
├── apple-touch-icon.png     ← 180×180 (iOS)
└── favicon.svg              ← векторный (опционально)
```

В `src/app/layout.tsx` каждого приложения:

```tsx
export const metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}
```

## Open Graph

Картинка 1200×630: логотип, короткий заголовок, опционально подзаголовок, брендовый фон, без мелкого текста. Способы: Figma, Canva, AI-генерация, Dynamic OG через Next.js (если нужна под каждую страницу). Файл — `public/og-image.png`.

```tsx
// src/app/layout.tsx
export const metadata = {
  title: '<Продукт> — <ценность одной строкой>',
  description: 'Что делает, для кого, зачем — до 160 символов.',
  openGraph: {
    title: '<Продукт>',
    description: '...',
    url: 'https://<домен>',
    siteName: '<Продукт>',
    images: [{ url: 'https://<домен>/og-image.png', width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '<Продукт>',
    description: '...',
    images: ['https://<домен>/og-image.png'],
  },
}
```

## title + description

- **title**: 50–60 символов, формат `<Продукт> — <главная ценность>`.
- **description**: 140–160 символов; что за продукт, для кого, главная польза; не дублирует title; ключевые слова естественно.

**Per-screen: на лендинге — по желанию (блог, статьи), в сервисе — ОБЯЗАТЕЛЬНО.** Шаблон в `layout.tsx` сервиса: `title: { template: '%s — <Продукт>', default: '<Продукт>' }`. Каждый экран — свой:

```tsx
// статический экран: development/apps/app/src/app/(app)/settings/page.tsx
export const metadata = { title: 'Настройки', description: '...' }

// динамический: development/apps/app/src/app/(app)/orders/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const order = await getOrder(params.id)
  return { title: `Заказ #${order.number}`, description: '...' }
}
```

Тексты — из `docs/screens/<экран>.md`. Пройти все ключевые экраны (auth, dashboard, основной флоу, settings).

## Проверка

- https://www.opengraph.xyz/ — OG-теги.
- https://realfavicongenerator.net/favicon_checker — favicon.
- Пошарить URL в Telegram / Slack.
- Telegram кэширует превью: сбросить через @WebpageBot (https://t.me/WebpageBot). Facebook — Sharing Debugger (developers.facebook.com/tools/debug), LinkedIn — Post Inspector.
- https://search.google.com/test/rich-results — заголовок в выдаче.

## Результат

1. Покажи на ОБОИХ приложениях: иконку во вкладке, превью при шаринге, что у каждого ключевого экрана сервиса свой title.
2. Иконки в `public/` обоих приложений, `metadata` в `layout.tsx` обоих, per-screen title/description на экранах сервиса.
3. В `docs/spec.md` (раздел «SEO»): title, description, источник favicon, источник OG, что мета настроены на лендинге и сервисе.
