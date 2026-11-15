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

## Предложение: один экран вместо трёх вкладок
```
Large vessel stroke                        [Edit on page]  [View ↗]  [⋯]
Therapy page · /us/therapies/lvo …                                    (⋯: Page settings, Copy to region, Unpublish, Delete)

REGIONS                                                   │ DETAILS
 Americas        ● On the site · edited by Emily, 2 h ago  │  Template   Therapy page
 Europe & ME     ● Changes not published · Daniel, today   │  Address    /{region}/therapies/lvo
 Asia & Pacific  ○ No version — [Create from Americas]     │  In menu    “Large vessel stroke” under Therapies
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
3. Картинка для соцсетей (Open Graph) — добавлять поле сейчас? Сейчас у всех страниц общая картинка сайта
   (`/og-image.jpg`), у терапий — главная картинка страницы; выбрать свою для поста в LinkedIn нельзя.
