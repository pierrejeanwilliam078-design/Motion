"""Tiny motion-graphics toolkit: easing, cached text sprites, shapes, glass.

The canvas is a float32 (H, W, 3) array in 0..1. Sprites are straight-alpha
RGBA float arrays. Everything is drawn with sub-pixel-free integer placement
but animated through eased parameters, which reads as smooth at 25 fps.
"""
import json
import re
import unicodedata
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1082, 1920, 25

FONT_DIR = "/usr/share/fonts/opentype/inter/"
WEIGHTS = {
    "light": "InterDisplay-Light.otf", "regular": "InterDisplay-Regular.otf",
    "medium": "InterDisplay-Medium.otf", "semibold": "InterDisplay-SemiBold.otf",
    "bold": "InterDisplay-Bold.otf", "xbold": "InterDisplay-ExtraBold.otf",
    "black": "InterDisplay-Black.otf",
}

# DigitalSub palette (0..1)
def rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))


WHITE = (1.0, 1.0, 1.0)
NAVY = rgb("#070B22")
NAVY2 = rgb("#0E1640")
CYAN = rgb("#46E3F5")
VIOLET = rgb("#A78BFA")
BLUE = rgb("#2F6BFF")
DIM = (0.62, 0.66, 0.78)


# ------------------------------------------------------------------ easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def prog(t, t0, dur):
    return clamp((t - t0) / dur) if dur > 0 else float(t >= t0)


def out3(x):
    return 1 - (1 - clamp(x)) ** 3


def out5(x):
    return 1 - (1 - clamp(x)) ** 5


def inout3(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def inout_expo(x):
    x = clamp(x)
    if x in (0.0, 1.0):
        return x
    return 2 ** (20 * x - 10) / 2 if x < 0.5 else (2 - 2 ** (-20 * x + 10)) / 2


def out_back(x, s=1.5):
    x = clamp(x) - 1
    return 1 + (s + 1) * x ** 3 + s * x ** 2


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def window(t, t_in, t_out, d_in=0.3, d_out=0.25):
    """1 inside [t_in, t_out], eased ramps on both sides."""
    return out3(prog(t, t_in, d_in)) * (1 - inout3(prog(t, t_out - d_out, d_out)))


# ------------------------------------------------------------------ words
def _norm(s):
    s = unicodedata.normalize("NFC", s.lower())
    return re.sub(r"[^\w]", "", s)


class Transcript:
    """Whisper words, with elided pieces ("n" + "'est") merged."""

    def __init__(self, path):
        words = [w for seg in json.load(open(path, encoding="utf-8")) for w in seg["words"]]
        merged = []
        for w in words:
            txt = w["w"].strip()
            if merged and txt.startswith("'"):
                merged[-1] = (merged[-1][0] + txt, merged[-1][1], w["e"])
            else:
                merged.append((txt, w["s"], w["e"]))
        self.words = merged

    def timed(self, text, near):
        """Map each token of `text` to (token, start, end) from the transcript."""
        first = _norm(text.split()[0])
        i = next(k for k, w in enumerate(self.words)
                 if w[1] >= near - 0.6 and first.startswith(_norm(w[0])))
        out = []
        for tok in text.split():
            target, acc, s = _norm(tok), "", None
            while _norm(acc) != target:
                w = self.words[i]
                s = w[1] if s is None else s
                acc += w[0]
                i += 1
                if len(_norm(acc)) > len(target) + 2:
                    raise ValueError(f"cannot align {tok!r} near {near}")
            out.append((tok.replace("_", " "), s, self.words[i - 1][2]))
        return out


# ------------------------------------------------------------------ text
@lru_cache(None)
def font(weight, size):
    return ImageFont.truetype(FONT_DIR + WEIGHTS[weight], size)


def text_width(text, weight, size, tracking=0.0):
    f = font(weight, size)
    if not tracking:
        return f.getlength(text)
    return sum(f.getlength(c) for c in text) + tracking * (len(text) - 1)


PAD = 24


@lru_cache(maxsize=8192)
def _text_img(text, weight, size, tracking):
    f = font(weight, size)
    asc, desc = f.getmetrics()
    w = int(text_width(text, weight, size, tracking)) + 2 * PAD
    img = Image.new("L", (w, asc + desc + 2 * PAD), 0)
    d = ImageDraw.Draw(img)
    if tracking:
        x = PAD
        for c in text:
            d.text((x, PAD + asc), c, font=f, fill=255, anchor="ls")
            x += f.getlength(c) + tracking
    else:
        d.text((PAD, PAD + asc), text, font=f, fill=255, anchor="ls")
    return img, asc


def blend_mask(cv, mask, color, x, y, alpha=1.0):
    """Composite a coverage mask (float 0..1, h x w) of one colour at (x, y)."""
    if alpha <= 0.002:
        return
    h, w = mask.shape
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + w, W), min(y + h, H)
    if x1 <= x0 or y1 <= y0:
        return
    m = mask[y0 - y:y1 - y, x0 - x:x1 - x, None] * alpha
    reg = cv[y0:y1, x0:x1]
    reg *= 1 - m
    reg += m * np.asarray(color, np.float32)


