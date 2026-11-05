# Экран: Контакты `/contact-us`

Код: `src/app/(site)/contact-us/page.tsx`, форма `src/components/site/ContactForm.tsx`,
сервер `src/lib/forms.ts` (`submitForm`). Восстановлено по коду `59169da`.

## Доступ
Публичный. `/{region}/contact-us` → редирект сюда с `?region={region}`.

## Параметры URL
| Параметр | Значения → предвыбор |
|---|---|
| `region` | `us` → Americas, `ous` → Europe, `apac` → Asia Pacific |
| `topic` | `demo` → Request a demo, `support` → Product question / Support, `orders` → Customer Service / Orders |

## Поля формы
| Поле | Клиент | Сервер (zod) |
|---|---|---|
| Topic (select: Request a demo · Product question / Support · Customer Service / Orders · Meetings & Events · Investor relations · Other) | required | строка ≤ 120, **не обязательна** |
| First Name / Last Name | required | trim, 1–80 |
| Organization | — | ≤ 160 |
| Email | required, `type=email` | валидный e-mail, ≤ 160 |
| Phone | — | ≤ 40 |
| Region (Americas · Europe · Asia Pacific · Middle East) | — | ≤ 40 |
| Country, State/Province | — (скрыты в `compact`) | ≤ 80 |
| Message | — | ≤ 4000 |
| Opt-in «Sign me up!» | checkbox | boolean |
| `form` (hidden) | `contact` | `contact` / `webinar` / `careers` |
| `meta` (hidden JSON) | `{}` | `Record<string,string>` |
| `website` (honeypot, скрыт) | — | заполнен → тихий «успех», ничего не сохраняется |

## Состояния
| Состояние | Что видно |
|---|---|
| Исходное | Форма, «(* indicates a required field)», ссылка на `/privacy-statement` |
| Отправка | Кнопка «Sending…», disabled |
| Ошибки валидации | «Please check the highlighted fields.» + текст ошибки у поля |
| Лимит | «Too many requests. Please try again later.» — > 8 отправок с IP за 10 минут (в памяти инстанса) |
| Успех | «Thank you for contacting us. We will get back to you as soon as possible.» (форма заменяется) |

## Что происходит при отправке
1. Запись в `contact_submissions` (`status = new`, IP из `x-forwarded-for`, User-Agent).
2. Письмо на `MAIL_TO` (тема `[Website] {form}: {topic} – {Имя Фамилия}`, `replyTo` = e-mail посетителя,
   ссылка на `/admin/submissions/{id}`). Ошибка почты логируется; посетитель всё равно видит успех.
3. Без `SMTP_HOST` — только лог в консоль.

## Переиспользование формы
Тот же `ContactForm`: `/{region}/webinars` (`form=webinar`, compact, темы = названия вебинаров),
`/careers` (`form=careers`, compact), `/open-positions/{slug}` (`form=careers`, `meta.job = slug`).
Все формы уходят на один `MAIL_TO` — маршрутизации по форме/теме/региону нет.

## Не предусмотрено кодом
CAPTCHA; маршрутизация получателей; подтверждение посетителю по e-mail; хранение согласия на обработку
кроме `optIn`. Заголовок «Let’s connect» и подзаголовок захардкожены (не в настройках, не редактируются).
