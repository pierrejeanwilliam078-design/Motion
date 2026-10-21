"""DigitalSub v2 — premium motion edit of the main sequence.

ffmpeg (decode + grade) -> per-frame compositing (worker pool) -> ffmpeg encode.

Layers per frame: face cam (eased punch-ins, vignette) -> scrims -> kinetic
typography / subtitles / glass overlays -> full-screen motion-design B-roll
cards with wipe transitions -> defocus into the end card.
All on-screen words are the speaker's own words (transcript/words.json).
"""
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageFilter

import cues as C
from mg import (_rrect_mask, blend_rgba, ARROW_HEAD, ARROW_UP, BLUE, CHECK, CYAN, DIM, FPS, H, NAVY, NAVY2, VIOLET, W, WHITE,
                Transcript, disc, glass, hline, inout3, inout_expo, out3, out5, out_back, out_expo, prog,
                rrect, rrect_outline, scrim, smooth, stroke_path, text, text_width, to_canvas, to_image,
                vline, window)

HERE = os.path.dirname(os.path.abspath(__file__))
TR = Transcript(os.path.join(HERE, "..", "transcript", "words.json"))
HOLD = 10  # held frames of the last image under the end-card dissolve
X0 = 96    # left margin for editorial layouts
MAXW = W - 2 * X0


def words(s, near):
    return TR.timed(s, near)


def fit(s, weight, size, maxw=MAXW, tracking=0.0):
    while size > 20 and text_width(s, weight, size, tracking) > maxw:
        size -= 2
    return size


def word_in(t, ts, dur=0.26):
    """Standard word entrance: alpha, rise, focus."""
    p = prog(t, ts - 0.05, dur)
    e = out3(p)
    return e, (1 - e) * 18, (1 - p) * 4


def draw_words(cv, t, toks, weight, size, color, x, y, alpha=1.0, anchor="l", colors=None, dur=0.26):
    """Lay out timed tokens on one line, each revealed when spoken."""
    sp = text_width(" ", weight, size)
    widths = [text_width(w, weight, size) for w, _, _ in toks]
    total = sum(widths) + sp * (len(toks) - 1)
    cx = x - {"l": 0, "c": total / 2, "r": total}[anchor]
    for (w, s, _), wd in zip(toks, widths):
        a, dy, bl = word_in(t, s, dur)
        col = (colors or {}).get(w, color)
        text(cv, w, weight, size, col, cx, y + dy, alpha * a, blur=bl)
        cx += wd + sp
    return total


# ------------------------------------------------------------------ face cam
ANCHOR = (520.0, 700.0)
ZOOM = [  # (t0, t1, z0, z1, ease) — moves sit on cuts, cards or pauses
    (0.00, 0.60, 1.16, 1.06, out_expo),   # hook: fast settle
    (0.60, 2.38, 1.06, 1.075, smooth),
    (2.38, 2.62, 1.075, 1.03, inout3),   # punch-out on "Le payant"
    (2.62, 5.50, 1.03, 1.05, smooth),
    (5.50, 13.78, 1.11, 1.11, smooth),    # hidden by the list card
    (13.78, 16.25, 1.11, 1.125, smooth),  # "pas magique": tight
    (16.25, 16.55, 1.125, 1.03, inout3),
    (16.55, 19.60, 1.03, 1.05, smooth),
    (19.60, 25.10, 1.05, 1.07, smooth),
    (25.10, 32.30, 1.09, 1.09, smooth),   # hidden by the split card
    (32.30, 33.40, 1.09, 1.06, out3),
    (33.40, 37.35, 1.06, 1.075, smooth),
    (37.35, 37.60, 1.075, 1.03, inout3),
    (37.60, 40.60, 1.03, 1.04, smooth),
    (40.60, 41.40, 1.04, 1.09, smooth),
]


def zoom_at(t):
    z = ZOOM[0][2]
    for t0, t1, z0, z1, e in ZOOM:
        if t >= t0:
            z = z0 + (z1 - z0) * e(prog(t, t0, t1 - t0))
    return z


