"""
Prépare les calques 2.5D à partir des 5 illustrations de référence.

Pour chaque image :
  - bg.jpg   : décor seul (zone de la mascotte reconstruite par inpainting flou)
  - fg.png   : mascotte détourée (RGBA)
  - <part>.png : éléments animés séparément (mains, valise, passeport...)
  - layers.json : positions normalisées (0..1) des parties, pivots, écran du téléphone

Usage :
  python prepare_layers.py <dossier_images_sources> <dossier_masques> <dossier_sortie>
Les masques (mask1..5.png) sont produits par rembg (modèle isnet-general-use).
"""
import json, sys, os
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter

SRC_W, SRC_H = 941, 1672
OUT_W, OUT_H = 1296, 2304  # 1.2 x 1080x1920 : marge pour les zooms caméra

# Correspondance fichier -> scène (selon le contenu des images fournies)
SCENES = {
    "s1_dubai":   5,  # tenue traditionnelle
    "s2_phone":   4,  # smartphone
    "s3_airport": 3,  # aéroport
    "s4_car":     2,  # voiture
    "s5_walk":    1,  # promenade
}

# Polygones en coordonnées source (941x1672), pivots en coordonnées source
PARTS = {
    "s1_dubai": {
        "hand": {"poly": [(0,690),(40,655),(110,662),(160,690),(190,712),(202,745),(185,800),(182,848),(165,870),(118,872),(95,852),(40,812),(0,795)],
                 "pivot": (152, 852)},
        "case": {"poly": [(668,1035),(796,1035),(796,1066),(917,1078),(928,1446),(628,1450),(628,1078),(668,1068)],
                 "pivot": (778, 1440), "keep": True},
    },
    "s3_airport": {
        "pass": {"poly": [(675,860),(728,782),(832,826),(804,930),(778,990),(772,1062),(742,1098),(668,1098),(636,1078),(588,1038),(582,1012)],
                 "pivot": (690, 1070), "keep": True},
    },
    "s4_car": {
        "hand": {"poly": [(536,860),(582,848),(596,836),(612,842),(614,868),(660,882),(670,904),(657,927),(600,932),(546,932),(536,900)],
                 "pivot": (548, 898)},
        "case": {"poly": [(125,975),(250,975),(250,1043),(302,1052),(304,1422),(282,1440),(18,1432),(18,1300),(42,1052),(125,1043)],
                 "pivot": (160, 1430), "keep": True},
    },
    "s5_walk": {
        "hand":  {"poly": [(622,955),(658,934),(671,903),(690,896),(702,912),(702,930),(746,934),(770,950),(774,968),(757,986),(702,999),(674,1022),(638,1020),(622,996)],
                  "pivot": (640, 985)},
        "thumb": {"poly": [(103,772),(132,766),(160,780),(172,828),(180,868),(180,940),(172,966),(140,978),(92,972),(56,942),(52,890),(72,850),(100,838)],
                  "pivot": (160, 962)},
    },
}

# Doigts tenant le téléphone (au-dessus de l'écran recréé) : ellipses (cx, cy, rx, ry)
PHONE_FINGERS = [(887.5,840,25.5,28),(876,895.5,30,30.5),(867.5,947.5,24.5,28.5)]


def harden(a):
    a = np.clip((a - 0.10) / 0.45, 0, 1)
    a = a * a * (3 - 2 * a)
    solid = (a > 0.5).astype(np.uint8)
    # bouche les trous internes
    h, w = solid.shape
    ff = solid.copy() * 255
    mask = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 128)
    holes = (ff == 0)
    a[holes] = 1.0
    # léger "choke" pour éviter les franges du décor
    a = cv2.erode(a, np.ones((2, 2), np.uint8))
    a = cv2.GaussianBlur(a, (3, 3), 0.7)
    return a


