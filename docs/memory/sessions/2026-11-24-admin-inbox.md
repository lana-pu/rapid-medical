# 2026-11-24 — Inbox: один список и видно, кто отвечает

**Задача:** следующий экран админки по полоске тем же циклом (Mobbin → черновик → решения → спека → код), после того
как владелица закрыла списки и форму («go»).

## Что сделано
- Разбор «как сейчас»: два списка одних и тех же заявок (Inbox и таблица «All requests», открывалась рядом с колонкой
  Inbox), пять чисел про одно (Inbox 16, Unread 16, All sources (20), New 20, значок 16), форма в строке дважды, кто
  отвечает в списке не виден, «nobody answers» в заявке дважды.
- Mobbin: Front, HubSpot, Plain, Lemni, Wix. Черновик сразу «тихий» (урок прошлого экрана):
  https://claude.ai/artifact/NHk3HaF1AV2NYzYLRcZgGt. Владелица — «ok» на три рекомендации.
- Код (`02b5dae2`):
  - Один список: `/admin/submissions` → редирект в Inbox; регион, Mine, Export переехали в Inbox.
  - Вкладки Open · Mine · Done · Spam, у каждой одно число (сколько писем с учётом формы и региона); пустые скрыты,
    Open всегда. Непрочитанные — жирные с синей точкой и на значке полосы.
  - Выпадашки формы (All forms, числа только у вариантов) и региона; **Export ↓** — CSV показанного
    (`?state=&form=&region=`).
  - Строка: кто · тема — начало · форма серым словом (Contact, Webinar, Job, Event, Note) · инициалы отвечающего
    (только если есть; «я» тёмным) · дата. Узкая колонка: «Форма · тема» второй строкой.
  - Subscribed to news — люди в любом состоянии, кроме спама; вкладки при нём скрыты.
  - Заявка: «Answers ▾» в полосе действий (на узком — второй строкой) вместо метки «New · nobody answers» и выпадашки
    справа; форма серой меткой над темой, Done / Spam — тихая отметка там же; Details без капслока, без строки Form.
- Спека: `screens/admin-inbox.md` («Один список», «Как в Gmail», «Фильтры»), `screens/admin-requests.md` («Список»,
  «Заявка»), `spec.md` → API (`submissions.csv` с фильтрами). Ссылка Home «Open requests» → `/admin/inbox`.
- Скриншоты результата: https://claude.ai/artifact/2QskDWh7GMue6KrKqkw1UT.

## Изменённые файлы
- `src/admin/inbox.ts` (owner, region, тема без формы), `home.ts`, `requests.ts`
- `src/components/admin/MessageList.tsx` (переписан), `InboxShell.tsx`, `RequestControls.tsx` (`AssignSelect` в полосе)
- `src/app/admin/(dashboard)/(inbox)/layout.tsx`, `submissions/page.tsx` (редирект), `submissions/[id]/page.tsx`
- `src/app/api/admin/submissions.csv/route.ts`
- `tests/e2e/admin.spec.ts`, `docs/screens/admin-inbox.md`, `docs/screens/admin-requests.md`, `docs/spec.md`

## Принятые решения
- Один список заявок вместо Inbox + таблицы; вкладки Open · Mine · Done · Spam (Unread, In progress, All убраны);
  «кто отвечает» — в полосе действий заявки. Решения владелицы 2026-11-24 по рекомендациям черновика.
- Статусы в базе прежние (new, in_progress, done, spam): New + In progress = Open.

## Находки
- Открытие заявки помечает её прочитанной: для снимков брались только уже открытые (29 — Maria Lopez, 21 — спам);
  аудит-обходчик тоже не изменил число непрочитанных (16 до и после).
- Для снимков временно назначались отвечающие (23 → Admin, 29 → Second editor), потом сняты (назначенных — 0).

## Открытые вопросы / следующие шаги
- e2e не прогоняли (общая база, параллельная сессия): тесты Inbox и заявки переписаны (редирект таблицы, вкладки,
  «Answers», Export с фильтрами, Subscribed без вкладок) — нужен общий прогон.
- Следующий экран по полоске — Analytics, только после того, как владелица закроет Inbox.

## Связанное
- Предыдущая сессия: 2026-11-24-admin-records.md
