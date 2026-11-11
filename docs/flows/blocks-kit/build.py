#!/usr/bin/env python3
"""Rapid Medical blocks kit page: every site block with anatomy, variants as properties and a page composer.
   python3 docs/flows/blocks-kit/build.py <out.html>
Data: ../rm-pages.json. Renderers and styles: page.template.html (also the source of ../pack.js, see make-pack.py)."""
import json, sys
from pathlib import Path
from common import META, load

pages, inst = load()
out = {'meta': META, 'pages': pages, 'instances': inst}
tpl = (Path(__file__).resolve().parent / 'page.template.html').read_text(encoding='utf8')
Path(sys.argv[1]).write_text(tpl.replace('/*__DATA__*/{}', json.dumps(out, ensure_ascii=False).replace('</', '<\\/')), encoding='utf8')
print('ok:', sys.argv[1], len(META), 'blocks', sum(len(m['variants']) for m in META), 'variants')
