"""DigitalSub end card: deep navy, official logo reveal, violet/cyan glow, URL.

The logo is only trimmed of its transparent margin and scaled uniformly:
never redrawn, recoloured or distorted.
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1082, 1920, 25
DUR = 3.15  # card starts under the dissolve (0.55 s), then 2.6 s on its own
URL = "www.digitalsub.org"
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Medium.otf"

LOGO_W = 740
LOGO_C = (W / 2, 880)
LINE_Y, URL_Y = 1135, 1210

rng = np.random.default_rng(7)


def clamp(x):
    return min(max(x, 0.0), 1.0)


def ease_out_expo(x):
    x = clamp(x)
    return 1.0 if x == 1 else 1 - 2 ** (-10 * x)


def ease_out(x):
    return 1 - (1 - clamp(x)) ** 3


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def radial(cx, cy, rx, ry):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
    return np.exp(-d * 2.2)


# background: navy vertical gradient + two breathing glows (violet, cyan)
_y = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
TOP, MID, BOT = (np.array(c, np.float32) for c in ([5, 8, 24], [11, 17, 50], [4, 6, 20]))
BG = np.where(_y < 0.46, TOP + (MID - TOP) * (_y / 0.46), MID + (BOT - MID) * ((_y - 0.46) / 0.54))
BG = np.broadcast_to(BG, (H, W, 3)).copy()
GLOW_V = radial(W * 0.42, 860, 520, 380)[..., None] * np.array([124, 58, 237], np.float32)
GLOW_C = radial(W * 0.62, 940, 420, 300)[..., None] * np.array([34, 211, 238], np.float32)
VIGNETTE = (1 - 0.55 * np.clip(radial(W / 2, H / 2, W * 0.9, H * 0.7) * -1 + 1, 0, 1))[..., None]


def load_logo(path):
    im = Image.open(path).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())
    h = round(im.height * LOGO_W / im.width)  # uniform scale only
    im = im.resize((LOGO_W, h), Image.LANCZOS)
    # transparent margin so the bloom is never clipped by the logo's bounding box
    pad = 90
    out = Image.new("RGBA", (LOGO_W + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    out.paste(im, (pad, pad))
    return out


def url_layer():
    font = ImageFont.truetype(FONT, 50)
    track = 3
    widths = [font.getlength(c) for c in URL]
    total = sum(widths) + track * (len(URL) - 1)
    lay = Image.new("L", (int(total) + 40, 90), 0)
    d = ImageDraw.Draw(lay)
    x = 20.0
    for c, w in zip(URL, widths):
        d.text((x, 45), c, font=font, fill=255, anchor="lm")
        x += w + track
    return lay


def frame(t, logo, glow, url):
    # glow breathes in with the logo, then settles
    g = 0.10 + 0.22 * smooth((t - 0.30) / 1.2) - 0.06 * smooth((t - 1.6) / 1.5)
    drift = 1 + 0.03 * np.sin(t * 1.3)
    img = BG + GLOW_V * g * drift + GLOW_C * g * 0.75 * (2 - drift)
    img = img * VIGNETTE
    canvas = Image.fromarray(np.clip(img + rng.normal(0, 1.1, img.shape), 0, 255).astype(np.uint8))

    # logo: fade + scale 0.94 -> 1 + focus pull, then a very slow push
    p = ease_out_expo((t - 0.35) / 0.95)
    if p > 0:
        s = (0.94 + 0.06 * p) * (1 + 0.012 * clamp((t - 1.3) / 1.85))
        lw, lh = round(logo.width * s), round(logo.height * s)
        lg = logo.resize((lw, lh), Image.LANCZOS)
        bl = 10 * (1 - p)
        if bl > 0.3:
            lg = lg.filter(ImageFilter.GaussianBlur(bl))
        # soft bloom from the logo's own colours
        gl = glow.resize((lw, lh), Image.BILINEAR)
        ga = np.asarray(gl, np.float32)
        bloom_a = 0.45 * p * (1 - 0.4 * smooth((t - 1.4) / 1.2))
        x0, y0 = round(LOGO_C[0] - lw / 2), round(LOGO_C[1] - lh / 2)
        base = np.asarray(canvas, np.float32)
        region = base[y0:y0 + lh, x0:x0 + lw]
        region += ga[..., :3] * (ga[..., 3:] / 255) * bloom_a
        base[y0:y0 + lh, x0:x0 + lw] = np.clip(region, 0, 255)
        canvas = Image.fromarray(base.astype(np.uint8))

        la = np.asarray(lg, np.float32)
        alpha = la[..., 3:] / 255 * p
        rgb = la[..., :3]
        # light sweep across the logo, clipped to its own shape
        sw = (t - 1.55) / 0.85
        if 0 < sw < 1:
            yy, xx = np.mgrid[0:lh, 0:lw].astype(np.float32)
            pos = -0.25 * lw + sw * 1.5 * lw
            band = np.exp(-(((xx + yy * 0.35) - pos) / 70) ** 2)[..., None]
            rgb = rgb + (255 - rgb) * band * 0.38
        base = np.asarray(canvas, np.float32)
        base[y0:y0 + lh, x0:x0 + lw] = base[y0:y0 + lh, x0:x0 + lw] * (1 - alpha) + rgb * alpha
        canvas = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))

    # gradient hairline drawn from the centre outward
    q = ease_out((t - 1.05) / 0.6)
    if q > 0:
        half = 150 * q
        base = np.asarray(canvas, np.float32)
        xs = np.arange(W, dtype=np.float32)
        u = (xs - (W / 2 - 150)) / 300
        col = np.array([70, 227, 245], np.float32) * (1 - u[:, None]) + np.array([167, 139, 250], np.float32) * u[:, None]
        m = np.clip(half - np.abs(xs - W / 2) + 0.5, 0, 1) * (1 - np.abs(xs - W / 2) / 170).clip(0, 1) ** 0.5
        for dy, k in ((-1, 0.35), (0, 0.9), (1, 0.9), (2, 0.35)):
            row = base[LINE_Y + dy]
            a = (m * k)[:, None]
            base[LINE_Y + dy] = row * (1 - a) + col * a
        canvas = Image.fromarray(base.astype(np.uint8))

    # URL: fade + slide up, then holds for reading
    r = ease_out((t - 1.30) / 0.6)
    if r > 0:
        m = url.point(lambda v: int(v * r))
        if r < 0.98:
            m = m.filter(ImageFilter.GaussianBlur(3 * (1 - r)))
        x = round(W / 2 - url.width / 2)
        y = round(URL_Y - url.height / 2 + 20 * (1 - r))
        canvas.paste(Image.new("RGB", url.size, (255, 255, 255)), (x, y), m)
    return canvas


def main(logo_path, out):
    logo = load_logo(logo_path)
    glow = logo.filter(ImageFilter.GaussianBlur(28))
    url = url_layer()
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "9", "-pix_fmt", "yuv420p",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                            out], stdin=subprocess.PIPE)
    n = round(DUR * FPS)
    for i in range(n):
        enc.stdin.write(frame(i / FPS, logo, glow, url).tobytes())
    enc.stdin.close()
    enc.wait()
    print(f"endcard: {n} frames ({n / FPS:.2f}s)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