def face(src, t):
    z = zoom_at(t)
    px, py = ANCHOR
    k = 1 / z
    img = src.transform((W, H), Image.AFFINE, (k, 0, px * (1 - k), 0, k, py * (1 - k)), Image.BICUBIC)
    return to_canvas(img) * VIGNETTE


_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGNETTE = (1 - 0.28 * np.clip(((_xx - W / 2) / (W * 0.75)) ** 2 + ((_yy - H * 0.45) / (H * 0.62)) ** 2, 0, 1) ** 1.5)[..., None]


def radial(cx, cy, rx, ry):
    return np.exp(-(((_xx - cx) / rx) ** 2 + ((_yy - cy) / ry) ** 2) * 2.0)[..., None]


# ------------------------------------------------------------------ card background
_gy = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
BG = np.asarray(NAVY, np.float32) * (1 - _gy) * 0.9 + np.asarray(NAVY2, np.float32) * np.sin(_gy * np.pi) * 0.8
BG = np.broadcast_to(BG, (H, W, 3)).copy()
grid = ((_xx % 90 < 1.2) | (_yy % 90 < 1.2)).astype(np.float32)[..., None]
BG += grid * 0.022
GLOW_A = radial(W * 0.15, H * 0.22, 700, 600) * np.asarray(VIOLET, np.float32)
GLOW_B = radial(W * 0.95, H * 0.70, 650, 700) * np.asarray(BLUE, np.float32)
NOISE = (np.random.default_rng(3).random((H + 64, W + 64, 1), dtype=np.float32) - 0.5) / 255 * 2.5


def card_bg(t):
    a = 0.14 + 0.04 * np.sin(t * 0.9)
    b = 0.12 + 0.04 * np.cos(t * 0.7)
    o = int(t * FPS * 7) % 64
    return BG + GLOW_A * a + GLOW_B * b + NOISE[o:o + H, o:o + W]


# ------------------------------------------------------------------ subtitles (v2)
SUB_SIZE, SUB_LH, SUB_BOTTOM = 56, 72, 1450
SUBS = [  # (start, end, lines, {keyword: colour}, bold keywords)
    (16.36, 18.42, ["il devient intéressant", "quand tu utilises déjà"], {"intéressant": CYAN}, ()),
    (18.42, 19.48, ["l'outil régulièrement"], {"régulièrement": CYAN}, ()),
    (32.26, 34.64, ["DigitalSub peut t'aider", "à comparer"], {"DigitalSub": CYAN, "comparer": CYAN}, ("DigitalSub",)),
    (34.64, 37.30, ["les options disponibles", "avant de décider."],
     {"avant": VIOLET, "de": VIOLET, "décider.": VIOLET}, ()),
]
SUB_TOKENS = []
for s0, s1, lines, keys, bold in SUBS:
    toks = words(" ".join(lines), s0)
    per, i = [], 0
    for ln in lines:
        n = len(ln.split())
        per.append(toks[i:i + n])
        i += n
    SUB_TOKENS.append(per)


def subtitles(cv, t):
    for (s0, s1, lines, keys, bold), per in zip(SUBS, SUB_TOKENS):
        if not (s0 - 0.05 <= t <= s1 + 0.05):
            continue
        a = window(t, s0, s1, 0.18, 0.16)
        widths = []
        for toks in per:
            ws = [text_width(w, "bold" if w in bold else "semibold", SUB_SIZE) for w, _, _ in toks]
            widths.append(sum(ws) + text_width(" ", "semibold", SUB_SIZE) * (len(ws) - 1))
        pw, ph = max(widths) + 72, len(per) * SUB_LH + 36
        rise = (1 - out3(prog(t, s0, 0.3))) * 14
        px, py = W / 2 - pw / 2, SUB_BOTTOM - ph + rise
        glass(cv, px, py, pw, ph, 26, alpha=a, tint_amt=0.5, blur=14, border=0.08, sheen=0.03)
        for li, toks in enumerate(per):
            base = py + 18 + 54 + li * SUB_LH
            sp = text_width(" ", "semibold", SUB_SIZE)
            x = W / 2 - widths[li] / 2
            for j, (w, ws, we) in enumerate(toks):
                wt = "bold" if w in bold else "semibold"
                ww = text_width(w, wt, SUB_SIZE)
                e, dy, bl = word_in(t, ws, 0.22)
                col = WHITE
                if w in keys:
                    k = out3(prog(t, ws - 0.04, 0.22))
                    col = tuple(WHITE[c] * (1 - k) + keys[w][c] * k for c in range(3))
                    u = out3(prog(t, ws, 0.35))
                    # consecutive keywords share one continuous underline
                    span = ww + (sp if j + 1 < len(toks) and toks[j + 1][0] in keys else 0)
                    hline(cv, x, x + span * u, base + 12, keys[w], a * e * 0.9, 3)
                text(cv, w, wt, SUB_SIZE, col, x, base + dy * 0.6, a * e, blur=bl * 0.6)
                x += ww + sp


