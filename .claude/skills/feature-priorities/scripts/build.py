#!/usr/bin/env python3
"""Собрать страницу приоритетов фич из папки с данными.

Использование:  python3 build.py <папка-данных> [выходной.html]

В папке:
  config.json    — шапка, корзины, области, подписи (см. references/data-format.md)
  features.json  — строки фич (массив объектов)
  refs.json      — {id: [название, уровень 1–5 или 0]} — источники доказательств (необязательно)
  jobs.json      — {код: [текст работы, эмоция]} — JTBD-коды (необязательно)
  detail/*.json  — подробности по фичам (массивы объектов), сколько угодно файлов

Скрипт сначала проверяет данные и печатает все ошибки; страницу пишет, только если ошибок нет.
"""
import json, sys, glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "..", "assets", "template.html")
NOW = {"have", "part", "broken", "none"}


def load(path, default=None):
    if not os.path.exists(path):
        if default is not None:
            return default
        sys.exit(f"Нет файла: {path}")
    with open(path, encoding="utf8") as f:
        return json.load(f)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(src, "feature-priorities.html")
    cfg = load(os.path.join(src, "config.json"))
    F = load(os.path.join(src, "features.json"))
    refs = load(os.path.join(src, "refs.json"), {})
    jobs = load(os.path.join(src, "jobs.json"), {})
    detail = {}
    for p in sorted(glob.glob(os.path.join(src, "detail", "*.json"))):
        for d in load(p):
            if d.get("id") in detail:
                print(f"⚠ {os.path.basename(p)}: {d['id']} уже был в другом файле — беру последний")
            detail[d["id"]] = d

    err = []
    for k in ["title", "eyebrow", "heading", "ledeHtml", "product", "collection", "decideLabel",
              "areaLabel", "areaAll", "areaGroupBy", "buckets", "areas", "how"]:
        if k not in cfg:
            err.append(f"config.json: нет поля {k}")
    keys = [b["key"] for b in cfg.get("buckets", [])]
    areas = cfg.get("areas", {})
    ids = set()
    for i, r in enumerate(F):
        rid = r.get("id") or f"#{i}"
        for k in ["id", "area", "name", "now", "prio", "why"]:
            if not r.get(k):
                err.append(f"{rid}: пустое поле {k}")
        if rid in ids:
            err.append(f"{rid}: повторяющийся id")
        ids.add(rid)
        if r.get("now") not in NOW:
            err.append(f"{rid}: now = {r.get('now')!r}, нужно одно из {sorted(NOW)}")
        if r.get("prio") not in keys:
            err.append(f"{rid}: prio = {r.get('prio')!r}, нужно одно из {keys}")
        if r.get("area") not in areas:
            err.append(f"{rid}: area = {r.get('area')!r} нет в config.areas")
        for ref in r.get("refs", []):
            if ref not in refs:
                err.append(f"{rid}: ссылка {ref!r} нет в refs.json")
        for j in str(r.get("jobs", "")).replace(" ", "").split(","):
            if j and j != "—" and jobs and j not in jobs:
                err.append(f"{rid}: работа {j!r} нет в jobs.json")
    for did, d in detail.items():
        if did not in ids:
            err.append(f"detail {did}: такой фичи нет в features.json")
        for k in ["what", "now", "research"]:
            if not d.get(k):
                err.append(f"detail {did}: пустое поле {k}")
        comps = d.get("competitors", [])
        if not comps and not d.get("gap"):
            err.append(f"detail {did}: нет ни конкурентов, ни gap")
        for c in comps:
            for k in ["name", "how", "src"]:
                if not c.get(k):
                    err.append(f"detail {did} / {c.get('name', '?')}: пустое поле {k}")
    missing = [i for i in ids if i not in detail]
    if missing:
        print(f"⚠ без подробностей: {', '.join(sorted(missing))}")
    if err:
        print("\n".join("✗ " + e for e in err))
        sys.exit(f"Ошибок: {len(err)}. Страница не собрана.")

    def js(name, v):
        return f"const {name} = " + json.dumps(v, ensure_ascii=False).replace("</", "<\\/") + ";"

    data = "\n".join([js("CONFIG", cfg), js("F", F), js("AREAS", areas), js("REFS", refs),
                      js("JOBS", jobs), js("DETAIL", detail)])
    tpl = open(TEMPLATE, encoding="utf8").read()
    html = tpl.replace("__TITLE__", cfg["title"].replace("<", "&lt;")).replace("/*__DATA__*/", data)
    with open(out, "w", encoding="utf8") as f:
        f.write(html)
    n_comp = sum(len(d.get("competitors", [])) for d in detail.values())
    counts = {k: sum(1 for r in F if r["prio"] == k) for k in keys}
    print(f"✓ {out}: фич {len(F)} ({', '.join(f'{k} {v}' for k, v in counts.items())}), "
          f"подробностей {len(detail)}, карточек конкурентов {n_comp}, {len(html) // 1024} КБ")


if __name__ == "__main__":
    main()
