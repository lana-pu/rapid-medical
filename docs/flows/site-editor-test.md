# Проверка редактора на людях — сценарий

**Зачем.** Главный страх: «нетехнический человек не разберётся». Снять его может только проверка на будущих редакторах.
Задания — из `memory/findings/admin-editor-best-practices.md → Как проверить`, приведены к тому, что кликается во флоу.

**На чём.** Кликабельные вайрфреймы, вид **Prototype**:
- редактор сайта — https://claude.ai/artifact/LkArx5FdPAWQQqCvsigRP8 (`docs/flows/site-editor.json`);
- админка — https://claude.ai/artifact/9mBBLfMDh1soj6rFuXaAPh (`docs/flows/admin.json`).

Ссылки приватные: перед встречей открыть доступ через Share или показывать со своего экрана.

**Ограничение прототипа.** Кликаются только подсвеченные места; клик мимо подсвечивает, что кликабельно. Если участник
нажал «не туда» — это данные, а не ошибка: спросить «What did you expect to happen?» и записать.

## Участники и формат
- 2–3 будущих редактора у клиента: маркетинг, кто будет менять сайт. Не разработчики и не мы.
- 30 минут на человека, по видео со показом экрана, вслух («think aloud»). Запись — только с согласия.
- Ведущий не подсказывает и не объясняет интерфейс. Второй человек ведёт заметки по таблице ниже.

## Вступление (ведущий, по-английски)
> Thanks for helping. We are testing a draft of the new website editor, not you — there are no wrong answers.
> It is a grey sketch: some things are not clickable yet. Please think aloud: say what you look for and what you expect.
> If you get stuck, say so — that is exactly what we need to learn.

## Задания

Перед каждым — открыть экран старта (ссылка `#proto-…` в адресе прототипа). Задание читать дословно.

| № | Задание участнику | Старт | Успех — дошёл до | Смотреть особенно |
|---|---|---|---|---|
| 1 | “Change the main title of the Large vessel stroke page to: *A patient-centric approach to acute ischemic stroke*.” | `#proto-pages` | `edit-text`, нажал Done | Нашёл ли страницу поиском или списком; понял ли, что клик по тексту начинает правку; ищет ли кнопку Save (её нет — автосохранение) |
| 2 | “The video next to *Gain active control* should be different only for Europe & Middle East. Show how you would do it.” | `#proto-edit-text` | `edit-video`, увидел переключатель «Same in all regions» | Понял ли без слов, что видео общее для регионов; где ищет регион: в панели или в меню «Showing» |
| 3 | “Find out how this page differs between Europe & Middle East and Asia & Pacific.” | `#proto-section-added` | `differences` | Находит ли меню «Showing»; понятны ли «Only in this region» и «Separate by rule» |
| 4 | “Publish your changes. Before you do, tell us what will change on the live site.” | `#proto-differences` | `published`, увидел «Live now» | Читает ли список изменений и регионов в окне проверки или жмёт сразу; что ждёт после публикации |
| 5 | “Oops — the old title was right. Bring the previous version back.” | `#proto-published` | `history`, нажал Restore | Находит ли History; не пугается ли «Restore» (что станет с живым сайтом) |
| 6 | “A new DRIVEWIRE 24 study came out. Add it to Evidence for Americas and Europe & Middle East.” (админка) | `#proto-home` | `pub-live` | Путь с рабочего стола; поле даты; понятны ли ошибки в `pub-error` |
| 7 | “Make a page for the DISTAL Summit 2027 event.” (админка) | `#proto-home` | `page-created` | Понятны ли шаблоны; подписи вместо пустых мест |

Задание 4 в находках звучало как «сделай страницу мероприятия и опубликуй в одном регионе» — здесь разделено на 4 и 7,
потому что регион новой страницы во флоу выбирается в окне создания.

## Что записывать

Для каждого задания:

| Поле | Значения |
|---|---|
| Результат | сам · с одной подсказкой · не справился |
| Время | минуты до успеха или до отказа |
| Где остановился | экран и элемент |
| Чего ждал | его словами |
| Слова, о которых спросил | дословно (например: «What is *Showing*?») |
| Цитата | одна, самая точная |

Подсказка — только одна и только наводящая («Where would you look for that?»). Вторая подсказка = «не справился».

## После заданий (5 минут)
1. “What was the hardest moment?”
2. “What would you be afraid of doing on the real site?”
3. “Is there anything you expected to find but didn’t?”

## Как разбирать
- Проблема, на которой споткнулись двое из трёх, — в работу; одна — записать и смотреть дальше.
- Итог — `memory/findings/editor-usability-<дата>.md`: задание → результат по людям → проблема → какой экран и заметка флоу
  её касаются → предложение. Решения — в BACKLOG, выбор за владелицей.
- Флоу поправить по итогам и пересобрать (`/wireframes`), чтобы следующая проверка шла на новой версии.
