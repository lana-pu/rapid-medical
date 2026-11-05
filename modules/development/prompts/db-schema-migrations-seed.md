# Схема БД из спеки, миграции, seed

Запускай, когда нужно собрать полную схему данных проекта (все сущности и связи), применить миграции локально и на проде и наполнить базу базовыми и демо-данными.

Нужно на входе: доступный PostgreSQL (свой или managed — см. `db-hosting-choice.md`, `postgres-docker-on-vps.md`); описание данных в `docs/spec.md` / `docs/PRD.md` и/или прототип с типами и моками.

Стек по умолчанию: Prisma + PostgreSQL, Next.js. Если в проекте уже другой ORM/фреймворк (Drizzle и т.п.) — адаптируй команды и код под него. Пути кода — от корня приложения (в монорепо — папка приложения, напр. `apps/app/`).

## 1. Установка ORM

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```
Появятся `prisma/schema.prisma` и `.env`. Если проект использует `.env.local` — перенеси `DATABASE_URL` туда и удали `.env` (при конфликте приоритет у `.env.local`).

## 2. Подключение для локальной разработки
Доступы (IP, пользователь, пароль БД) бери из `docs/memory/infrastructure.md` и `.env.production` — пользователю их в чат вводить не нужно. Предложи на выбор (по умолчанию A):

- **A) SSH-туннель к серверной БД** — не нужен локальный Postgres. Подними сам: `ssh -L 5432:127.0.0.1:5432 <user>@<IP>`; в `.env.local`: `DATABASE_URL=postgresql://<db>:<пароль из .env.production>@127.0.0.1:5432/<db>`.
- **B) Локальный контейнер** (оффлайн):
  ```bash
  docker run -d --name <project>-pg -e POSTGRES_USER=<db> -e POSTGRES_PASSWORD=local_dev \
    -e POSTGRES_DB=<db> -p 5432:5432 postgres:16-alpine
  ```
  `.env.local`: `DATABASE_URL=postgresql://<db>:local_dev@127.0.0.1:5432/<db>`.
- Managed БД — строка подключения из дашборда провайдера.

## 3. Карта модели — до написания схемы
Проанализируй все источники о данных и не пропусти ни одной сущности и связи:
- `docs/spec.md` (модель данных, сценарии, сущности), `docs/PRD.md`;
- типы сущностей прототипа (напр. `src/entities/<entity>/model/types.ts`) и моки (`src/entities/<entity>/api/mock-*.ts`) — какие поля реально нужны UI;
- экраны: формы, фильтры, таблицы — поля, статусы, связи.

Покажи пользователю карту:
- все сущности (таблицы);
- поля с типами и обязательностью;
- все связи (1-1, 1-N, M-N через join-таблицу) и их направление;
- enum'ы (статусы, роли, типы);
- что не нашлось в источниках и додумано — отдельным списком на подтверждение.

## 4. Схема
После подтверждения карты пиши `prisma/schema.prisma`. Базовая модель:

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String?
  emailVerified  DateTime?
  image          String?
  role           Role      @default(USER)
  hashedPassword String?   // null для OAuth-пользователей
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  // связи к предметным сущностям — по карте модели
}

enum Role {
  USER
  ADMIN
}
```

Дальше — ВСЕ предметные сущности из карты целиком, не «несколько для примера». Правила:
- сущность принадлежит пользователю → `userId String` + `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`;
- M-N — явная join-модель (или неявная `@relation`);
- индексы на `userId`, `createdAt` и поля частых фильтров/сортировок;
- `onDelete: Cascade` для зависимых данных;
- enum'ы вместо «магических строк».

Покажи финальную схему до миграции.

## 5. Миграция
После подтверждения: `npx prisma migrate dev --name init` — создаст `prisma/migrations/<timestamp>_init/`, применит к БД, сгенерирует client.
Если в целевой БД уже есть живые данные — не запускай `migrate dev` вслепую (может предложить сбросить базу); согласуй с пользователем.

## 6. Seed — `prisma/seed.ts`
Два вида данных:
1. **Базовые** (без них приложение не работает): справочники, категории, статусы, дефолтные настройки, демо-админ — из `docs/spec.md`. Нужны и на dev, и на проде.
2. **Демо** — записи из моков прототипа, чтобы экраны не были пустыми. Только для dev.

```ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // очистка для повторного запуска — в порядке зависимостей (только dev!)
  await prisma.<entity>.deleteMany()
  await prisma.user.deleteMany()

  const demoUser = await prisma.user.create({
    data: { email: 'demo@example.com', name: 'Demo User', role: 'USER' },
  })

  await prisma.<entity>.createMany({
    data: [{ /* из моков */ userId: demoUser.id }],
  })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

В `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`; `npm install -D tsx`; запусти `npx prisma db seed`. Очистку и демо-данные не запускай против прод-базы.

## 7. Клиент-singleton — `src/shared/db.ts`

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```
Singleton — чтобы hot-reload не плодил соединения. Не включай `query`-лог по умолчанию: на больших объёмах он раздувает логи.

## 8. Миграции на проде
В `deploy.sh` на сервере после поднятия контейнеров:

```bash
docker compose exec -T web npx prisma migrate deploy
```
`migrate deploy` только применяет существующие миграции — безопасно для прода. На проде НИКОГДА не запускай `migrate dev`. Задеплой и убедись, что миграции применились.

## 9. Документация
- В `docs/spec.md` (или `docs/PRD.md`) — раздел «Схема данных»: сущности, ключевые поля и связи для людей. Источник правды — `prisma/schema.prisma`.
- В `docs/memory/infrastructure.md` (раздел «БД») — путь к схеме, миграциям, singleton-клиенту, способ локального подключения.

В конце покажи: финальную схему, `ls prisma/migrations/`, данные в `npx prisma studio`.

## Нюансы

- SSH-туннель закрылся посреди работы → `ECONNREFUSED`; перезапусти туннель.
- Первый `migrate dev` может спросить «Drop database?» — соглашайся только если база свежая и данных нет.