def poly_mask(poly, feather=1.2):
    s = 4
    im = Image.new("L", (SRC_W * s, SRC_H * s), 0)
    ImageDraw.Draw(im).polygon([(x * s, y * s) for x, y in poly], fill=255)
    im = im.resize((SRC_W, SRC_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(im).astype(np.float32) / 255


def ellipse_mask(ells, feather=0.8):
    s = 4
    im = Image.new("L", (SRC_W * s, SRC_H * s), 0)
    d = ImageDraw.Draw(im)
    for cx, cy, rx, ry in ells:
        d.ellipse([(cx - rx) * s, (cy - ry) * s, (cx + rx) * s, (cy + ry) * s], fill=255)
    im = im.resize((SRC_W, SRC_H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(feather))
    return np.asarray(im).astype(np.float32) / 255


def push_pull(img, valid):
    """Remplissage lisse des zones invalides (pyramide pondérée « push-pull »)."""
    levels = []
    cur, w = img * valid[..., None], valid.astype(np.float32)
    while min(cur.shape[:2]) > 4:
        levels.append((cur, w))
        h2, w2 = (cur.shape[0] + 1) // 2, (cur.shape[1] + 1) // 2
        cur = cv2.resize(cur, (w2, h2), interpolation=cv2.INTER_AREA)
        w = cv2.resize(w, (w2, h2), interpolation=cv2.INTER_AREA)
    filled = cur / np.maximum(w, 1e-6)[..., None]
    for c, wt in reversed(levels):
        upf = cv2.resize(filled, (c.shape[1], c.shape[0]), interpolation=cv2.INTER_LINEAR)
        k = np.clip(wt, 0, 1)[..., None]
        filled = np.where(wt[..., None] > 1e-6, c / np.maximum(wt, 1e-6)[..., None], upf) * k + upf * (1 - k)
    return filled


def fill_behind(rgb, alpha, region):
    """Reconstruit le décor derrière la mascotte (zone floue, raccord progressif)."""
    reg = (region > 0.02).astype(np.uint8)
    reg = cv2.dilate(reg, np.ones((9, 9), np.uint8))
    valid = (1 - reg).astype(np.float32)
    filled = push_pull(rgb, valid)
    filled = cv2.GaussianBlur(filled, (0, 0), 3)
    soft = cv2.GaussianBlur(reg.astype(np.float32), (0, 0), 2)[..., None]
    return rgb * (1 - soft) + filled * soft


def up(img, sharpen=True):
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    im = im.resize((OUT_W, OUT_H), Image.LANCZOS)
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=45, threshold=2))
    return im


def save_rgba(rgb, a, path, crop=None):
    rgb_up = up(rgb)
    a_up = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((OUT_W, OUT_H), Image.LANCZOS)
    im = rgb_up.copy()
    im.putalpha(a_up)
    if crop:
        im = im.crop(crop)
    im.save(path, optimize=True)


def screen_quad(rgb):
    # zone approximative de l'écran (relevée à la main), l'ajustement fin est automatique
    rough = np.array([(672, 548), (906, 582), (848, 1036), (590, 996)], np.int32)
    region = np.zeros((SRC_H, SRC_W), np.uint8)
    cv2.fillPoly(region, [rough], 1)
    region = cv2.dilate(region, np.ones((29, 29), np.uint8))
    nondark = (rgb.max(axis=2) >= 75).astype(np.uint8) & region
    # les doigts (blancs) relient l'écran à l'extérieur : on les traite comme une barrière
    for cx, cy, rx, ry in PHONE_FINGERS:
        cv2.ellipse(nondark, (int(cx), int(cy)), (int(rx + 2), int(ry + 3)), 0, 0, 360, 0, -1)
    n, lab = cv2.connectedComponents(nondark, connectivity=4)
    border = region - cv2.erode(region, np.ones((3, 3), np.uint8))
    touching = set(np.unique(lab[border > 0]).tolist())
    keep = np.zeros_like(nondark)
    for k in range(1, n):
        if k not in touching:
            keep[lab == k] = 1
    cnts, _ = cv2.findContours(keep, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    pts = np.concatenate([c.reshape(-1, 2) for c in cnts if cv2.contourArea(c) > 50])
    hull = cv2.convexHull(pts).reshape(-1, 2).astype(np.float64)
    # pour chaque bord : segments du contour orientés comme le bord approximatif
    lines = []
    for i in range(4):
        r0, r1 = rough[i].astype(np.float64), rough[(i + 1) % 4].astype(np.float64)
        u = (r1 - r0) / np.linalg.norm(r1 - r0)
        nrm = np.array([-u[1], u[0]])
        sel = []
        for j in range(len(hull)):
            p, q = hull[j], hull[(j + 1) % len(hull)]
            L = np.linalg.norm(q - p)
            if L < 3 or abs((q - p) / L @ u) < np.cos(np.radians(8)):
                continue
            if abs((p - r0) @ nrm) > 30:
                continue
            for t in np.linspace(0, 1, max(2, int(L)), endpoint=False):
                sel.append(p + (q - p) * t)
        sel = np.array(sel, np.float32)
        vx, vy, px, py = cv2.fitLine(sel, cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        lines.append((np.array([px, py]), np.array([vx, vy])))
    corners = []
    for i in range(4):
        (p1, v1), (p2, v2) = lines[(i - 1) % 4], lines[i]
        A = np.array([v1, -v2]).T
        t = np.linalg.solve(A, p2 - p1)
        corners.append((p1 + v1 * t[0]).tolist())
    return corners  # TL, TR, BR, BL (coordonnées source)


def main(src_dir, mask_dir, out_dir):
    meta = {}
    for scene, idx in SCENES.items():
        od = os.path.join(out_dir, scene)
        os.makedirs(od, exist_ok=True)
        rgb = np.asarray(Image.open(f"{src_dir}/{idx}.webp").convert("RGB")).astype(np.float32)
        a = np.asarray(Image.open(f"{mask_dir}/mask{idx}.png")).astype(np.float32) / 255
        a = harden(a)

        # décor seul
        bg = fill_behind(rgb, a, a)
        up(bg).save(os.path.join(od, "bg.jpg"), quality=92)

        m = {"parts": {}}
        base_a = a.copy()
        base_rgb = rgb.copy()
        sx, sy = OUT_W / SRC_W, OUT_H / SRC_H
        for name, p in PARTS.get(scene, {}).items():
            pm = poly_mask(p["poly"])
            pa = a * pm
            ys, xs = np.where(pa > 0.01)
            bx0, by0 = int(max(0, xs.min() * sx - 4)), int(max(0, ys.min() * sy - 4))
            bx1, by1 = int(min(OUT_W, xs.max() * sx + 6)), int(min(OUT_H, ys.max() * sy + 6))
            save_rgba(rgb, pa, os.path.join(od, f"{name}.png"), crop=(bx0, by0, bx1, by1))
            m["parts"][name] = {
                "x": bx0 / OUT_W, "y": by0 / OUT_H, "w": (bx1 - bx0) / OUT_W, "h": (by1 - by0) / OUT_H,
                "px": p["pivot"][0] / SRC_W, "py": p["pivot"][1] / SRC_H,
            }
            if p.get("keep"):
                continue  # mouvement très faible : la partie reste aussi dans le calque principal
            # ce qui se trouve "derrière" la partie, dans la mascotte
            region = (pm > 0.02).astype(np.uint8)
            region = cv2.dilate(region, np.ones((5, 5), np.uint8))
            base_rgb = cv2.inpaint(np.clip(base_rgb, 0, 255).astype(np.uint8), region * 255, 9, cv2.INPAINT_TELEA).astype(np.float32)
            a8 = (np.clip(base_a, 0, 1) * 255).astype(np.uint8)
            a8[region > 0] = 0
            a_in = cv2.inpaint(a8, region * 255, 9, cv2.INPAINT_TELEA).astype(np.float32) / 255
            a_in = np.clip((a_in - 0.35) / 0.3, 0, 1)
            base_a = np.where(region > 0, a_in, base_a)

        if scene == "s2_phone":
            q = screen_quad(rgb)
            m["screen"] = [[x / SRC_W, y / SRC_H] for x, y in q]
            fm = ellipse_mask(PHONE_FINGERS)
            fa = np.maximum(fm, 0) * (a > 0.3)
            fa = np.maximum(fa * 0, fm)  # les doigts sont opaques
            ys, xs = np.where(fa > 0.01)
            bx0, by0 = int(xs.min() * sx - 4), int(ys.min() * sy - 4)
            bx1, by1 = int(xs.max() * sx + 6), int(ys.max() * sy + 6)
            save_rgba(rgb, fa, os.path.join(od, "fingers.png"), crop=(bx0, by0, bx1, by1))
            m["parts"]["fingers"] = {"x": bx0 / OUT_W, "y": by0 / OUT_H, "w": (bx1 - bx0) / OUT_W, "h": (by1 - by0) / OUT_H,
                                     "px": 0.5, "py": 0.5}

        save_rgba(base_rgb, base_a, os.path.join(od, "fg.png"))
        # centre de masse / boîte de la mascotte (pour les cadrages)
        ys, xs = np.where(a > 0.5)
        m["box"] = [xs.min() / SRC_W, ys.min() / SRC_H, xs.max() / SRC_W, ys.max() / SRC_H]
        meta[scene] = m
        print(scene, "ok")
    with open(os.path.join(out_dir, "layers.json"), "w") as f:
        json.dump(meta, f, indent=1)


if __name__ == "__main__":
    main(*sys.argv[1:4])
