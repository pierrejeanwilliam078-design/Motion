"""DigitalSub video 16 — cinematic kinetic-typography edit.

Typography: Anton (condensed titles), Playfair Display ExtraBold Italic
(accent words), Inter Display (subtitle chunks). Text over the face cam lives
only in the free zones (above the head / over the torso); every frame is
checked against the tracked face keep-out box (v16/face_track.json).
"""
import json
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import cues16 as C
import mg
from kinetic import box_word, chunk, chunks, fit, pop_in, rise_word
from mg import (BLUE, CYAN, DIM, FPS, H, NAVY, NAVY2, VIOLET, W, WHITE, Transcript, _rrect_mask, blend_mask,
                blend_rgba, chat_bubble, clamp, disc, glass, hline, icon, inout3, inout_expo, out3, out5, out_back,
                out_expo, prog, rrect, rrect_outline, scrim, smooth, swoosh, text, text_width, to_canvas, to_image,
                vline)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
TR = Transcript(os.path.join(ROOT, "v16", "words.json"))
# onsets corrected from the measured pauses (Whisper glued them to the previous segment)
for i, (w, s, e) in enumerate(TR.words):
    if w == "Parfois," and abs(s - 26.54) < 0.05:
        TR.words[i] = (w, 27.03, e)
    if w == "Parfois," and abs(s - 30.08) < 0.05:
        TR.words[i] = (w, 30.23, e)
    if w == "et" and abs(s - 20.66) < 0.05:
        TR.words[i] = (w, 20.93, e)
    if w == "prémien":  # ASR spelling of « premium »
        TR.words[i] = ("premium", s, e)

KEEP = np.array(json.load(open(os.path.join(ROOT, "v16", "face_track.json")))["keepout"], np.float32)
ANCHOR = (float(np.median((KEEP[:, 0] + KEEP[:, 2]) / 2)), float(np.median((KEEP[:, 1] + KEEP[:, 3]) / 2)))
HOLD = 10
X0 = 96
ZONE = (1095, 1560)  # free zone over the torso, below the chin and above social UI


def words(s, near):
    return TR.timed(s, near)


ZOOM = [
    (0.00, 0.70, 1.10, 1.02, out_expo),
    (0.70, 2.96, 1.02, 1.035, smooth),
    (2.96, 10.30, 1.06, 1.06, smooth),
    (10.30, 13.75, 1.06, 1.04, smooth),
    (13.75, 14.10, 1.04, 1.07, inout3),   # punch-in on the music drop
    (14.10, 17.00, 1.07, 1.08, smooth),
    (17.00, 22.60, 1.03, 1.03, smooth),
    (22.60, 27.00, 1.03, 1.05, smooth),
    (27.00, 33.60, 1.04, 1.04, smooth),
    (33.60, 37.46, 1.04, 1.08, smooth),
    (37.46, 37.90, 1.08, 1.03, inout3),
    (37.90, 41.30, 1.03, 1.045, smooth),
    (41.30, 42.10, 1.045, 1.10, smooth),
]


def zoom_at(t):
    z = ZOOM[0][2]
    for t0, t1, z0, z1, e in ZOOM:
        if t >= t0:
            z = z0 + (z1 - z0) * e(prog(t, t0, t1 - t0))
    return z


_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGNETTE = (1 - 0.30 * np.clip(((_xx - W / 2) / (W * 0.75)) ** 2 + ((_yy - H * 0.42) / (H * 0.62)) ** 2, 0, 1) ** 1.5)[..., None]


def face(src, t):
    z = zoom_at(t)
    ax, ay = ANCHOR
    k = 1 / z
    img = src.transform((W, H), Image.AFFINE, (k, 0, ax * (1 - k), 0, k, ay * (1 - k)), Image.BICUBIC)
    return to_canvas(img) * VIGNETTE


def keepout(n, t):
    x0, y0, x1, y1 = KEEP[min(n, len(KEEP) - 1)]
    z = zoom_at(t)
    ax, ay = ANCHOR
    return ax + (x0 - ax) * z, ay + (y0 - ay) * z, ax + (x1 - ax) * z, ay + (y1 - ay) * z


# ------------------------------------------------------------------ backgrounds
def radial(cx, cy, rx, ry):
    return np.exp(-(((_xx - cx) / rx) ** 2 + ((_yy - cy) / ry) ** 2) * 2.0)[..., None]


