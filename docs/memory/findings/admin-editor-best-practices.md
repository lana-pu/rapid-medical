# Админка для нетехнического человека: практики и разбор прототипа

2026-11-07. Повод: владелица посмотрела прототип v0.1 и считает, что удобства нет, а человек без технического опыта
в нём не разберётся. Разбор прототипа подтверждает это.

**Как собрано.** Экраны продуктов смотрели глазами в Mobbin. Справку вендоров и статьи читали, где страница открылась.
Руками ни один продукт не пробовали, с редакторами клиента ничего не проверяли.

**Отход от метода `/benchmark`.** В проекте нет атласа и этапов JTBD, поэтому результат лежит здесь, а не в
`docs/research/stages/`. Полная матрица «продукты × шаги» не собиралась, вместо неё таблица паттернов.

**Уровень доказательности: L2, местами L1.** Контролируемого исследования «правка на странице против формы» для CMS
не нашли. Всё ниже опирается на эвристики, практиков, справку вендоров и экраны. Это сильные ориентиры, а не замеры.
L5 дадут только реальные редакторы (раздел «Как проверить»).

## Главный вывод

Прототип повторяет ошибку текущей админки: он устроен вокруг системы, а не вокруг страницы сайта. В продуктах для
нетехнических людей редактор сразу видит свою страницу, нажимает на то, что хочет поменять, видит результат, нажимает
Publish. Дизайн защищён так, что сломать его нельзя. Остальное убрано на второй уровень.

## Что не так в прототипе v0.1

| № | Проблема | Факт в прототипе | Принцип |
|---|---|---|---|
| 1 | Редактор не видит страницу | Вместо страницы стопка полей с подписями капсом: HERO, BENEFIT, REGULATORY. На сайте она выглядит иначе | Соответствие реальному миру |
| 2 | Нет предпросмотра | Кнопки Preview нет вообще. Перед Publish нельзя увидеть результат | Видимость состояния |
| 3 | Нет страховки | Нет Undo, истории и пути назад после публикации, хотя история есть в текущем коде | Контроль и свобода |
| 4 | Слишком много над контентом | 9 элементов управления в двух рядах: назад, Comment, Ask a colleague, Publish, 3 региона, Edit, Compare regions | Минимализм |
| 5 | Внутренний язык | US / OUS / APAC, Global, Workspace, Content lists, Hero, Eyebrow, Coverage, Build release | Язык пользователя |
| 6 | Код вместо слов | Пунктирный чип значит «страницы нет в регионе», это надо прочитать в подзаголовке и запомнить | Узнавание вместо запоминания |
| 7 | Главная отвечает не на тот вопрос | Первый экран показывает исключения. Частая задача «поменять текст на странице X» начинается с поиска пункта меню. Поиска нет | Навигация |
| 8 | Публикация заканчивается ничем | Всплывающая надпись на 3 секунды, ссылки на живую страницу нет | Видимость состояния |
| 9 | Нет экрана выбора | Владелица просила: вход, затем выбор «сайт или инструмент». В прототипе маленький переключатель в сайдбаре | Требование владелицы |
| 10 | Разные слова для одного действия | На сайте Publish, в инструменте Build release, хотя по ADR-006 это одно и то же действие | Единообразие |
| 11 | Прототип почти не кликается | Из 14 страниц открывается одна, Content lists — заглушка, у инструмента один экран. Оценить работу по такому трудно | Ошибка подачи |

## Практики

Метки: **L2** — экран или страница источника просмотрены, **L1** — только выдержка поиска, страницу открыть не удалось.

