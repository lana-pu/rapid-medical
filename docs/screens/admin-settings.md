# Экран: Site settings (`/admin/settings?group=`)

Основа: описано по коду 2026-11-13 (как работает сейчас), роли — ADR-006. Группа «Menu and footer» и правка подписей
на странице — [menu-footer](menu-footer.md); где группы показываются внутри разделов сайта — [admin-sections](admin-sections.md).
Код: `src/app/admin/(dashboard)/settings/page.tsx`, `src/admin/settings.ts` (`SETTINGS_GROUPS`, `mayEditGroup`,
`groupValue`), `src/lib/settings.ts`, `src/components/admin/SettingsFields.tsx`; таблицы `site_settings`, `setting_drafts`.

## Что показано
- Заголовок «Site settings», вкладки — группы, доступные роли, в этом порядке:

| Вкладка | Что внутри | Кто открывает |
|---|---|---|
| Contact details | телефоны, общая почта, почты заказов (Ltd / Inc / Canada), почта IFU; **Offices** — список офисов с адресом и точкой на карте | все |
| Social links | X / Twitter, LinkedIn, Instagram, YouTube | все |
| Regional notices | заголовок и подзаголовок выбора региона, сноски US / OUS / APAC | все |
| Therapies overview – US / OUS / APAC (Google) | Google title и description страницы `/{регион}/therapies` | все |
| Google titles & descriptions | title и description для Evidence, Webinars, Contact (по регионам и общий) | все |
| Menu and footer | меню, кнопка Contact, колонки и ссылки футера, копирайт | дизайнер, админ |
| Branding | логотип SVG/PNG, PNG для писем, картинка для соцсетей, favicon | дизайнер, админ |
| Integrations | Google Analytics 4 ID, UserWay, «Suggest region by visitor country» | админ |

- Под вкладками — описание группы (если есть) и форма полей группы, **Save**.
- Без `?group=` открывается Contact details. Группа, которую роль не открывает (или неизвестная), — открывается первая
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