_gy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
BG = np.asarray(NAVY, np.float32) * (1 - _gy) * 0.9 + np.asarray(NAVY2, np.float32) * np.sin(_gy * np.pi) * 0.85
BG = np.broadcast_to(BG, (H, W, 3)).copy()
BG += (((_xx % 120) < 1.2) | ((_yy % 120) < 1.2)).astype(np.float32)[..., None] * 0.018
GLOW_A = radial(W * 0.10, H * 0.18, 720, 640) * np.asarray(VIOLET, np.float32)
GLOW_B = radial(W * 0.95, H * 0.78, 680, 720) * np.asarray(BLUE, np.float32)
NOISE = (np.random.default_rng(5).random((H + 64, W + 64, 1), dtype=np.float32) - 0.5) / 255 * 2.5


def card_bg(t):
    o = int(t * FPS * 7) % 64
    return (BG + GLOW_A * (0.15 + 0.05 * np.sin(t * 0.9)) + GLOW_B * (0.13 + 0.04 * np.cos(t * 0.7))
            + NOISE[o:o + H, o:o + W])


def line(cv, x0, y0, x1, y1, color, alpha, width=2):
    if alpha <= 0.002:
        return
    ss, pad = 3, width + 2
    bx, by = int(min(x0, x1) - pad), int(min(y0, y1) - pad)
    w, h = int(abs(x1 - x0) + 2 * pad), int(abs(y1 - y0) + 2 * pad)
    img = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(img).line(((x0 - bx) * ss, (y0 - by) * ss, (x1 - bx) * ss, (y1 - by) * ss), fill=255,
                             width=width * ss)
    blend_mask(cv, np.asarray(img.resize((w, h), Image.LANCZOS), np.float32) / 255, color, bx, by, alpha)


def pip(cv, t, src, cx, cy, d, t_in):
    """Circular picture-in-picture of the speaker inside the B-roll cards."""
    p = prog(t, t_in, 0.5)
    if p <= 0:
        return
    s = d * (0.85 + 0.15 * out_back(p))
    ds = max(4, int(round(s)))
    fx0, fy0, fx1, fy1 = np.median(KEEP, 0)
    side = (fx1 - fx0) * 0.95
    fcx, fcy = (fx0 + fx1) / 2, fy0 + (fy1 - fy0) * 0.42
    crop = src.crop((int(fcx - side / 2), int(fcy - side / 2), int(fcx + side / 2), int(fcy + side / 2)))
    img = to_canvas(crop.resize((ds, ds), Image.BICUBIC))
    spr = np.concatenate([img, mg._disc(ds)[..., None]], 2)
    blend_rgba(cv, spr, int(cx - ds / 2), int(cy - ds / 2), out3(p))
    rrect_outline(cv, cx - ds / 2, cy - ds / 2, ds, ds, ds / 2, CYAN, out3(p) * 0.8, 3)


# ------------------------------------------------------------------ type helpers


def prep(spec):
    return [(words(s, n), set(k)) for s, n, k in spec]


def zone_scrim(cv, a):
    scrim(cv, ZONE[0] - 120, H, 0.80 * a)


# ------------------------------------------------------------------ face-cam scenes
HK = dict(a=words("Tu veux passer au premium", 0.0), q=words("quelle formule choisir", 1.9))
HK_CH = prep([("mais tu ne sais", 0.9, ()), ("même pas", 1.5, ("pas",))])


def scene_hook(cv, t):
    if t > 3.30:
        return
    a = 1 - inout3(prog(t, 3.02, 0.25))
    zone_scrim(cv, a)
    A = 1 - inout3(prog(t, 0.92, 0.12))
    if A > 0:
        x = X0
        for w, s, _ in HK["a"][:4]:
            e, sc, dy = pop_in(t, s)
            text(cv, w, "xbold", 64, WHITE, x, 1215 + dy, A * e)
            x += text_width(w + " ", "xbold", 64)
        w, s, _ = HK["a"][4]
        p = prog(t, s - 0.04, 0.45)
        text(cv, "premium", "serif", 176, CYAN, X0 - 6, 1400, A * out3(p), scale=1.12 - 0.12 * out_expo(p),
             blur=(1 - p) * 6)
        swoosh(cv, X0 + 10, 1440, X0 + text_width("premium", "serif", 176) - 10, 1428,
               out3(prog(t, 0.86, 0.32)), VIOLET, CYAN, 14, 16, A)
    chunks(cv, t, HK_CH)
    if t >= 1.92:
        (q1, s1, _), (q2, s2, _), (q3, s3, _) = HK["q"]
        rise_word(cv, t, "QUELLE", "anton", 150, WHITE, X0, 1300, s1, a)
        rise_word(cv, t, "FORMULE", "anton", 150, WHITE, X0 + text_width("QUELLE ", "anton", 150), 1300, s2, a)
        box_word(cv, t, "CHOISIR ?", "anton", 150, X0 + 22, 1475, s3, CYAN, NAVY, a)