# ------------------------------------------------------------------ scenes over face cam
HOOK_W = [words("Tu utilises", 0.0), words("ChatGPT", 0.5), words("gratuitement", 1.1)]


def scene_hook(cv, t):
    t0, t1 = C.HOOK
    if t > t1 + 0.05:
        return
    a = 1 - inout3(prog(t, t1 - 0.25, 0.25))
    up = -24 * inout3(prog(t, t1 - 0.25, 0.25))
    scrim(cv, 820, H, 0.72 * a)
    vline(cv, X0 - 14, 1135 + up, 1135 + up + 345 * out3(prog(t, 0.0, 0.55)), CYAN, a, 4)
    draw_words(cv, t, HOOK_W[0], "medium", 54, WHITE, X0 + 10, 1190 + up, 0.9 * a)
    p = prog(t, 0.55, 0.55)
    text(cv, "ChatGPT", "black", 132, WHITE, X0 + 6, 1330 + up, a * out3(p), scale=1.12 - 0.12 * out_expo(p),
         blur=(1 - p) * 8)
    q = prog(t, 1.14, 0.62)
    text(cv, "gratuitement ?", "bold", 92, CYAN, X0 + 10, 1445 + up, a * out3(prog(t, 1.14, 0.2)),
         tracking=16 * (1 - out5(q)), reveal=out3(q))


PAY_W = [words("Le payant", 2.4), words("n'est intéressant que", 2.8), words("s'il te fait", 3.8),
         words("gagner plus.", 4.3)]


def scene_payant(cv, t):
    t0, t1 = C.PAYANT
    if not (t0 - 0.05 <= t <= t1 + 0.05):
        return
    a = out3(prog(t, t0, 0.2)) * (1 - inout3(prog(t, t1 - 0.25, 0.25)))
    dy = 30 * inout3(prog(t, t1 - 0.25, 0.25))
    scrim(cv, 820, H, 0.72 * a)
    (le, ls, _), (py_, ps, _) = PAY_W[0]
    e, rise, bl = word_in(t, ls)
    text(cv, le, "medium", 60, WHITE, X0, 1170 + dy + rise, a * e, blur=bl)
    p = prog(t, ps - 0.04, 0.5)
    x = X0 + text_width("Le ", "medium", 60)
    text(cv, py_, "bold", 104, VIOLET, x - 40 * (1 - out5(p)), 1170 + dy, a * out3(p), blur=(1 - p) * 6)
    draw_words(cv, t, PAY_W[1], "medium", 54, WHITE, X0, 1255 + dy, 0.9 * a)
    draw_words(cv, t, PAY_W[2], "medium", 54, WHITE, X0, 1325 + dy, 0.9 * a)
    (g, gs, _), (pl, pls, _) = PAY_W[3]
    pg = prog(t, gs - 0.04, 0.45)
    text(cv, g, "black", 118, WHITE, X0, 1450 + dy, a * out3(pg), scale=0.86 + 0.14 * out_back(pg), blur=(1 - pg) * 5)
    gx = X0 + text_width(g + " ", "black", 118)
    pp = prog(t, pls - 0.04, 0.45)
    text(cv, pl, "black", 118, CYAN, gx, 1450 + dy, a * out3(pp), scale=0.86 + 0.14 * out_back(pp), blur=(1 - pp) * 5)
    ax = gx + text_width(pl, "black", 118) + 18
    arrow = out3(prog(t, pls + 0.12, 0.4))
    stroke_path(cv, ARROW_UP, arrow, CYAN, ax, 1450 + dy - 92, 74, 7, a)
    stroke_path(cv, ARROW_HEAD, out3(prog(t, pls + 0.32, 0.3)), CYAN, ax, 1450 + dy - 92, 74, 7, a)