def blend_rgba(cv, spr, x, y, alpha=1.0):
    if alpha <= 0.002:
        return
    h, w = spr.shape[:2]
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + w, W), min(y + h, H)
    if x1 <= x0 or y1 <= y0:
        return
    s = spr[y0 - y:y1 - y, x0 - x:x1 - x]
    m = s[..., 3:] * alpha
    reg = cv[y0:y1, x0:x1]
    reg *= 1 - m
    reg += m * s[..., :3]


def text(cv, s, weight, size, color, x, y, alpha=1.0, anchor="l", scale=1.0, blur=0.0,
         tracking=0.0, reveal=1.0, reveal_dir="x"):
    """Draw text with its baseline at y. anchor: l / c / r on the advance width.

    reveal < 1 masks the text progressively (x: left->right, y: bottom->top).
    """
    if alpha <= 0.002 or not s:
        return
    img, asc = _text_img(s, weight, size, round(tracking, 1))
    adv = text_width(s, weight, size, tracking)
    if scale != 1.0:
        img = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.BICUBIC)
    if blur > 0.3:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    m = np.asarray(img, np.float32) / 255
    if reveal < 1.0:
        if reveal_dir == "x":
            edge = PAD * scale + reveal * adv * scale
            xs = np.arange(m.shape[1], dtype=np.float32)
            m = m * np.clip(edge - xs + 6, 0, 12)[None, :] / 12
        else:
            edge = m.shape[0] * (1 - reveal)
            ys = np.arange(m.shape[0], dtype=np.float32)
            m = m * np.clip(ys - edge + 6, 0, 12)[:, None] / 12
    ox = {"l": 0, "c": adv / 2, "r": adv}[anchor] * scale
    blend_mask(cv, m, color, round(x - ox - PAD * scale), round(y - (PAD + asc) * scale), alpha)


# ------------------------------------------------------------------ shapes
@lru_cache(maxsize=512)
def _rrect_mask(w, h, r, ss=3):
    img = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(img).rounded_rectangle((0, 0, w * ss - 1, h * ss - 1), r * ss, fill=255)
    return np.asarray(img.resize((w, h), Image.LANCZOS), np.float32) / 255


