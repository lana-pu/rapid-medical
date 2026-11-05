# PWA — manifest, иконки, service worker, офлайн, push

Запускай, когда продукт нужно устанавливать на главный экран и/или нужен офлайн-кэш и быстрые переключения.

Нужно на входе: продукт на HTTPS; решение, где живёт приложение — подстраница `/app` или поддомен `app.` (`development/prompts/app-domain-placement.md`); иконки (тот же источник, что favicon — `seo-geo/prompts/seo-meta.md`).

Пути: в монорепо PWA ставится в приложение продукта `development/apps/app/...` (устанавливают сервис, не лендинг); редирект-компонент лендинга — в `development/apps/landing/...`. Одно приложение — `src/...` и `public/...`.

Минимум PWA: HTTPS, `manifest.json` с иконками, service worker, подключение в `<head>`.

## 1. manifest.json

`development/apps/app/public/manifest.json` (вариант «подстраница»):

```json
{
  "name": "<Полное название продукта>",
  "short_name": "<Продукт>",
  "description": "<Что делает продукт, одним предложением>",
  "id": "/app",
  "start_url": "/app",
  "scope": "/",
  "display": "standalone",
  "background_color": "<токен фона из DESIGN.md>",
  "theme_color": "<токен theme из DESIGN.md>",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**`start_url` / `scope` / `id`:**
- **Подстраница** (`/` — лендинг, `/app` — продукт): `start_url: "/app"` (иконка открывает сразу продукт, не лендинг); `scope: "/"` (переходы на публичные страницы остаются в окне приложения; сужать до `/app` нельзя); `id: "/app"` — стабильный идентификатор установки, чтобы правки `start_url` не плодили дубли.
- **Поддомен** (`app.<домен>`): `start_url: "/"`, `scope: "/"`, `id: "/"` относительно поддомена. Раздел «Переключение лендинг ↔ приложение» не нужен — хосты уже разведены.

**Иконки:** `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (512×512 с safe area для Android adaptive icons). Набор генерирует `realfavicongenerator.net`.

## 2. Переключение лендинг ↔ приложение (только «подстраница»)

1. Залогинен и зашёл на `/` — серверный редирект в `/app`.
2. Запущено как установленное PWA и попало на `/` — клиентский компонент определяет `display-mode` и уводит в `/app`.
3. Гость на `/app` — guard (`middleware.ts`) отправляет на `/login`.

```tsx
// development/apps/landing/src/app/page.tsx — лендинг (серверный компонент)
import { redirect } from 'next/navigation'
import { getSession } from '@/shared/lib/auth'

export default async function LandingPage() {
  const session = await getSession()
  if (session) redirect('/app')
  return (
    <>
      <PwaRedirect />
      <Landing />
    </>
  )
}
```

```tsx
// development/apps/landing/src/app/_components/pwa-redirect.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PwaRedirect() {
  const router = useRouter()
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true // iOS Safari
    if (isStandalone) router.replace('/app')
  }, [router])
  return null
}
```

## 3. Подключение в layout

```tsx
// development/apps/app/src/app/layout.tsx
export const metadata = {
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: '<Продукт>' },
}
export const viewport = { themeColor: '<токен theme из DESIGN.md>' }
```

