# Админка `/admin` — управление данными, журнал действий, обзор с метриками

Запускай, когда владельцу/операторам нужен отдельный раздел для роли admin: управление контентом/данными, лог всех действий и обзор с реальными метриками.

Нужно на входе: auth с ролями (`auth-setup.md`), БД с ORM.

Стек по умолчанию: Next.js App Router + Prisma. Другой стек — адаптируй.

## 0. Сначала разбор, потом код
Разбери с пользователем: какие сущности и метрики из `docs/spec.md` нужны, кто что видит, как считаются числа. Есть скилл `/new-feature` — используй его; нет — задай уточняющие вопросы, покажи план, реализуй после согласования.

## 1. Роль admin
Если роли нет — добавь в `User` поле `role` (enum `USER | ADMIN`, по умолчанию `USER`) и роль в `docs/spec.md`. Первого админа (владельца) создай через seed или SQL.

## 2. Защита на сервере
Роль проверяется **на сервере** — в layout/middleware и в КАЖДОМ admin-endpoint, а не только скрытием UI.

```tsx
// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/shared/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')
  return <AdminShell>{children}</AdminShell>
}
```
`AdminShell` (меню/сайдбар) живёт в этом layout и не перемонтируется при переходах; навигация по разделам — `<Link href="/admin/...">`, активный раздел — через `usePathname()`. Меню внутри страниц разделов не дублируй.

## 3. Структура (по умолчанию три раздела)
1. **Обзор** (`/admin`) — метрики (шаг 6).
2. **Данные** — по табу на сущность из спеки (Users, Orders, Posts…): список, просмотр, правка, удаление.
3. **Логи** (`/admin/logs`) — все действия: кто, когда, что (шаг 5).

## 4. Переиспользуемая таблица
`src/shared/ui/admin-table.tsx` принимает `columns`, `data`, `actions` (view/edit/delete), `filters`, `pagination`; используется на каждом табе — новый раздел = описать колонки. Все действия — через admin-endpoints с серверной проверкой роли и записью в лог.

## 5. Журнал действий
```prisma
model ActivityLog {
  id        String   @id @default(uuid())
  userId    String   // кто сделал
  action    String   // 'user.update' / 'order.delete' / 'apikey.create'
  target    String?  // 'user:abc' / 'order:xyz'
  metadata  Json?    // что изменилось
  createdAt DateTime @default(now())
  @@index([createdAt])
  @@index([userId])
}
```
Хелпер `logAction(userId, action, target?, metadata?)` вызывается из всех admin-мутаций (и входа админа, выдачи API-ключей). На `/admin/logs` — та же `AdminTable`, сортировка `createdAt desc`, фильтры по пользователю, типу действия, дате.

## 6. Обзор с метриками
Карточки с числами по реальным запросам к БД (`count`, `groupBy`), не выдуманные. Минимум:
- пользователей всего / новых за 7 дней;
- записей основной сущности всего / новых за 7 дней;
- 2–3 продуктовые метрики из спеки (оплаты, активные подписки, заявки в статусе «новая»…).
По желанию — график динамики за 30 дней.

```ts
const [users, usersWeek, orders] = await Promise.all([
  db.user.count(),
  db.user.count({ where: { createdAt: { gte: weekAgo } } }),
  db.order.count(),
])
```

## Безопасность
- Админ не может удалить или разжаловать сам себя; список админов минимален.
- В IDOR-проверках слоя данных право админа — явное: `entity.userId !== userId && role !== 'ADMIN'`.

## После реализации
1. Покажи обзор с метриками, управление сущностями, страницу логов.
2. Проверь: обычный пользователь на `/admin` и на admin-endpoint получает редирект/403; admin видит всё.
3. `docs/spec.md` — раздел «Админка» (разделы, метрики на обзоре, кто admin).

REST API и API-ключи для внешних интеграций — отдельно (`rest-api-keys.md`); для самой админки не нужны.
