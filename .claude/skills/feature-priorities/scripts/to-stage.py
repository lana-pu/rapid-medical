#!/usr/bin/env python3
"""Перенести таблицу приоритетов в атлас исследования.

Использование:  python3 to-stage.py <папка-данных> <stages/priorities.json>

Читает данные /feature-priorities и пишет раздел `table` этапа priorities: в атласе таблица работает как на отдельной
странице (правка в строке, фильтры, подробности). Выводы, решения и подтверждение из файла этапа сохраняются.
"""
import json, sys, glob, os


def load(path, default=None):
    if not os.path.exists(path):
        if default is not None:
            return default
        sys.exit(f"Нет файла: {path}")
    with open(path, encoding="utf8") as f:
        return json.load(f)


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

    table = []
    if cfg.get("how"):
        how = [{"type": "table", "head": ["Что", "Как читать"], "rows": [list(pair) for pair in col]} for col in cfg["how"]]
        table.append({"type": "fold", "t": "Как раскладывали", "blocks": how})
    table.append({"type": "prio", "collection": cfg["collection"], "product": cfg["product"], "decideLabel": cfg["decideLabel"],
                  "areaLabel": cfg["areaLabel"], "areaAll": cfg["areaAll"], "areaGroupBy": cfg["areaGroupBy"],
                  "buckets": cfg["buckets"], "areas": cfg["areas"], "rows": F, "details": detail, "refs": refs, "jobs": jobs})

    stage = load(out, {})
    stage.setdefault("outputs", {})["table"] = table
    stage["outputs"].pop("details", None)
    with open(out, "w", encoding="utf8") as f:
        json.dump(stage, f, ensure_ascii=False, indent=1)
    print(f"✓ {out}: фич {len(F)}, подробностей {len(detail)}, карточек {sum(len(d.get('competitors', [])) for d in detail.values())}")


if __name__ == "__main__":
    main()