MV = dict(a=words("Le mauvais réflexe", 10.2), b=words("le prix le plus bas", 12.5))
MV_CH = prep([("c'est de choisir", 11.4, ()), ("uniquement", 12.0, ("uniquement",))])


def scene_mauvais(cv, t):
    if not (10.2 <= t <= 13.85):
        return
    a = out3(prog(t, 10.22, 0.2)) * (1 - inout3(prog(t, 13.55, 0.25)))
    zone_scrim(cv, a)
    A = 1 - inout3(prog(t, 11.36, 0.12))
    (le, s0, _), (mv, s1, _), (rf, s2, _) = MV["a"]
    rise_word(cv, t, "Le", "serif", 104, WHITE, X0, 1215, s0, A * a)
    rise_word(cv, t, "mauvais", "serif", 104, VIOLET, X0 + text_width("Le ", "serif", 104), 1215, s1, A * a)
    rise_word(cv, t, "RÉFLEXE", "anton", 176, WHITE, X0, 1410, s2, A * a, tracking=30)
    ix = X0 + text_width("RÉFLEXE", "anton", 176) + 30
    cp = prog(t, 10.92, 0.4)
    if cp > 0:
        disc(cv, ix + 60, 1340, 120 * (0.8 + 0.2 * out_back(cp)), VIOLET, A * a * out3(cp))
        icon(cv, "cross", ix + 16, 1296, 88, out3(prog(t, 11.0, 0.35)), WHITE, 9, A * a)
    chunks(cv, t, MV_CH)
    B = out3(prog(t, 12.58, 0.1))
    if B > 0:
        toks = MV["b"]
        x = X0
        for w, s, _ in toks[:2]:
            rise_word(cv, t, w.upper(), "anton", 132, WHITE, x, 1290, s, a)
            x += text_width(w.upper() + " ", "anton", 132)
        x = X0
        for w, s, _ in toks[2:]:
            rise_word(cv, t, w.upper().strip("."), "anton", 132, WHITE, x, 1440, s, a)
            x += text_width(w.upper().strip(".") + " ", "anton", 132)
        sp = out5(prog(t, 13.34, 0.3))
        hline(cv, X0 - 10, X0 - 10 + (text_width("LE PRIX", "anton", 132) + 20) * sp, 1236, VIOLET, a, 12)
        hline(cv, X0 - 10, X0 - 10 + (x - X0 + 10) * sp, 1386, VIOLET, a, 12)


BN = dict(a=words("Le bon réflexe", 14.0), u=words("ton usage.", 16.1))
BN_CH = prep([("c'est de", 15.2, ()), ("commencer par", 15.5, ("commencer",))])


def scene_bon(cv, t):
    if not (14.0 <= t <= 17.10):
        return
    a = out3(prog(t, 14.02, 0.2)) * (1 - inout3(prog(t, 16.95, 0.15)))
    zone_scrim(cv, a)
    A = 1 - inout3(prog(t, 15.16, 0.12))
    (le, s0, _), (bn, s1, _), (rf, s2, _) = BN["a"]
    rise_word(cv, t, "Le", "serif", 104, WHITE, X0, 1215, s0, A * a)
    rise_word(cv, t, "bon", "serif", 104, CYAN, X0 + text_width("Le ", "serif", 104), 1215, s1, A * a)
    box_word(cv, t, "RÉFLEXE", "anton", 160, X0 + 22, 1420, s2, CYAN, NAVY, A * a)
    ix = X0 + 22 + text_width("RÉFLEXE", "anton", 160) + 50
    cp = prog(t, 14.52, 0.4)
    if cp > 0:
        disc(cv, ix + 60, 1350, 120 * (0.8 + 0.2 * out_back(cp)), CYAN, A * a * out3(cp))
        icon(cv, "check", ix + 16, 1306, 88, out3(prog(t, 14.6, 0.35)), NAVY, 9, A * a)
    chunks(cv, t, BN_CH)
    (tn, s3, _), (us, s4, _) = BN["u"]
    if t >= s3 - 0.1:
        rise_word(cv, t, "ton", "serif", 120, WHITE, X0, 1260, s3, a)
        p = prog(t, s4 - 0.04, 0.45)
        text(cv, "usage.", "serif", 190, CYAN, X0 - 4, 1450, a * out3(p), scale=1.1 - 0.1 * out_expo(p), blur=(1 - p) * 5)
        swoosh(cv, X0 + 10, 1488, X0 + text_width("usage", "serif", 190), 1476, out3(prog(t, 16.52, 0.32)),
               VIOLET, CYAN, 14, 16, a)


