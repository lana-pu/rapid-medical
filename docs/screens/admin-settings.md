# Экран: Site settings (`/admin/settings?group=`)

Основа: описано по коду 2026-11-13 (как работает сейчас), роли — ADR-006. Группа «Menu and footer» и правка подписей
на странице — [menu-footer](menu-footer.md); где группы показываются внутри разделов сайта — [admin-sections](admin-sections.md).
Код: `src/app/admin/(dashboard)/settings/page.tsx`, `src/admin/settings.ts` (`SETTINGS_GROUPS`, `mayEditGroup`,
`groupValue`), `src/lib/settings.ts`, `src/components/admin/SettingsFields.tsx`; таблицы `site_settings`, `setting_drafts`.

## Обзор Settings и порядок (решение владелицы 2026-11-15: «очень много всего, не разбито по блокам»)
Референсы: incident.io и Remote (Mobbin) — блоки по группам, у каждого значок, название и строка «что меняет и где видно».
- `/admin/settings` без `?group=` — **обзор**: группы блоков, у каждого — название, одна строка простыми словами, где это
  видно на сайте, и состояние, если есть что сделать («2 pages without a description», «3 broken links»):
  - **On the site** — Contact details («Phones, emails and offices — in the footer and on Contact Us»), Social links
    («The icons in the footer»), Regional notices («The region chooser and the notes under each region»);
  - **Search & sharing** — Google & sharing (`/admin/seo`, экран — [admin-seo](admin-seo.md)), Old links (редиректы и
    битые ссылки на одном экране, вкладки Broken links · Redirects);
  - **Look** — Branding (дизайнер, админ);
  - **Team** — People and roles (админ), Activity log;
  - **Connections** — Integrations (админ);
  - **You** — My account & security.
- Колонка слева — та же структура: «Overview» и группы с заголовками.
- **Форма группы разбита на блоки** с заголовком и строкой пояснения (поле `section` у полей группы и `sections` с
  пояснениями у группы). Contact details: «Phones and email on the site» · «Where requests go» (почты заказов и IFU:
  «The contact form sends orders by region and IFU requests here; everything else goes to the main team address») ·
  «Offices».

## Иерархия (решения владелицы 2026-11-27, черновик https://claude.ai/artifact/RhBC3cgZcJkwE45q6v4p9r)
Референсы (Mobbin): Framer Site Settings, Shopify General, Etsy Pattern, Lyssna, Vercel Members, Airwallex и Mercury
Security, Base44 Domains.
- **Обзор — строками**, а не карточками: блоки «On the site» · «Requests» · «Search & sharing» · «Look & connections»
  · «Team & you», заголовки обычным шрифтом; в строке — значок, название, строка «где это видно», метка «что сделать»
  справа, ›. Метки: Google & sharing — **число страниц** («12 pages to look at»), то же число, что в фильтре «Only
  problems» на экране Google & sharing (до 2026-11-27 обзор считал по-своему — «19 versions», а экран писал «17»);
  Old links — «N broken links visitors hit»; People — «N without two-step sign-in».
- **Шапка формы группы**: крошка «Settings › {блок обзора}», заголовок, пояснение группы сразу под ним (подзаголовком).
- **Save — полосой внизу экрана** (как Shopify): полоса прилипает к низу формы, Save всегда виден; когда в форме есть
  изменения — «● Unsaved changes» и **Discard** (перезагружает группу без сохранения). «Saved.» — сверху, как было.
- **Офисы свёрнуты**: офис — строкой «{Entity} · {Label}», поля открываются по клику; широта и долгота —
  ещё глубже, свёрнутым «Map pin». duplicate / remove / перетаскивание — как было.
- **Regional notices** — два блока: «Region chooser» (заголовок, подзаголовок) и «Note under each region's pages» (US,
  OUS, APAC); у пустой сноски подсказка «Empty — no note on … pages».
- **Social links, Branding** — с пояснением, где это видно. Branding: путь файла — в мелком поле, как было; подсказка
  «Also replace src/app/favicon.ico» убрана — значок вкладки теперь берётся из настройки (ниже).
- **Integrations** — у каждого поля строка «что это делает на сайте»; пустое поле — выключено.

### Поля, которые сайт не читал (решение 2026-11-27: подключить три, Logo PNG убрать)
До 2026-11-27 четыре поля сохранялись, но на сайте ничего не меняли:
- **Social sharing image** (`branding.ogImageUrl`) — теперь картинка ссылки в соцсетях и мессенджерах для всех страниц
  сайта (`openGraph.images`, `twitter.images`); пусто — `/og-image.jpg`. Своя картинка страницы терапии — как была.
- **Favicon** (`branding.faviconUrl`) — теперь значок вкладки на сайте (`icons`); пусто — `/favicon.ico`. Файл
  `favicon.ico` перенесён из `src/app/` в `public/`: файловый значок Next перекрывал бы настройку.
- **Suggest region by visitor country** (`integrations.geoSuggest`) — выключено: плашка «It looks like you are in …» не
  показывается; не сохранялось ни разу — включено.
