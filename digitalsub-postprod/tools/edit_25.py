"""DigitalSub video 25 — 3D motion design + 2D kinetic typography composite.

3D renders (three/scenes, real-time PBR in headless Chromium) are either RGBA overlays on the
face cam or full-frame shots with designed transitions. All type is 2D (Anton, Playfair Display
italic, Inter Display), synced word by word, never over the tracked face.
"""
import json
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageFilter

import cues25 as C
import mg
from kinetic import box_word, chunk, chunks, fit, pop_in, rise_word
from mg import (CYAN, FPS, H, NAVY, VIOLET, W, WHITE, Transcript, hline, inout3, out3, out5, out_back, out_expo, prog,
                scrim, smooth, swoosh, text, text_width, to_canvas, to_image)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
R3D = os.environ.get("R3D", os.path.join(ROOT, "out", "r3d25"))

TR = Transcript(os.path.join(ROOT, "v25", "words.json"))
FIXES = {"arrière": "ariary", "Découvres": "Découvre"}  # ASR: « en ariary » (MGA), imperative « découvre »
ONSETS = {"L'idée": 29.78}  # Whisper glued it to the end of the previous sentence (pause 28.78–29.78)
for i, (w, s, e) in enumerate(TR.words):
    w = FIXES.get(w, w)
    s = ONSETS.get(w, s)
    for p0, p1 in C.PAUSES:  # onsets Whisper placed inside a measured pause start when the pause ends
        if p0 <= s < p1 - 0.02:
            s = p1
    TR.words[i] = (w, s, e)

KEEP = np.array(json.load(open(os.path.join(ROOT, "v25", "face_track.json")))["keepout"], np.float32)
ANCHOR = (float(np.median((KEEP[:, 0] + KEEP[:, 2]) / 2)), float(np.median((KEEP[:, 1] + KEEP[:, 3]) / 2)))
X0 = 96
SRC_FRAMES = 1205
END = 51.25


def words(s, near):
    return TR.timed(s, near)


def prep(spec):
    return [(words(s, n), set(k)) for s, n, k in spec]


def in_expo(x):
    x = min(max(x, 0.0), 1.0)
    return 0.0 if x == 0 else 2 ** (10 * x - 10)


# ------------------------------------------------------------------ camera on the face cam
ZOOM = [
    (0.00, 0.70, 1.20, 1.04, out_expo),     # hook: speed-ramped dolly-in settle
    (0.70, 2.25, 1.04, 1.05, smooth),
    (2.25, 2.67, 1.05, 1.00, inout3),       # exactly 1.0 when the 3D pull-back takes over
    (9.29, 13.25, 1.00, 1.06, smooth),      # 1.0 again where the camera dives back in
    (13.25, 14.16, 1.06, 1.03, smooth),
    (14.16, 14.40, 1.03, 1.12, out_expo),   # punch-in on the drop
    (14.40, 16.10, 1.12, 1.13, smooth),
    (16.10, 16.40, 1.13, 1.45, in_expo),    # speed ramp into the journey
    (24.80, 25.60, 1.18, 1.04, out_expo),
    (25.60, 28.78, 1.04, 1.07, smooth),
    (28.78, 29.78, 1.07, 1.03, inout3),
    (29.78, 30.64, 1.03, 1.16, in_expo),    # accelerating push, hard cut on the beat
    (34.15, 35.00, 1.16, 1.03, out_expo),
    (35.00, 39.89, 1.03, 1.06, smooth),
    (39.89, 40.30, 1.06, 1.03, inout3),
    (40.30, 43.70, 1.03, 1.09, smooth),
    (43.70, 44.69, 1.09, 1.03, inout3),
    (44.69, 47.80, 1.03, 1.05, smooth),
    (47.80, 48.30, 1.05, 1.25, in_expo),    # push into darkness → brand reveal
]


def zoom_at(t):
    z = ZOOM[0][2]
    for t0, t1, z0, z1, e in ZOOM:
        if t >= t0:
            z = z0 + (z1 - z0) * e(prog(t, t0, t1 - t0))
    return z


