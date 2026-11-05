# Индексация и AI-поиск (GEO): robots, sitemap, noindex, llms.txt, schema.org

Запускай перед публичным запуском сайта и при появлении новых публичных разделов.

Нужно на входе: публичный сайт/лендинг на Next.js и прод-домен; решение, где живёт приложение (`/app` или поддомен — `development/prompts/app-domain-placement.md`).

Пути: в монорепо публичная индексация (`robots.txt`, `sitemap.ts`, `llms.txt`, schema.org) — в приложении лендинга `development/apps/landing/...`, `noindex` внутренних страниц — в сервисе `development/apps/app/...`. Одно приложение — корень `src/` и `public/`. Приложение на поддомене — у `app.<домен>` свой robots.txt с `Disallow: /`.

## Принцип

- Лендинг и публичные страницы (FAQ, блог, цены, юридические) — открыты.
- Страницы продукта (кабинет, дашборд, настройки) — закрыты.
- Технические (API, admin) — закрыты.

## robots.txt

`development/apps/landing/public/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /app/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /settings/

Sitemap: https://<домен>/sitemap.xml
```

## noindex на внутренних страницах

```tsx
// development/apps/app/src/app/(app)/layout.tsx — layout всех страниц за логином
export const metadata = {
  robots: { index: false, follow: false },
}
```

Применяется ко всем страницам внутри `(app)/`.

## sitemap

`sitemap.ts` в Next.js — функция, собирающая список из реальных маршрутов; руками не правится.

- Статичные публичные страницы (`/`, `/pricing`, `/privacy`, `/terms`, `/cookies`) — массив.
- Динамический контент (блог, публичные профили, каталог) — из источника (БД / CMS / файлы), с реальными `updatedAt` (не `new Date()`); если тянется на каждый запрос — добавить `revalidate`.
- Внутренние разделы (`/app`, `/dashboard`, `/admin`) в sitemap не кладём.

```ts
// development/apps/landing/src/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/shared/lib/posts' // источник динамики, если есть

const base = 'https://<домен>'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/pricing', '/privacy', '/terms', '/cookies'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }))

  const posts = await getPublishedPosts()
  const postRoutes = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...postRoutes]
}
```

Динамики нет — только статичный массив.

## AI-поиск (GEO/AEO) — СНАЧАЛА спроси

Спроси: «Хотите, чтобы продукт находили и цитировали AI-ассистенты и AI-поиск (ChatGPT, Perplexity, Claude, Google AI Overviews)? Или держим приватнее — только обычная индексация?»

**«Приватнее»** — GEO не добавляем. Если нужно закрыться от обучения AI — в `robots.txt`:

```
User-agent: GPTBot
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: PerplexityBot
Disallow: /
```

**«Хочу, чтобы находили»** — сделай всё, не переспрашивая по пунктам:

1. **`llms.txt`** в `development/apps/landing/public/llms.txt` — Markdown-карта продукта для LLM: что это, для кого, главная ценность, ссылки на ключевые публичные страницы (лендинг, фичи, цены, FAQ, блог) с одной строкой описания. Факты — из `docs/landing-brief.md` и `docs/spec.md`, без выдумок. По возможности — `llms-full.txt` с полным текстом ключевых страниц.
2. **JSON-LD schema.org** в `layout.tsx` / на лендинге (`<script type="application/ld+json">`): `Organization` или `SoftwareApplication` (название, описание, URL, логотип); `WebSite` с `potentialAction: SearchAction` (если есть поиск); `FAQPage` из FAQ лендинга (один-в-один); `BreadcrumbList` для вложенных публичных страниц. Разметка = видимый контент, иначе спам-сигнал.
3. **robots.txt** — явно не закрывать GPTBot / Google-Extended / PerplexityBot / ClaudeBot.
4. **Контент под ответы (AEO)** — заголовки-вопросы, прямой ответ в первом абзаце, короткое определение «что такое <продукт>», FAQ с самодостаточными ответами.
5. **Sitemap** с публичными URL — вход для AI-краулеров.

В Claude Code можно прогнать скиллами `ai-seo` / `seo-geo`, если установлены; иначе вручную по пунктам.

Выбор (приватно / GEO) зафиксируй в `docs/spec.md` (раздел «SEO»).

## Проверка после деплоя

```bash
curl https://<домен>/robots.txt
curl https://<домен>/sitemap.xml
curl -I https://<домен>/dashboard | grep -i x-robots
```

- `robots.txt` доступен;
- `sitemap.xml` содержит только публичные URL;
- на `/dashboard` — `X-Robots-Tag: noindex` или `<meta name="robots" content="noindex">`;
- при GEO: `curl https://<домен>/llms.txt` отдаётся, JSON-LD валиден (https://validator.schema.org/ или https://search.google.com/test/rich-results).

## Вебмастерские

- Google Search Console (https://search.google.com/search-console): добавить домен, подтвердить (DNS-запись или meta tag), отправить sitemap.xml; индексация лендинга — 1–7 дней.
- Yandex Webmaster (https://webmaster.yandex.ru) — если аудитория в РФ/СНГ: то же самое.
- Bing Webmaster Tools — по желанию (питает часть AI-поиска).

## Результат

1. Показать: robots.txt доступен, sitemap только с публичными страницами, `/dashboard` с noindex.
2. Домен в Google Search Console (+ Yandex Webmaster по аудитории), sitemap отправлен.
3. В `docs/spec.md` (раздел «SEO»): список индексируемых страниц + выбор по AI-поиску.