Или в `<head>`: `<link rel="manifest" href="/manifest.json" />`, `<meta name="theme-color" …>`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`.

## 4. Service worker

Через `next-pwa` (или совместимый форк под актуальную версию Next.js):

```bash
npm install next-pwa
```

```ts
// development/apps/app/next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  fallbacks: { document: '/offline' },
})
module.exports = withPWA({ /* настройки Next.js */ })
```

Генерирует `public/sw.js`.

**Стратегия кэширования:**
- Хэшированная статика (JS, CSS, шрифты, иконки, картинки) — `CacheFirst` / `StaleWhileRevalidate`.
- HTML и API — `NetworkFirst`, кэш только как fallback офлайн. Не накрывать HTML и API `CacheFirst`-ом.
- Отображаемые GET-данные (списки, профиль) — `StaleWhileRevalidate` для мгновенного показа. Изменяющие запросы (POST/PUT/DELETE) и приватное — только сеть.

```ts
runtimeCaching: [
  { urlPattern: ({ request }) => request.destination === 'document',
    handler: 'NetworkFirst', options: { cacheName: 'pages' } },
  { urlPattern: /\/api\/(feed|catalog|profile)/,
    handler: 'StaleWhileRevalidate', options: { cacheName: 'data' } },
  { urlPattern: /\/_next\/static\//,
    handler: 'CacheFirst', options: { cacheName: 'static' } },
]
```

Кэш service worker дополняет кэш nginx/CDN (оба отдают `/_next/static/` надолго).

**Офлайн — для всех посетителей** (SW регистрируется у любого, кто открыл сайт):
- Страница `development/apps/app/src/app/offline/page.tsx` (логотип, «Нет сети — часть данных доступна из кэша», кнопка «Обновить»), отдаётся через `fallbacks.document`.
- Прекэш оболочки и ключевых маршрутов; критичные публичные страницы — `StaleWhileRevalidate` в `runtimeCaching`.

**Быстрые переключения страниц:**
- Общие элементы (навигация, sidebar, шапка, провайдеры) — в `layout.tsx` сегмента, не в каждой `page.tsx`.
- Внутренние переходы — `next/link` (префетч).
- Клиентские данные — SWR / TanStack Query с кэшем.

## 5. Тонкости

Safe-area для notch на iOS:

```css
/* development/apps/app/src/app/globals.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

## 6. Push-уведомления — спроси, нужны ли

Когда базовый PWA готов, спроси: нужны ли push-уведомления на устройство (даже когда приложение закрыто) — напоминания, ответы, смена статуса. Нет — пропусти.

Важно: на iOS push только в установленном PWA (iOS 16.4+); разрешение спрашивать по действию пользователя через мягкий пре-промт, не на загрузке; подписку хранить на сервере.

```
Помоги добавить web-push уведомления в PWA. Стек — Next.js (App Router) + service
worker из next-pwa. Источник — docs/spec.md (за какие события пуш) и схема БД.
Чего не хватает — спрашивай.

СНАЧАЛА СПРОСИ МЕНЯ:
1. За какие события шлём пуш (2-4 конкретных триггера из spec.md)?
2. Куда сохранять подписки (таблица пользователей)?

ПОСЛЕ ОТВЕТОВ:
1. VAPID: `npx web-push generate-vapid-keys`, в .env приложения: VAPID_PUBLIC_KEY,
   VAPID_PRIVATE_KEY (приватный — НЕ NEXT_PUBLIC).
2. Таблица push_subscriptions (userId, endpoint unique, p256dh, auth, createdAt) +
   миграция.
3. Клиент: кнопка «Включить уведомления» в нужном месте продукта (не на лендинге и
   не на загрузке); по клику Notification.requestPermission(); при 'granted' —
   registration.pushManager.subscribe({ userVisibleOnly: true,
   applicationServerKey: <VAPID_PUBLIC_KEY> }); POST на /api/push/subscribe →
   в БД; состояния: не спрашивали / разрешено / заблокировано (с подсказкой, как
   разблокировать).
4. Service worker: свой код через swSrc / отдельный воркер (чтобы не затёрся
   генерацией): 'push' → showNotification(title, body, icon, badge, data.url);
   'notificationclick' → clients.openWindow(url).
5. Сервер: функция отправки через web-push (setVapidDetails + sendNotification),
   привязана к реальному триггеру; подписки с 410/404 удалять.
6. Зафиксируй: ADR «push» (зачем, какие события), раздел «Push» в docs/spec.md,
   строка в docs/memory/INDEX.md.

ПОКАЖИ МНЕ:
- кнопку и подписку в БД;
- реальный тестовый пуш: пришёл, клик открыл экран;
- предупреждение в UI для iOS вне установленного PWA.
```

## Проверка

1. Установка: iPhone (Safari → Поделиться → «На экран Домой»), Android (Chrome → «Установить»), Desktop (Chrome/Edge → «Установить») — открывается без браузерной строки.
2. `https://<домен>/manifest.json` отдаётся; service worker зарегистрирован (DevTools → Application).
3. Точка входа: **подстраница** — иконка открывает `/app`; залогиненный с `/` попадает в `/app`; гость на `/` видит лендинг; гость на `/app` уходит на `/login`. **Поддомен** — иконка открывает корень `app.<домен>`; вход на лендинге переносится через общую cookie.
4. Офлайн в обычном браузере: DevTools → Network → Offline, перезагрузить — открытые страницы из кэша, остальные — `/offline`; переходы мгновенные, навигация не перерисовывается.
5. В `docs/spec.md` раздел «PWA»: что поддерживаем, версия manifest, `start_url`, переключение лендинг ↔ приложение, офлайн-стратегия, push (если делали).