def warp(img, z, resample=Image.BICUBIC):
    if abs(z - 1) < 1e-4:
        return img
    ax, ay = ANCHOR
    k = 1 / z
    return img.transform((W, H), Image.AFFINE, (k, 0, ax * (1 - k), 0, k, ay * (1 - k)), resample)


def zoom_blur(img, z, amount):
    """Radial speed blur for ramps: average of slightly scaled copies."""
    if amount < 0.004:
        return warp(img, z)
    acc = np.zeros((H, W, 3), np.float32)
    n = 5
    for i in range(n):
        acc += np.asarray(warp(img, z * (1 + amount * i / (n - 1)), Image.BILINEAR), np.float32)
    return Image.fromarray((acc / n).astype(np.uint8))


def keepout(n, t):
    x0, y0, x1, y1 = KEEP[min(n, len(KEEP) - 1)]
    z = zoom_at(t)
    ax, ay = ANCHOR
    return ax + (x0 - ax) * z, ay + (y0 - ay) * z, ax + (x1 - ax) * z, ay + (y1 - ay) * z


def face_box(n, t):
    """Detected face box (the keep-out without its hair/chin margins), zoom-corrected."""
    x0, y0, x1, y1 = keepout(n, t)
    w, h = (x1 - x0) / 1.5, (y1 - y0) / 1.75
    return x0 + 0.25 * w, y0 + 0.45 * h, x0 + 1.25 * w, y0 + 1.45 * h


# ------------------------------------------------------------------ 3D layers
def r3d(scene, f):
    p = os.path.join(R3D, scene, f"{f:05d}.png")
    return Image.open(p) if os.path.exists(p) else None


def overlay(cv, img):
    a = np.asarray(img, np.float32) / 255
    m = a[..., 3:]
    cv *= 1 - m
    cv += a[..., :3] * m
    return m[..., 0]


def zone_scrim(cv, a, top=1000):
    scrim(cv, top, H, 0.78 * a)


# ------------------------------------------------------------------ type: face-cam sections
HK = dict(a=words("abonnement digital", 0.4))
HK_CH = prep([("sans te compliquer la vie", 1.3, ("compliquer",))])


def type_hook(cv, t):
    if t > 2.66:
        return
    a = 1 - inout3(prog(t, 2.38, 0.24))
    zone_scrim(cv, a)
    (ab, s0, _), (dg, s1, _) = HK["a"]
    rise_word(cv, t, "ABONNEMENT", "anton", 176, WHITE, X0, 1250, s0, a, tracking=30)
    p = prog(t, s1 - 0.04, 0.45)
    text(cv, "digital", "serif", 170, CYAN, X0 - 6, 1405, a * out3(p), scale=1.12 - 0.12 * out_expo(p), blur=(1 - p) * 6)
    swoosh(cv, X0 + 12, 1440, X0 + text_width("digital", "serif", 170) - 8, 1430, out3(prog(t, s1 + 0.15, 0.32)),
           VIOLET, CYAN, 14, 16, a)
    toks, keys = HK_CH[0]
    chunk(cv, t, toks, 2.40, base=1540, keys=keys)


SV = dict(tv=words("Tu veux", 3.9), names=words("Canva Pro, ChatGPT, Netflix, Spotify", 4.2),
          ou=words("ou un autre service", 7.3))
NAMES = [("Canva Pro", 0, 1), ("ChatGPT", 2, 2), ("Netflix", 3, 3), ("Spotify", 4, 4)]


