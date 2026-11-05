# NOT / notIn над NULLABLE-полем — молчаливая потеря строк

В SQL `NOT (NULL IN (...))` = `NULL`, а не `TRUE` → строка с `NULL` в поле **отбрасывается**, хотя по смыслу
должна остаться. Логи зелёные, данных ноль.

- Любой `notIn` / `NOT` / `<>` / `!=` над nullable-полем (Prisma, Drizzle, сырой SQL) — до коммита проверь
  намерение по `null`.
- Правильно — явно оставить `null`: Prisma `OR: [{ f: null }, { f: { notIn: [...] } }]`,
  Drizzle `or(isNull(t.f), notInArray(t.f, [...]))`, SQL `f IS NULL OR f NOT IN (...)`.
- Ревью: `grep -rnE "notIn|notInArray|NOT IN|not:" src/` — каждое попадание сверить с nullable-схемой.