MAG_W = [words("Mais un abonnement payant", 13.8), words("n'est pas", 15.0), words("magique.", 15.3)]


def scene_magique(cv, t):
    t0, t1 = C.MAGIQUE
    if not (t0 - 0.05 <= t <= t1 + 0.05):
        return
    a = out3(prog(t, t0, 0.2)) * (1 - inout3(prog(t, t1 - 0.28, 0.28)))
    sc = 1 - 0.03 * inout3(prog(t, t1 - 0.28, 0.28))
    scrim(cv, 820, H, 0.75 * a)
    draw_words(cv, t, MAG_W[0], "medium", 52, WHITE, W / 2, 1210, 0.9 * a, anchor="c", colors={"payant": VIOLET})
    draw_words(cv, t, MAG_W[1], "bold", 80, WHITE, W / 2, 1305, a, anchor="c")
    (m, ms, _), = MAG_W[2]
    p = prog(t, ms - 0.04, 0.7)
    size = 140
    text(cv, m, "black", size, WHITE, W / 2, 1455, a * out3(prog(t, ms - 0.04, 0.25)), anchor="c",
         tracking=34 * (1 - out5(p)), scale=sc, blur=(1 - out3(p)) * 6)
    u = out3(prog(t, ms + 0.18, 0.55))
    half = text_width(m, "black", size) / 2 * u
    hline(cv, W / 2 - half, W / 2 + half, 1482, CYAN, a, 5, color2=VIOLET)


FOR_W = [words("et que les capacités", 19.5), words("supplémentaires", 20.8), words("disponibles dans la formule", 21.5),
         words("répondent à", 22.9), words("un vrai besoin.", 23.9)]


def scene_formule(cv, t):
    t0, t1 = C.FORMULE
    if not (t0 - 0.05 <= t <= t1 + 0.05):
        return
    a = out3(prog(t, t0, 0.4)) * (1 - inout3(prog(t, t1 - 0.3, 0.3)))
    dy = 70 * (1 - out5(prog(t, t0, 0.55))) + 40 * inout3(prog(t, t1 - 0.3, 0.3))
    x, y, w, h = 66, 830 + dy, W - 132, 630
    glass(cv, x, y, w, h, 44, alpha=a, tint_amt=0.66, blur=22, border=0.14)
    hline(cv, x + 44, x + 44 + (w - 88) * out3(prog(t, t0 + 0.2, 0.6)), y, CYAN, a * 0.9, 2, color2=VIOLET)
    lx = x + 60
    draw_words(cv, t, FOR_W[0], "medium", 44, WHITE, lx, y + 95, 0.85 * a)
    (s, ss, _), = FOR_W[1]
    p = prog(t, ss - 0.04, 0.6)
    size = fit(s, "bold", 82, w - 120)
    text(cv, s, "bold", size, VIOLET, lx, y + 190, a * out3(prog(t, ss - 0.04, 0.2)), tracking=12 * (1 - out5(p)),
         reveal=out3(p))
    draw_words(cv, t, FOR_W[2], "medium", 44, WHITE, lx, y + 262, 0.85 * a)
    for i, (frac, tb) in enumerate(((0.86, 21.70), (0.62, 21.85), (0.74, 22.00))):
        by = y + 312 + i * 36
        ap = out3(prog(t, tb - 0.1, 0.25))
        disc(cv, lx + 6, by + 5, 12, CYAN, a * ap)
        hline(cv, lx + 26, lx + 26 + (w - 150), by, WHITE, a * ap * 0.07, 10)
        hline(cv, lx + 26, lx + 26 + (w - 150) * frac * out5(prog(t, tb, 0.7)), by, VIOLET, a * ap * 0.85, 10,
              color2=CYAN)
    draw_words(cv, t, FOR_W[3], "medium", 44, WHITE, lx, y + 470, 0.85 * a)
    draw_words(cv, t, FOR_W[4], "bold", 80, CYAN, lx, y + 565, a)
    cp = prog(t, 24.32, 0.45)
    cx, cy = x + w - 120, y + 520
    if cp > 0:
        r = 92 * (0.8 + 0.2 * out_back(cp))
        disc(cv, cx, cy, r, CYAN, a * 0.16 * out3(cp))
        rrect_outline(cv, cx - r / 2, cy - r / 2, r, r, r / 2, CYAN, a * out3(cp), 3)
        stroke_path(cv, CHECK, out3(prog(t, 24.42, 0.35)), WHITE, cx - 46, cy - 46, 92, 7, a)


