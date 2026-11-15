# Экран страницы в админке — что оставить, что убрать, что добавить (предложение, 2026-11-15)

Статус: **предложение, ждёт решения владелицы.** Сейчас: `docs/screens/admin-sections.md` → «Экран страницы»,
код `src/app/admin/(dashboard)/(content)/page/[[...key]]/page.tsx`, вкладки `src/components/admin/PageTabs.tsx`.

## Что есть сейчас (3 вкладки)
| Вкладка | Что на ней | Проблема |
|---|---|---|
| **Overview** | Большие карточки регионов: статус словами, «Visitors see the latest version», Edit on page · Google & address · View. Карточки коллекций | Много места на три слова статуса; одна и та же подсказка в каждой карточке; нет ничего, чего не видно в дереве |
| **Google & address** | Форма записи **одного региона**: подпись в меню, адрес (slug), регион, продукт, порядок, группа, proof point, описание для Google; справа статус, расписание, история; снизу полоса Publish | Название не про содержимое; технические слова (Slug, Sort order); регион можно сменить выпадашкой; Unpublish / Preview / Edit повторяют Overview; полоса Publish наезжает на форму |
| **History** | Сравнение «From / To» двумя селектами, таблица версий с колонками `#`, `KIND`, ссылки view / vs live / restore | Технично; в редакторе та же история уже понятнее (лента: кто, когда, что) |

