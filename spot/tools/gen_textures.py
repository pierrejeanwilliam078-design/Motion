"""Génère les textures procédurales du bureau (bois noyer sombre + carte de rugosité).

Usage : python tools/gen_textures.py
"""
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "assets")
rng = np.random.default_rng(7)


def fbm(h, w, octaves=6, base=4, stretch=1.0):
    out = np.zeros((h, w))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        gh = base * 2 ** o + 1
        gw = max(2, int(base * 2 ** o * (w / h) / stretch) + 1)
        g = rng.random((gh, gw))
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * (np.asarray(img) / 255.0)
        total += amp
        amp *= 0.5
    return out / total


def wood():
    h, w = 1024, 2048
    yy, xx = np.mgrid[0:h, 0:w] / h
    warp = fbm(h, w, 4, 2, stretch=3)
    streak = fbm(h, w, 6, 24, stretch=40)
    fine = fbm(h, w, 6, 16, stretch=2)
    rings = np.sin((yy * 11 + warp * 2.2 + xx * 0.15) * np.pi)
    v = 0.5 + 0.16 * rings + 0.45 * (streak - 0.5) + 0.12 * (fine - 0.5)
    v = np.clip(v, 0, 1)
    dark = np.array([28, 20, 18]) / 255.0
    light = np.array([92, 66, 52]) / 255.0
    col = dark + (light - dark) * v[..., None] ** 1.4
    pores = (rng.random((h, w)) < 0.004) * 0.35
    col *= (1 - pores[..., None])
    Image.fromarray((col * 255).astype(np.uint8)).save(os.path.join(OUT, "wood.jpg"), quality=92)
    rough = 0.42 + 0.18 * (1 - v) + 0.1 * (fine - 0.5)
    Image.fromarray((np.clip(rough, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "wood_rough.jpg"), quality=92)


if __name__ == "__main__":
    wood()
    print("ok")