OPT_SCAN = (35.10, 35.95)


def scene_options(cv, t):
    t0, t1 = C.OPTIONS
    if not (t0 - 0.05 <= t <= t1 + 0.05):
        return
    out = inout3(prog(t, t1 - 0.3, 0.3))
    cw, ch, gap = 268, 196, 29
    x0 = W / 2 - (3 * cw + 2 * gap) / 2
    pick = out3(prog(t, 36.36, 0.35))
    for i in range(3):
        p = prog(t, t0 + 0.04 + i * 0.1, 0.5)
        a = out3(p) * (1 - out)
        x, y = x0 + i * (cw + gap), 1015 + 50 * (1 - out5(p)) + 30 * out
        dim = 1 - 0.45 * pick * (i != 1)
        glass(cv, x, y, cw, ch, 28, alpha=a * dim, tint_amt=0.6, blur=16, border=0.12)
        disc(cv, x + 44, y + 46, 28, (CYAN, VIOLET, BLUE)[i], a * dim * 0.9)
        hline(cv, x + 72, x + 72 + 120, y + 40, WHITE, a * dim * 0.55, 8)
        hline(cv, x + 72, x + 72 + 76, y + 58, WHITE, a * dim * 0.22, 6)
        for k, fr in enumerate(((0.8, 0.55, 0.7), (0.6, 0.85, 0.5), (0.7, 0.45, 0.9))[i]):
            hline(cv, x + 30, x + 30 + (cw - 60) * fr * out5(prog(t, t0 + 0.3 + i * 0.1 + k * 0.06, 0.6)),
                  y + 104 + k * 28, WHITE, a * dim * 0.16, 8)
        # comparison scan highlight
        sp = prog(t, *OPT_SCAN) * 3 - i
        scan = max(0.0, 1 - abs(sp - 0.5) * 2) if 0 <= sp <= 1 else 0.0
        hi = max(scan * 0.8, pick if i == 1 else 0.0)
        if hi > 0:
            rrect_outline(cv, x, y, cw, ch, 28, CYAN, a * hi, 3)
        if i == 1 and pick > 0:
            cx, cy = x + cw - 40, y + 40
            disc(cv, cx, cy, 46 * (0.7 + 0.3 * out_back(pick)), CYAN, a * pick)
            stroke_path(cv, CHECK, out3(prog(t, 36.45, 0.3)), NAVY, cx - 21, cy - 21, 42, 5, a)


CTA_W = [words("Écris", 37.4), words("si tu veux connaître l'offre disponible.", 38.6)]


