"""Render single frames of the v2 edit at given times into a contact sheet."""
import importlib
import os
import subprocess
import sys

from PIL import Image

E = importlib.import_module(os.environ.get("EDIT", "edit_v2"))  # EDIT=edit_16 for video 16


def grab(src, t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{min(t, 40.9):.3f}", "-i", src, "-vf", E.GRADE,
                          "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return Image.frombuffer("RGB", (E.W, E.H), raw)


if __name__ == "__main__":
    src, out, *times = sys.argv[1:]
    thumbs = []
    for t in map(float, times):
        img = E.render(grab(src, t), t)
        thumbs.append((img[0] if isinstance(img, tuple) else img).resize((361, 640)))
    sheet = Image.new("RGB", (361 * len(thumbs), 640))
    for i, im in enumerate(thumbs):
        sheet.paste(im, (361 * i, 0))
    sheet.save(out)
