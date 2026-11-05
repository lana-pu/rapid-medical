#!/usr/bin/env python3
"""Перенести таблицу приоритетов в атлас исследования.

Использование:  python3 to-stage.py <папка-данных> <stages/priorities.json>

Читает данные /feature-priorities и пишет разделы `table` и `details` этапа priorities. Выводы, решения,
открытые пункты и подтверждение, которые уже есть в файле этапа, сохраняются.
"""
import json, sys, glob, os

NOW = {"have": ("Есть", "ok"), "part": ("Частично", "warn"), "broken": ("Сломано", "bad"), "none": ("Нет", "none")}


def load(path, default=None):
    if not os.path.exists(path):
        if default is not None:
            return default
        sys.exit(f"Нет файла: {path}")
    with open(path, encoding="utf8") as f:
        return json.load(f)


def sources(src):
    out = []
    for i, p in enumerate(x.strip() for x in str(src).split(";") if x.strip()):
        url, _, note = p.partition(" ")  # после адреса бывает пометка: «(проверено 01.11)»
        out.append(f"[источник {i + 1}]({url}) {note}".strip() if url.startswith("http") else p)
    return ", ".join(out)


def card(c):
    mark = {"vendor": " · проверено у вендора", "secondhand": " · по обзору"}.get(c.get("checked"), "")
    out = [{"type": "sub", "t": c["name"] + mark}, {"type": "text", "t": c["how"]}]
    for key, label in (("users", "Пользователи"), ("take", "Взять"), ("dont", "Не брать")):
        if c.get(key):
            out.append({"type": "text", "t": f"**{label}.** {c[key]}"})
    if c.get("src"):
        out.append({"type": "text", "t": sources(c["src"])})
    return out


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, out = sys.argv[1], sys.argv[2]
    cfg = load(os.path.join(src, "config.json"))
    F = load(os.path.join(src, "features.json"))
    refs = load(os.path.join(src, "refs.json"), {})
    jobs = load(os.path.join(src, "jobs.json"), {})
    detail = {}
    for p in sorted(glob.glob(os.path.join(src, "detail", "*.json"))):
        detail.update({d["id"]: d for d in load(p)})

    table, details = [], []
    for col in cfg.get("how", []):
        table.append({"type": "table", "head": ["Что", "Как читать"], "rows": [list(pair) for pair in col]})
    for b in cfg["buckets"]:
        rows = [r for r in F if r["prio"] == b["key"]]
        if not rows:
            continue
        table.append({"type": "sub", "t": f"{b['label']} · {len(rows)}"})
        table.append({"type": "text", "t": b["short"]})
        body = []
        for r in rows:
            d = detail.get(r["id"], {})
            comp = ", ".join(c["name"] for c in d.get("competitors", [])) or r.get("comp", "")
            label, tone = NOW[r["now"]]
            why = r["why"] + (f" **{cfg['decideLabel']}.**" if r.get("decide") else "")
            body.append([r["id"], r["name"], cfg["areas"][r["area"]], {"t": label, "tone": tone}, r.get("nowNote", ""),
                         r.get("research", ""), comp, why])
        table.append({"type": "table", "head": ["№", "Фича", "Фаза", "Сейчас", "Что работает", "Из ресёрча", "Конкуренты", "Почему здесь"],
                      "rows": body})
        details.append({"type": "sub", "t": b["label"]})
        for r in rows:
            d = detail.get(r["id"])
            if not d:
                continue
            blocks = [{"type": "text", "t": f"**Что это.** {d['what']}"}, {"type": "text", "t": f"**Сейчас.** {d['now']}"},
                      {"type": "text", "t": f"**Ресёрч.** {d['research']}"}]
            work = [f"{j}: {jobs[j][0]}" for j in str(r.get("jobs", "")).replace(" ", "").split(",") if j in jobs]
            if work:
                blocks.append({"type": "list", "items": work})
            names = [f"{refs[x][0]} (L{refs[x][1]})" if len(refs[x]) > 1 and refs[x][1] else refs[x][0] for x in r.get("refs", []) if x in refs]
            if names:
                blocks.append({"type": "text", "t": "**Источники.** " + "; ".join(names)})
            if r.get("comp"):
                blocks.append({"type": "text", "t": f"**Конкуренты коротко.** {r['comp']}"})
            for c in d.get("competitors", []):
                blocks += card(c)
            if d.get("compNote"):
                blocks.append({"type": "text", "t": d["compNote"]})
            if d.get("gap"):
                blocks.append({"type": "text", "t": f"**Чего нет ни у кого.** {d['gap']}"})
            if d.get("note"):
                blocks.append({"type": "text", "t": d["note"]})
            details.append({"type": "fold", "t": f"{r['id']} · {r['name']}", "blocks": blocks})

    stage = load(out, {})
    stage.setdefault("outputs", {}).update({"table": table, "details": details})
    with open(out, "w", encoding="utf8") as f:
        json.dump(stage, f, ensure_ascii=False, indent=1)
    print(f"✓ {out}: фич {len(F)}, подробностей {len(detail)}, карточек {sum(len(d.get('competitors', [])) for d in detail.values())}")


if __name__ == "__main__":
    main()
