"""Convertit le logo JADE (fond blanc) en PNG transparent lisible sur fond noir."""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)

# Alpha obtenu en "démélangeant" le blanc du fond.
alpha = (255.0 - rgb.min(axis=2)) / 255.0
greenish = (rgb[..., 1] - rgb[..., 0]) > 25

out = np.zeros(rgb.shape[:2] + (4,), np.float32)
out[..., :3] = 255.0                       # texte noir et ellipse grise -> blanc
out[greenish, :3] = (31, 160, 78)          # vert JADE légèrement éclairci pour fond sombre
out[..., 3] = np.clip(alpha * 255.0, 0, 255)

img = Image.fromarray(out.astype(np.uint8), "RGBA")
img = img.crop(img.getbbox())
img.save(dst)
print(dst, img.size)
