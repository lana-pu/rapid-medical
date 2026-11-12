# Информационная архитектура сайта (как есть, 2026-11-13)

Описание структуры, которая сейчас в коде и в базе. Это перенос с Duda: структуру сильно не меняем (решение владелицы,
`spec.md → Стадия`). Ничего здесь не предлагается к переделке: в конце — вопросы, которые видны из структуры.
Источники: маршруты `src/app/(site)/`, база (сид), меню `src/lib/navigation.ts`, аудит Duda `content/audit.md`,
редиректы (`redirects`, 47 шт.), экраны `docs/screens/*.md`.

## 1. Регионы — первый уровень

Регион в адресе (ADR-002): `/us`, `/ous`, `/apac`. Определяется по IP при первом заходе (решение 2026-11-10); без
страны — экран выбора `/choose-your-location`. Переключатель региона — в верхней строке на каждой странице.

| Код | Название на сайте | Терапий |
|---|---|---|
| `us` | Americas | 3 |
| `ous` | Europe & Middle East (в подписи: «Europe, Middle East, Latin America & Australia») | 5 |
| `apac` | Asia & Pacific | 5 |

Региональные разделы: терапии, Evidence, вебинары, часть текстовых страниц. Остальное — общее для всех регионов.

## 2. Дерево страниц

```
/                                   Home — общая (site_pages: home)
├── /choose-your-location           выбор региона (?next=evidence — куда вести дальше)
├── /{region}                       → редирект на /{region}/therapies
│   ├── /therapies                  обзор терапий региона (site_pages: therapies × 3)
│   │   ├── Ischemic stroke
│   │   │   ├── /lvo                Large vessel stroke            us · ous · apac
│   │   │   └── /mvo                Medium vessel stroke                 ous · apac
│   │   ├── Hemorrhagic stroke
│   │   │   ├── /aneurysm           Aneurysm                       us · ous · apac
│   │   │   └── /vasospasm          Vasospasm                            ous · apac
│   │   └── Access
│   │       └── /drivewire          Access                         us · ous · apac
│   ├── /evidence                   публикации региона, вкладки по продуктам (site_pages: evidence × 3)
│   ├── /webinars                   вебинары + форма «запросить запись» (не в меню: ссылки со страниц терапий)
│   └── /{slug}                     региональные текстовые страницы (см. 4)
├── /news-events                    сверху предстоящие события, ниже новости и архив
│   └── /events/{slug}              событие: до даты — регистрация, после — итоги
├── /about-us                       о компании, руководство (биографии раскрываются тут же), офисы, карта
│   └── /team/{slug}                → 308 на /about-us#{slug}
├── /careers                        карьера, цитаты, принципы, форма
│   └── /open-positions             вакансии (ссылка с Careers видна, только когда вакансии есть)
│       └── /{slug}                 вакансия с формой
├── /contact-us                     форма (?region=&topic=), письмо уходит по теме и региону
└── /{slug}                         общие текстовые страницы (см. 4)

служебные: /sitemap.xml, /robots.txt, /style-guide (витрина блоков, noindex, без ссылок)
```

## 3. Навигация

- **Верхняя строка:** Get in touch (телефоны HQ и US, почта) · переключатель региона.
- **Меню:** Welcome · Therapies ▾ (выпадающий список терапий региона по группам + All therapies) · Evidence (своего
  региона) · News & Events · About Us · Careers · кнопка **Contact Us** (с регионом). Без региона Therapies и Evidence
  ведут через выбор региона. На телефоне — те же пункты строкой, без Welcome. Правится: состав и адреса — дизайнер и
  админ (Site settings → Menu and footer), подписи — на странице (`screens/menu-footer.md`).
- **Футер:** Get in touch (контакты) · Follow (X, LinkedIn, Instagram, YouTube) · Legal (Privacy Statement, Terms of
  Use, Compliance Statement, Patents) · региональное уведомление (своё у каждого региона) · копирайт.

## 4. Текстовые страницы (`pages`)

