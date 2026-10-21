"""Quick look: composite rendered 3D overlay frames on the matching source frames."""
import subprocess
import sys

from PIL import Image

src, out, *pairs = sys.argv[1:]
thumbs = []
for p in pairs:
    path, t = p.rsplit(":", 1)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", t, "-i", src, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt",
                          "rgb24", "-"], capture_output=True, check=True).stdout
    bg = Image.frombuffer("RGB", (1082, 1920), raw).convert("RGBA")
    ov = Image.open(path).convert("RGBA")
    if ov.getextrema()[3][1] == 255 and ov.getpixel((0, 0))[3] == 255:
        bg = ov
    else:
        bg.alpha_composite(ov)
    thumbs.append(bg.convert("RGB").resize((361, 640)))
sheet = Image.new("RGB", (361 * len(thumbs), 640))
for i, im in enumerate(thumbs):
    sheet.paste(im, (361 * i, 0))
sheet.save(out)