def scene_cta(cv, t):
    t0, t1 = C.CTA
    if not (t0 - 0.05 <= t <= t1 + 0.05):
        return
    a = out3(prog(t, t0, 0.35)) * (1 - inout3(prog(t, t1 - 0.3, 0.3)))
    dy = 60 * (1 - out5(prog(t, t0, 0.5)))
    x, y, w, h = 66, 1050 + dy, W - 132, 400
    glass(cv, x, y, w, h, 44, alpha=a, tint_amt=0.62, blur=22, border=0.14)
    hline(cv, x + 44, x + 44 + (w - 88) * out3(prog(t, t0 + 0.15, 0.6)), y, CYAN, a * 0.9, 2, color2=VIOLET)
    lx = x + 60
    draw_words(cv, t, CTA_W[0], "bold", 62, WHITE, lx, y + 100, a)
    # comment field with the word typed in
    fx, fy, fw, fh = lx, y + 135, w - 120, 112
    focus = out3(prog(t, 37.75, 0.3))
    rrect(cv, fx, fy, fw, fh, fh / 2, WHITE, a * 0.07)
    rrect_outline(cv, fx, fy, fw, fh, fh / 2, WHITE, a * 0.18 * (1 - focus), 2)
    rrect_outline(cv, fx, fy, fw, fh, fh / 2, CYAN, a * 0.85 * focus, 2)
    n = int(np.clip((t - C.TYPE_START) / C.TYPE_STEP + 1, 0, 7))
    typed = "ChatGPT"[:n]
    tx = fx + 44
    text(cv, typed, "semibold", 58, WHITE, tx, fy + 76, a)
    caret_x = tx + (text_width(typed, "semibold", 58) + 6 if typed else 0)
    blink = 1.0 if (t - 37.75) % 0.9 < 0.55 or C.TYPE_START <= t <= C.SEND_AT else 0.0
    if t > 37.75:
        vline(cv, caret_x, fy + 30, fy + 84, CYAN, a * blink * focus, 3)
    # send button
    bp = prog(t, C.SEND_AT, 0.45)
    bx, by = fx + fw - 62, fy + fh / 2
    pulse = 1 + 0.16 * np.sin(np.pi * clamp01(bp)) if bp > 0 else 1.0
    ready = out3(prog(t, C.SEND_AT - 0.25, 0.25))
    disc(cv, bx, by, 80 * pulse, CYAN, a * (0.35 + 0.65 * ready))
    stroke_path(cv, ARROW_UP, 1.0, NAVY, bx - 22, by - 22, 44, 5, a)
    stroke_path(cv, ARROW_HEAD, 1.0, NAVY, bx - 22, by - 22, 44, 5, a)
    if 0 < bp < 1:
        r = 80 + 90 * out3(bp)
        rrect_outline(cv, bx - r / 2, by - r / 2, r, r, r / 2, CYAN, a * (1 - bp) * 0.8, 2)
    size = fit("si tu veux connaître l'offre disponible.", "medium", 44, w - 120)
    draw_words(cv, t, CTA_W[1], "medium", size, WHITE, lx, y + 330, 0.88 * a)


def clamp01(x):
    return min(max(x, 0.0), 1.0)


# ------------------------------------------------------------------ full-screen cards
LIST_HEAD = words("ChatGPT peut t'aider à", 5.7)
LIST = [("Rédiger", ""), ("Structurer", "des idées"), ("Analyser", "des informations"), ("Préparer", "un plan"),
        ("Accélérer", "certaines tâches")]
LIST_SUB = [[]] + [words(c, n) for (_, c), n in zip(LIST[1:], (8.3, 9.7, 11.3, 12.4))]
PIP = (734, 150, 252, 316)
PIP_CROP = (270, 150, 770, 775)


def card_list(t, src):
    cv = card_bg(t)
    t_in = C.LIST_IN
    hline(cv, X0, X0 + 44 * out3(prog(t, t_in + 0.35, 0.4)), 400, CYAN, 1.0, 4)
    draw_words(cv, t, LIST_HEAD, "medium", 52, WHITE, X0, 476, 0.8)
    # presenter picture-in-picture keeps the voice on screen
    pp = prog(t, t_in + 0.45, 0.5)
    if pp > 0:
        x, y, w, h = PIP
        s = 0.9 + 0.1 * out_back(pp)
        ww, hh = round(w * s), round(h * s)
        img = to_canvas(src.crop(PIP_CROP).resize((ww, hh), Image.BICUBIC))
        spr = np.concatenate([img, _rrect_mask(ww, hh, 30)[..., None]], 2)
        ox, oy = round(x + (w - ww) / 2), round(y + (h - hh) / 2)
        blend_rgba(cv, spr, ox, oy, out3(pp))
        rrect_outline(cv, ox, oy, ww, hh, 30, CYAN, out3(pp) * 0.7, 3)
    for i, ((kw, comp), tk) in enumerate(zip(LIST, C.LIST_ITEMS)):
        top = 590 + i * 182
        p = prog(t, tk - 0.08, 0.5)
        if p <= 0:
            continue
        nxt = C.LIST_ITEMS[i + 1] if i + 1 < len(LIST) else 99
        active = 1 - out3(prog(t, nxt - 0.05, 0.3))
        recap = out3(prog(t, 12.85 + i * 0.05, 0.3))
        lum = max(0.38 + 0.62 * active, recap)
        e = out3(p)
        text(cv, f"0{i + 1}", "medium", 30, CYAN, X0, top + 42, e * lum, tracking=2)
        text(cv, kw, "bold", 96, WHITE, 180 + 50 * (1 - out5(p)), top + 88, e * lum,
             tracking=12 * (1 - out5(p)), blur=(1 - p) * 6)
        if LIST_SUB[i]:
            draw_words(cv, t, LIST_SUB[i], "medium", 46, DIM, 183, top + 146, lum)
        bar = out3(prog(t, tk, 0.35)) * active
        vline(cv, 156, top + 22, top + 22 + 132 * bar, CYAN, bar, 3)
        hline(cv, X0, X0 + MAXW * out5(prog(t, tk, 0.8)), top + 174, WHITE, 0.10, 1)
    return cv


