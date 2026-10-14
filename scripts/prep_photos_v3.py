#!/usr/bin/env python3
"""V3 — préparation des photos fournies (Toamasina / Arena, Antananarivo).

- agrandissement ×3 (Lanczos) + accentuation douce : les sources ne font que 474 px ;
- découpe d'un calque de premier plan (alpha adouci) pour une parallaxe 2,5D :
  le premier plan glisse légèrement plus vite que l'arrière-plan.
Les images ne sont ni recolorées ni retouchées (aucun élément retiré).
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "public", "media", "v3")
K = 3

JOBS = {
    # nom : (source, polyligne de séparation premier plan, en px source)
    "toamasina-arena": ("source-toamasina-arena.webp", [(0, 322), (100, 306), (200, 292), (300, 282), (400, 276), (474, 266)]),
    "antananarivo": ("source-antananarivo.png", [(0, 152), (120, 146), (240, 142), (360, 138), (474, 128)]),
}

for name, (src, line) in JOBS.items():
    im = Image.open(os.path.join(D, src)).convert("RGB")
    w, h = im.size
    big = im.resize((w * K, h * K), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    big.save(os.path.join(D, f"{name}.jpg"), quality=92)
    mask = Image.new("L", big.size, 0)
    poly = [(x * K, y * K) for x, y in line] + [(w * K, h * K), (0, h * K)]
    ImageDraw.Draw(mask).polygon(poly, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(5 * K))
    fg = big.copy()
    fg.putalpha(mask)
    fg.save(os.path.join(D, f"{name}-fg.webp"), quality=90)
    print(name, big.size)
