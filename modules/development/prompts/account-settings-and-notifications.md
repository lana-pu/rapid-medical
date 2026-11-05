# Личный кабинет, настройки, изоляция данных (IDOR) и in-app центр уведомлений

Запускай, когда есть auth и пользователи должны работать только со своими данными. Результат: каждый видит и меняет только своё (IDOR закрыт), есть настройки профиля/безопасности/удаления аккаунта и базовый центр уведомлений только in-app.

Нужно на входе: auth с сессиями (`auth-setup.md`), реальные запросы к БД вместо моков (`mocks-to-real-db.md`).

Стек по умолчанию: Prisma + better-auth + Next.js App Router + FSD. Другой стек — адаптируй (напр. NextAuth: `getServerSession` вместо `auth.api.getSession`).

## Часть 1. Кабинет и изоляция данных

### 1. Привязка данных к пользователю
У каждой предметной сущности, принадлежащей пользователю, — `userId` с FK на `User`:

```prisma
model <Entity> {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ...
  @@index([userId])
}
```

Если поля нет и в таблице уже есть строки без владельца:
- в базе только seed/демо-данные (реальных пользователей нет): обнови `prisma/seed.ts`, чтобы демо-записи создавались с `userId` демо-пользователя, объясни пользователю одной фразой и запусти `npx prisma migrate reset` (удаляет базу → создаёт → применяет миграции → seed);
- в базе реальные данные: `reset` ЗАПРЕЩЁН. Добавь поле nullable → заполни владельцев (backfill) → сделай обязательным отдельной миграцией; на проде — только `migrate deploy` после бэкапа.
Строк нет — достаточно `npx prisma migrate dev --name add-user-relation`.

### 2. Фильтрация по владельцу в слое данных
Каждая функция чтения/записи данных пользователя принимает `userId` (из сессии, не из запроса клиента):

```ts
export async function listEntities(userId: string, params?: {...}) {
  return db.entity.findMany({ where: { userId, ...params } })
}

export async function createEntity(userId: string, data: ...) {
  return db.entity.create({ data: { ...data, userId } })
}

export async function getEntityById(userId: string, id: string) {
  const entity = await db.entity.findUnique({ where: { id } })
  if (!entity || entity.userId !== userId) return null   // IDOR-защита
  return entity
}

export async function updateEntity(userId: string, id: string, data: ...) {
  const entity = await db.entity.findUnique({ where: { id } })
  if (!entity || entity.userId !== userId) throw new Error('Not found')
  return db.entity.update({ where: { id }, data })
}

export async function deleteEntity(userId: string, id: string) {
  const entity = await db.entity.findUnique({ where: { id } })
  if (!entity || entity.userId !== userId) throw new Error('Not found')
  await db.entity.delete({ where: { id } })
}
```
На чужой ресурс отвечай `404`/`null`, не `Forbidden` — атакующий не должен узнать, существует ли ресурс.

### 3. Сессия на страницах
В серверных экранах (напр. `src/pages/dashboard/ui/DashboardScreen.tsx`):

```ts
import { auth } from '@/shared/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { listEntities } from '@/entities/<entity>'

export async function DashboardScreen() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')   // guard помимо middleware
  const items = await listEntities(session.user.id)
  return <DashboardUI items={items} />
}
```

### 4. Страница настроек
- **Профиль**: email — read-only (смена через отдельный flow с подтверждением), имя — редактируется.
- **Безопасность**: смена пароля (текущий + новый).
- **Опасная зона**: удаление аккаунта с confirm-модалкой (ввести email для подтверждения) → выход и редирект на главную.

API:
- `src/app/api/users/me/route.ts` — `GET` профиль, `PATCH` имя, `DELETE` удаление аккаунта;
- `src/app/api/users/me/password/route.ts` — `POST` смена пароля.
Входные данные — через явную валидацию/whitelist полей (никакого `data: req.body`).

### 5. Тест IDOR
Создай два аккаунта A и B, каждым — по записи. Под A:
- открыть `/<feature>/<id-B>` по URL → 404 / «Не найдено»;
- `DELETE /api/<entity>/<id-B>` через curl с кукой A → 404.
Затем то же под B на ресурсах A. Пробилось хоть раз — найди и почини.

## Часть 2. Центр уведомлений (только in-app)
Одна функция `notify` пишет событие в БД, пользователь видит его внутри сервиса. Email сюда не подключаем: важные транзакционные письма (заказ, инвайт, сброс пароля) уходят напрямую при событии (`account-emails.md`, `product-emails.md`), не как канал центра. Оповещения владельцу в Telegram — отдельно (`telegram-owner-alerts.md`).

Если уведомлений в спеке нет совсем — можно пропустить, но базовый колокольчик + страница почти всегда полезны, поэтому по умолчанию делай.

1. Модели (+ миграция):
   ```prisma
   model Notification {
     id        String    @id @default(cuid())
     userId    String
     type      String
     title     String
     body      String?
     data      Json?
     readAt    DateTime?
     createdAt DateTime  @default(now())
     @@index([userId])
   }

   model NotificationPreference {
     id     String @id @default(cuid())
     userId String @unique
     muted  Json   // выключенные типы, напр. ["digest"]
   }
   ```
2. `notify(userId, event)` — создаёт `Notification`, если тип не выключен в `NotificationPreference`. Без email/Telegram fanout.
3. UI:
   - `NotificationBell` в шапке: счётчик непрочитанных, dropdown/Sheet с историей;
   - страница `/notifications`: список, «отметить все прочитанными»;
   - обновление без перезагрузки: polling (напр. `refetchInterval`) — по умолчанию; SSE/WebSocket — если нужен мгновенный.
   Чтение уведомлений — только своих (`where: { userId }`).
4. `/settings/notifications`: переключатели «какие типы показывать» (мьют по типу).
5. Подключи `notify()` к триггерам из `docs/spec.md`. Зафиксируй ADR «центр уведомлений — in-app only».

## Документация
Обнови `docs/spec.md`: доступы (кто что видит), настройки, типы уведомлений и их триггеры.

В конце покажи: дашборд под двумя аккаунтами (данные разные), результат IDOR-теста по URL и curl (404), событие → колокольчик показывает непрочитанное, выключенный тип перестаёт показываться.

## Нюансы

- Публичный ресурс по ссылке («share by link») — проверка доступа через токен в URL, не через `userId`; обсуди сценарий с пользователем.
- Есть роль admin с правом видеть чужое — условие: `entity.userId !== userId && session.user.role !== 'ADMIN'` (см. `admin-panel.md`).
- Удаление аккаунта удаляет зависимые данные через каскад — убедись, что `onDelete: Cascade` описан в схеме.