DS = dict(chez=words("Chez", 22.5), o=words("une orientation", 24.4))
DS_CH = prep([("tu peux demander", 23.9, ("demander",)), ("avant ta commande.", 25.2, ("commande.",))])
LOGO = Image.open(os.path.join(ROOT, "assets", "digitalsub-logo.png")).convert("RGBA")
LOGO = LOGO.crop(LOGO.getchannel("A").getbbox())


def logo_sprite(height):
    w = round(LOGO.width * height / LOGO.height)  # uniform scale only
    return np.asarray(LOGO.resize((w, height), Image.LANCZOS), np.float32) / 255


LOGO_S = logo_sprite(215)


def scene_digitalsub(cv, t):
    if not (22.5 <= t <= 26.65):
        return
    a = out3(prog(t, 22.55, 0.2)) * (1 - inout3(prog(t, 26.40, 0.15)))
    zone_scrim(cv, a)
    A = 1 - inout3(prog(t, 23.86, 0.14))
    (cz, s0, _), = DS["chez"]
    rise_word(cv, t, "Chez", "serif", 104, WHITE, W / 2, 1200, s0, A * a, anchor="c")
    p = prog(t, 22.86, 0.6)
    if p > 0:
        s = 0.9 + 0.1 * out_expo(p)
        h = int(LOGO_S.shape[0] * s)
        img = Image.fromarray((LOGO_S * 255).astype(np.uint8)).resize((int(LOGO_S.shape[1] * s), h), Image.LANCZOS)
        if p < 1:
            img = img.filter(ImageFilter.GaussianBlur(6 * (1 - p)))
        spr = np.asarray(img, np.float32) / 255
        if mg.TRACK[0]:
            mg.DRAWN.append((W / 2 - spr.shape[1] / 2, 1340 - h / 2, W / 2 + spr.shape[1] / 2, 1340 + h / 2))
        blend_rgba(cv, spr, int(W / 2 - spr.shape[1] / 2), int(1340 - h / 2), A * a * out3(p))
    chunks(cv, t, DS_CH[:1])
    (un, s1, _), (orr, s2, _) = DS["o"]
    if t >= s1 - 0.1:
        B = 1 - inout3(prog(t, 25.22, 0.12))
        rise_word(cv, t, "UNE", "anton", 96, WHITE, W / 2, 1250, s1, B * a, anchor="c")
        p = prog(t, s2 - 0.04, 0.45)
        text(cv, "orientation", "serif", fit("orientation", "serif", 170, W - 2 * X0), CYAN, W / 2, 1420,
             B * a * out3(p), anchor="c", scale=1.1 - 0.1 * out_expo(p), blur=(1 - p) * 5)
        hw = text_width("orientation", "serif", fit("orientation", "serif", 170, W - 2 * X0)) / 2
        swoosh(cv, W / 2 - hw + 10, 1460, W / 2 + hw - 10, 1450, out3(prog(t, 24.86, 0.32)), VIOLET, CYAN, 14, 16, B * a)
    chunks(cv, t, DS_CH[1:])


KY = dict(a=words("Le bon abonnement", 33.7), u=words("utilisation réelle.", 36.1))
KY_CH = prep([("est celui qui", 34.6, ()), ("fonctionne pour ton", 35.3, ("fonctionne",))])


