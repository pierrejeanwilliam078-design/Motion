"""Render single frames of the v2 edit at given times into a contact sheet."""
import subprocess
import sys

from PIL import Image

import edit_v2 as E


def grab(src, t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{min(t, 40.96):.3f}", "-i", src, "-vf", E.GRADE,
                          "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return Image.frombuffer("RGB", (E.W, E.H), raw)


if __name__ == "__main__":
    src, out, *times = sys.argv[1:]
    thumbs = [E.render(grab(src, float(t)), float(t)).resize((361, 640)) for t in times]
    sheet = Image.new("RGB", (361 * len(thumbs), 640))
    for i, im in enumerate(thumbs):
        sheet.paste(im, (361 * i, 0))
    sheet.save(out)
