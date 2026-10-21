"""Main-sequence picture pass for the DigitalSub edit.

ffmpeg (decode + light grade) -> this script -> ffmpeg (vignette + ASS + encode)

Per frame: subtle eased punch-ins between sentences, the frosted-glass CTA
panel, and the defocus that leads into the end card. The edit itself (order,
timing, framing) is untouched; HOLD extra frames of the last image are added so
the dissolve into the end card never eats the last spoken word.
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, FPS = 1082, 1920, 25
HOLD = 10  # frames of last image held under the end-card dissolve
ANCHOR = (520.0, 700.0)  # zoom anchor ~ the speaker's face

# (time, zoom): moves happen in the pauses between sentences
ZOOM_KEYS = [
    (0.00, 1.000), (4.95, 1.018), (5.75, 1.040),
    (13.45, 1.052), (13.90, 1.080),  # "Mais un abonnement payant n'est pas magique"
    (15.95, 1.084), (16.40, 1.035),
    (24.75, 1.050), (25.45, 1.020),
    (31.75, 1.035), (32.30, 1.060),  # "DigitalSub peut t'aider"
    (36.95, 1.072), (37.42, 1.030),  # CTA: open the frame for the panel
    (40.60, 1.040), (41.40, 1.090),  # push into the end card
]
DEFOCUS = (40.85, 41.40, 14.0)  # start, end, max blur radius

# CTA glass panel
CTA_IN, CTA_OUT = (37.40, 37.75), (40.70, 40.95)
PANEL = (541 - 455, 1168, 541 + 455, 1432)  # x0, y0, x1, y1
RADIUS = 40
NAVY = np.array([8, 12, 38], np.float32)
CYAN = np.array([70, 227, 245], np.float32)
VIOLET = np.array([167, 139, 250], np.float32)


def smooth(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3


def zoom_at(t):
    for (t0, z0), (t1, z1) in zip(ZOOM_KEYS, ZOOM_KEYS[1:]):
        if t <= t1:
            return z0 + (z1 - z0) * smooth((t - t0) / (t1 - t0))
    return ZOOM_KEYS[-1][1]


def zoom(img, z):
    if abs(z - 1) < 1e-4:
        return img
    px, py = ANCHOR
    k = 1 / z
    return img.transform((W, H), Image.AFFINE, (k, 0, px * (1 - k), 0, k, py * (1 - k)), Image.BICUBIC)


def build_panel_layers():
    x0, y0, x1, y1 = PANEL
    pw, ph = x1 - x0, y1 - y0
    ss = 4  # supersampled rounded-rect masks
    m = Image.new("L", (pw * ss, ph * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, pw * ss - 1, ph * ss - 1), RADIUS * ss, fill=255)
    fill = np.asarray(m.resize((pw, ph), Image.LANCZOS), np.float32) / 255
    inner = Image.new("L", (pw * ss, ph * ss), 0)
    ImageDraw.Draw(inner).rounded_rectangle((2 * ss, 2 * ss, (pw - 2) * ss - 1, (ph - 2) * ss - 1),
                                            (RADIUS - 2) * ss, fill=255)
    inner = np.asarray(inner.resize((pw, ph), Image.LANCZOS), np.float32) / 255
    border = np.clip(fill - inner, 0, 1)
    gx = np.linspace(0, 1, pw, dtype=np.float32)[None, :, None]
    grad = CYAN * (1 - gx) + VIOLET * gx  # brand gradient, left to right
    # soft top sheen inside the glass
    sheen = np.clip(1 - np.linspace(0, 1, ph, dtype=np.float32) / 0.45, 0, 1)[:, None] ** 2
    return fill, border, grad, sheen


FILL, BORDER, GRAD, SHEEN = build_panel_layers()


def draw_panel(frame, t):
    a_in = ease_out((t - CTA_IN[0]) / (CTA_IN[1] - CTA_IN[0]))
    a_out = 1 - smooth((t - CTA_OUT[0]) / (CTA_OUT[1] - CTA_OUT[0]))
    a = a_in * a_out
    if a <= 0:
        return frame
    dy = int(round(26 * (1 - a_in)))
    x0, y0, x1, y1 = PANEL
    y0, y1 = y0 + dy, y1 + dy
    pad = 40
    region = frame.crop((x0 - pad, y0 - pad, x1 + pad, y1 + pad)).filter(ImageFilter.GaussianBlur(20))
    glass = np.asarray(region, np.float32)[pad:-pad, pad:-pad]
    glass = glass * 0.42 + NAVY * 0.58 + 255 * 0.05 * SHEEN[..., None]
    # border: faint all around, brighter top accent drawn from the centre outward
    reach = ease_out((t - 37.55) / 0.55)
    pw = x1 - x0
    xs = np.abs(np.arange(pw) - pw / 2) / (pw / 2)
    accent = (xs <= reach).astype(np.float32)[None, :] * (np.arange(y1 - y0) < RADIUS)[:, None]
    b_alpha = BORDER * (0.35 + 0.55 * accent)
    glass = glass * (1 - b_alpha[..., None]) + GRAD * b_alpha[..., None]
    base = np.asarray(frame, np.float32)
    sub = base[y0:y1, x0:x1]
    m = (FILL * a)[..., None]
    base[y0:y1, x0:x1] = sub * (1 - m) + glass * m
    return Image.fromarray(np.clip(base + 0.5, 0, 255).astype(np.uint8))


def process(img, t):
    img = zoom(img, zoom_at(t))
    img = draw_panel(img, t)
    d0, d1, r = DEFOCUS
    if t > d0:
        img = img.filter(ImageFilter.GaussianBlur(r * smooth((t - d0) / (d1 - d0))))
    return img


GRADE = "eq=contrast=1.035:saturation=1.04:gamma=0.985,colorbalance=rs=-0.01:bs=0.025:rh=0.012:bh=-0.005"


def main(src, ass, out):
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", GRADE, "-f", "rawvideo",
                            "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                            "-vf", f"vignette=angle=0.42,subtitles={ass}",
                            "-c:v", "libx264", "-preset", "medium", "-crf", "9", "-pix_fmt", "yuv420p",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                            out], stdin=subprocess.PIPE)
    n, last = 0, None
    while True:
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        last = Image.frombuffer("RGB", (W, H), buf)
        enc.stdin.write(process(last, n / FPS).tobytes())
        n += 1
    for _ in range(HOLD):
        enc.stdin.write(process(last, n / FPS).tobytes())
        n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"main: {n} frames ({n / FPS:.2f}s)")


if __name__ == "__main__":
    main(*sys.argv[1:4])