def type_services(cv, t):
    if not (3.9 <= t <= 9.2):
        return
    a = 1 - inout3(prog(t, 8.85, 0.25))
    scrim(cv, 1050, H, 0.55 * a)
    (w0, s0, _), (w1, s1, _) = SV["tv"]
    e, sc, dy = pop_in(t, s0)
    text(cv, "Tu veux", "xbold", 62, WHITE, X0, 1215 + dy, a * e)
    toks = SV["names"]
    starts = [toks[i][1] for _, i, _ in NAMES] + [SV["ou"][0][1]]
    for k, (name, i0, i1) in enumerate(NAMES):
        t0, t1 = toks[i0][1], starts[k + 1]
        if not (t0 - 0.1 <= t <= t1 + 0.2):
            continue
        out = inout3(prog(t, t1 - 0.08, 0.18))
        rise_word(cv, t, name.upper(), "anton", 160, WHITE, X0, 1400 - 60 * out, t0, a * (1 - out), tracking=24)
        u = out3(prog(t, t0 + 0.1, 0.35))
        hline(cv, X0, X0 + text_width(name.upper(), "anton", 160) * u, 1428 - 60 * out, CYAN, a * (1 - out), 6,
              color2=VIOLET)
    ou = SV["ou"]
    if t >= ou[0][1] - 0.1:
        rise_word(cv, t, "ou", "serif", 110, WHITE, X0, 1400, ou[0][1], a)
        x = X0 + text_width("ou ", "serif", 110)
        for w, s, _ in ou[1:]:
            e, sc, dy = pop_in(t, s)
            text(cv, w, "serif", 110, CYAN, x, 1400 + dy, a * e)
            x += text_width(w + " ", "serif", 110)


FR = dict(w=words("la formule, le paiement et l'activation,", 10.0))
FR_CH = prep([("entre le choix", 9.3, ("choix",)), ("de", 9.95, ())])
FR_T = prep([("tu perds", 12.5, ()), ("du temps", 12.95, ("temps",))])


def type_friction(cv, t):
    if not (9.29 <= t <= 13.3):
        return
    a = out3(prog(t, 9.29, 0.2)) * (1 - inout3(prog(t, 13.05, 0.22)))
    zone_scrim(cv, a)
    for toks, keys in FR_CH:
        chunk(cv, t, toks, 10.12, base=1300, keys=keys)
    w = FR["w"]
    A = 1 - inout3(prog(t, 12.50, 0.2))
    for (word, s, _), y in zip((w[1], w[3], w[5]), (1215, 1365, 1515)):
        rise_word(cv, t, word.strip(",").upper().replace("L'", ""), "anton", 150, WHITE, X0 - 60 * (1 - A), y, s, a * A,
                  tracking=20)
    for i, (toks, keys) in enumerate(FR_T):
        chunk(cv, t, toks, 13.05, base=(1300, 1400)[i], keys=keys)


IM = prep([("DigitalSub", 14.0, ("digitalsub",)), ("ce parcours.", 15.5, ("parcours.",))])
SIMPL = words("simplifie", 14.8)[0]


def type_impact(cv, t):
    if not (14.10 <= t <= 16.40):
        return
    a = out3(prog(t, 14.12, 0.15)) * (1 - inout3(prog(t, 16.10, 0.22)))
    zone_scrim(cv, a, 1150)
    chunks(cv, t, IM, base=1470)


def type_simplifie(t):
    """Giant SIMPLIFIE in the top band, drawn on its own layer: composited under the person matte."""
    if not (14.85 <= t <= 16.40):
        return None
    lay = np.zeros((H, W, 3), np.float32)
    al = np.zeros((H, W, 3), np.float32)
    a = 1 - inout3(prog(t, 16.10, 0.25))
    size = fit("SIMPLIFIE", "anton", 300, W - 60)
    for cv, col in ((lay, WHITE), (al, (1.0, 1.0, 1.0))):
        rise_word(cv, t, "SIMPLIFIE", "anton", size, col, W / 2, 430, SIMPL[1], a, anchor="c", tracking=40)
    return lay, al[..., 0]


AC = prep([("Puis notre équipe", 25.2, ("équipe",)), ("t'accompagne pour", 26.0, ("t'accompagne",))])
AC_W = words("l'activation", 27.0)[0]
AC_S = prep([("selon le service.", 27.6, ())])


