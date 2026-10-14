"""Convertit le fond blanc du logo officiel en transparence (color-to-alpha).
Le rendu reste identique au pixel près lorsqu'il est composé sur fond blanc :
aucune déformation, aucune recoloration du logo."""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float64) / 255.0
# alpha minimal permettant de reconstruire la couleur sur fond blanc
alpha = np.max(1.0 - im, axis=2)
alpha = np.where(alpha < 0.02, 0.0, alpha)
safe = np.where(alpha > 0, alpha, 1.0)[..., None]
rgb = 1.0 - (1.0 - im) / safe
rgb = np.clip(rgb, 0, 1)
out = np.dstack([rgb, alpha])
img = Image.fromarray((out * 255).round().astype(np.uint8), "RGBA")
bbox = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
pad = 6
bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0), min(bbox[2] + pad, img.width), min(bbox[3] + pad, img.height))
img = img.crop(bbox)
img.save(dst)
print("saved", dst, img.size)
