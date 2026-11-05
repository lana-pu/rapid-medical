#!/usr/bin/env python3
"""Собрать атлас исследования из папки с данными и показать, что не сделано.

Использование:
  python3 build.py <папка-данных> [выходной.html]   — проверить и собрать страницу
  python3 build.py --status <папка-данных>          — только напечатать, что не сделано

В папке:
  project.json     — шапка документа (см. references/data-format.md)
  stages/<id>.json — материал этапа; id — из assets/stages.json. Нет файла — этап не начат.

Статус этапа считает скрипт, руками его не поставить: вручную отмечаются только `confirmed` и `skip`.
Скрипт сначала проверяет данные и печатает все ошибки; страницу пишет, только если ошибок нет.
"""
import json, sys, os, re
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "..", "assets", "template.html")
DEFS = os.path.join(HERE, "..", "assets", "stages.json")
SKILLS = os.path.join(HERE, "..", "..")
BLOCKS = {"text", "sub", "list", "claims", "table", "link", "fold", "shots"}
LABELS = {"fact", "inference", "limit", "pattern"}
TONES = {"ok", "bad", "warn", "none"}
KINDS = {"question", "decision"}
STATUS = {"todo": "Не начат", "work": "В работе", "review": "Ждёт подтверждения", "done": "Готов", "skip": "Пропущен"}


def load(path):
    with open(path, encoding="utf8") as f:
        return json.load(f)


def check_url(u, where, err):
    if urlparse(u).scheme not in ("http", "https"):
        err.append(f"{where}: нужна ссылка http(s), сейчас {u!r}")


def check_block(b, where, err, images):
    t = b.get("type")
    if t not in BLOCKS:
        err.append(f"{where}: тип блока {t!r}, нужно одно из {sorted(BLOCKS)}")
    elif t in ("text", "sub") and not b.get("t"):
        err.append(f"{where}: пустой {t}")
    elif t == "fold":
        if not b.get("t") or not b.get("blocks"):
            err.append(f"{where}: у fold нужны t и blocks")
        for x in b.get("blocks", []):
            check_block(x, where, err, images)
    elif t == "shots":
        for i in b.get("items", []):
            if not re.fullmatch(r"img/[\w./-]+\.(webp|png|jpg)", str(i.get("img"))) or ".." in i["img"]:
                err.append(f"{where}: img = {i.get('img')!r}, нужен путь img/….webp")
            else:
                images.add(i["img"])
    elif t == "list" and not b.get("items"):
        err.append(f"{where}: пустой list")
    elif t == "claims":
        for c in b.get("items", []):
            if not c.get("t"):
                err.append(f"{where}: утверждение без текста")
            if c.get("label") not in LABELS:
                err.append(f"{where}: label = {c.get('label')!r}, нужно одно из {sorted(LABELS)}")
            if c.get("level") not in (None, 1, 2, 3, 4, 5):
                err.append(f"{where}: level = {c.get('level')!r}, нужно 1–5")
    elif t == "table":
        head = b.get("head", [])
        for i, r in enumerate(b.get("rows", [])):
            if len(r) != len(head):
                err.append(f"{where}: строка {i + 1} — ячеек {len(r)}, колонок {len(head)}")
            for c in r:
                if isinstance(c, dict) and c.get("tone") not in (None, *TONES):
                    err.append(f"{where}: tone = {c.get('tone')!r}, нужно одно из {sorted(TONES)}")
                if isinstance(c, dict) and c.get("level") not in (None, 1, 2, 3, 4, 5):
                    err.append(f"{where}: level = {c.get('level')!r}, нужно 1–5")
    elif t == "link":
        if not b.get("t") or not (b.get("url") or b.get("path")):
            err.append(f"{where}: у link нужны t и url или path")
        if b.get("url"):
            check_url(b["url"], where, err)


def output_state(blocks):
    """Ссылка на материал вне атласа — ещё не разобранный материал; final — итог живёт там."""
    if not blocks:
        return "empty"
    if all(b.get("type") == "link" and not b.get("final") for b in blocks):
        return "linked"
    return "filled"