def type_activation(cv, t):
    if not (25.25 <= t <= 28.85):
        return
    a = out3(prog(t, 25.28, 0.2)) * (1 - inout3(prog(t, 28.55, 0.25)))
    zone_scrim(cv, a)
    chunks(cv, t, AC, base=1290)
    rise_word(cv, t, "ACTIVATION", "anton", 160, CYAN, W / 2, 1300, AC_W[1], a * (1 - inout3(prog(t, 28.35, 0.2))),
              anchor="c", tracking=26)
    toks, _ = AC_S[0]
    x = W / 2 - text_width("selon le service.", "xbold", 48) / 2
    for w, s, _ in toks:
        e, sc, dy = pop_in(t, s)
        text(cv, w, "xbold", 48, WHITE, x, 1570 + dy, a * e)
        x += text_width(w + " ", "xbold", 48)


ID = words("L'idée est simple,", 29.6)


def type_idee(cv, t):
    if not (29.7 <= t <= 30.64):
        return
    a = out3(prog(t, 29.72, 0.15))
    zone_scrim(cv, a)
    (w0, s0, _), (w1, s1, _), (w2, s2, _) = ID
    rise_word(cv, t, "L'idée", "serif", 110, WHITE, X0, 1265, s0, a)
    rise_word(cv, t, "est", "serif", 110, WHITE, X0 + text_width("L'idée ", "serif", 110), 1265, s1, a)
    box_word(cv, t, "SIMPLE.", "anton", 190, X0 + 22, 1480, s2, CYAN, NAVY, a)


PS_CH = prep([("Que tu sois", 34.3, ()), ("ou simplement", 37.0, ("simplement",)), ("à la recherche de", 37.9, ())])
PS = [("ÉTUDIANT", "étudiant,", 34.8, CYAN), ("CRÉATEUR", "créateur,", 35.7, VIOLET),
      ("ENTREPRENEUR", "entrepreneur", 36.6, WHITE), ("DIVERTISSEMENT", "divertissement,", 38.8, CYAN)]
PS_T = [words(w, n)[0][1] for _, w, n, _ in PS]


def letters_rise(cv, t, s, weight, size, color, cx, base, t0, alpha, stagger=0.025):
    """Letter-by-letter rise with a small overshoot (2D)."""
    total = text_width(s, weight, size)
    x = cx - total / 2
    for i, ch in enumerate(s):
        p = prog(t, t0 - 0.05 + i * stagger, 0.42)
        if p > 0:
            e = out_back(p, 1.6)
            text(cv, ch, weight, size, color, x, base + (1 - e) * size * 0.45, alpha * min(1.0, p * 3),
                 reveal=out5(p), reveal_dir="y")
        x += text_width(s[:i + 1], weight, size) - text_width(s[:i], weight, size)


def type_personas(cv, t):
    if not (34.35 <= t <= 39.95):
        return
    a = out3(prog(t, 34.38, 0.2)) * (1 - inout3(prog(t, 39.70, 0.22)))
    zone_scrim(cv, a)
    for i, (toks, keys) in enumerate(PS_CH):
        chunk(cv, t, toks, (PS_T[0] + 0.6, 37.92, PS_T[3] - 0.08)[i], base=1240, keys=keys)
    for i, ((word, _, _, col), t0) in enumerate(zip(PS, PS_T)):
        t1 = PS_T[i + 1] if i + 1 < len(PS) else 39.7
        if not (t0 - 0.1 <= t <= t1 + 0.3):
            continue
        out = inout3(prog(t, t1 - 0.12, 0.25))
        size = fit(word, "anton", 190, W - 2 * X0)
        letters_rise(cv, t, word, "anton", size, col, W / 2, 1460 - 70 * out, t0, a * (1 - out))


BS = dict(cp=prep([("commence par", 40.2, ())]), ton=words("ton besoin,", 40.7),
          pp=prep([("pas par le produit", 41.9, ("pas",)), ("le plus populaire.", 42.85, ("populaire.",))]))


