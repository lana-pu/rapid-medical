# ADR-002 — Регион в пути URL, а не в cookie/поддомене

- **Статус:** принято (ретроспективно, по README и `src/proxy.ts`, код `59169da`)

## Контекст
На Duda регионы жили на поддоменах `us.` / `ous.` / `apac.` с жёстким гео-редиректом. Регуляторные тексты
(индикации, доступность продуктов) различаются по регионам.

## Решение
- Один хост, регион — первый сегмент пути: `/us/…`, `/ous/…`, `/apac/…`.
- Терапии хранятся строкой на пару `(slug, region)` (`solutions_slug_region` unique).
- Старые поддомены → 301 на путь (`src/proxy.ts`, `LEGACY_HOSTS`).
- Cookie `rm_region` — только память о последнем регионе для меню «Our Therapies»; `rm_geo` — подсказка
  по стране посетителя, без принудительного редиректа.

## Обоснование
README: «Region is **in the path**, not in a cookie, so Google indexes US and OUS regulatory text separately.»
«Duda did a hard geo-redirect, we only suggest.»

## Последствия
- Глобальные страницы (`/about-us`, `/contact-us`, `/news-events`) — без региона; регион передаётся
  query-параметром (`/contact-us?region=us`).
- Сегмент `[seg]` перегружен: регион или slug глобальной страницы (`src/app/(site)/[seg]/page.tsx`).
- Разметка `hreflang`/альтернатив между регионами в коде не найдена — открытый вопрос SEO (BACKLOG).