- **Logo PNG (email / fallback)** — поле убрано из формы: письма уходят без логотипа. Значение в базе остаётся.

## Where requests go (`/admin/settings?group=requests`, решение владелицы 2026-11-27)
«Куда уходят заявки» — **отдельная настройка**, не часть контактов сайта: у каждого вида заявки — свой адрес, у адреса
есть значение по умолчанию, и его можно поменять. Каждая заявка в любом случае лежит в Inbox; здесь — какой ящик ещё
получает её письмом. Пункт в колонке Settings — «Requests → Where requests go»; строка в обзоре. Кто открывает — все,
как Contact details.
- **Main address** — по региону посетителя: «Main address — Americas» и «Main address — everywhere else» (клиент: два
  общих ящика info@ USA и INTL, письмо 25.11). Пустое одно — письмо идёт на другое; пусты оба — на адрес сервера
  `MAIL_TO` (задаётся при установке, запасной).
- **Contact Us — by topic**: Request a demo · Product question / Support · Customer Service / Orders — Americas (Inc),
  Canada, everywhere else (Ltd) · Instructions for Use (IFU) · Meetings & Events · Investor relations · Other.
- **Other forms**: Webinar recording · Job application · Event registration.
- Пустая строка — заявка уходит на Main address своего региона. Несколько адресов — через запятую. Адрес не похож на
  почту — ничего не сохраняется: «{поле}: use email addresses, separated by commas. Nothing was saved.»
- Значения по умолчанию: четыре адреса, что были в Contact details (заказы Inc / Canada / Ltd, IFU), — те же; пока группу
  не сохранили, они читаются из `contact` (переносить данные не нужно). Остальные строки пусты.
- Заказы: Canada — свой ящик (пусто — Inc), Americas — Inc, остальные — Ltd; пусто — Main address.
- Из Contact details блок «Where requests go» убран (там — только то, что видно на сайте).
- Код: `src/lib/contact-topics.ts` (`recipientFor`, `routingOf`), группа `requests` в `src/admin/settings.ts`; письмо
  заявки (`src/lib/forms.ts`) и копия в готовом ответе (`submissions/[id]`) берут адрес отсюда.

## Что показано
- Заголовок «Site settings», вкладки — группы, доступные роли, в этом порядке:

| Вкладка | Что внутри | Кто открывает |
|---|---|---|
| Contact details | телефоны, общая почта; **Offices** — список офисов с адресом и точкой на карте (почты заказов и IFU — с 2026-11-27 в Where requests go) | все |
| Where requests go | Main address по региону, адрес у каждой темы Contact Us и у каждой формы (выше) | все |
| Social links | X / Twitter, LinkedIn, Instagram, YouTube | все |
| Regional notices | заголовок и подзаголовок выбора региона, сноски US / OUS / APAC | все |
| Therapies overview – US / OUS / APAC (Google) | Google title и description страницы `/{регион}/therapies` | все |
| Google titles & descriptions | title и description для Evidence, Webinars, Contact (по регионам и общий) | все |
| Menu and footer | меню, кнопка Contact, колонки и ссылки футера, копирайт | дизайнер, админ |
| Branding | логотип SVG/PNG, картинка для соцсетей, favicon (PNG для писем убран 2026-11-27) | дизайнер, админ |
| Integrations | Google Analytics 4 ID, UserWay, «Suggest region by visitor country» (работает с 2026-11-27) | админ |

- Под заголовком — описание группы (если есть) и форма полей группы, **Save** — в полосе внизу (выше).
- Без `?group=` — обзор (выше; до 2026-11-15 открывалась Contact details). Группа, которую роль не открывает (или неизвестная), — открывается первая
  доступная, без сообщения.
- Значения в форме: значения по умолчанию группы (есть у Menu and footer — нынешнее меню), поверх — сохранённые, поверх —
  неопубликованные правки с сайта.

## Неопубликованные правки с сайта
Если группу правили на странице (подписи меню и футера, офисы), над формой: «This group has changes made on the site by
{имя} that are not live yet. The form shows them; **Save** publishes them, **discard** drops them.»
**discard** удаляет эти правки (журнал `settings`, `discardedDraft`).

## Save
Сохраняет группу сразу на сайт (черновика нет), удаляет правки с сайта, обновляет страницы группы.
Ключи, которых нет в форме (старые тексты, переехавшие в редактор страниц), сохраняются как были.
Сообщение «Saved.». Журнал: `settings` с названием группы.
Если список (например, Offices) не читается — ничего не сохраняется: «{поле}: the list could not be read, nothing was
saved.»; адрес в поле-ссылке — путь `/…`, `https://`, `mailto:` или `tel:`, иначе «{поле}: use a page address (/…) or a
full link (https://…). Nothing was saved.» (аудит 2026-11-13).

## Права
Любой вошедший с двухшаговым входом — группы без ограничения; Menu and footer и Branding — дизайнер и админ;
Integrations — только админ. Проверка роли и при открытии, и при Save / discard.