def rrect(cv, x, y, w, h, r, color, alpha=1.0):
    w, h = int(round(w)), int(round(h))
    if w < 2 or h < 2:
        return
    blend_mask(cv, _rrect_mask(w, h, int(min(r, w // 2, h // 2))), color, int(round(x)), int(round(y)), alpha)


def rrect_outline(cv, x, y, w, h, r, color, alpha=1.0, width=2):
    w, h = int(round(w)), int(round(h))
    if w < 2 * width + 2 or h < 2 * width + 2:
        return
    r = int(min(r, w // 2, h // 2))
    outer = _rrect_mask(w, h, r)
    inner = np.zeros_like(outer)
    inner[width:h - width, width:w - width] = _rrect_mask(w - 2 * width, h - 2 * width, max(r - width, 0))
    blend_mask(cv, np.clip(outer - inner, 0, 1), color, int(round(x)), int(round(y)), alpha)


def hline(cv, x0, x1, y, color, alpha=1.0, thick=2, color2=None):
    """Anti-aliased (in x) horizontal line, optional horizontal gradient."""
    if x1 - x0 < 0.5 or alpha <= 0:
        return
    xi0, xi1 = int(np.floor(x0)), int(np.ceil(x1))
    xs = np.arange(xi0, xi1, dtype=np.float32) + 0.5
    cov = np.clip(np.minimum(xs - x0 + 0.5, x1 - xs + 0.5), 0, 1)
    m = np.repeat(cov[None, :], thick, 0)
    if color2 is None:
        blend_mask(cv, m, color, xi0, int(y), alpha)
    else:
        u = ((xs - x0) / max(x1 - x0, 1))[:, None]
        col = np.asarray(color, np.float32) * (1 - u) + np.asarray(color2, np.float32) * u
        spr = np.concatenate([np.repeat(col[None], thick, 0), m[..., None]], 2)
        blend_rgba(cv, spr, xi0, int(y), alpha)


def vline(cv, x, y0, y1, color, alpha=1.0, thick=3):
    if y1 - y0 < 0.5:
        return
    yi0, yi1 = int(np.floor(y0)), int(np.ceil(y1))
    ys = np.arange(yi0, yi1, dtype=np.float32) + 0.5
    cov = np.clip(np.minimum(ys - y0 + 0.5, y1 - ys + 0.5), 0, 1)
    blend_mask(cv, np.repeat(cov[:, None], thick, 1), color, int(x), yi0, alpha)


@lru_cache(maxsize=256)
def _disc(d, ss=4):
    img = Image.new("L", (d * ss, d * ss), 0)
    ImageDraw.Draw(img).ellipse((0, 0, d * ss - 1, d * ss - 1), fill=255)
    return np.asarray(img.resize((d, d), Image.LANCZOS), np.float32) / 255


def disc(cv, cx, cy, d, color, alpha=1.0):
    d = max(2, int(round(d)))
    blend_mask(cv, _disc(d), color, int(round(cx - d / 2)), int(round(cy - d / 2)), alpha)


def stroke_path(cv, pts, progress, color, x, y, size, width=6, alpha=1.0):
    """Draw a polyline (unit coords) progressively, e.g. a check mark."""
    if progress <= 0 or alpha <= 0:
        return
    ss = 4
    seg = [np.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:])]
    total, left = sum(seg), sum(seg) * clamp(progress)
    path = [pts[0]]
    for (a, b), L in zip(zip(pts, pts[1:]), seg):
        if left <= 0:
            break
        f = min(1, left / L)
        path.append((a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f))
        left -= L
    img = Image.new("L", (size * ss, size * ss), 0)
    d = ImageDraw.Draw(img)
    p = [(u * size * ss, v * size * ss) for u, v in path]
    d.line(p, fill=255, width=width * ss, joint="curve")
    for u, v in (p[0], p[-1]):
        r = width * ss / 2
        d.ellipse((u - r, v - r, u + r, v + r), fill=255)
    m = np.asarray(img.resize((size, size), Image.LANCZOS), np.float32) / 255
    blend_mask(cv, m, color, int(x), int(y), alpha)


CHECK = [(0.2, 0.52), (0.42, 0.72), (0.8, 0.3)]
ARROW_UP = [(0.2, 0.8), (0.8, 0.2)]
ARROW_HEAD = [(0.38, 0.2), (0.8, 0.2), (0.8, 0.62)]


# ------------------------------------------------------------------ glass
def glass(cv, x, y, w, h, r, alpha=1.0, tint=NAVY, tint_amt=0.55, blur=18, border=0.12, sheen=0.05):
    """Frosted panel: blurred backdrop, tinted, hairline border."""
    x, y, w, h = int(round(x)), int(round(y)), int(round(w)), int(round(h))
    if alpha <= 0.002 or w < 4 or h < 4:
        return
    pad = int(blur * 2)
    x0, y0, x1, y1 = max(x - pad, 0), max(y - pad, 0), min(x + w + pad, W), min(y + h + pad, H)
    region = Image.fromarray((np.clip(cv[y0:y1, x0:x1], 0, 1) * 255).astype(np.uint8))
    region = np.asarray(region.filter(ImageFilter.GaussianBlur(blur)), np.float32) / 255
    gx0, gy0 = max(x, 0), max(y, 0)
    gx1, gy1 = min(x + w, W), min(y + h, H)
    g = region[gy0 - y0:gy1 - y0, gx0 - x0:gx1 - x0]
    g = g * (1 - tint_amt) + np.asarray(tint, np.float32) * tint_amt
    if sheen:
        ys = np.linspace(0, 1, h, dtype=np.float32)[gy0 - y:gy1 - y]
        g = g + sheen * np.clip(1 - ys / 0.5, 0, 1)[:, None, None] ** 2
    mask = _rrect_mask(w, h, int(min(r, w // 2, h // 2)))[gy0 - y:gy1 - y, gx0 - x:gx1 - x, None] * alpha
    reg = cv[gy0:gy1, gx0:gx1]
    reg *= 1 - mask
    reg += mask * g
    if border:
        rrect_outline(cv, x, y, w, h, r, WHITE, alpha * border, 2)


def scrim(cv, y0, y1, amount):
    """Bottom darkening gradient to seat large type over footage."""
    if amount <= 0.002:
        return
    a = np.linspace(0, 1, y1 - y0, dtype=np.float32) ** 0.8 * amount
    cv[y0:y1] *= (1 - a)[:, None, None]
    cv[y0:y1] += (a[:, None, None] * np.asarray(NAVY, np.float32))


def to_canvas(img):
    return np.asarray(img, np.float32) / 255


def to_image(cv):
    return Image.fromarray((np.clip(cv, 0, 1) * 255 + 0.5).astype(np.uint8))
