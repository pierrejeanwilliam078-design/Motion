"""Extrait les éléments du logo officiel ABONIVO à partir des visuels fournis.

- assets/logo_tile.png      : icône « Smart Orbit » sur tuile sombre (icon_dark.png), détourée
- assets/logo_symbol.png    : symbole seul détouré depuis la version claire (icon_light.png)
- assets/wordmark.svg       : wordmark « ABONIVO » vectorisé (potrace) depuis la bannière

Usage : python tools/extract_logo.py   (nécessite numpy, Pillow, potracer)
"""
import os

import numpy as np
import potrace
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "..", "assets")
SRC = os.path.join(ASSETS, "src")


def rounded_rect_mask(w, h, box, r, feather=2.0):
    x0, y0, x1, y1 = box
    yy, xx = np.mgrid[0:h, 0:w].astype(float) + 0.5
    cx = np.clip(xx, x0 + r, x1 - r)
    cy = np.clip(yy, y0 + r, y1 - r)
    d = np.hypot(xx - cx, yy - cy) - r
    return np.clip(0.5 - d / feather, 0, 1)


def tile():
    im = np.asarray(Image.open(os.path.join(SRC, "icon_dark.png")).convert("RGB")).astype(float)
    h, w, _ = im.shape
    box = (143, 131, 1113, 1098)
    m = rounded_rect_mask(w, h, box, 190, 2.5)
    out = np.dstack([im, m * 255]).astype(np.uint8)
    Image.fromarray(out).crop(box).save(os.path.join(ASSETS, "logo_tile.png"))


def symbol():
    im = np.asarray(Image.open(os.path.join(SRC, "icon_light.png")).convert("RGB")).astype(float)
    h, w, _ = im.shape
    bg = np.array([246.0, 248.0, 255.0])
    a = np.max((bg - im) / bg, axis=2)
    # ne conserver que le symbole (exclut bulles et orbites décoratives)
    yy, xx = np.mgrid[0:h, 0:w]
    region = np.hypot(xx - 612, yy - 598) < 492
    a = np.clip((a - 0.16) / 0.30, 0, 1) * region
    # la sphère turquoise porte un reflet blanc : on la rend entièrement opaque
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    near = np.hypot(xx - 980, yy - 395) < 110
    ball = near & (g > r + 40) & (g > 150)
    by, bx = np.where(ball)
    cx, cy = bx.mean(), by.mean()
    rad = np.sqrt(ball.sum() / np.pi) * 1.03
    a = np.maximum(a, np.clip(rad - np.hypot(xx - cx, yy - cy) + 0.5, 0, 1))
    a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0
    out = np.dstack([im, a * 255]).astype(np.uint8)
    img = Image.fromarray(out)
    img.crop(img.getbbox()).save(os.path.join(ASSETS, "logo_symbol.png"))


def wordmark():
    im = np.asarray(Image.open(os.path.join(SRC, "banner.png")).convert("RGB")).astype(float)
    x0, y0, x1, y1 = 750, 403, 1238, 482
    crop = im[y0:y1, x0:x1]
    r, g, b = crop[..., 0], crop[..., 1], crop[..., 2]
    dot = (g > r + 60) & (g > 140)
    ys, xs = np.where(dot)
    dot_c = (xs.mean(), ys.mean())
    dot_r = (np.sqrt(dot.sum() / np.pi))
    dark = 1 - crop.min(axis=2) / 235.0
    dark[dot] = 0
    dark = np.clip((dark - 0.25) / 0.5, 0, 1)
    scale = 8
    big = Image.fromarray((dark * 255).astype(np.uint8)).resize(
        ((x1 - x0) * scale, (y1 - y0) * scale), Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale * 0.6))
    # potracer trace les pixels « faux » : on lui passe le négatif des lettres
    bm = potrace.Bitmap(np.asarray(big) <= 127)
    path = bm.trace(turdsize=200, alphamax=1.0, opticurve=True, opttolerance=0.3)
    d = []
    for curve in path:
        sp = curve.start_point
        d.append(f"M{sp.x:.1f},{sp.y:.1f}")
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x:.1f},{seg.c.y:.1f}L{seg.end_point.x:.1f},{seg.end_point.y:.1f}")
            else:
                d.append(f"C{seg.c1.x:.1f},{seg.c1.y:.1f} {seg.c2.x:.1f},{seg.c2.y:.1f} {seg.end_point.x:.1f},{seg.end_point.y:.1f}")
        d.append("Z")
    W, H = (x1 - x0) * scale, (y1 - y0) * scale
    cx, cy, cr = dot_c[0] * scale, dot_c[1] * scale, dot_r * scale * 1.04
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'
           f'<path class="wm-letters" fill="currentColor" fill-rule="evenodd" d="{"".join(d)}"/>'
           f'<circle class="wm-dot" cx="{cx:.1f}" cy="{cy:.1f}" r="{cr:.1f}" fill="#37DDC3"/></svg>')
    with open(os.path.join(ASSETS, "wordmark.svg"), "w") as f:
        f.write(svg)


if __name__ == "__main__":
    tile()
    symbol()
    wordmark()
    print("ok")