| Практика | У кого видели | Что берём | Что не берём |
|---|---|---|---|
| **Страница в центре** | [Squarespace](https://mobbin.com/flows/f47edd7d-36c3-4ecf-8dfd-4a5c73464137?tab=screens&utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp), [Etsy](https://mobbin.com/screens/feeecbfb-8571-4f25-a003-d872cc68b16f?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp), Shopify, [Storyblok](https://www.storyblok.com/docs/manuals/visual-editor) (L2) | Настоящая страница сайта. Клик по элементу начинает правку. Страница и панель связаны: Storyblok показывает слева сайт, справа поля | Свободное перетаскивание и конструктор, как у [Wix](https://mobbin.com/screens/53f6b15a-11db-4cd9-aeed-7ff0198be545?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp): там десятки инструментов |
| **Дизайн заперт, контент открыт** | WordPress contentOnly (L2), Canva Brand Templates, Webflow Content editor (L1) | Редактор меняет только текст и картинки, остальных настроек у него просто нет. Дизайнер работает в другом режиме | Разблокировку редактором |
| **Описания простыми словами** | [Jobber](https://mobbin.com/screens/a9429ca2-1977-4da6-ac85-3f47da574030?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp), [Workable](https://mobbin.com/screens/58da6014-8c92-4693-8155-c5bad206c7d0?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) (L2) | Секция подписана тем, что она делает: «Header. Change image, taglines, and contact information». Новые секции выбираются по картинке | Настройки цвета, отступов и размеров в той же панели |
| **Один статус и видимое автосохранение** | [Flodesk](https://mobbin.com/screens/ec94aee4-ec6a-47d1-bbef-4e52b10f039f?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp), Squarespace (L2) | Одна строка сверху: что за страница, опубликована ли, сохранено ли. Undo и Redo рядом | Отдельную кнопку Save: правки и так сохраняются в черновик |
| **Preview рядом с Publish** | Wix, GoDaddy, Etsy, Mailchimp (L2) | Пара кнопок в одном и том же месте на всех экранах | Переключатели устройств на первом плане |
| **Проверка перед публикацией** | [Mailchimp](https://mobbin.com/screens/0c79d28b-8330-423c-ab01-0c281b07f528?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) (L2) | Список галочками и превью рядом: «Your email is ready to send!». У нас: что меняется, в каких регионах, нет ли пустых полей и картинок без описания | Пошаговый мастер: страницу правят часто, письмо отправляют один раз |
| **Понятный итог публикации** | [Wix](https://mobbin.com/flows/1e3115b2-30bb-4f8b-927d-5f331567db2d?tab=screens&utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) (L2) | «Опубликовано», адрес и ссылка на живую страницу | Рекламу следующего шага |
| **История с откатом** | [Fibery](https://mobbin.com/screens/eb05e8be-4a16-47f0-94fe-08ad3da74171?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) (L2) | Список версий с датой и автором, «Show changes», «Restore version» | Номера версий и обязательные комментарии к ним |
| **Страницы с миниатюрами и поиск** | [Mailchimp](https://mobbin.com/flows/7222be25-3e18-4f83-853e-60fceb543d81?tab=screens&utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp), [Kajabi](https://mobbin.com/screens/23f83043-62a2-40b9-9ed5-0fe16a8f3374?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) (L2), Lullabot | Страницу узнают по картинке, поиск есть в самой админке | Таблицу с фильтрами и настраиваемыми видами, как у [HubSpot](https://mobbin.com/screens/e57fa484-104d-4b1d-b7b1-12ee79debd54?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) |
| **Сложное на втором уровне** | [NN/g](https://www.nngroup.com/articles/progressive-disclosure/) (L2) | Сначала только важное, редкое по запросу. Не больше двух уровней | Прятать то, что нужно часто или юридически значимо |
| **Подсказки на месте** | Lullabot (L2), GOV.UK (L2) | Короткий текст о том, что будет на сайте. GOV.UK хранит подсказки в файлах, чтобы их правили без разработчика | Обязательный тур при первом входе |

## Правка на странице: где она ломается

Самый важный довод против простого «сделаем как Squarespace». Статья [Lullabot](https://www.lullabot.com/articles/inline-editing-and-the-cost-of-leaky-abstractions)
2012 года (мнение практика, но конкретное): правка на странице хороша для простого контента и хуже работает, когда есть
поля, которых не видно на странице, контент повторяется в нескольких местах, есть перевод и многошаговая работа.

У Rapid Medical это всё есть: SEO, альтернативный текст, регионы, регуляторные тексты, повторяющиеся файлы.

**Вывод: гибрид, как у Storyblok и Shopify.** Страница в центре, короткий текст правится прямо на ней, остальное в панели
рядом, которая открывается по клику. То, чего на странице не видно, живёт в «Page settings». Формы остаются для списков:
Evidence, новости, команда. Там страница не нужна, и Lullabot прямо советует не считать правку на странице обязательной.

## Регионы

Самая сложная часть, и здесь у вендоров есть готовая модель.

| Что делают | Источник |
|---|---|
| Регион наследует базовую версию, пока его не поменяли | Shopify (L2), Webflow (L1) |
| Регион выбирается в одном меню над страницей, страница показана как в этом регионе | [Shopify](https://mobbin.com/screens/65c27494-e178-460a-bc19-5b2ab821c04f?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) (L2) |
| Отличия собраны отдельно от общего: разделы Customized и Inherited | [Shopify](https://mobbin.com/screens/2a348087-153b-49c5-ba11-b887d83269bb?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp) (L2) |
| Отличие можно сбросить и вернуться к общему | [Shopify](https://help.shopify.com/en/manual/online-store/themes/customizing-themes-for-markets) (L2), Webflow (L1) |

**Что берём.** Меню «Showing: Americas» над страницей вместо вкладок. На элементе пометка «Same in all regions» или
«Only in this region». Сравнение регионов, которое понравилось владелице, остаётся, но вторым уровнем: подсветка на самой
странице и отдельный экран «See differences».

**Что не берём.**
- Правило Webflow «структура только в основной версии»: у нас есть страницы и блоки только для отдельных регионов.
- Автоматическое наследование для регуляторных текстов (**вывод, не из источников**). Правка базовой версии не должна
  сама менять показания к применению в другом регионе. Такие блоки всегда свои в каждом регионе, а совпадение видно в
  сравнении. Подтвердить с клиентом.

**Цена.** Сегодня терапии лежат отдельной записью на регион, связи между копиями нет. Наследование меняет модель данных.
Это самое дорогое решение в этом документе.

## Словарь

| Сейчас | Предложение |
|---|---|
| Workspace | Home |
| Content lists | Сразу Evidence, News, Team и так далее |
| US / OUS / APAC | Americas / Europe, Middle East, LatAm & Australia / Asia & Pacific |
| Global | All regions |
| Hero | Top of page |
| Eyebrow | Small label above the title |
| Published, has edits | Live, with unpublished changes |
| Compare regions | See differences |
| Coverage | What's ready |
| Build release | Publish (как на сайте) |

Draft, Publish, Template и Comment оставляем: это обычные слова в продуктах такого типа. Подбор предварительный,
финальный проверить на людях и сверить с тем, как регионы называет сам клиент.

## Как должен выглядеть путь редактора

1. Вход, затем выбор: Website или Training tool.
2. Website: поиск и страницы с миниатюрами. Рядом короткий блок «Needs your attention».
3. Клик по странице: настоящая страница. Сверху только назад, название, регион, статус, Undo, Comment, Preview, Publish.
4. Клик по тексту или картинке: правка. Дизайн заперт, вёрстку сломать нельзя.
5. Publish: что изменится и в каких регионах, галочки проверки, кнопка.
6. Итог: «Live now» и ссылка на страницу. Ошибся — History, Restore.

## Как проверить

Страх «не разберётся» снимается только проверкой на людях. Команда у клиента маленькая, поэтому хватит 2–3 будущих
редакторов. Без подсказок, с рассказом вслух.

1. Поменяй заголовок на странице Access для Америки.
2. Замени картинку только для Asia & Pacific.
3. Найди, чем отличается регуляторный текст между регионами.
4. Сделай страницу мероприятия по шаблону и опубликуй в одном регионе.
5. Верни предыдущую версию страницы.

Смотрим: сделал ли сам, где остановился, какие слова спросил. Проверку можно сделать на встрече с маркетингом, если
эти пути в прототипе будут кликаться.

## Решения за владелицей

1. Переделать редактор прототипа вокруг настоящей страницы (гибрид). Рекомендация: да.
2. Брать модель наследования регионов, несмотря на смену модели данных. Рекомендация: да, кроме регуляторных блоков.
3. Какая версия базовая. Это вопрос к клиенту: US или международная.

## Источники

- NN/g: [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- Lullabot: [7 Pillars of a Good Editorial Experience](https://www.lullabot.com/articles/7-pillars-good-editorial-experience), [Inline Editing and the Cost of Leaky Abstractions](https://www.lullabot.com/articles/inline-editing-and-the-cost-of-leaky-abstractions)
- [Evolving Web: why CMS usability is tough](https://evolvingweb.com/blog/content-editor-ux-why-cms-usability-tough) (без данных, мнение агентства)
- GOV.UK: [Building and testing the new Content Publisher](https://insidegovuk.blog.gov.uk/2019/04/23/building-and-testing-the-new-content-publisher)
- Storyblok: [Visual Editor](https://www.storyblok.com/docs/manuals/visual-editor)
- WordPress: [Patterns and Block Locking](https://developer.wordpress.org/themes/patterns/patterns-and-block-locking/)
- Shopify: [Customizing themes for markets](https://help.shopify.com/en/manual/online-store/themes/customizing-themes-for-markets), [Markets inheritance](https://shopify.dev/docs/apps/build/markets/new-markets/market-inheritance)
- L1, страницы вернули 403, использованы выдержки поиска: [Canva: locks in Brand Templates](https://www.canva.com/help/brand-template-locks/), [Webflow: Localize content and styles](https://help.webflow.com/hc/en-us/articles/33961240676371-Localize-content-and-styles), [Webflow: Site roles](https://help.webflow.com/hc/en-us/articles/41015796747667-Site-roles-and-permissions)
- Экраны: Mobbin, ссылки в таблицах. Дата сбора 2026-11-07.
