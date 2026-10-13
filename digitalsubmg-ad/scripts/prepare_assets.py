"""Prepare the visual assets and voice-over clips used by the Remotion project.

- Crops the real DigitalSubMG product visuals from the catalogue screenshot
  (browser chrome, "EN STOCK" badges and Windows UI are removed).
- Extracts the official logo from the site screenshot and makes its light
  background transparent. The source logo is only ~70 px wide: replace
  public/brand/logo.png with the HD file for a sharper result.
- Cuts the ElevenLabs voice-over into phrase clips following
  src/data/voice-cues.json (no time-stretch: phrases are only moved).

Usage: python3 scripts/prepare_assets.py   (run from digitalsubmg-ad/)
"""
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
PUB = ROOT / "public"


def upscale(img: Image.Image, factor: float) -> Image.Image:
    w, h = img.size
    out = img.resize((round(w * factor), round(h * factor)), Image.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))


def products() -> None:
    catalog = Image.open(SRC / "site-catalog.webp").convert("RGB")
    # Card image areas measured on the 1600x851 screenshot (y 202..452 skips
    # the stock badges at the top and the site footer strip at the bottom).
    cards = {
        "netflix": (136, 204, 448, 452),
        "prime-video": (486, 204, 798, 452),
        "chatgpt": (836, 204, 1148, 452),
        "spotify": (1186, 204, 1498, 452),
    }
    out = PUB / "products"
    out.mkdir(parents=True, exist_ok=True)
    for name, box in cards.items():
        upscale(catalog.crop(box), 2.5).save(out / f"{name}.png", optimize=True)


def logo() -> None:
    page = Image.open(SRC / "site-why.png").convert("RGB")
    crop = page.crop((108, 24, 192, 68))
    bg = (248, 249, 251)
    rgba = Image.new("RGBA", crop.size)
    px_in, px_out = crop.load(), rgba.load()
    for y in range(crop.size[1]):
        for x in range(crop.size[0]):
            r, g, b = px_in[x, y]
            # alpha from the distance to the page background
            d = max(abs(r - bg[0]), abs(g - bg[1]), abs(b - bg[2]))
            a = min(1.0, d / 70.0)
            if a <= 0.02:
                px_out[x, y] = (0, 0, 0, 0)
                continue
            # un-blend the background so edges keep their true colour
            un = [max(0, min(255, round((c - (1 - a) * k) / a))) for c, k in zip((r, g, b), bg)]
            px_out[x, y] = (un[0], un[1], un[2], round(a * 255))
    bbox = rgba.getbbox()
    rgba = rgba.crop(bbox)
    big = rgba.resize((rgba.size[0] * 6, rgba.size[1] * 6), Image.LANCZOS)
    (PUB / "brand").mkdir(parents=True, exist_ok=True)
    big.save(PUB / "brand" / "logo.png", optimize=True)


def voice() -> None:
    cues = json.loads((ROOT / "src" / "data" / "voice-cues.json").read_text())
    src = PUB / cues["source"]
    out = PUB / "audio" / "vo"
    for c in cues["cues"]:
        dur = c["srcOut"] - c["srcIn"]
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-ss", f"{c['srcIn']:.3f}", "-t", f"{dur:.3f}", "-i", str(src),
                "-af", f"afade=t=in:d=0.008,afade=t=out:st={max(0, dur - 0.03):.3f}:d=0.03",
                "-ac", "2", "-ar", "44100", str(out / f"{c['id']}.wav"),
            ],
            check=True,
        )


if __name__ == "__main__":
    products()
    logo()
    voice()
    print("assets ready")