def type_besoin(cv, t):
    if not (40.25 <= t <= 43.75):
        return
    a = out3(prog(t, 40.28, 0.2)) * (1 - inout3(prog(t, 43.48, 0.22)))
    zone_scrim(cv, a)
    toks, keys = BS["cp"][0]
    chunk(cv, t, toks, BS["ton"][0][1] - 0.06, base=1300, keys=keys)
    A = 1 - inout3(prog(t, 41.80, 0.2))
    (tn, s0, _), (bs, s1, _) = BS["ton"]
    if t >= s0 - 0.1:
        rise_word(cv, t, "ton", "serif", 130, WHITE, X0, 1290, s0, a * A)
        box_word(cv, t, "BESOIN", "anton", 210, X0 + 26, 1510, s1, CYAN, NAVY, a * A, pad=(26, 18))
    for i, (toks, keys) in enumerate(BS["pp"]):
        chunk(cv, t, toks, (BS["pp"][1][0][0][1] - 0.06, 43.48)[i], base=1400, keys=keys,
              key_col=VIOLET)


CT = prep([("Découvre les offres", 44.5, ("découvre",)), ("disponibles sur", 45.5, ())])
URL_T = words("digitalsub.org.", 46.3)[0][1]


def type_cta(cv, t):
    if not (44.6 <= t <= 48.1):
        return
    a = out3(prog(t, 44.62, 0.2)) * (1 - inout3(prog(t, 47.85, 0.2)))
    zone_scrim(cv, a)
    chunks(cv, t, CT, base=1210)
    p = prog(t, URL_T - 0.04, 0.5)
    if p > 0:
        text(cv, "digitalsub.org", "bold", 84, WHITE, W / 2, 1408, a * out3(prog(t, URL_T - 0.04, 0.2)), anchor="c",
             tracking=14 * (1 - out5(p)), reveal=out3(p))


# ------------------------------------------------------------------ type over the 3D shots
JN = [(words("Tu consultes", 17.2), words("les offres disponibles.", 17.9), "01"),
      (words("Tu choisis", 19.4), words("celle qui correspond à ton besoin.", 19.9), "02"),
      (words("Tu paies", 22.3), words("en ariary avec les moyens proposés.", 22.6), "03")]
JN_LINES = [["LES OFFRES", "DISPONIBLES"], ["CELLE QUI CORRESPOND", "À TON BESOIN"], ["EN ARIARY AVEC LES", "MOYENS PROPOSÉS"]]


def type_journey(cv, t):
    for i, ((title, body, num), (h0, h1)) in enumerate(zip(JN, C.LIST_TILES)):
        if not (h0 - 0.2 <= t <= h1 + 0.25):
            continue
        a = out3(prog(t, h0 - 0.1, 0.3)) * (1 - inout3(prog(t, h1 - 0.05, 0.22)))
        x = 170
        rise_word(cv, t, num, "anton", 140, CYAN, x, 640, max(h0, title[0][1] - 0.25), a, tracking=10)
        xx = x
        for w, s, _ in title:
            rise_word(cv, t, w, "serif", 100, WHITE, xx, 800, s, a)
            xx += text_width(w + " ", "serif", 100)
        # body: the spoken words appear in sync, laid out on two Anton lines
        times = [s for _, s, _ in body]
        k = 0
        for li, ln in enumerate(JN_LINES[i]):
            size = fit(ln, "anton", 92, 740)
            xx = x
            for w in ln.split():
                tw = times[min(k, len(times) - 1)]
                rise_word(cv, t, w, "anton", size, WHITE, xx, 960 + li * 112, tw, a)
                xx += text_width(w + " ", "anton", size)
                k += 1
        hline(cv, x, x + 220 * out3(prog(t, body[0][1], 0.5)), 1080 + 112, CYAN, a, 4, color2=VIOLET)


CL = dict(m=words("moins de complications,", 30.8), p=words("plus de clarté.", 32.4))


