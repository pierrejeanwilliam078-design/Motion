"""
Masques d'effets lumineux (sortie : PNG blanc + alpha, 1296x2304) :
  s4_car/car_gloss.png  : carrosserie sombre et brillante (reflets dynamiques)
  s4_car/interior.png   : intérieur clair de la voiture (éclairage doux)
  s5_walk/water.png     : surface de l'eau (scintillement)
  + points de scintillement de l'eau ajoutés à layers.json

Usage : python prepare_fx_masks.py <dossier_images_sources> <dossier_masques> <dossier_layers>
"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image

SRC_W, SRC_H = 941, 1672
OUT_W, OUT_H = 1296, 2304


def save_mask(m, path):
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.5)
    a = Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).resize((OUT_W, OUT_H), Image.LANCZOS)
    im = Image.new("RGBA", (OUT_W, OUT_H), (255, 255, 255, 0))
    im.putalpha(a)
    im.save(path, optimize=True)


def main(src, masks, layers):
    meta = json.load(open(os.path.join(layers, "layers.json")))
    yy, xx = np.mgrid[0:SRC_H, 0:SRC_W]

    # --- voiture (image 2)
    rgb = np.asarray(Image.open(f"{src}/2.webp").convert("RGB")).astype(np.float32)
    mascot = np.asarray(Image.open(f"{masks}/mask2.png")).astype(np.float32) / 255
    luma = rgb @ np.array([0.299, 0.587, 0.114])
    region = np.zeros((SRC_H, SRC_W), np.uint8)
    cv2.fillPoly(region, [np.array([(520, 560), (941, 520), (941, 1560), (470, 1500), (450, 900)], np.int32)], 1)
    gloss = np.clip((110 - luma) / 70, 0, 1) * region * (1 - mascot)
    save_mask(gloss, os.path.join(layers, "s4_car", "car_gloss.png"))
    hsv = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
    beige = ((luma > 150) & (hsv[..., 1] > 25) & (hsv[..., 1] < 120)).astype(np.float32)
    inter = np.zeros((SRC_H, SRC_W), np.uint8)
    cv2.fillPoly(inter, [np.array([(620, 600), (941, 560), (941, 1300), (620, 1320)], np.int32)], 1)
    save_mask(beige * inter * (1 - mascot), os.path.join(layers, "s4_car", "interior.png"))

    # --- eau (image 1)
    rgb = np.asarray(Image.open(f"{src}/1.webp").convert("RGB")).astype(np.float32)
    mascot = np.asarray(Image.open(f"{masks}/mask1.png")).astype(np.float32) / 255
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    water = ((b > r + 35) & (g > r + 15) & (yy > 0.52 * SRC_H) & (yy < 0.80 * SRC_H)).astype(np.float32)
    water = cv2.morphologyEx(water, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    water *= (1 - mascot)
    save_mask(water, os.path.join(layers, "s5_walk", "water.png"))
    # points brillants pour les scintillements
    luma = rgb @ np.array([0.299, 0.587, 0.114])
    score = cv2.GaussianBlur(luma, (0, 0), 2) * (cv2.erode(water, np.ones((5, 5), np.uint8)) > 0)
    pts = []
    s = score.copy()
    for _ in range(22):
        y, x = np.unravel_index(np.argmax(s), s.shape)
        if s[y, x] <= 0:
            break
        pts.append([x / SRC_W, y / SRC_H])
        cv2.circle(s, (int(x), int(y)), 34, 0, -1)
    meta["s5_walk"]["sparkles"] = pts
    json.dump(meta, open(os.path.join(layers, "layers.json"), "w"), indent=1)
    print("sparkles", len(pts))


if __name__ == "__main__":
    main(*sys.argv[1:4])
