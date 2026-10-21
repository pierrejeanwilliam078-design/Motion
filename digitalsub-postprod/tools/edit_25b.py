"""DigitalSub video 25 — version II: flat, light, graphic 2D motion design.

The speaker sits in a morphing window (full frame → card → circle → badge) on a paper canvas;
violet / cyan / navy colour blocks wipe in for the key moments. Typography is Inter Display
(Black + Medium) with highlighter blocks, pills, timelines, a scribble that straightens and a
slot-machine word roll. The window frames the tracked face; type only lives on the canvas.
"""
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import cues25b as C
import mg
from mg import (FPS, H, W, _rrect_mask, blend_mask, blend_rgba, clamp, disc, hline, icon, inout3, inout_expo,
                out3, out5, out_back, prog, rgb, rrect, rrect_outline, text, text_width, to_canvas,
                to_image, vline)
from v25data import KEEP, words

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
END = 51.25

PAPER = rgb("#F4F5FA")
INK = rgb("#0B1030")
VIO = rgb("#7C3AED")
CYA = rgb("#22D3EE")
LILAC = rgb("#E6DEFF")
NAVYBG = rgb("#0A0F2C")
WHITE = (1.0, 1.0, 1.0)
COLORS = {"paper": PAPER, "violet": VIO, "cyan": CYA, "navy": NAVYBG}
X0 = 96


def mixc(a, b, k):
    return tuple(a[i] + (b[i] - a[i]) * k for i in range(3))


# ------------------------------------------------------------------ canvas
_yy, _xx = np.mgrid[0:H, 0:W]
DOTS = (((_xx % 46) - 23) ** 2 + ((_yy % 46) - 23) ** 2 <= 4).astype(np.float32)[..., None]


def canvas(t):
    """Current canvas colour; a new colour block wipes up from the bottom (0.5 s)."""
    cur = prev = C.CANVAS[0]
    for c in C.CANVAS:
        if t >= c[0]:
            prev, cur = cur, c
    t0, name = cur
    col = np.asarray(COLORS[name], np.float32)
    cv = np.empty((H, W, 3), np.float32)
    cv[:] = col
    e = inout_expo(prog(t, t0, 0.5))
    if e < 1 and prev is not cur:
        edge = int(H * (1 - e))
        cv[:edge] = np.asarray(COLORS[prev[1]], np.float32)
    if name == "paper" and cv[H - 1, W - 1, 0] > 0.9:  # ambient shape: big lilac disc low right, drifting
        disc(cv, 990 + 30 * np.sin(t * 0.35), 1830 + 20 * np.cos(t * 0.3), 760, LILAC, 0.7)
        disc(cv, 120, 1700 + 15 * np.sin(t * 0.5), 70, VIO, 0.18)
    dot_col = np.asarray(INK if name == "paper" else WHITE, np.float32)
    k = 0.06 if name == "paper" else 0.12
    cv += (dot_col - cv) * DOTS * k
    return cv, name


# ------------------------------------------------------------------ morphing face window
_fc = np.array([((b[0] + b[2]) / 2, b[1] + (b[3] - b[1]) / 1.75 * 0.95) for b in KEEP], np.float32)
_k = np.ones(25) / 25
FACE_C = np.stack([np.convolve(np.pad(_fc[:, j], 12, mode="edge"), _k, "valid") for j in range(2)], 1)

# name: (x, y, w, h, radius, scale, face target x, face target y)
SHAPES = {
    "top":    (48, 110, W - 96, 960, 56, 0.92, W / 2, 110 + 960 * 0.42),
    "circle": (231, 190, 620, 620, 310, 0.82, W / 2, 520),
    "center": (221, 340, 640, 640, 320, 0.85, W / 2, 680),
    "badge":  (65, 175, 250, 250, 125, 0.36, 190, 305),
    "corner": (740, 1300, 260, 260, 130, 0.37, 870, 1435),
    "half":   (48, 110, W - 96, 820, 56, 0.86, W / 2, 110 + 820 * 0.45),
    "gone":   (541, 860, 0, 0, 0, 0.30, 541, 860),
}