def type_clarity(cv, t):
    if not (30.64 <= t <= 33.6):
        return
    (m0, s0, _), (m1, s1, _), (m2, s2, _) = CL["m"]
    A = 1 - inout3(prog(t, 32.02, 0.2))
    x = W / 2 - text_width("moins de", "xbold", 66) / 2
    for w, s in (("moins", s0), ("de", s1)):
        e, sc, dy = pop_in(t, s)
        text(cv, w, "xbold", 66, WHITE, x, 300 + dy, A * e)
        x += text_width(w + " ", "xbold", 66)
    size = fit("COMPLICATIONS", "anton", 170, W - 2 * X0)
    rise_word(cv, t, "COMPLICATIONS", "anton", size, WHITE, W / 2, 470, s2, A, anchor="c", tracking=34)
    (p0, q0, _), (p1, q1, _), (p2, q2, _) = CL["p"]
    B = 1 - inout3(prog(t, 33.30, 0.25))
    x = W / 2 - text_width("plus de", "xbold", 66) / 2
    for w, s in (("plus", q0), ("de", q1)):
        e, sc, dy = pop_in(t, s)
        text(cv, w, "xbold", 66, WHITE, x, 300 + dy, B * e)
        x += text_width(w + " ", "xbold", 66)
    p = prog(t, q2 - 0.04, 0.45)
    text(cv, "clarté.", "serif", 210, CYAN, W / 2, 500, B * out3(p), anchor="c", scale=1.12 - 0.12 * out_expo(p),
         blur=(1 - p) * 6)
    hw = text_width("clarté", "serif", 210) / 2
    swoosh(cv, W / 2 - hw, 540, W / 2 + hw, 528, out3(prog(t, q2 + 0.2, 0.3)), VIOLET, CYAN, 14, 16, B)


def type_outro(cv, t):
    u = t - C.CARD_AT
    if u < 1.2:
        return
    r = out3(prog(u, 1.25, 0.6))
    text(cv, "www.digitalsub.org", "medium", 54, WHITE, W / 2, 1300 + 16 * (1 - r), r, anchor="c",
         tracking=3 + 16 * (1 - out3(prog(u, 1.25, 1.1))))


# ------------------------------------------------------------------ frame
def full_shot(scene, f):
    img = r3d(scene, f)
    return to_canvas(img.convert("RGB")) if img is not None else None


def load_matte(n):
    mp = os.path.join(ROOT, "v25", "matte", f"{min(n, SRC_FRAMES - 1):05d}.png")
    return Image.open(mp).convert("L").resize((W, H), Image.BICUBIC) if os.path.exists(mp) else None