def assemble(src):
    defs = load(DEFS)
    pj = os.path.join(src, "project.json")
    if not os.path.exists(pj):
        sys.exit(f"Нет файла: {pj}")
    project = load(pj)
    err = []
    for k in ["title", "product", "heading", "lede", "owner"]:
        if not project.get(k):
            err.append(f"project.json: нет поля {k}")
    if project.get("eyebrow") is None:
        project["eyebrow"] = ""

    images = set()
    ids = {d["id"] for d in defs}
    sdir = os.path.join(src, "stages")
    for name in sorted(os.listdir(sdir)) if os.path.isdir(sdir) else []:
        if name.endswith(".json") and name[:-5] not in ids:
            err.append(f"stages/{name}: такого этапа нет, этапы: {', '.join(d['id'] for d in defs)}")

    stages = []
    for d in defs:
        p = os.path.join(sdir, d["id"] + ".json")
        data = load(p) if os.path.exists(p) else {}
        where = f"stages/{d['id']}.json"
        keys = {o["key"] for o in d["outputs"]}
        got = data.get("outputs", {})
        for k in got:
            if k not in keys:
                err.append(f"{where}: раздела {k!r} нет у этапа, разделы: {', '.join(sorted(keys))}")
        outs = []
        for o in d["outputs"]:
            blocks = got.get(o["key"], [])
            for b in blocks:
                check_block(b, f"{where} / {o['key']}", err, images)
            outs.append({**o, "blocks": blocks, "state": output_state(blocks)})
        for it in data.get("open", []):
            if it.get("kind") not in KINDS or not it.get("t"):
                err.append(f"{where}: open — нужны kind из {sorted(KINDS)} и t")
        conclusions = data.get("conclusions", [])
        confirmed, skip = data.get("confirmed"), data.get("skip")
        if confirmed and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(confirmed)):
            err.append(f"{where}: confirmed = {confirmed!r}, нужна дата ГГГГ-ММ-ДД")
        if skip is not None and not str(skip).strip():
            err.append(f"{where}: skip — напиши причину")

        filled = [o for o in outs if o["state"] == "filled"]
        ref = d.get("reference")  # справочники: без выводов и подтверждения
        complete = len(filled) == len(outs) and (bool(conclusions) or bool(ref))
        if confirmed and not complete:
            err.append(f"{where}: confirmed стоит, но этап не заполнен")
        if skip:
            status = "skip"
        elif complete:
            status = "done" if confirmed or ref else "review"
        elif filled or conclusions or any(o["state"] == "linked" for o in outs):
            status = "work"
        else:
            status = "todo"

        ready = os.path.exists(os.path.join(SKILLS, d["skill"], "SKILL.md"))
        todo = []
        if status in ("todo", "work"):
            for o in outs:
                if o["state"] == "linked":
                    todo.append({"kind": "moved", "t": o["title"], "out": o["key"]})
                elif o["state"] == "empty":
                    todo.append({"kind": "missing", "t": o["title"], "out": o["key"]})
            if not conclusions and not ref:
                todo.append({"kind": "missing", "t": "Выводы для решения"})
        if status == "review":
            todo.append({"kind": "review", "t": "Прочитать и подтвердить этап"})
        if status != "skip":
            todo += [{"kind": it["kind"], "t": it["t"]} for it in data.get("open", [])]
        stages.append({**d, "outputs": outs, "conclusions": conclusions, "confirmed": confirmed, "skip": skip,
                       "status": status, "skillReady": ready, "todo": todo,
                       "filled": len(filled), "total": len(outs)})

    root = os.path.join(src, project.get("imgRoot", ""))
    for i in sorted(images):
        if not os.path.exists(os.path.join(root, i)):
            err.append(f"экран не найден: {os.path.join(root, i)}")
    titles = {s["id"]: s["title"] for s in stages}
    for s in stages:
        s["needs"] = [{"id": n, "title": titles[n]} for n in s["needs"]]
    nxt = None
    for s in stages:
        if s.get("cross") or s["status"] in ("done", "skip"):
            continue
        if s["status"] == "review":
            action = "Прочитать этап и подтвердить его"
        elif s["skillReady"]:
            action = f"Запустить /{s['skill']}"
        else:
            action = f"Написать скилл /{s['skill']} и пройти этап"
        nxt = {"id": s["id"], "n": s["n"], "title": s["title"], "action": action}
        break
    return project, stages, nxt, err, sorted(images)


def report(stages, nxt):
    for key, label in STATUS.items():
        names = [f"{s['n']} {s['title']}" for s in stages if s["status"] == key]
        if names:
            print(f"{label} ({len(names)}): {'; '.join(names)}")
    if nxt:
        print(f"Следующий шаг: {nxt['n']} {nxt['title']} — {nxt['action']}")
    for s in stages:
        if s["todo"]:
            print(f"\n{s['n']} {s['title']}")
            for t in s["todo"]:
                print(f"  [{t['kind']}] {t['t']}")
    todo = [s["skill"] for s in stages if not s["skillReady"]]
    if todo:
        print(f"\nСкиллы ещё не написаны ({len(todo)}): {', '.join('/' + k for k in todo)}")


def main():
    args = sys.argv[1:]
    only_status = "--status" in args
    args = [a for a in args if a != "--status"]
    if not args:
        sys.exit(__doc__)
    src = args[0]
    out = args[1] if len(args) > 1 else os.path.join(src, "research-atlas.html")
    project, stages, nxt, err, images = assemble(src)
    if err:
        print("\n".join("✗ " + e for e in err))
        sys.exit(f"Ошибок: {len(err)}. Страница не собрана.")
    if only_status:
        report(stages, nxt)
        return

    def js(name, v):
        # данные идут внутрь <script>: ни один символ не должен менять разбор HTML
        raw = json.dumps(v, ensure_ascii=False)
        for ch, code in (("<", "\\u003c"), (">", "\\u003e"), ("&", "\\u0026"), ("\u2028", "\\u2028"), ("\u2029", "\\u2029")):
            raw = raw.replace(ch, code)
        return f"const {name} = {raw};"

    data = "\n".join([js("PROJECT", project), js("STAGES", stages), js("NEXT", nxt), js("STATUS", STATUS)])
    tpl = open(TEMPLATE, encoding="utf8").read()
    html = tpl.replace("__TITLE__", project["title"].replace("<", "&lt;")).replace("/*__DATA__*/", data)
    with open(out, "w", encoding="utf8") as f:
        f.write(html)
    print(f"✓ {out}: {len(html) // 1024} КБ, экранов {len(images)}")
    if images:
        with open(out + ".files.json", "w", encoding="utf8") as f:
            json.dump(images, f, ensure_ascii=False, indent=0)
    report(stages, nxt)


if __name__ == "__main__":
    main()