def scene_key(cv, t):
    if not (33.55 <= t <= 37.55):
        return
    a = out3(prog(t, 33.6, 0.25)) * (1 - inout3(prog(t, 37.36, 0.15)))
    zone_scrim(cv, a)
    A = 1 - inout3(prog(t, 34.62, 0.12))
    (le, s0, _), (bn, s1, _), (ab, s2, _) = KY["a"]
    rise_word(cv, t, "LE", "anton", 110, WHITE, X0, 1230, s0, A * a)
    rise_word(cv, t, "BON", "anton", 110, CYAN, X0 + text_width("LE ", "anton", 110), 1230, s1, A * a)
    rise_word(cv, t, "ABONNEMENT", "anton", fit("ABONNEMENT", "anton", 170, W - 2 * X0), WHITE, X0, 1420, s2, A * a,
              tracking=28)
    chunks(cv, t, KY_CH)
    (ut, s3, _), (re, s4, _) = KY["u"]
    if t >= s3 - 0.1:
        rise_word(cv, t, "UTILISATION", "anton", 140, WHITE, X0, 1290, s3, a, tracking=20)
        p = prog(t, s4 - 0.04, 0.45)
        text(cv, "réelle.", "serif", 180, CYAN, X0 - 4, 1460, a * out3(p), scale=1.1 - 0.1 * out_expo(p), blur=(1 - p) * 5)
        swoosh(cv, X0 + 10, 1494, X0 + text_width("réelle", "serif", 180), 1482, out3(prog(t, 37.08, 0.3)),
               VIOLET, CYAN, 14, 16, a)


CT = dict(e=words("Écris", 37.8), m=words("en message", 38.9), p=words("plusieurs formules.", 40.6))
CT_CH = prep([("si tu hésites entre", 39.4, ("hésites",))])


def scene_cta(cv, t):
    if not (37.75 <= t <= 41.9):
        return
    a = out3(prog(t, 37.8, 0.2))
    zone_scrim(cv, a)
    A = 1 - inout3(prog(t, 40.55, 0.18))
    up = -40 * inout3(prog(t, 40.55, 0.18))
    (ec, s0, _), = CT["e"]
    rise_word(cv, t, "Écris", "serif", 110, WHITE, X0, 1200 + up, s0, A * a)
    # message bubble with the word typed in
    bp = prog(t, 38.28, 0.35)
    if bp > 0:
        bw, bh = 420, 150
        sc = 0.7 + 0.3 * out_back(bp)
        bx, by = X0, 1240 + up
        chat_bubble(cv, bx, by + bh * (1 - sc) / 2, bw * sc, bh * sc, CYAN, A * a * out3(bp))
        n = int(np.clip((t - C.AIDE_TYPE) / C.AIDE_STEP + 1, 0, 4))
        if n and sc > 0.95:
            text(cv, "AIDE"[:n], "anton", 112, NAVY, bx + 44, by + 122, A * a)
        dp = prog(t, 38.80, 0.3)
        if dp > 0:  # delivered tick
            icon(cv, "check", bx + bw - 76, by + bh - 70, 56, out3(dp), NAVY, 6, A * a)
    (en, s1, _), (ms, s2, _) = CT["m"]
    mx = X0 + 460
    for w, s, y in (("en", s1, 1300), ("message", s2, 1370)):
        e, sc, dy = pop_in(t, s)
        text(cv, w, "xbold", 64, WHITE, mx, y + up + dy, A * a * e)
    toks, keys = CT_CH[0]
    chunk(cv, t, toks, CT["p"][0][1] - 0.08, base=1515, keys=keys)  # clears before « plusieurs formules »
    (pl, s3, _), (fo, s4, _) = CT["p"]
    if t >= s3 - 0.1:
        D = 1 - inout3(prog(t, 41.45, 0.2))
        rise_word(cv, t, "PLUSIEURS", "anton", 150, WHITE, X0, 1300, s3, a * D, tracking=24)
        box_word(cv, t, "FORMULES", "anton", 150, X0 + 22, 1470, s4, VIOLET, WHITE, a * D)


# ------------------------------------------------------------------ B-roll cards
A_HEAD = dict(n=words("C'est normal", 3.3), p=words("de se perdre entre", 3.8))
CHIP_POS = [(330, 740), (770, 820), (250, 960), (650, 1030), (330, 1190), (790, 1250), (520, 1410)]