TOP_W = [words("Un entrepreneur", 25.4), words("qui travaille avec l'IA", 25.9), words("chaque jour", 27.3)]
MID_W = words("n'a pas la même utilisation", 27.9)
BOT_W = [words("qu'une personne", 29.5), words("qui pose", 30.1), words("deux questions par mois.", 30.6)]
CAL = (7, 4, 58, 18)  # cols, rows, cell, gap
LIT_BOTTOM = {(1, 3): 30.95, (2, 5): 31.30}
MID = 885  # split line of the comparison card


def calendar(cv, t, top, t_show, lit_all_at=None, lit=None, color=CYAN):
    cols, rows, cell, gap = CAL
    w = cols * cell + (cols - 1) * gap
    x0 = W / 2 - w / 2
    for r in range(rows):
        for c in range(cols):
            k = r * cols + c
            x, y = x0 + c * (cell + gap), top + r * (cell + gap)
            ap = out3(prog(t, t_show + k * 0.012, 0.3))
            rrect_outline(cv, x, y, cell, cell, 12, WHITE, 0.16 * ap, 2)
            tl = None
            if lit_all_at is not None:
                tl = lit_all_at + k * 0.027
            elif lit and (r, c) in lit:
                tl = lit[(r, c)]
            if tl is not None and t >= tl:
                q = prog(t, tl, 0.3)
                s = cell * (0.6 + 0.4 * out_back(q))
                rrect(cv, x + (cell - s) / 2, y + (cell - s) / 2, s, s, 12, color, 0.92 * out3(q))


def card_compare(t):
    cv = card_bg(t + 3)
    cx = W / 2
    draw_words(cv, t, TOP_W[0], "bold", 92, WHITE, cx, 290, anchor="c")
    draw_words(cv, t, TOP_W[1], "medium", 50, DIM, cx, 368, anchor="c")
    draw_words(cv, t, TOP_W[2], "bold", 92, CYAN, cx, 470, anchor="c")
    calendar(cv, t, 520, 25.6, lit_all_at=27.32, color=CYAN)
    # divider + badge
    dp = out5(prog(t, 27.95, 0.7))
    hline(cv, cx - (MAXW / 2) * dp, cx + (MAXW / 2) * dp, MID - 1, CYAN, 0.8, 2, color2=VIOLET)
    bp = prog(t, 28.0, 0.45)
    if bp > 0:
        d = 92 * (0.6 + 0.4 * out_back(bp))
        disc(cv, cx, MID, d, NAVY, out3(bp))
        rrect_outline(cv, cx - d / 2, MID - d / 2, d, d, d / 2, WHITE, 0.35 * out3(bp), 2)
        text(cv, "≠", "bold", 56, WHITE, cx, MID + 20, out3(bp), anchor="c")
    draw_words(cv, t, MID_W, "medium", 46, WHITE, cx, 972, 0.85, anchor="c")
    draw_words(cv, t, BOT_W[0], "bold", 92, WHITE, cx, 1085, anchor="c")
    draw_words(cv, t, BOT_W[1], "medium", 50, DIM, cx, 1150, anchor="c")
    size = fit("deux questions par mois.", "bold", 80)
    draw_words(cv, t, BOT_W[2], "bold", size, VIOLET, cx, 1245, anchor="c")
    calendar(cv, t, 1280, 29.8, lit=LIT_BOTTOM, color=VIOLET)
    return cv