def render(src, t, n=None, matte=None):
    f = round(t * FPS)
    n = f if n is None else n
    matte = load_matte(n) if matte is None else matte
    z = zoom_at(t)
    ramp = 0.0
    if 16.10 <= t < 16.40:
        ramp = 0.10 * in_expo(prog(t, 16.10, 0.30))
    if 29.78 <= t < 30.64:
        ramp = 0.06 * in_expo(prog(t, 29.78, 0.86))
    base = zoom_blur(src, z, ramp)
    # defocus when coming back from / going into a 3D shot
    for t0, d, r in ((24.80, 0.5, 16.0), (34.15, 0.5, 16.0)):
        if t0 <= t < t0 + d:
            base = base.filter(ImageFilter.GaussianBlur(r * (1 - smooth(prog(t, t0, d)))))
    if t >= 47.80:
        base = base.filter(ImageFilter.GaussianBlur(14 * smooth(prog(t, 47.80, 0.45))))
    cv = to_canvas(base)
    if t >= 47.80:
        cv *= 1 - 0.75 * smooth(prog(t, 47.80, 0.45))

    mg.DRAWN.clear()
    mg.TRACK[0] = True
    face_cam = True
    hits = []
    # 3D overlays on the face cam
    for scene, a0, a1, kind in C.RENDERS:
        if kind == "overlay" and a0 <= t <= a1:
            img = r3d(scene, f)
            if img is not None:
                m = overlay(cv, img)
                kx0, ky0, kx1, ky1 = (int(v) for v in keepout(n, t))
                if m[max(ky0, 0):ky1, max(kx0, 0):kx1].max(initial=0) > 0.05:
                    hits.append(("3d:" + scene,))
    mg.TRACK[0] = False  # the behind-the-head layer is checked after the matte instead
    sl = type_simplifie(t)
    if sl is not None and matte is not None:
        lay, al = sl
        person = np.asarray(warp(matte, z, Image.BILINEAR), np.float32) / 255
        k = (al * (1 - person))[..., None]
        cv[:] = cv * (1 - k) + lay * k
        # behind-the-head type may show through the soft hair edge, never over the face itself
        fx0, fy0, fx1, fy1 = (int(v) for v in face_box(n, t))
        if k[max(fy0, 0):fy1, max(fx0, 0):fx1].max(initial=0) > 0.05:
            hits.append(("behind-head type visible on the face",))
    mg.TRACK[0] = True
    for fn in (type_hook, type_friction, type_impact, type_activation, type_idee, type_personas, type_besoin, type_cta):
        fn(cv, t)
    mg.TRACK[0] = False
    if mg.DRAWN:
        kx0, ky0, kx1, ky1 = keepout(n, t)
        hits += [b for b in mg.DRAWN if b[0] < kx1 and b[2] > kx0 and b[1] < ky1 and b[3] > ky0]

    # full-frame 3D shots + their transitions
    if 2.67 <= t < 9.29:
        shot = full_shot("services", f)
        if shot is not None:
            cv, face_cam = shot, False
            type_services(cv, t)
    if 16.24 <= t < 25.10:
        shot = full_shot("journey", min(f, round(24.95 * FPS)))
        if shot is not None:
            k = smooth(prog(t, 16.24, 0.18)) * (1 - smooth(prog(t, 24.80, 0.28)))
            cv = cv * (1 - k) + shot * k
            face_cam = k < 0.5
            lay = shot.copy()
            type_journey(lay, t)
            cv = cv * (1 - k) + lay * k
    if 30.64 <= t < 34.45:
        shot = full_shot("clarity", min(f, round(34.45 * FPS)))
        if shot is not None:
            k = 1 - smooth(prog(t, 34.15, 0.28))
            if t < 30.72:  # light flash on the hard cut
                shot = np.clip(shot + 0.35 * (1 - prog(t, 30.64, 0.08)), 0, 1)
            type_clarity(shot, t)
            cv = cv * (1 - k) + shot * k
            face_cam = k < 0.5
    if t >= 47.95:
        shot = full_shot("outro", f)
        if shot is not None:
            k = smooth(prog(t, 47.95, 0.35))
            type_outro(shot, t)
            cv = cv * (1 - k) + shot * k
            face_cam = k < 0.5
    return to_image(cv), (hits if face_cam else [])


GRADE = "eq=contrast=1.05:saturation=1.04:gamma=0.98,colorbalance=rs=-0.015:bs=0.03:rh=0.015:bh=-0.01"


def _work(job):
    n, buf = job
    t = n / FPS
    img, hits = render(Image.frombuffer("RGB", (W, H), buf), t, n)
    return img.tobytes(), (n, hits) if hits else None


def main(src_path, out):
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src_path, "-vf", GRADE, "-f", "rawvideo", "-pix_fmt",
                            "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "9",
                            "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
                            "-color_trc", "bt709", out], stdin=subprocess.PIPE)
    total = round(END * FPS)
    n, last, batch, violations = 0, None, [], []
    with Pool(os.cpu_count()) as pool:
        def flush():
            for b, v in pool.map(_work, batch):
                enc.stdin.write(b)
                if v:
                    violations.append(v)
            batch.clear()

        while n < total:
            buf = dec.stdout.read(W * H * 3)
            if len(buf) < W * H * 3:
                buf = last  # hold the last source frame under the brand reveal
            last = buf
            batch.append((n, buf))
            n += 1
            if len(batch) == 16:
                flush()
        flush()
    dec.stdout.close()
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"main: {n} frames; face keep-out violations: {len(violations)}")
    for f, hits in violations[:12]:
        print(f"  frame {f} ({f / FPS:.2f}s): {hits[:3]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