def shape_params(name, n):
    if name == "full":
        return (0.0, 0.0, float(W), float(H), 0.0, 1.0, 0.0, 0.0)
    x, y, w, h, r, s, tx, ty = SHAPES[name]
    fx, fy = FACE_C[min(n, len(FACE_C) - 1)]
    ox, oy = tx - fx * s, ty - fy * s
    if W * s >= w:  # keep the window fully covered by footage
        ox = min(max(ox, x + w - W * s), x)
    if H * s >= h:
        oy = min(max(oy, y + h - H * s), y)
    return (float(x), float(y), float(w), float(h), float(r), s, ox, oy)


def window(t, n):
    cur, prev = C.LAYOUT[0], C.LAYOUT[0]
    for L in C.LAYOUT:
        if t >= L[0]:
            prev, cur = cur, L
    t0, d, name = cur
    b = shape_params(name, n)
    if d <= 0 or t >= t0 + d:
        return b, name
    a = shape_params(prev[2], n)
    e = inout_expo(prog(t, t0, d))
    return tuple(a[i] + (b[i] - a[i]) * e for i in range(8)), name


def draw_window(cv, src, p, ring):
    x, y, w, h, r, s, ox, oy = p
    xi, yi, wi, hi = int(round(x)), int(round(y)), int(round(w)), int(round(h))
    if wi < 4 or hi < 4:
        return
    if wi < W or hi < H:  # soft drop shadow under the window
        sw, sh = max(2, wi // 4 + 12), max(2, hi // 4 + 12)
        m = Image.new("L", (sw, sh), 0)
        ImageDraw.Draw(m).rounded_rectangle((6, 6, sw - 7, sh - 7), max(0, r / 4), fill=255)
        m = m.filter(ImageFilter.GaussianBlur(5)).resize((sw * 4, sh * 4), Image.BILINEAR)
        blend_mask(cv, np.asarray(m, np.float32) / 255, INK, xi - 24, yi - 24 + 22, 0.22)
    win = src.transform((wi, hi), Image.AFFINE, (1 / s, 0, (xi - ox) / s, 0, 1 / s, (yi - oy) / s), Image.BICUBIC)
    spr = np.concatenate([to_canvas(win), _rrect_mask(wi, hi, int(min(r, wi // 2, hi // 2)))[..., None]], 2)
    blend_rgba(cv, spr, xi, yi)
    if ring and r > 0:
        rrect_outline(cv, xi - 7, yi - 7, wi + 14, hi + 14, int(r) + 7, WHITE, 1.0, 7)


def face_on_screen(p, n):
    """Visible face box on screen (inside the window) — the keep-out for type."""
    x, y, w, h, r, s, ox, oy = p
    k0, k1, k2, k3 = KEEP[min(n, len(KEEP) - 1)]
    fw, fh = (k2 - k0) / 1.5, (k3 - k1) / 1.75
    fx0, fy0 = k0 + 0.25 * fw, k1 + 0.45 * fh
    bx0, by0, bx1, by1 = ox + fx0 * s, oy + fy0 * s, ox + (fx0 + fw) * s, oy + (fy0 + fh) * s
    return max(bx0, x), max(by0, y), min(bx1, x + w), min(by1, y + h)


# ------------------------------------------------------------------ graphic helpers
def mg_fit(s, weight, size, maxw, tracking=0.0):
    while size > 20 and text_width(s, weight, size, tracking) > maxw:
        size -= 2
    return size


def pop_word(cv, t, s, weight, size, color, x, base, t0, alpha=1.0, anchor="l", tracking=0.0):
    p = prog(t, t0 - 0.04, 0.32)
    if p <= 0:
        return
    text(cv, s, weight, size, color, x, base + (1 - out3(p)) * 22, alpha * min(1.0, p * 3), anchor=anchor,
         scale=0.9 + 0.1 * out_back(p, 1.8), tracking=tracking)


def line_words(cv, t, toks, weight, size, color, x, base, alpha=1.0, anchor="l", earliest=0.0, colors=None):
    sp = text_width(" ", weight, size)
    wd = [text_width(w, weight, size) for w, _, _ in toks]
    total = sum(wd) + sp * (len(toks) - 1)
    cx = x - {"l": 0, "c": total / 2}[anchor]
    for (w, s, _), ww in zip(toks, wd):
        pop_word(cv, t, w, weight, size, (colors or {}).get(w, color), cx, base, max(s, earliest), alpha)
        cx += ww + sp
    return total


def marker(cv, t, x, base, w, size, t0, color, alpha=1.0, pad=18):
    """Highlighter block behind a word, swept left to right."""
    e = out5(prog(t, t0 - 0.06, 0.35))
    if e > 0:
        rrect(cv, x - pad, base - size * 0.80, (w + 2 * pad) * e, size * 0.98, 14, color, alpha)


def pill(cv, t, label, cx, cy, t0, fill, ink, outline=None, size=66, h=136, alpha=1.0):
    p = prog(t, t0 - 0.05, 0.45)
    if p <= 0:
        return
    sc = 0.4 + 0.6 * out_back(p, 2.2)
    tw = text_width(label, "black", size)
    w, hh = (tw + 84) * sc, h * sc
    a = alpha * min(1.0, p * 4)
    if fill is not None:
        rrect(cv, cx - w / 2, cy - hh / 2, w, hh, hh / 2, fill, a)
    if outline is not None:
        rrect_outline(cv, cx - w / 2, cy - hh / 2, w, hh, hh / 2, outline, a, 5)
    text(cv, label, "black", size, ink, cx, cy + size * 0.36 * sc, a, anchor="c", scale=sc, tracking=-1)


def polyline(cv, pts, color, width, alpha=1.0):
    if len(pts) < 2 or alpha <= 0:
        return
    ss = 2
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    bx, by = int(min(xs) - width), int(min(ys) - width)
    w, h = int(max(xs) - bx + width + 2), int(max(ys) - by + width + 2)
    img = Image.new("L", (w * ss, h * ss), 0)
    d = ImageDraw.Draw(img)
    q = [((px - bx) * ss, (py - by) * ss) for px, py in pts]
    d.line(q, fill=255, width=int(width * ss), joint="curve")
    r = width * ss / 2
    for px, py in (q[0], q[-1]):
        d.ellipse((px - r, py - r, px + r, py + r), fill=255)
    blend_mask(cv, np.asarray(img.resize((w, h), Image.LANCZOS), np.float32) / 255, color, bx, by, alpha)


def cursor(cv, x, y, sc=1.0, alpha=1.0):
    ss = 3
    S = int(90 * sc)
    img = Image.new("L", (S * ss, S * ss), 0)
    pts = [(0.08, 0.04), (0.08, 0.82), (0.30, 0.62), (0.46, 0.96), (0.60, 0.90), (0.44, 0.56), (0.72, 0.56)]
    ImageDraw.Draw(img).polygon([(u * S * ss, v * S * ss) for u, v in pts], fill=255)
    m = np.asarray(img.resize((S, S), Image.LANCZOS), np.float32) / 255
    outline = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)), np.float32) / 255
    blend_mask(cv, outline, INK, int(x), int(y), alpha)
    blend_mask(cv, m, WHITE, int(x), int(y), alpha)


# ------------------------------------------------------------------ sections
HK = dict(a=words("Tu veux un abonnement digital", 0.0), b=words("sans te compliquer la vie", 1.3))


def sec_hook(cv, t):
    if t > 2.75:
        return
    a = 1 - inout3(prog(t, 2.50, 0.2))
    toks = HK["a"]
    line_words(cv, t, toks[:3], "medium", 56, INK, X0, 1170, a, earliest=0.66)
    pop_word(cv, t, "abonnement", "black", 150, INK, X0 - 4, 1300, max(toks[3][1], 0.68), a, tracking=-4)
    w = text_width("digital", "black", 150, -4)
    marker(cv, t, X0, 1430, w, 150, max(toks[4][1], 0.86), VIO, a)
    pop_word(cv, t, "digital", "black", 150, WHITE, X0, 1430, max(toks[4][1], 0.86), a, tracking=-4)
    x = X0
    for wd, s, _ in HK["b"]:
        col = INK
        if wd == "compliquer":
            marker(cv, t, x, 1545, text_width(wd, "bold", 50), 50, s, CYA, a, pad=8)
        pop_word(cv, t, wd, "bold", 50, col, x, 1545, s, a)
        x += text_width(wd + " ", "bold", 50)
    p = prog(t, 0.95, 0.5)
    if p > 0:
        disc(cv, 1000, 128, 190 * out_back(p, 2.0), VIO, a)
        disc(cv, 1060, 250, 46 * out_back(prog(t, 1.1, 0.4), 2.0), CYA, a)


SV = words("Tu veux", 3.9)
PILL_STYLE = [(VIO, WHITE, None), (INK, WHITE, None), (CYA, INK, None), (PAPER, INK, INK), (LILAC, INK, VIO)]
PILL_POS = [(320, 1010), (770, 1010), (290, 1175), (740, 1175), (541, 1340)]


def sec_services(cv, t):
    if not (2.9 <= t <= 9.6):
        return
    a = 1 - inout3(prog(t, 9.25, 0.3))
    line_words(cv, t, SV, "medium", 58, INK, W / 2, 900, a, anchor="c")
    for (label, t0), (fill, ink, outl), (cx, cy) in zip(C.PILLS, PILL_STYLE, PILL_POS):
        bob = 6 * np.sin(t * 2.2 + cx * 0.01)
        pill(cv, t, label, cx, cy + bob, t0, fill, ink, outl, alpha=a)


FR = dict(e=words("entre le choix de", 9.3), w=words("la formule, le paiement et l'activation,", 10.0),
          tp=words("tu perds du temps", 12.5))
SCRIB_A = [(160, 1215), (420, 1180), (700, 1240), (930, 1200), (700, 1330), (420, 1300), (300, 1420), (560, 1460),
           (880, 1430)]


def scribble_pts(anchor_pts, u_end, wobble=34, seed=0, k_straight=0.0, y_line=900, x0=130, x1=950):
    """Smooth tangled path through anchors (+loops); k_straight morphs it into a straight line."""
    pts = []
    n = 220
    A = np.array(anchor_pts, np.float32)
    for i in range(n):
        u = i / (n - 1)
        if u > u_end:
            break
        f = u * (len(A) - 1)
        j = min(int(f), len(A) - 2)
        fr = f - j
        base = A[j] * (1 - fr) + A[j + 1] * fr
        loop = np.array([np.sin(u * 47 + seed), np.cos(u * 41 + seed * 2)]) * wobble
        p = base + loop
        straight = np.array([x0 + (x1 - x0) * u, y_line])
        pts.append(tuple(p * (1 - k_straight) + straight * k_straight))
    return pts


def sec_friction(cv, t):
    if not (9.3 <= t <= 13.4):
        return
    a = out3(prog(t, 9.35, 0.2)) * (1 - inout3(prog(t, 13.10, 0.22)))
    A = 1 - inout3(prog(t, 12.50, 0.25))
    line_words(cv, t, FR["e"], "medium", 52, INK, X0, 1135, a * A)
    polyline(cv, scribble_pts(SCRIB_A, out3(prog(t, 9.9, 2.0)), seed=1), VIO, 8, 0.55 * a * A)
    w = FR["w"]
    for (word, s, _), (x, y) in zip((w[1], w[3], w[5]), ((X0, 1260), (560, 1300), (300, 1450))):
        label = word.strip(",").replace("l'", "")
        pop_word(cv, t, label, "black", 92, INK, x, y, s, a * A, tracking=-3)
    tp = FR["tp"]
    if t >= tp[0][1] - 0.1:
        line_words(cv, t, tp[:2], "medium", 60, INK, X0, 1250, a)
        pop_word(cv, t, "du temps ?", "black", 140, VIO, X0 - 4, 1420, tp[2][1], a, tracking=-4)
        p = prog(t, tp[0][1], 0.3)
        if p > 0:
            cx, cy, R = 930, 1370, 70 * out_back(p, 2)
            rrect_outline(cv, cx - R, cy - R, 2 * R, 2 * R, R, INK, a, 8)
            ang = t * 9
            polyline(cv, [(cx, cy), (cx + 0.75 * R * np.sin(ang), cy - 0.75 * R * np.cos(ang))], INK, 8, a)
            polyline(cv, [(cx, cy), (cx + 0.5 * R * np.sin(ang / 12), cy - 0.5 * R * np.cos(ang / 12))], INK, 8, a)


IM = dict(d=words("DigitalSub", 14.0), s=words("simplifie", 14.8), c=words("ce parcours.", 15.5))


def sec_impact(cv, t):
    if not (13.3 <= t <= 16.6):
        return
    a = 1 - inout3(prog(t, 16.30, 0.2))
    mg.TRACK[0] = False  # ripple rings sit outside the round window by construction (R ≥ its radius)
    for k, t0 in enumerate((13.35, 14.16)):
        q = prog(t, t0, 0.9)
        if 0 < q < 1:
            R = 330 + 220 * out3(q)
            rrect_outline(cv, W / 2 - R, 660 - R, 2 * R, 2 * R, R, WHITE, a * (1 - q) * 0.8, 4)
    mg.TRACK[0] = True
    (d, s0, _), = IM["d"]
    pop_word(cv, t, "DigitalSub", "bold", 62, WHITE, W / 2, 1085, s0, a, anchor="c")
    (sm, s1, _), = IM["s"]
    pop_word(cv, t, "simplifie", "black", 190, WHITE, W / 2, 1290, s1, a, anchor="c", tracking=-6)
    e = out5(prog(t, s1 + 0.2, 0.5))
    if e > 0:
        x1 = 140 + 780 * e
        polyline(cv, [(140, 1345), (x1, 1345)], WHITE, 10, a)
        polyline(cv, [(x1 - 34, 1320), (x1, 1345), (x1 - 34, 1370)], WHITE, 10, a * min(1, e * 2))
    line_words(cv, t, IM["c"], "medium", 62, WHITE, W / 2, 1460, a, anchor="c")


ST = [(words("Tu consultes", 17.2), words("les offres disponibles.", 17.9), None),
      (words("Tu choisis", 19.4), words("celle qui correspond à ton besoin.", 19.9), None),
      (words("Tu paies", 22.3), words("en ariary avec les moyens proposés.", 22.6), None),
      (words("Puis notre équipe", 25.2), words("t'accompagne pour l'activation", 26.0), words("selon le service.", 27.6))]
NODE_Y = [590, 850, 1110, 1370]


def wrap_words(toks, weight, size, maxw):
    lines, cur, w = [], [], 0.0
    sp = text_width(" ", weight, size)
    for tk in toks:
        tw = text_width(tk[0], weight, size)
        if cur and w + sp + tw > maxw:
            lines.append(cur)
            cur, w = [], 0.0
        cur.append(tk)
        w += (sp if len(cur) > 1 else 0) + tw
    return lines + [cur] if cur else lines


def sec_steps(cv, t):
    if not (16.5 <= t <= 29.0):
        return
    a = out3(prog(t, 16.6, 0.25)) * (1 - inout3(prog(t, 28.75, 0.25)))
    x_node = 150
    for i, ((title, body, extra), y) in enumerate(zip(ST, NODE_Y)):
        t0 = C.STEPS[i]
        t_next = C.STEPS[i + 1] if i + 1 < len(C.STEPS) else 99
        if i + 1 < len(NODE_Y):  # connector to the next node grows when that step starts
            g = out3(prog(t, t_next - 0.35, 0.35))
            vline(cv, x_node - 2, y + 36, y + 36 + (NODE_Y[i + 1] - y - 72) * g, INK, a * 0.35, 4)
        p = prog(t, t0 - 0.12, 0.35)
        if p <= 0:
            rrect_outline(cv, x_node - 32, y - 32, 64, 64, 32, INK, a * 0.25 * out3(prog(t, 16.7 + i * 0.08, 0.3)), 4)
            continue
        done = out3(prog(t, t_next - 0.1, 0.3))
        R = 34 * (0.6 + 0.4 * out_back(p, 2.2))
        disc(cv, x_node, y, 2 * R, mixc(VIO, INK, done), a)
        if done < 0.5:
            text(cv, str(i + 1), "black", 40, WHITE, x_node, y + 14, a * (1 - 2 * done), anchor="c")
        else:
            icon(cv, "check", x_node - 22, y - 22, 44, out3(prog(t, t_next - 0.05, 0.3)), WHITE, 6, a)
        tx = 230
        line_words(cv, t, title, "black", 76, INK, tx, y + 24, a)
        lines = wrap_words(body + (extra or []), "medium", 50, 780 if i < 3 else 600)
        for li, ln in enumerate(lines):
            line_words(cv, t, ln, "medium", 50, mixc(INK, PAPER, 0.25), tx, y + 92 + li * 58, a)
    # step 4: the activation switch flips on « l'activation »
    p = prog(t, C.STEPS[3] + 0.3, 0.4)
    if p > 0:
        on = inout3(prog(t, C.TOGGLE_AT, 0.3))
        tx, ty, tw_, th = 880, NODE_Y[3] - 40, 150, 80
        al = a * out3(p)
        rrect(cv, tx, ty, tw_, th, th / 2, mixc(rgb("#C9CCDC"), VIO, on), al)
        disc(cv, tx + th / 2 + (tw_ - th) * on, ty + th / 2, th - 16, WHITE, al)


ID = words("L'idée est simple,", 29.6)
CL = dict(m=words("moins de complications,", 30.8), p=words("plus de clarté.", 32.4))
SCRIB_B = [(140, 760), (420, 1040), (860, 760), (980, 1080), (560, 900), (180, 1080), (480, 720), (760, 1060),
           (950, 900)]


def sec_climax(cv, t):
    if 28.9 <= t <= 30.8:  # « L'idée est simple »
        a = out3(prog(t, 29.0, 0.2)) * (1 - inout3(prog(t, 30.55, 0.15)))
        (w0, s0, _), (w1, s1, _), (w2, s2, _) = ID
        line_words(cv, t, ID[:2], "medium", 64, INK, X0, 1215, a)
        w = text_width("simple.", "black", 190, -6) + 24
        marker(cv, t, X0, 1420, w, 190, s2, CYA, a)
        pop_word(cv, t, "simple.", "black", 190, INK, X0, 1420, s2, a, tracking=-6)
    if not (30.64 <= t <= 34.6):
        return
    a = 1 - inout3(prog(t, 34.30, 0.2))
    (m0, s0, _), (m1, s1, _), (m2, s2, _) = CL["m"]
    (p0, q0, _), (p1, q1, _), (p2, q2, _) = CL["p"]
    A = 1 - inout3(prog(t, 32.05, 0.2))
    line_words(cv, t, CL["m"][:2], "medium", 64, INK, W / 2, 330, a * A, anchor="c")
    size = mg_fit("complications", "black", 140, W - 2 * X0, -5)
    pop_word(cv, t, "complications", "black", size, INK, W / 2, 480, s2, a * A, anchor="c", tracking=-5)
    k = inout_expo(prog(t, 32.45, 0.35))
    pts = scribble_pts(SCRIB_B, out3(prog(t, s0, 1.2)), wobble=60 * (1 - k), seed=3, k_straight=k, y_line=900)
    polyline(cv, pts, INK, 14, a)
    if k >= 1:
        disc(cv, 130, 900, 40, INK, a)
        disc(cv, 950, 900, 40, INK, a)
    line_words(cv, t, CL["p"][:2], "medium", 64, INK, W / 2, 330, a, anchor="c")
    pop_word(cv, t, "clarté.", "black", 230, WHITE, W / 2, 560, q2, a, anchor="c", tracking=-8)


PS = dict(q=words("Que tu sois", 34.3), o=words("ou simplement à la recherche de", 37.0))
PERS = [("étudiant", "étudiant,", 34.8, VIO, WHITE), ("créateur", "créateur,", 35.7, CYA, INK),
        ("entrepreneur", "entrepreneur", 36.6, INK, WHITE), ("divertissement", "divertissement,", 38.8, VIO, WHITE)]
PERS_T = [words(w, n)[0][1] for _, w, n, _, _ in PERS]


def sec_personas(cv, t):
    if not (34.6 <= t <= 40.1):
        return
    a = out3(prog(t, 34.65, 0.2)) * (1 - inout3(prog(t, 39.80, 0.22)))
    q_end = PS["o"][0][1] - 0.1
    line_words(cv, t, PS["q"], "medium", 60, INK, W / 2, 1200, a * (1 - inout3(prog(t, q_end - 0.2, 0.2))), anchor="c",
               earliest=34.65)
    line_words(cv, t, PS["o"], "medium", 52, INK, W / 2, 1200, a, anchor="c")
    i = max([k for k, t0 in enumerate(PERS_T) if t >= t0 - 0.06] or [0])
    if t < PERS_T[0] - 0.06:
        return
    word, _, t0, fill, ink = PERS[i]
    size = 118
    wcur = text_width(word, "black", size, -4) + 90
    if i > 0:
        wprev = text_width(PERS[i - 1][0], "black", size, -4) + 90
        e = out_back(prog(t, t0 - 0.06, 0.35), 1.2)
        pw = wprev + (wcur - wprev) * e
        col = mixc(PERS[i - 1][3], fill, out3(prog(t, t0 - 0.06, 0.25)))
    else:
        e = out_back(prog(t, t0 - 0.06, 0.4), 1.6)
        pw, col = wcur * e, fill
    cy = 1370
    rrect(cv, W / 2 - pw / 2, cy - 95, pw, 190, 95, col, a)
    # slot-machine roll: previous word leaves upwards, the new one rises in
    r = out5(prog(t, t0 - 0.04, 0.38))
    if i > 0 and r < 1:
        pw_, _, _, _, pink = PERS[i - 1]
        text(cv, pw_, "black", size, pink, W / 2, cy + 42 - 90 * r, a * (1 - r), anchor="c", tracking=-4)
    text(cv, word, "black", size, ink, W / 2, cy + 42 + 90 * (1 - r), a * r, anchor="c", tracking=-4)


BS = dict(c=words("commence par", 40.2), t=words("ton besoin,", 40.7), p=words("pas par le produit", 41.9),
          l=words("le plus populaire.", 42.85))


def sec_besoin(cv, t):
    if not (40.1 <= t <= 44.9):
        return
    a = out3(prog(t, 40.15, 0.2)) * (1 - inout3(prog(t, 44.60, 0.2)))
    line_words(cv, t, BS["c"], "medium", 58, INK, X0, 1045, a)
    (tn, s0, _), (bs, s1, _) = BS["t"]
    pop_word(cv, t, "ton", "black", 150, INK, X0 - 4, 1215, s0, a, tracking=-5)
    bx = X0 + text_width("ton ", "black", 150, -5)
    pop_word(cv, t, "besoin,", "black", 150, VIO, bx, 1215, s1, a, tracking=-5)
    u = out5(prog(t, s1 + 0.2, 0.4))
    rrect(cv, bx, 1240, text_width("besoin", "black", 150, -5) * u, 16, 8, CYA, a)
    line_words(cv, t, BS["p"], "medium", 56, INK, X0, 1360, a)
    wl = line_words(cv, t, BS["l"], "black", 84, INK, X0, 1470, a)
    sp = out5(prog(t, BS["l"][-1][2] + 0.1, 0.35))
    hline(cv, X0 - 10, X0 - 10 + (wl + 20) * sp, 1442, VIO, a, 10)


CT = dict(d=words("Découvre", 44.5), o=words("les offres disponibles sur", 45.1), u=words("digitalsub.org.", 46.3))


def sec_cta(cv, t):
    if not (44.8 <= t <= 48.2):
        return
    a = out3(prog(t, 44.85, 0.2)) * (1 - inout3(prog(t, 47.80, 0.25)))
    pop_word(cv, t, "Découvre", "black", 120, INK, W / 2, 960, max(CT["d"][0][1], 44.9), a, anchor="c", tracking=-4)
    line_words(cv, t, CT["o"], "medium", 54, INK, W / 2, 1050, a, anchor="c")
    tu = CT["u"][0][1]
    p = prog(t, tu - 0.06, 0.45)
    if p > 0:
        press = 1 - 0.05 * np.sin(np.pi * clamp(prog(t, C.CLICK_AT, 0.22)))
        sc = (0.5 + 0.5 * out_back(p, 1.8)) * press
        bw, bh = 780 * sc, 150 * sc
        rrect(cv, W / 2 - bw / 2, 1235 - bh / 2, bw, bh, bh / 2, VIO, a * min(1, p * 4))
        text(cv, "digitalsub.org", "black", 74, WHITE, W / 2, 1235 + 27 * sc, a * min(1, p * 4), anchor="c", scale=sc,
             tracking=-2)
        m = out5(prog(t, C.CLICK_AT - 0.45, 0.45))
        cx, cy = 1010 - 150 * m, 1430 - 175 * m  # lands on the button's right end, clear of the URL
        q = prog(t, C.CLICK_AT, 0.55)
        if 0 < q < 1:  # click ripple at the cursor tip
            R = 20 + 110 * out3(q)
            rrect_outline(cv, cx + 7 - R, cy + 4 - R, 2 * R, 2 * R, R, WHITE, a * (1 - q), 5)
        if m > 0:
            cursor(cv, cx, cy, 1.0, a * min(1, m * 3))


LOGO = Image.open(os.path.join(ROOT, "assets", "digitalsub-logo.png")).convert("RGBA")
LOGO = LOGO.crop(LOGO.getchannel("A").getbbox())


def sec_outro(cv, t):
    u = t - C.CARD_AT
    if u < 0:
        return
    for (cx, cy, d, col, dl) in ((60, 300, 420, VIO, 0.0), (1040, 1640, 380, CYA, 0.12)):
        e = out_back(prog(u, 0.1 + dl, 0.7), 1.4)
        disc(cv, cx, cy, d * e, col, 0.35)
    p = prog(u, 0.30, 0.8)
    if p > 0:
        s = 0.9 + 0.1 * out_back(p, 1.6)
        lw = int(760 * s)
        lh = round(LOGO.height * lw / LOGO.width)  # uniform scale only
        spr = np.asarray(LOGO.resize((lw, lh), Image.LANCZOS), np.float32) / 255
        blend_rgba(cv, spr, int(W / 2 - lw / 2), int(860 - lh / 2), min(1.0, p * 2.5))
    r = out3(prog(u, 1.05, 0.6))
    if r > 0:
        hline(cv, W / 2 - 150 * r, W / 2 + 150 * r, 1100, CYA, 1.0, 4, color2=VIO)
        text(cv, "www.digitalsub.org", "medium", 54, WHITE, W / 2, 1185 + 14 * (1 - r), r, anchor="c",
             tracking=3 + 14 * (1 - out3(prog(u, 1.05, 1.1))))


SECTIONS = (sec_hook, sec_services, sec_friction, sec_impact, sec_steps, sec_climax, sec_personas, sec_besoin, sec_cta,
            sec_outro)


# ------------------------------------------------------------------ frame
def render(src, t, n=None):
    n = round(t * FPS) if n is None else n
    cv, cname = canvas(t)
    p, name = window(t, n)
    ring = cname != "paper" and name in ("circle", "center", "badge", "corner")
    draw_window(cv, src, p, ring)
    mg.DRAWN.clear()
    mg.TRACK[0] = True
    for sec in SECTIONS:
        sec(cv, t)
    mg.TRACK[0] = False
    hits = []
    fx0, fy0, fx1, fy1 = face_on_screen(p, n)
    if fx1 > fx0 and fy1 > fy0:
        hits = [b for b in mg.DRAWN if b[0] < fx1 and b[2] > fx0 and b[1] < fy1 and b[3] > fy0]
    return to_image(cv), hits


GRADE = "eq=contrast=1.04:saturation=1.06:gamma=0.99"


def _work(job):
    n, buf = job
    img, hits = render(Image.frombuffer("RGB", (W, H), buf), n / FPS, n)
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
                buf = last
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
