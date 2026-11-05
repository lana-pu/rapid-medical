# Auth — регистрация, логин, сессии, защита роутов

Запускай, когда в продукте нужен вход пользователей. Результат: регистрация и логин по email + пароль работают локально и на проде, сессии хранятся в БД (не JWT-only), приватные роуты защищены.

Нужно на входе: подключённая БД и ORM (`db-schema-migrations-seed.md`), формы логина/регистрации в UI (или сделай их).

Стек по умолчанию: better-auth + Prisma + Next.js App Router. Если в проекте уже есть auth-библиотека или выбран auth провайдера БД (напр. Supabase Auth) — адаптируй шаги под неё. Официальная документация библиотеки приоритетнее примеров ниже — API меняется.

## 0. ADR выбора библиотеки
Создай `docs/memory/decisions/ADR-<N>-auth-library.md` (Context, Decision, Alternatives, Consequences, Status, Date). Рекомендация по умолчанию — better-auth (современная, активно развивается). Альтернативы: NextAuth/Auth.js, Clerk, Supabase Auth, свой auth. Добавь строку в `docs/memory/INDEX.md`.

## 1. Установка
`npm install better-auth`

## 2. Модели сессий в схеме
Точную схему под твою версию сгенерируй официальным CLI: `npx @better-auth/cli generate` — и сверь с ориентиром:

```prisma
model User {
  // ... существующие поля
  sessions Session[]
  accounts Account[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Account {
  id           String    @id @default(cuid())
  userId       String
  provider     String    // 'email', 'google', 'github'
  providerId   String
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerId])
  @@index([userId])
}

model Verification {
  id         String   @id @default(cuid())
  identifier String   // email/ключ, к которому привязан токен
  value      String   // токен
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([identifier])
}
```
Модель `Verification` обязательна — без неё не работают подтверждение email, сброс пароля и вход по коду.
Миграция: `npx prisma migrate dev --name auth-schema`.

## 3. Конфиг — `src/shared/lib/auth.ts`

```ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '@/shared/db'

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Спроси пользователя и реши по spec.md:
    // true — публичная регистрация, нужны подтверждённые адреса (письмо verify-email — см. account-emails.md);
    // false — закрытый/админский доступ или регистрация без подтверждения.
    requireEmailVerification: false,
    // колбэки sendVerificationEmail / sendResetPassword подключаются вместе с письмами аккаунта
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,  // 30 дней
    updateAge: 60 * 60 * 24,        // продление раз в сутки активности
    cookieCache: { enabled: true },
  },
  secret: process.env.BETTER_AUTH_SECRET!,   // имя переменной — по конвенции выбранной библиотеки
  baseURL: process.env.BETTER_AUTH_URL!,
})
```

## 4. API-роут
`src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from '@/shared/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
export const { GET, POST } = toNextJsHandler(auth)
```
Обрабатывает все `/api/auth/*`: sign-up, sign-in, sign-out, session.

## 5. Секреты
Сгенерируй сам (`openssl rand -base64 32`), разные для dev и прода:
- `.env.local`: `BETTER_AUTH_SECRET=<…>`, `BETTER_AUTH_URL=http://localhost:3000`;
- `.env.production` на сервере: `BETTER_AUTH_SECRET=<другой>`, `BETTER_AUTH_URL=https://<domain>`.

## 6. Формы логина и регистрации — реальные вызовы
Создай клиент `src/shared/lib/auth-client.ts` (по доке библиотеки). В фиче логина:

```ts
import { authClient } from '@/shared/lib/auth-client'

export async function login(email: string, password: string) {
  const { data, error } = await authClient.signIn.email({ email, password, callbackURL: '/dashboard' })
  if (error) throw new Error(error.message)
  return data
}
```
Регистрация — аналогично через `authClient.signUp.email(...)`. В формах:
- валидация формата email и пароля ≥ 8 символов;
- конкретное сообщение об ошибке от API (не «Ошибка»);
- loading-состояние во время запроса;
- при успехе — редирект в приложение (`/dashboard` или главный экран по спеке).

## 7. Защита роутов — middleware
Дополни `src/middleware.ts` (если там уже есть rate limit — сохрани его):

```ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  // ... существующий rate limit — без изменений

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')
  const isAppRoute = path.startsWith('/dashboard') || path.startsWith('/settings') /* || приватные разделы из spec */

  const session = await getSession(request)   // точный helper — из доки библиотеки

  if (isAppRoute && !session) return NextResponse.redirect(new URL('/login', request.url))
  if (isAuthRoute && session) return NextResponse.redirect(new URL('/dashboard', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/login', '/register', '/api/:path*'],
}
```
Middleware — первый рубеж; серверные страницы и API всё равно проверяют сессию сами.

## 8. Проверка
Локально (`npm run dev`), затем после деплоя — на проде:
- регистрация нового email → попадание в приложение;
- перезагрузка — сессия сохраняется;
- выход → редирект на публичную страницу;
- открытие приватного роута без сессии → редирект на `/login`.

Обнови `docs/spec.md` (раздел доступов/auth: кто регистрируется, подтверждение email, что приватно) и `docs/memory/infrastructure.md` (раздел «Auth» — см. `update-infrastructure-memory.md`).

В конце покажи: ADR, результат четырёх проверок на проде.

Дальше по необходимости: письма аккаунта — `account-emails.md`; защита auth — `auth-security-hardening.md`; изоляция данных и кабинет — `account-settings-and-notifications.md`.

## Нюансы

- Конфликт с существующим роутингом — следуй официальной доке библиотеки.
- На проде `BETTER_AUTH_URL` обязательно `https://`, иначе cookie не выставится.
- Cookie не выставляется — проверь, что nginx пропускает `Set-Cookie` (иногда нужен явный `proxy_pass_header Set-Cookie`).