## Как это обычно устроено (Mobbin + знание продуктов; не проверено на людях — гипотеза)
| Паттерн | Где видно | Что берём |
|---|---|---|
| **Настройки страницы — панелью сбоку или окном**, а не отдельным экраном: название, адрес, описание для Google с **живым превью сниппета и счётчиком символов**, картинка для соцсетей | [Gamma](https://mobbin.com/screens/f10a4235-7e48-49c3-88d7-0e6a503707e6), [Kit](https://mobbin.com/screens/f4eda8ee-1024-4534-a536-1ac101276a89), [Hashnode](https://mobbin.com/screens/aa594e1e-fa0a-4ad5-af7a-fdc64d34a1f4), [beehiiv](https://mobbin.com/screens/1000b783-ecfa-4479-badf-e960bec366ce), [Jobber](https://mobbin.com/screens/44b0a2aa-85eb-4f4a-be35-02bd50f60ca8); Webflow / Framer Page settings (по памяти) | Вкладку «Google & address» заменить панелью **Page settings** с превью в Google |
| **Цифры конкретной страницы**: визиты за период, график, источники, откуда пришли | [Coda](https://mobbin.com/screens/dbf4ddca-d73b-4057-8259-4ed7f4830078), [Manus](https://mobbin.com/screens/10a508a6-d1ea-4e8e-b697-bb7e1536e2b5), [Craft](https://mobbin.com/screens/9f81384e-8b48-4e63-bf83-4ff04cd34b2e) | Блок **Performance** — наш счётчик уже это знает, плюс заявки, которые начались с этой страницы |
| **Языки / регионы — компактным списком строк**: регион · статус · когда опубликовано · действия в «⋯»; кнопка «создать перевод» | [Better Stack](https://mobbin.com/screens/5cc6e4ca-b056-4e7d-a0bf-97f8fc87f9d3), [Wix Multilingual](https://mobbin.com/screens/01186cf0-6bd9-4b01-961a-628e4021f52b), [Shopify](https://mobbin.com/screens/9c2f3c90-c11a-4366-b32a-22fefc86a863) | Карточки регионов → строки; у отсутствующего региона — «Create from Americas» |
| **Детали справа**: тип, статус, создано / изменено кем и когда, «Show version history» | [Intercom article](https://mobbin.com/screens/5a63a4de-edec-4607-b0b4-aa570e20c014); WordPress / Sanity / Contentful (по памяти) | Колонка **Details**: шаблон, адрес, последние изменения, ссылка на всю историю |
| История — **лентой**, у версии «Посмотреть» и «Вернуть»; сравнение — «с текущей», без выбора двух версий | Google Docs, Notion, WordPress Revisions (по памяти); наш редактор | История — лента как в редакторе |

## Кто и что делает со страницей (2026-11-15)
**Люди.** В админку заходят четверо (письмо Emily 10.11, `findings/client-email-2026-11-10.md`):
- **Emily Richardson, Alyssa Elkins** — маркетинг, правят сайт; главные пользователи экрана.
- **Ronen Eckhouse** — CEO; утверждает часть текстов (Fix List: «нужна виза MLR/CEO»).
- **Nir Palmor** — IT; доступы, домен, редиректы.
- Ещё владелица — дизайнер и admin.
- **Согласующий MLR** (medical / legal / regulatory) — **аккаунта в админке нет**, но тексты проходят через него
  (Fix List B.5, B.6, B.7 «на утверждение MLR»).

Частота — гипотеза по Fix List и письмам: никого не наблюдали, проверить с Emily.

| # | Действие | Кто | Как часто (гипотеза) | Сейчас | На экране страницы |
|---|---|---|---|---|---|
| 1 | Поменять текст, картинку, файл на странице | Emily, Alyssa | еженедельно | Edit on page — есть | главная кнопка **Edit on page** по региону |
| 2 | Понять, что сейчас на сайте и что ждёт публикации; опубликовать или запланировать | Emily | при каждой правке | статус на карточке; публикация — в редакторе или в форме | **Regions**: статус словами, «publishes Tue 09:00», кнопка Publish у региона с правками |
| 3 | **Отдать правки на согласование MLR / CEO** — до публикации, человеку без аккаунта | Emily → MLR, Ronen | при каждом тексте, где есть утверждения | preview-ссылка есть в коде (`/api/preview?token=…`, 7 дней), но спрятана в форме как «Preview» | **Share preview** у региона: ссылка на версию с неопубликованными правками, «действует до {дата}»; ответ — заметкой |
| 4 | Сделать одинаковую правку во всех регионах или проверить, чем регионы отличаются (COMANECI US ≠ OUS только колонкой каталожного номера) | Emily | ежемесячно | таблица регионов в редакторе (⇄ Regions) | **Compare regions** → редактор с таблицей регионов |
| 5 | Завести страницу в новом регионе (HYPERDRIVE для US, A.3) или снять страницу в регионе | Emily, владелица | редко | Copy to region — на вкладке Google, подписи OUS / APAC | у отсутствующего региона — **Create from {регион}**; в «⋯» — **Take off the site** |
| 6 | Поправить заголовок и описание для Google, картинку для LinkedIn (B.7–B.9) | Emily | при запуске и раз в квартал | форма записи; часть страниц — в Settings → Google defaults | **Google preview** + **Page settings** |
| 7 | **Подготовить ссылку для поста в LinkedIn** с меткой кампании, чтобы потом увидеть, сколько людей и заявок привела публикация | Emily, Nir | каждый пост | нигде — UTM вручную | **Copy link for a post**: название кампании → ссылка с `utm_source=linkedin…`; кампания потом видна в Analytics |
| 8 | Посмотреть, работает ли страница: визиты, откуда, заявки, открытые PDF | Emily, Ronen | раз в неделю или месяц | только общий экран Analytics | **Performance** за 30 дней |
| 9 | **Узнать, что было на странице в такую-то дату** и кто менял (вопрос регулятора, спор о формулировке); вернуть старую версию | Emily, Ronen | редко, но важно для медицинского производителя | История есть, сравнение техничное; «View» без отката есть | **History** лентой: дата, кто, что; **View** версии как на сайте; **Restore** |
| 10 | Заменить PDF (IFU, исследование) или картинку, которые стоят на странице | Emily | при новой версии IFU | замена файла везде — в медиатеке | **Files on this page**: список PDF и картинок страницы, **Replace** |
| 11 | Ответить на заметку коллеги на странице | все | при работе вдвоём | Inbox → редактор | **Open notes**: число и ссылка в редактор |
| 12 | Переименовать страницу или сменить адрес | Emily, Nir | редко | поле Slug; **редирект со старого адреса не создаётся** — старые ссылки (в т. ч. посты LinkedIn) станут 404 | **Page settings**: адрес + автоматический редирект со старого |
| 13 | Удалить черновик или страницу | Emily, владелица | редко | кнопка на странице черновика | «⋯» → **Delete**, с предупреждением, если страница в меню или на неё ведут ссылки |

**Что из этого следует для экрана.** Чаще всего — 1, 2 и 3. Значит, наверху должны быть регионы со статусом и тремя
действиями: Edit, Publish, Share preview. Performance, Google и History — ниже. Новые возможности, которых нет
ни в старом, ни в новом макете: **Share preview** (3), **Copy link for a post** (7), **Files on this page** (10),
**редирект при смене адреса** (12).

## Предложение: один экран вместо трёх вкладок
```
Large vessel stroke                 [Copy link for a post]  [View ↗]  [⋯]
Therapy page                          (⋯: Page settings, Take off the site, Delete)

REGIONS                                                   │ DETAILS
 Americas     ● On the site · Emily, 2 h ago   [Edit] [Share preview]   │  Template   Therapy page
 Europe & ME  ● Changes waiting · Daniel, today [Edit] [Publish] [Share] │  Address    /{region}/therapies/lvo
 Asia & Pac.  ○ No version — [Create from Americas]   [Compare regions] │  In menu    “Large vessel stroke” under Therapies
                                                           │  Google     ✓ title and description  ·  Page settings
PERFORMANCE · last 30 days                                 │
 312 visits · 4 requests started here · top: LinkedIn      │ RECENT CHANGES
 ▁▂▃▅▂▁▃ (by day)          PDFs opened: IFU (12)           │  Emily published · 2 h ago
                                                           │  Daniel edited Europe · today
GOOGLE PREVIEW (Americas ▾)                                │  All versions →
 Large vessel stroke | Rapid Medical                       │
 rapid-medical.com › us › therapies › lvo                  │ OPEN NOTES ON THE PAGE
 TIGERTRIEVER … (description, 148/155)        [Edit]       │  2 notes · open in the editor
                                                           │
FILES ON THIS PAGE                                         │
 IFU TIGERTRIEVER.pdf · opened 12× · [Replace]             │
                                                           │
COLLECTIONS SHOWN ON THIS PAGE (Evidence)                  │
 Publications · 102 · Open · + New                         │
```

### Убрать
- Вкладки **Overview / Google & address / History** как три экрана.
- Повторяющуюся подсказку «Visitors see the latest version» в каждой карточке.
- Технические слова: Slug, Sort order, `#`, `KIND`, ID записи.
- Смену региона выпадашкой у существующей страницы: регион — при создании, дальше «Copy to region».
- Дубли действий (Unpublish / Preview / Edit на второй вкладке).
- Сравнение двух версий через «From / To».

### Оставить
- Статусы словами («On the site», «Changes not published yet», «Not on the site yet»).
- **Edit on page** главной кнопкой.
- Коллекции страницы (Evidence → Publications, Products).
- Запланированную публикацию — в «⋯» и строкой в Regions («publishes Tue 09:00»).

### Добавить
- **Performance** за 30 дней: визиты, заявки, начатые с этой страницы, источники, открытые PDF. Данные уже есть.
- **Google preview** с живым сниппетом и счётчиками 60 / 155 символов по регионам.
- **Create from {регион}** у отсутствующего региона.
- **Details** справа: шаблон, адрес, место в меню, последние изменения, открытые заметки на странице.
- **Page settings** — боковая панель вместо вкладки: в меню, адрес, Google (с превью), картинка для соцсетей, продукт / группа (для терапий).
- **Всю историю** — отдельным экраном-лентой (как в редакторе), с «View» и «Restore».

### Вопросы владелице
1. Один экран + панель Page settings + лента истории (рекомендую) или оставить вкладки, но наполнить их иначе?
2. Performance — сразу (данные есть) или после запуска сайта?
3. Картинка для соцсетей (Open Graph): у терапий она уже есть (`shareImageUrl`, Fix List B.9, иначе — главная
   картинка), у остальных страниц — общая картинка сайта (`/og-image.jpg`). Добавить поле всем страницам?