def card_a(t, src):
    cv = card_bg(t)
    hline(cv, X0, X0 + 46 * out3(prog(t, 3.2, 0.4)), 300, CYAN, 1.0, 4)
    (c1, s0, _), (c2, s1, _) = A_HEAD["n"]
    p = prog(t, s0 - 0.04, 0.45)
    text(cv, "C'est normal", "serif", 112, WHITE, X0, 440, out3(p), scale=1.08 - 0.08 * out_expo(p), blur=(1 - p) * 5)
    x = X0
    for w, s, _ in A_HEAD["p"]:
        rise_word(cv, t, w.upper(), "anton", 84, WHITE, x, 560, s, 0.82)
        x += text_width(w.upper() + " ", "anton", 84)
    pip(cv, t, src, 900, 250, 210, 3.5)
    # tangled path between the plan names: « se perdre »
    pts = []
    for i, ((label, ts), (cx, cy)) in enumerate(zip(C.CHIPS, CHIP_POS)):
        dx, dy = 9 * np.sin(t * 0.9 + i * 1.3), 11 * np.sin(t * 1.1 + i * 1.7)
        pts.append((cx + dx, cy + dy, ts))
    for (x0, y0, t0), (x1, y1, t1) in zip(pts, pts[1:]):
        lp = prog(t, t1 - 0.1, 0.35)
        if lp > 0:
            line(cv, x0, y0, x0 + (x1 - x0) * out3(lp), y0 + (y1 - y0) * out3(lp), WHITE, 0.18, 2)
    for i, ((label, ts), (cx, cy, _)) in enumerate(zip(C.CHIPS, pts)):
        p = prog(t, ts - 0.04, 0.35)
        if p <= 0:
            continue
        sc = 0.6 + 0.4 * out_back(p)
        tw = text_width(label, "bold", 62)
        w, h = (tw + 80) * sc, 112 * sc
        rrect(cv, cx - w / 2, cy - h / 2, w, h, h / 2, NAVY2, 0.95 * out3(p))
        hl = 1 - out3(prog(t, ts + 0.3, 0.8))
        rrect_outline(cv, cx - w / 2, cy - h / 2, w, h, h / 2, CYAN, out3(p) * (0.25 + 0.75 * hl), 3)
        text(cv, label, "bold", 62, WHITE, cx, cy + 22 * sc, out3(p), anchor="c", scale=sc)
    return cv


B_Q = [("Combien de", "PERSONNES", "people", 17.3), ("Combien de", "TEMPS", "clock", 18.6),
       ("Sur quels", "APPAREILS", "devices", 19.6), ("Pour quels", "OBJECTIFS", "target", 20.95)]
B_W = [(words(f"{a} {b.lower()}", n)) for a, b, _, n in B_Q]


