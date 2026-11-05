"""Copy img/ tree with screenshots downscaled to <=520 px wide, JPEG-encoded (keeps file names) — for the print build."""
import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
for root, _, files in os.walk(src):
    for f in files:
        a = os.path.join(root, f); b = os.path.join(dst, os.path.relpath(a, src)); os.makedirs(os.path.dirname(b), exist_ok=True)
        im = Image.open(a).convert("RGB")
        if im.width > 520: im = im.resize((520, round(im.height * 520 / im.width)), Image.LANCZOS)
        im.save(b, "JPEG", quality=72, optimize=True)
