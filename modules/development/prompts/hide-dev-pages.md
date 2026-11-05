# Hide Dev Pages — витрина UI-кита и dev-страницы недоступны на проде

Запускай перед публичным запуском / фиксацией MVP, если в приложении есть `/style-guide`, showcase, playground или `__dev`-маршруты. Результат: на проде 404, в dev всё работает. Код витрины не удаляется.

Нужно на входе: Next.js-приложение с dev-страницами.

Принцип: страница видна при `NODE_ENV !== "production"`, на проде — 404. Гейт на серверном слое (`layout.tsx` сегмента или серверный `page.tsx`), чтобы прод не рендерил витрину вообще.

## Промт

```
Закрой витрину UI-кита /style-guide (и другие dev-only страницы) на проде — 404, но в
dev работает. Код витрины не удаляй, только гейт показа.

1. Найди dev-страницы во всех приложениях (в монорепо — development/apps/*/src/app/,
   иначе src/app/): style-guide/ (App Router) или pages/style-guide.tsx (Pages Router),
   плюс showcase / playground / __dev маршруты. Покажи список перед правкой.

2. App Router — серверный гейт, предпочтительно layout сегмента:

   // src/app/style-guide/layout.tsx
   import { notFound } from "next/navigation";

   export default function StyleGuideLayout({ children }: { children: React.ReactNode }) {
     if (process.env.NODE_ENV === "production") notFound();
     return children;
   }

   Без layout — тот же гейт в начале page.tsx (серверный компонент, не "use client").

3. Pages Router — в getStaticProps/getServerSideProps:
   if (process.env.NODE_ENV === "production") return { notFound: true };

4. Индексация: на странице витрины robots noindex, nofollow
   (export const metadata = { robots: { index: false, follow: false } }).
   /style-guide нет в sitemap.xml и не разрешён в robots.txt.

5. Витрина — отдельный статический HTML (не маршрут Next) — закрой на уровне
   сервера/прокси (nginx/Caddy): на проде 404.

ПОКАЖИ МНЕ:
- список dev-страниц и какой гейт на каждой;
- diff;
- проверку: `npm run dev` → /style-guide открывается; `npm run build && npm start`
  (NODE_ENV=production) → /style-guide отдаёт 404.
```

## Edge cases

- Preview / staging, где витрина нужна, — гейт по своей переменной (`SHOW_STYLE_GUIDE=true`), задать только в preview.
- Альтернатива 404 — доступ к витрине только админу на проде (сложнее; для MVP обычно хватает 404).
- Витрину удалили совсем — проверить битые ссылки на `/style-guide` (footer, dev-меню) и sitemap.
- После правки обязательно проверить, что в dev витрина открывается.
