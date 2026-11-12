# Экран: Requests (`/admin/submissions`, `/admin/submissions/{id}`)

Основа: флоу админки `docs/flows/admin.json` (экраны requests, request), разбор админки сценарий №9 («один список на все
формы без ответственного и заметок»). Цель — чтобы двое не ответили одному врачу и было видно, кто чем занят.
Код: `src/app/admin/(dashboard)/submissions/`, `src/admin/requests.ts`, таблица `contact_submissions`.

## Список
- Заголовок «Requests», подпись «Everything people send through the forms on the site», **Export CSV**.
- Вкладки статуса с числом: **New** (по умолчанию), In progress, Done, Spam, All.
- Фильтры: **All forms** (Contact form, Webinar recording, Job application, Event registration), **All regions**
  (названия регионов, как на сайте), **Mine** (где я отвечаю).
- Строка: «{Форма словами} · {тема}» и «{Имя Фамилия}, {организация}», регион словами, когда пришла, кто отвечает
  («—», если никто), статус словами.
- Пусто: «No requests here».

## Заявка
- Заголовок — тема (или форма), под ним «{Форма} · {регион} · {когда}».
- Данные заявки: имя, организация, почта, телефон, страна, штат, согласие на рассылку, поля формы (вебинар, вакансия),
  сообщение.
- Справа:
  - **Reply by email** (`mailto:`);
  - **I'll answer** — я отвечаю, статус In progress (если заявка была New); виден, пока у заявки нет ответственного или
    отвечает другой человек («Daniel K answers — take it over?»);
  - **Status**: New · In progress · Done · Spam;
  - **Who answers**: список людей (активные учётные записи) и «Nobody»;
  - **Note for the team** — видна только в админке;
  - Save → «Saved», запись в журнале действий (`request`).
- Ниже — история заявки из журнала: кто, что поменял, когда.

## Данные
`contact_submissions.assigned_to_id` (→ `users`, при удалении человека — пусто), `note` (текст, до 4000 символов).
Миграция `0015_request_owner`.

## Права
Любой вошедший с двухшаговым входом.