| Где | Страница | На сайте | Откуда ссылка |
|---|---|---|---|
| общая | Privacy Statement, Terms of Use, Compliance Statement, Patents | да | футер |
| общая | DISTALS Trial Results | да | страницы MVO |
| общая | Long-term outcomes … Comaneci remodeling device (`/LongTerm_Outcomes`) | да | **ниоткуда** |
| us · ous · apac | SUCCESS Study – Final Results | да | страницы Aneurysm |
| ous | COMANECI spinal case – Dr. Patankar | да | Aneurysm (ous) |
| us | TIGERTRIEVER™ Instructions for Use – Canada | да | **ниоткуда** |
| us | DRIVEWIRE™ 24 SVIN Poster | черновик | — |
| us · ous · apac | See the comparison / comparison video, COMANECI for vasospasm | черновик | обёртки с Duda: адреса перенаправлены на страницы терапий |

## 5. Откуда берётся содержимое

| Раздел | Свои тексты страницы | Списки из записей админки |
|---|---|---|
| Home | блоки страницы | новости (featured) |
| Обзор терапий | блоки страницы | карточки терапий региона по группам |
| Терапия | блоки страницы; вкладки продукта (Product overview, How it works, In-Practice, Clinical evidence → Evidence) | версии в других регионах, подпись региона; регуляторный блок закреплён внизу |
| Evidence | блоки страницы | публикации (102): featured, последние, по продуктам; вкладка = продукт региона |
| Webinars | — | вебинары (5) |
| News & Events | — | новости (53), события (5) |
| About | блоки страницы | руководство (6), офисы и пины карты (Contact details) |
| Careers / Open positions | блоки страницы | вакансии (сейчас 0) |
| Contact | — | темы и адреса получателей (Contact details) |

Продукты (вкладки Evidence и ссылки с терапий): TIGERTRIEVER™, TIGERTRIEVER™ 13 (ous, apac), TIGERTRIEVER™ 25 & XL
(ous, apac), COMANECI™, DRIVEWIRE™.

## 6. Ключевые связи

- Home → Therapies региона → терапия → вкладка Clinical evidence → `/{region}/evidence#{продукт}`.
- Терапия → кнопки Request a demo / Customer support → `/contact-us?region=&topic=`.
- Терапия → «версия в другом регионе» (подпись региона на странице).
- Терапии (кроме Access) → Webinars своего региона; других путей к вебинарам нет — в меню их нет.
- Терапии → Evidence своего региона; Home → News & Events. Между Evidence, Webinars и News & Events прямых ссылок нет.
- Старые адреса Duda (`us.`, `ous.`, `apac.rapid-medical.com/...`) → 301 на новые (47 редиректов).

## 7. Вопросы, которые видны из структуры (без изменений, решать владелице)

1. **`/us/vasospasm` → `/us/therapies/vasospasm`** — редирект ведёт на страницу, которой нет: Vasospasm в Americas нет.
   Куда вести — на Aneurysm, на обзор терапий, или в Americas терапия есть, но не опубликована?
2. **Страницы без входящих ссылок:** Long-term outcomes (Comaneci) и IFU – Canada открываются только по прямой ссылке.
   Так и задумано (ссылки из писем, QR) или ссылки потерялись при переносе?
3. **Название региона OUS:** «Europe & Middle East» в выборе и меню против «Europe, Middle East, Latin America & Australia»
   в подписях; гео-карта шлёт Латинскую Америку в Americas (BACKLOG, решение №9; ждём Emily).
4. **Webinars не в меню:** попасть можно только со страниц терапий. Так было на Duda; оставить или добавить в меню
   (например, под Evidence)?
5. **Вакансий 0:** блок вакансий на Careers прячется, на `/open-positions` ничего не ведёт. Так и нужно, пока набор идёт
   через Spark Hire?
6. **Вебинары в APAC:** на Duda были только US и OUS (BACKLOG №14).
7. **Evidence «Featured publications»** — отмеченные или последние (BACKLOG №13).
8. **Форма запроса брошюры** (`/request-form` на Duda) на новом сайте отсутствует (BACKLOG №17).
9. **Сравнение регионов терапий:** MVO и Vasospasm есть в ous и apac, нет в us — это регуляторика или просто не сделано?