def card_b(t, src):
    cv = card_bg(t + 7)
    pip(cv, t, src, 541, 230, 190, 17.1)
    cw, ch, gap = 420, 470, 30
    x0, y0 = W / 2 - cw - gap / 2, 420
    for i, ((pre, kw, ic, _), toks) in enumerate(zip(B_Q, B_W)):
        cx, cy = x0 + (i % 2) * (cw + gap), y0 + (i // 2) * (ch + gap)
        t_in = toks[0][1]
        p = prog(t, t_in - 0.1, 0.45)
        if p <= 0:
            continue
        nxt = B_W[i + 1][0][1] if i + 1 < len(B_W) else 99
        active = 1 - out3(prog(t, nxt - 0.05, 0.3))
        dy = 50 * (1 - out5(p))
        glass(cv, cx, cy + dy, cw, ch, 36, alpha=out3(p), tint_amt=0.55, blur=12, border=0.12)
        rrect_outline(cv, cx, cy + dy, cw, ch, 36, CYAN, out3(p) * 0.85 * active, 3)
        lum = 0.55 + 0.45 * active
        text(cv, f"0{i + 1}", "anton", 44, CYAN, cx + cw - 44, cy + dy + 80, out3(p), anchor="r")
        icon(cv, ic, cx + 40, cy + dy + 40, 120, out3(prog(t, t_in, 0.6)), CYAN if active > 0.5 else WHITE, 6,
             out3(p) * lum)
        xx = cx + 44
        for w, s, _ in toks[:-1]:
            e, sc, ddy = pop_in(t, s)
            text(cv, w, "medium", 44, DIM, xx, cy + dy + 290 + ddy, e * lum)
            xx += text_width(w + " ", "medium", 44)
        w, s, _ = toks[-1]
        size = fit(kw, "anton", 112, cw - 88)
        rise_word(cv, t, kw, "anton", size, WHITE, cx + 44, cy + dy + 410, s, lum, tracking=14)
    return cv


C_TOP = dict(p=words("Parfois,", 26.9), f=words("la formule la plus chère est inutile.", 27.8))
C_BOT = dict(p=words("Parfois,", 30.1), f=words("la moins chère ne correspond pas", 30.9), b=words("à ton besoin.", 32.4))
SPLIT = 905


def bars(cv, t, x0, base, t_in, pick, pick_t, cross_t, col):
    for i, hgt in enumerate((130, 220, 320)):
        p = out5(prog(t, t_in + i * 0.08, 0.6))
        if p <= 0:
            continue
        x = x0 + i * 74
        hl = out3(prog(t, pick_t, 0.3)) if i == pick else 0.0
        rrect(cv, x, base - hgt * p, 54, max(2, hgt * p), 12, WHITE, 0.14 * (1 - hl))
        if hl:
            rrect(cv, x, base - hgt * p, 54, hgt * p, 12, col, hl)
    cp = prog(t, cross_t, 0.4)
    if cp > 0:
        cx = x0 + pick * 74 + 27
        cy = base - (130, 220, 320)[pick] - 70
        disc(cv, cx, cy, 96 * (0.8 + 0.2 * out_back(cp)), col, out3(cp))
        icon(cv, "cross", cx - 34, cy - 34, 68, out3(prog(t, cross_t + 0.08, 0.3)), WHITE, 7)


def card_c(t):
    cv = card_bg(t + 13)
    (pf, s0, _), = C_TOP["p"]
    rise_word(cv, t, "Parfois,", "serif", 110, WHITE, X0, 330, s0)
    f = C_TOP["f"]
    x = X0
    for w, s, _ in f[:2]:
        rise_word(cv, t, w.upper(), "anton", 108, WHITE, x, 470, s)
        x += text_width(w.upper() + " ", "anton", 108)
    x = X0
    for w, s, _ in f[2:5]:
        rise_word(cv, t, w.upper(), "anton", 108, VIOLET if "CHÈRE" in w.upper() else WHITE, x, 600, s)
        x += text_width(w.upper() + " ", "anton", 108)
    w, s, _ = f[5]
    rise_word(cv, t, "EST", "anton", 108, WHITE, X0, 760, s)
    w, s, _ = f[6]
    box_word(cv, t, "INUTILE.", "anton", 108, X0 + 22 + text_width("EST ", "anton", 108), 760, s, VIOLET, WHITE)
    bars(cv, t, 800, 780, 27.4, 2, f[4][1], 29.30, VIOLET)
    dp = out5(prog(t, 29.75, 0.6))
    hline(cv, W / 2 - (W / 2 - X0) * dp, W / 2 + (W / 2 - X0) * dp, SPLIT, CYAN, 0.7, 2, color2=VIOLET)
    (pf, s1, _), = C_BOT["p"]
    rise_word(cv, t, "Parfois,", "serif", 110, WHITE, X0, 1050, s1)
    x = X0
    for w, s, _ in C_BOT["f"][:3]:
        rise_word(cv, t, w.upper(), "anton", 108, CYAN if "CHÈRE" in w.upper() else WHITE, x, 1190, s)
        x += text_width(w.upper() + " ", "anton", 108)
    x = X0
    for w, s, _ in C_BOT["f"][3:]:
        rise_word(cv, t, w.upper(), "anton", 84, WHITE, x, 1320, s)
        x += text_width(w.upper() + " ", "anton", 84)
    x = X0
    for w, s, _ in C_BOT["b"]:
        e, sc, dy = pop_in(t, s)
        text(cv, w, "serif", 104, CYAN, x, 1450 + dy, e)
        x += text_width(w + " ", "serif", 104)
    bars(cv, t, 800, 1470, 30.6, 0, C_BOT["f"][2][1], 32.04, CYAN)
    return cv


def composite_cards(cv, t, src):
    a0, a1 = C.BROLL_A
    if a0 <= t <= a1 + 0.6:
        card = card_a(t, src)
        e_in = inout_expo(prog(t, a0, 0.5))
        e_out = inout_expo(prog(t, a1, 0.5))
        if e_out > 0:  # push left: the card leaves, the face cam comes in from the right
            off = int(W * e_out)
            face_now = cv.copy()
            cv[:, :W - off] = card[:, off:]
            cv[:, W - off:] = face_now[:, :off]
            vline(cv, W - off, 0, H, CYAN, 1.0, 3)
        else:  # iris: a rounded window opens from the centre
            w, h = W * e_in, H * e_in
            if w > 4:
                x, y = int(W / 2 - w / 2), int(H / 2 - h / 2)
                m = _rrect_mask(int(w), int(h), int(60 * (1 - e_in) + 2))[..., None]
                cv[y:y + int(h), x:x + int(w)] = cv[y:y + int(h), x:x + int(w)] * (1 - m) + card[y:y + int(h), x:x + int(w)] * m
    b0, b1 = C.BROLL_B
    if b0 <= t <= b1 + 0.6:
        card = card_b(t, src)
        e_in = inout_expo(prog(t, b0, 0.45))
        e_out = inout3(prog(t, b1, 0.45))
        if e_out > 0:  # zoom-through: the card flies past the camera and clears fast
            s = 1 + 0.25 * e_out
            img = to_image(card).resize((int(W * s), int(H * s)), Image.BILINEAR)
            ox, oy = (img.width - W) // 2, (img.height - H) // 2
            big = to_canvas(img.crop((ox, oy, ox + W, oy + H)))
            k = 1 - out3(prog(t, b1, 0.28))
            cv[:] = cv * (1 - k) + big * k
        else:
            edge = int(H * (1 - e_in))
            cv[edge:] = card[edge:]
            if edge > 0:
                hline(cv, 0, W, edge, CYAN, 1.0, 3, color2=VIOLET)
    c0, c1 = C.BROLL_C
    if c0 <= t <= c1 + 0.6:
        card = card_c(t)
        e_in = inout_expo(prog(t, c0, 0.45))
        e_out = inout_expo(prog(t, c1, 0.48))
        if e_out > 0:  # split open on the face
            up, dn = int(SPLIT * e_out), int((H - SPLIT) * e_out)
            if up < SPLIT:
                cv[:SPLIT - up] = card[up:SPLIT]
                hline(cv, 0, W, SPLIT - up - 2, CYAN, 1.0, 2, color2=VIOLET)
            if dn < H - SPLIT:
                cv[SPLIT + dn:] = card[SPLIT:H - dn]
                hline(cv, 0, W, SPLIT + dn, VIOLET, 1.0, 2, color2=CYAN)
        else:  # wipe from the left
            edge = int(W * e_in)
            cv[:, :edge] = card[:, :edge]
            if 0 < edge < W:
                vline(cv, edge, 0, H, CYAN, 1.0, 3)


# ------------------------------------------------------------------ frame
DEFOCUS = (41.55, 42.10, 14.0)


def render(src, t, n=None):
    cv = face(src, t)
    mg.DRAWN.clear()
    mg.TRACK[0] = True
    for sc in (scene_hook, scene_mauvais, scene_bon, scene_digitalsub, scene_key, scene_cta):
        sc(cv, t)
    mg.TRACK[0] = False
    hits = []
    if n is not None and mg.DRAWN:
        kx0, ky0, kx1, ky1 = keepout(n, t)
        hits = [b for b in mg.DRAWN if b[0] < kx1 and b[2] > kx0 and b[1] < ky1 and b[3] > ky0]
    composite_cards(cv, t, src)
    img = to_image(cv)
    d0, d1, r = DEFOCUS
    if t > d0:
        img = img.filter(ImageFilter.GaussianBlur(r * smooth(prog(t, d0, d1 - d0))))
    return img, hits


def card_covers(t):
    return any(a + 0.5 <= t <= b for a, b in (C.BROLL_A, C.BROLL_B, C.BROLL_C))


def _work(job):
    n, buf = job
    img, hits = render(Image.frombuffer("RGB", (W, H), buf), n / FPS, n)
    return img.tobytes(), (n, hits) if hits and not card_covers(n / FPS) else None


GRADE = "eq=contrast=1.05:saturation=1.04:gamma=0.98,colorbalance=rs=-0.015:bs=0.03:rh=0.015:bh=-0.01"


def main(src_path, out):
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src_path, "-vf", GRADE, "-f", "rawvideo", "-pix_fmt",
                            "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "9",
                            "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
                            "-color_trc", "bt709", out], stdin=subprocess.PIPE)
    n, last, batch, violations = 0, None, [], []
    with Pool(os.cpu_count()) as pool:
        def flush():
            for b, v in pool.map(_work, batch):
                enc.stdin.write(b)
                if v:
                    violations.append(v)
            batch.clear()

        while True:
            buf = dec.stdout.read(W * H * 3)
            if len(buf) < W * H * 3:
                break
            last = buf
            batch.append((n, buf))
            n += 1
            if len(batch) == 16:
                flush()
        for _ in range(HOLD):
            batch.append((n, last))
            n += 1
        flush()
    dec.stdout.close()
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"main: {n} frames; face keep-out violations: {len(violations)}")
    for f, hits in violations[:10]:
        print(f"  frame {f} ({f / FPS:.2f}s): {hits[:3]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
