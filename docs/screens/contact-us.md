# Экран: Контакты `/contact-us`

Код: `src/app/(site)/contact-us/page.tsx`, форма `src/components/site/ContactForm.tsx`,
сервер `src/lib/forms.ts` (`submitForm`). Восстановлено по коду `59169da`.

## Блоки
Страница — список блоков, собирает `contactToBlocks()` (`src/blocks/from-pages.ts`):
Hero · `page` («Let’s connect», текст не редактируется) и Form · `split` — композиция «общая линия» (DESIGN.md, решение
2026-11-14): тонкая линия, под ней слева (4/12) таблица «ключ — значение» с контактами региона, справа (7/12) форма.

**Контакты слева** (из Settings → Contact details, офисы): регион `us` → офис с подписью «USA» (Rapid Medical Inc.), иначе
— «Headquarters» (Ltd.). Строки: «Call {регион}» — телефон ссылкой `tel:`, «Orders» — почта заказов офиса ссылкой
`mailto:`; ниже «All offices and addresses →» → `/about-us#offices`. Строка срока ответа появится, когда клиент даст
цифру (BACKLOG №22). Без офисов колонка пустая, форма остаётся справа.

## Доступ
Публичный. `/{region}/contact-us` → редирект сюда с `?region={region}`.

## Параметры URL
| Параметр | Значения → предвыбор |
|---|---|
| `region` | `us` → Americas, `ous` → Europe, `apac` → Asia Pacific |
| `topic` | `demo` → Request a demo, `support` → Product question / Support, `orders` → Customer Service / Orders, `ifu` → Instructions for Use (IFU). Темы и их порядок — `src/lib/contact-topics.ts` |

Другие значения параметров ничего не предвыбирают.

## Поля формы
| Поле | Клиент | Сервер (zod) |
|---|---|---|
| Topic — первым, чипами (DESIGN.md → Формы): Request a demo · Product question / Support · Customer Service / Orders · **Other topic ▾** (список: Instructions for Use (IFU) · Meetings & Events · Investor relations · Other). Тема из `?topic=` выбрана; тема из «Other» — открытым списком | required | строка ≤ 120, **не обязательна** |
| First Name / Last Name | required | trim, 1–80 |
| Email | required, `type=email` | валидный e-mail, ≤ 160 |
| Phone | — | ≤ 40 |
| Organization | — | ≤ 160 |
| Country (список стран ISO, значение — код) | required | код → название страны (`country`); **регион письма выводится из страны** (`regionForCountry` → Americas / Europe / Asia Pacific), поля Region на форме нет |
| State / Province | только когда страна — США или Канада (решение владелицы 2026-11-15) | ≤ 80 |
| Message | — | ≤ 4000 |
| Opt-in «Sign me up!» | checkbox | boolean |
| `form` (hidden) | `contact` | `contact` / `webinar` / `careers` / `event` |
| `meta` (hidden JSON) | источник визита | `Record<string,string>` |
| `website` (honeypot, скрыт) | — | заполнен → тихий «успех», ничего не сохраняется |

Поля парами: имя / фамилия, e-mail / телефон, организация / страна, штат — отдельной строкой. Кнопка «Submit» на всю
ширину формы, под ней строка согласия с Privacy Statement. Тексты подписей, согласия и кнопки — прежние (тексты за
клиентом). Формы Webinars, Careers, событие — пока прежние (тема списком, поле Region), переводятся вместе со своими
страницами.

## Состояния
| Состояние | Что видно |
|---|---|
| Исходное | Форма, «(* indicates a required field)», ссылка на `/privacy-statement` |
| Отправка | Кнопка «Sending…», disabled |
| Ошибки валидации | Текст ошибки под полем, рамка и текст цветом `--danger`, `aria-invalid`; введённое остаётся. Общей плашки нет — она остаётся только для ошибок не про поля (лимит) |
| Лимит | «Too many requests. Please try again later.» — > 8 отправок с адреса за 10 минут; счёт в базе (`login_attempts`, ключ `form:{адрес}`), общий для всех экземпляров сервера и не сбрасывается перезапуском; адрес — тот, что записал хостинг: на Vercel — только `x-vercel-forwarded-for`; на другом хостинге — `x-forwarded-for`, только если задано `TRUSTED_PROXY_HOPS` (сколько прокси перед сайтом), иначе заголовку не верим; подставленное посетителем не учитывается, значение — только настоящий IP; запрос без адреса — в общую корзину «unknown» с лимитом 60 за 10 минут, а не мимо лимита; отклонённая отправка в счёт не пишется; счёт и запись — одним запросом без блокировок (при одновременных отправках лимит может превыситься на одну-две); служебных полей (`meta`: источник визита, вебинар…) — не больше 20 (аудит 2026-11-13, решено 2026-11-16) |
| Успех | «Thank you for contacting us. We will get back to you as soon as possible.» + «We’ll reply to {email}.» и сводка: тема, страна; «Send another request» возвращает пустую форму (форма заменяется) |

## Что происходит при отправке
1. Запись в `contact_submissions` (`status = new`, IP из `x-forwarded-for`, User-Agent).
2. Письмо (тема `[Website] {form}: {topic} – {Имя Фамилия}`, `replyTo` = e-mail посетителя,
   ссылка на `/admin/submissions/{id}`). Ошибка почты логируется; посетитель всё равно видит успех.
   **Куда (2026-11-10):** тема «Customer Service / Orders» — регион Americas → `contact.ordersEmailInc` (страна
   содержит «Canada» → `ordersEmailCanada`), остальные регионы → `ordersEmailLtd`; тема IFU → `contact.ifuEmail`;
   всё остальное и пустой/неверный адрес → `MAIL_TO`. Адреса правятся в Settings → Contact details.
3. Без `SMTP_HOST` — только лог в консоль.

## Переиспользование формы
Тот же `ContactForm`: `/{region}/webinars` (`form=webinar`, compact, темы = названия вебинаров),
`/careers` (`form=careers`, compact), `/open-positions/{slug}` (`form=careers`, `meta.job = slug`).
Все формы уходят на один `MAIL_TO` — маршрутизации по форме/теме/региону нет.

## Не предусмотрено кодом
CAPTCHA; маршрутизация получателей; подтверждение посетителю по e-mail; хранение согласия на обработку
кроме `optIn`. Заголовок «Let’s connect» и подзаголовок захардкожены (не в настройках, не редактируются).

## Проход по юзабилити 2026-11-13 (`memory/findings/site-ux-pass-2026-11-13.md`)
- Ошибка от сервера **не стирает** введённое (форма отправляется из обработчика, а не через `action`, — React 19 сбрасывал
  поля). Поле с ошибкой — рамкой и текстом под полем, `aria-invalid`; ошибка темы тоже показывается.
- Текст успеха по типу формы: contact и webinar — «Thank you for contacting us. We will get back to you as soon as
  possible.»; event — «You're registered for {событие}. We'll email you the details.»; careers — «Thanks — we've received
  your details. We'll be in touch if there's a match.»
- Подпись выбора темы по типу формы: contact — «How can we help? Select a topic.*», webinar — «Which webinar?*», careers —
  «Area of interest*».
- «Customer support» на страницах терапий и в шаблоне — `/contact-us?region={region}&topic=support` (тема выбрана);
  существующие страницы обновлены миграцией `0018`.
