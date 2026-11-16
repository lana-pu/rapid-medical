# Экран: Search & sharing (`/admin/seo`)

Решение владелицы 2026-11-15: тексты для Google — **одна система**, без правки «по кусочкам на разных страницах».
Править можно и здесь, и в Settings самой страницы — это одно и то же поле, поэтому расходиться нечему. Референсы
(Mobbin): Jobber «SEO and Discovery», Later «SEO Data», Searchable «SEO settings» — поле, счётчик, подсказка под полем,
живое превью рядом. Код: `src/admin/seo.ts`, `src/app/admin/(dashboard)/(settings)/seo/page.tsx`,
`src/components/admin/SeoEditor.tsx`.

## Где хранится текст страницы (один источник на страницу)
| Страницы | Где поле | Как попадает на сайт |
|---|---|---|
| Терапии, текстовые страницы | поля записи `metaTitle` / `metaDescription` (по региону) | как правка страницы: черновик → **Publish** |
| Home, About, Careers, Evidence, обзор Therapies | поля записи `site_pages.meta_title` / `meta_description` (миграция 0022; прежние тексты из кода и из Settings перенесены) | черновик → **Publish** |
| Webinars, News & Events, Open positions, Contact Us | Settings → группа `seo` (у Contact — по региону и общий) | сразу при сохранении (как все настройки сайта) |
Новости, события, вакансии, публикации получают заголовок из своего названия — в списке их нет.

## Вид — список и редактор (master–detail), не таблица-куча
- **Слева** — страницы сайта по разделам дерева (Home · Therapies · Evidence · Webinars · News & Events · About · Careers
  · Contact · Other pages): название и точка состояния — зелёная (всё в порядке) или жёлтая (есть что поправить).
  Сверху поиск и **Only problems ({N})**. Проблема: нет описания, заголовок длиннее 60 или описание длиннее 155 знаков.
- **Справа** — выбранная страница (`?page={ключ}`): по карточке на регион (Asia & Pacific, пока не используется, —
  свёрнут): поле **Title in Google** (счётчик 0/60), **Description in Google** (0/155, подсказка «What the page offers,
  in one or two sentences»), **живое превью** сниппета рядом, **Save**. Пусто в заголовке — показано, что подставится
  (название страницы | Rapid Medical™).
- После Save: у страниц-записей — «Saved. It goes live when this page is published» и **Publish {регион}**; у страниц
  из Settings — «Saved — live on the site». Ссылка **Open the page** ведёт на экран страницы.

## Связи
- На экране страницы блок «How Google shows it» → **Edit** ведёт сюда, на эту страницу.
- В Settings самой страницы (терапии, текстовые и Home / About / Careers / Evidence / Therapies) остаются те же поля —
  правка там видна здесь и наоборот.
- Прежний экран «Google titles & descriptions» в меню Settings заменён этим.

## Права
Любая роль после двухшагового входа.
