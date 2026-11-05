# Feature Registry — реестр реализованных фич `docs/memory/feature-registry.md`

Запускай, когда в продукте появились реализованные фичи и нужно быстро отвечать «есть ли уже X?» без чтения всего PRD; обновляй в конце каждого этапа / после значимой фичи (`save-session` это проверяет).

Нужно на входе: код продукта; `docs/PRD.md` / `docs/spec.md`; `docs/memory/INDEX.md`.

## Промт

```
Создай (или обнови) docs/memory/feature-registry.md — реестр того, что УЖЕ реализовано.
При старте сессии он не грузится; читается целиком на вопросы «есть ли уже фича X?»,
«что уже сделано из X?», «реализовывать Y или уже есть?».

ШАБЛОН (адаптируй под реальный проект):

# Feature Registry — <продукт>

> Каталог реализованных фич. Используется на вопросы «есть ли уже X?».
> Обновляется в конце каждого этапа.

## Auth
- Регистрация по email + пароль → spec: docs/screens/auth.md
- Логин → spec: docs/screens/auth.md
- Защита роутов через middleware → spec: docs/screens/_global.md (Auth Guard)
- Сессии: где хранятся, длительность
- Cookie: флаги (HttpOnly, Secure, SameSite)
- Rate limiting на /api/auth/*: лимиты
- IDOR: как закрыт

## Сущности
- User → src/entities/user/, schema.prisma
- <Entity> → src/entities/<entity>/, schema.prisma
(по реальной схеме данных)

## Действия пользователя (фичи)
- Login → src/features/login/
- <действие> → src/features/<...>/
(по реальному коду и PRD)

## Экраны
- /dashboard — ...
- /settings — ...

## UI-кит
- src/shared/ui/ (или packages/ui): список реальных компонентов

## Документация
- docs/PRD.md, docs/spec.md, docs/DESIGN.md
- docs/app-map.md, docs/screens/*.md, docs/screens/_global.md, docs/test-cases.md

## Инфраструктура
- Хостинг, домен, HTTPS, контейнеры, деплой, БД и бэкапы — детали в
  docs/memory/infrastructure.md

## Что НЕ реализовано (планы)
- ... (коротко; подробный бэклог — в docs/memory/BACKLOG.md, если есть)

ПОСЛЕ:
1. Разделы «Сущности», «Действия», «Экраны», «UI-кит» — по РЕАЛЬНОМУ коду. Никаких
   оставшихся плейсхолдеров <Entity>, <действие>.
2. Строка в docs/memory/INDEX.md (раздел «Реестр функций»):
   - [feature-registry.md](feature-registry.md) — что уже реализовано, по модулям
3. Покажи финальный feature-registry.md.
```

## Edge cases

- Фич много — структурируй по модулям / разделам продукта.
- Не дублируй PRD: только уже реализованное, не план.
- У каждой записи — ссылка на spec или файл (путь для точечного чтения).