def composite_cards(cv, t, src):
    # list card: wipe up in, slide up out
    if C.LIST_IN <= t <= C.LIST_OUT + 0.5:
        card = card_list(t, src)
        e_in = inout_expo(prog(t, C.LIST_IN, 0.5))
        e_out = inout_expo(prog(t, C.LIST_OUT, 0.46))
        if e_out > 0:
            off = int(H * e_out)
            if off < H:
                cv[:H - off] = card[off:]
                hline(cv, 0, W, H - off - 2, CYAN, 1.0, 3, color2=VIOLET)
        else:
            edge = int(H * (1 - e_in))
            cv[edge:] = card[edge:]
            if edge > 0:
                hline(cv, 0, W, edge, CYAN, 1.0, 3, color2=VIOLET)
    # comparison card: wipe in from the right, split open to reveal the face
    if C.COMPARE_IN <= t <= C.COMPARE_OUT + 0.5:
        card = card_compare(t)
        e_in = inout_expo(prog(t, C.COMPARE_IN, 0.5))
        e_out = inout_expo(prog(t, C.COMPARE_OUT, 0.45))
        mid = MID
        if e_out > 0:
            up, dn = int(mid * e_out), int((H - mid) * e_out)
            if up < mid:
                cv[:mid - up] = card[up:mid]
                hline(cv, 0, W, mid - up - 2, CYAN, 1.0, 2, color2=VIOLET)
            if dn < H - mid:
                cv[mid + dn:] = card[mid:H - dn]
                hline(cv, 0, W, mid + dn, VIOLET, 1.0, 2, color2=CYAN)
        else:
            edge = int(W * (1 - e_in))
            cv[:, edge:] = card[:, edge:]
            if edge > 0:
                vline(cv, edge, 0, H, CYAN, 1.0, 3)


# ------------------------------------------------------------------ frame
DEFOCUS = (40.85, 41.40, 14.0)


def render(src, t):
    cv = face(src, t)
    scene_hook(cv, t)
    scene_payant(cv, t)
    scene_magique(cv, t)
    scene_formule(cv, t)
    scene_options(cv, t)
    subtitles(cv, t)
    scene_cta(cv, t)
    composite_cards(cv, t, src)
    img = to_image(cv)
    d0, d1, r = DEFOCUS
    if t > d0:
        img = img.filter(ImageFilter.GaussianBlur(r * smooth(prog(t, d0, d1 - d0))))
    return img


def _work(job):
    n, buf = job
    src = Image.frombuffer("RGB", (W, H), buf)
    return render(src, n / FPS).tobytes()


GRADE = "eq=contrast=1.04:saturation=1.05:gamma=0.985,colorbalance=rs=-0.01:bs=0.03:rh=0.012:bh=-0.005"


def main(src_path, out, start=None, end=None):
    ss = ["-ss", str(start)] if start else []
    dec = subprocess.Popen(["ffmpeg", "-v", "error", *ss, "-i", src_path, "-vf", GRADE, "-f", "rawvideo",
                            "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "9",
                            "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709",
                            "-color_trc", "bt709", out], stdin=subprocess.PIPE)
    first = round((start or 0) * FPS)
    last_n = round(end * FPS) if end else None
    n, last, batch = first, None, []
    with Pool(os.cpu_count()) as pool:
        def flush():
            for b in pool.map(_work, batch):
                enc.stdin.write(b)
            batch.clear()

        while last_n is None or n < last_n:
            buf = dec.stdout.read(W * H * 3)
            if len(buf) < W * H * 3:
                break
            last = buf
            batch.append((n, buf))
            n += 1
            if len(batch) == 16:
                flush()
        if last_n is None:
            for _ in range(HOLD):
                batch.append((n, last))
                n += 1
        flush()
    dec.stdout.close()
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"main: {n - first} frames")


if __name__ == "__main__":
    a = sys.argv[1:]
    main(a[0], a[1], *(float(x) for x in a[2:4]))
