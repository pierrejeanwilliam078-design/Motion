"""Generate the 7 scene sub-compositions + index.html for the Tiavina Nomena ad.

Run from the project root:  python3 -I tools/build_scenes.py
Depth system per scene (back to front):
  ground -> back text -> portrait shadow -> portrait (+ relight) -> front text copy
The front copy repeats the back text exactly and is masked ABOVE a shoulder line,
so letters pass behind the head and in front of the chest.
"""
import os

OUT = "compositions/scenes"
os.makedirs(OUT, exist_ok=True)

PULL = ("assets/portraits/pull.png", 1067, 1356)        # chin y 605, shoulders ~645
COSTUME = ("assets/portraits/costume.png", 525, 919)    # chin y 290, shoulders ~330

FONTS = """
      @font-face { font-family: "Anton"; src: url("assets/fonts/anton-latin-400-normal.woff2") format("woff2"); font-display: block; }
      @font-face { font-family: "Boldonse"; src: url("assets/fonts/Boldonse-Regular.ttf") format("truetype"); font-display: block; }
      @font-face { font-family: "InstrumentSansBI"; src: url("assets/fonts/InstrumentSans-BoldItalic.ttf") format("truetype"); font-display: block; }
      @font-face { font-family: "Inter"; font-weight: 800; src: url("assets/fonts/inter-latin-800-normal.woff2") format("woff2"); font-display: block; }
      @font-face { font-family: "Inter"; font-weight: 900; src: url("assets/fonts/inter-latin-900-normal.woff2") format("woff2"); font-display: block; }
"""

BASE = """
      #root { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; color: #FFFFFF; }
      #root .layer { position: absolute; inset: 0; width: 100%; height: 100%; }
      #root .cam { position: absolute; inset: 0; transform-origin: 540px 960px; }
      #root .w { position: absolute; left: 50%; white-space: nowrap; line-height: 0.8; }
      #root .anton { font-family: "Anton", sans-serif; }
      #root .bold { font-family: "Boldonse", sans-serif; }
      #root .inter { font-family: "Inter", sans-serif; font-weight: 900; }
      #root .pt { position: absolute; }
      #root .pt img { position: absolute; inset: 0; width: 100%; height: 100%; }
      #root .relight { position: absolute; inset: 0; -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
      #root .grain { background-image: url("assets/fx/grain.png"); background-size: 512px 512px; opacity: 0.06;
        mix-blend-mode: overlay; pointer-events: none; }
      #root .vignette { background: radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%); pointer-events: none; }
"""

HELPERS = """
        const root = document.querySelector('[data-composition-id="__ID__"]');
        const q = (s) => root.querySelector(s);
        const qa = (s) => Array.from(root.querySelectorAll(s));
        const tl = gsap.timeline({ paused: true });
        const grain = q(".grain");
        for (let i = 0; i * (1 / 12) < __DUR__; i++) {
          tl.set(grain, { backgroundPosition: ((i * 137) % 512) + "px " + ((i * 241) % 512) + "px" }, i / 12);
        }
        // centre every word box horizontally once (left: 50% in CSS)
        gsap.set(qa(".w"), { xPercent: -50 });
        // deterministic decaying camera shake
        const shake = (el, at, amp, dur) => {
          const n = Math.round(dur / 0.033);
          for (let i = 0; i < n; i++) {
            const k = 1 - i / n, s = (i % 2 ? -1 : 1);
            tl.set(el, { x: s * amp * k * ((i * 7) % 5 + 1) / 5, y: -s * amp * 0.6 * k * ((i * 3) % 4 + 1) / 4 }, at + i * 0.033);
          }
          tl.set(el, { x: 0, y: 0 }, at + n * 0.033);
        };
"""


def portrait(cls, src, left, top, scale, relight=None, shadow=None):
    path, w, h = src
    W, H = round(w * scale), round(h * scale)
    style = f"left:{left}px;top:{top}px;width:{W}px;height:{H}px"
    rel = ""
    if relight:
        rel = (f'<div class="relight" data-layout-allow-occlusion style="background:{relight};-webkit-mask-image:url({path});mask-image:url({path})"></div>')
    sh = ""
    if shadow:
        dx, dy, blur, op, skew = shadow
        sh = (f'<div class="pt {cls}-shadow" style="{style};opacity:{op};filter:blur({blur}px);background:#000;'
              f'-webkit-mask-image:url({path});mask-image:url({path});-webkit-mask-size:100% 100%;mask-size:100% 100%"></div>')
        sh = sh.replace(f"left:{left}px;top:{top}px", f"left:{left + dx}px;top:{top + dy}px")
    return sh + (f'<div class="pt {cls}" data-layout-allow-occlusion style="{style}">'
                 f'<img src="{path}" alt="" data-layout-allow-occlusion />{rel}</div>')


def twin(html):
    """Front copy of the back text: identical pixels, deliberately stacked."""
    return (html.replace('class="w ', 'data-layout-allow-overlap aria-hidden="true" class="w ')
                .replace('<text ', '<text data-layout-allow-overlap aria-hidden="true" ')
                .replace('id="s2-arc-b"', 'id="s2-arc-f"'))


def front_mask(y):
    m = f"linear-gradient(to bottom, rgba(0,0,0,0) {y}px, #000 {y + 36}px)"
    return f"-webkit-mask-image:{m};mask-image:{m}"


def scene(sid, dur, css, body, js):
    html = (
        "<template>\n    <style>\n" + FONTS + BASE + css + "\n    </style>\n"
        f'    <div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920" data-duration="{dur}">\n'
        + body
        + f'\n      <div id="{sid}-grain" class="clip layer grain" data-start="0" data-duration="{dur}" data-track-index="8"></div>\n'
        "    </div>\n    <script>\n      (function () {\n"
        + HELPERS.replace("__ID__", sid).replace("__DUR__", str(dur))
        + js
        + f'\n        window.__timelines["{sid}"] = tl;\n      }})();\n    </script>\n</template>\n'
    )
    # every giant word is designed to sit behind the portrait and to be stacked with its twin
    html = (html.replace('class="w ', 'data-layout-allow-occlusion class="w ')
                .replace('<text class=', '<text data-layout-allow-occlusion data-layout-allow-overlap class=')
                .replace('<span class="s5-l', '<span data-layout-allow-occlusion class="s5-l')
                .replace('<textPath ', '<textPath data-layout-allow-overlap data-layout-allow-occlusion '))
    with open(f"{OUT}/{sid}.html", "w") as f:
        f.write(html)
    print("wrote", sid)


def clip(cid, cls, start, dur, track, inner, style=""):
    st = f' style="{style}"' if style else ""
    return (f'      <div id="{cid}" class="clip layer {cls}" data-start="{start}" data-duration="{dur}" '
            f'data-track-index="{track}"{st}>\n{inner}\n      </div>\n')


BLUE_RIGHT = ("linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.25) 38%, rgba(0,0,0,0) 55%, "
              "rgba(10,59,255,0.55) 82%, rgba(90,140,255,0.85) 100%)")
BLUE_SIDE = ("linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.35) 40%, rgba(10,59,255,0.25) 62%, "
             "rgba(40,100,255,0.75) 100%)")
SOFT_LEFT = "linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 40%, rgba(0,10,60,0.35) 100%)"
STUDIO = "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 35%, rgba(0,20,90,0.25) 100%)"

# =============================================================== SCENE 1 — CREATE
scene(
    "s1-intro", 3.75,
    """
      #root .s1-ground { background: #050506; }
      #root .s1-glow { position: absolute; left: -200px; top: 300px; width: 1480px; height: 1500px;
        background: radial-gradient(closest-side, rgba(10,59,255,0.55), rgba(10,59,255,0.18) 55%, rgba(5,5,6,0)); }
      #root .s1-band { position: absolute; left: -260px; top: 900px; width: 1600px; height: 120px; border-radius: 60px;
        background: linear-gradient(90deg, rgba(10,59,255,0) 0%, #0A3BFF 30%, #BFD2FF 50%, #0A3BFF 70%, rgba(10,59,255,0) 100%);
        box-shadow: 0 0 120px 40px rgba(10,59,255,0.65); }
      #root .s1-create { top: 250px; font-size: 470px; color: #FFFFFF; }
      #root .s1-wipe { position: absolute; left: -300px; top: 0; width: 1680px; height: 2600px; background: #F2F3F5; }
""",
    clip("s1-ground", "s1-ground", 0, 3.75, 0, '        <div class="s1-glow"></div>')
    + clip("s1-back", "s1-backl", 0, 3.75, 1, '        <div class="cam s1-camt"><div class="w anton s1-create">CREATE</div></div>')
    + clip("s1-person", "s1-personl", 0, 3.75, 2,
           '        <div class="cam s1-camp">' + portrait("s1-p", PULL, -135, 370, 1.5, BLUE_RIGHT) + '</div>')
    + clip("s1-fx", "s1-fxl", 0, 3.75, 3, '        <div class="s1-band"></div><div class="s1-wipe"></div>'),
    """
        tl.fromTo(q(".s1-band"), { x: -1900, rotation: -12, opacity: 1 }, { x: 1900, rotation: -12, opacity: 1, duration: 0.38, ease: "expo.inOut" }, 0);
        tl.fromTo(q(".s1-glow"), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0.12);
        tl.fromTo(q(".s1-p"), { filter: "brightness(0)" }, { filter: "brightness(1)", duration: 0.9, ease: "power2.out" }, 0.2);
        tl.fromTo(q(".s1-p .relight"), { opacity: 0.2 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.15);
        tl.fromTo(q(".s1-create"), { scaleY: 0, filter: "blur(20px)", transformOrigin: "50% 100%" },
          { scaleY: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, 0.94);
        tl.fromTo(q(".s1-create"), { x: 0 }, { x: -60, duration: 2.81, ease: "none" }, 0.94);
        tl.fromTo(q(".s1-camp"), { scale: 1 }, { scale: 1.08, duration: 3.75, ease: "none" }, 0);
        tl.fromTo(q(".s1-camt"), { scale: 1 }, { scale: 1.1, duration: 3.75, ease: "none" }, 0);
        tl.fromTo(q(".s1-wipe"), { y: 2200, rotation: -8 }, { y: -340, rotation: -8, duration: 0.22, ease: "power3.in" }, 3.53);
""",
)

# =============================================================== SCENE 2 — VISION on a bending arc
ARC_STRAIGHT = "M -300 700 C 160 700, 920 700, 1380 700"
ARC_CURVED = "M -300 470 C 120 1330, 960 1330, 1380 470"
VISION = "VISION VISION VISION VISION"


def arc_svg(pid):
    return (f'<svg class="s2-svg" width="1080" height="1920" viewBox="0 0 1080 1920">'
            f'<path id="{pid}" class="s2-arc" d="{ARC_STRAIGHT}" fill="none" />'
            f'<text class="s2-vtext"><textPath href="#{pid}" class="s2-tp" startOffset="0">{VISION}</textPath></text></svg>')


scene(
    "s2-vision", 3.75,
    """
      #root .s2-ground { background: radial-gradient(90% 60% at 50% 40%, #FFFFFF 0%, #EEF0F3 60%, #E2E5EA 100%); }
      #root .s2-svg { position: absolute; left: 0; top: 0; overflow: visible; }
      #root .s2-vtext { font-family: "Boldonse", sans-serif; font-size: 190px; fill: #3A3D42; }
      #root .s2-ghost { top: 250px; font-size: 96px; color: #C9CED6; opacity: 0.55; }
      #root .s2-iris { position: absolute; left: 140px; top: 560px; width: 800px; height: 800px; border-radius: 50%; background: #0A3BFF; }
""",
    clip("s2-ground", "s2-ground", 0, 3.75, 0, '        <div class="w bold s2-ghost">VISION VISION VISION</div>')
    + clip("s2-back", "s2-backl", 0, 3.75, 1, '        <div class="cam s2-camt">' + arc_svg("s2-arc-b") + '</div>')
    + clip("s2-person", "s2-personl", 0, 3.75, 2,
           '        <div class="cam s2-camp">' + portrait("s2-p", COSTUME, 110, 380, 2.0, None, (46, 26, 16, 0.22, 0)) + '</div>')
    + clip("s2-front", "s2-frontl", 0, 3.75, 3, '        <div class="cam s2-camt">' + twin(arc_svg("s2-arc-f")) + '</div>',
           front_mask(990))
    + clip("s2-fx", "s2-fxl", 0, 3.75, 4, '        <div class="s2-iris"></div>'),
    f"""
        const arcs = qa(".s2-arc"), tps = qa(".s2-tp");
        tl.fromTo(arcs, {{ attr: {{ d: "{ARC_STRAIGHT}" }} }}, {{ attr: {{ d: "{ARC_CURVED}" }}, duration: 2.2, ease: "power2.inOut" }}, 0.3);
        tl.fromTo(tps, {{ attr: {{ startOffset: 120 }} }}, {{ attr: {{ startOffset: -900 }}, duration: 3.45, ease: "none" }}, 0);
        tl.to(tps, {{ attr: {{ startOffset: -1700 }}, duration: 0.3, ease: "power2.in" }}, 3.45);
        tl.fromTo(qa(".s2-vtext"), {{ opacity: 0 }}, {{ opacity: 1, duration: 0.25, ease: "none" }}, 0);
        tl.fromTo(q(".s2-ghost"), {{ x: 0 }}, {{ x: 260, duration: 3.75, ease: "none" }}, 0);
        tl.fromTo(qa(".s2-camt"), {{ x: 0, rotation: 0 }}, {{ x: -40, rotation: 2, duration: 3.75, ease: "sine.inOut" }}, 0);
        tl.fromTo(q(".s2-camp"), {{ x: 0 }}, {{ x: -18, duration: 3.75, ease: "sine.inOut" }}, 0);
        tl.fromTo(q(".s2-p"), {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }}, 0);
        tl.fromTo(q(".s2-p-shadow"), {{ opacity: 0 }}, {{ opacity: 0.22, duration: 0.5, ease: "none" }}, 0.05);
        tl.fromTo(q(".s2-iris"), {{ scale: 0 }}, {{ scale: 3.4, duration: 0.3, ease: "power3.in" }}, 3.45);
""",
)

# =============================================================== SCENE 3 — TIAVINA / NOMENA
names = ('<div class="w anton s3-n s3-n1">TIAVINA</div>'
         '<div class="w anton s3-n s3-n2">NOMENA</div>')
scene(
    "s3-name", 3.75,
    """
      #root .s3-ground { background: radial-gradient(80% 60% at 45% 40%, #2F5BFF 0%, #0A3BFF 45%, #001A8C 100%); }
      #root .s3-world { position: absolute; inset: 0; perspective: 1600px; }
      #root .s3-n { font-size: 300px; color: #FFFFFF; }
      #root .s3-n1 { top: 250px; }
      #root .s3-n2 { top: 1235px; }
""",
    clip("s3-ground", "s3-ground", 0, 3.75, 0, "")
    + clip("s3-back", "s3-backl", 0, 3.75, 1, '        <div class="s3-world"><div class="cam s3-camt">' + names + '</div></div>')
    + clip("s3-person", "s3-personl", 0, 3.75, 2,
           '        <div class="cam s3-camp">' + portrait("s3-p", PULL, 173, 377, 1.15, SOFT_LEFT) + '</div>')
    + clip("s3-front", "s3-frontl", 0, 3.75, 3, '        <div class="s3-world"><div class="cam s3-camt">' + twin(names) + '</div></div>',
           front_mask(1100)),
    """
        tl.set(qa(".s3-n"), { skewX: -8, rotation: -6 }, 0);
        tl.fromTo(qa(".s3-n1"), { x: -1400 }, { x: 0, duration: 0.5, ease: "back.out(1.4)" }, 0.0);
        tl.fromTo(qa(".s3-n2"), { y: 900 }, { y: 0, duration: 0.5, ease: "back.out(1.4)" }, 0.47);
        tl.fromTo(q(".s3-p"), { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "expo.out" }, 0);
        tl.fromTo(qa(".s3-camt"), { scale: 1, rotationY: 0 }, { scale: 1.06, rotationY: 4, duration: 3.4, ease: "sine.inOut" }, 0);
        tl.fromTo(q(".s3-camp"), { scale: 1 }, { scale: 1.03, duration: 3.4, ease: "sine.inOut" }, 0);
        tl.to(qa(".s3-n"), { scaleX: 1.6, filter: "blur(10px)", duration: 0.35, ease: "power3.in" }, 3.4);
        tl.to(q(".s3-camp"), { scale: 1.12, duration: 0.35, ease: "power3.in" }, 3.4);
""",
)

# =============================================================== SCENE 4 — DESIGN / VIDEO / MOTION
RING = ("M -600 0 A 600 470 0 1 1 600 0 A 600 470 0 1 1 -600 0")
ring_text = "MOTION • " * 8


def ring_svg(pid):
    return (f'<svg class="s4-svg" width="1080" height="1920" viewBox="0 0 1080 1920"><g transform="translate(540 1000) rotate(-15)">'
            f'<path id="{pid}" d="{RING}" fill="none" />'
            f'<text class="s4-rtext"><textPath href="#{pid}" class="s4-tp" startOffset="0">{ring_text}</textPath></text></g></svg>')


design = '<div class="w inter s4-design">DESIGN</div>'
video = '<div class="w bold s4-video">VIDEO</div>'
A, B = 1.40625, 2.34375
scene(
    "s4-skills", 3.75,
    """
      #root .s4a-ground { background: radial-gradient(80% 60% at 50% 45%, #2F5BFF 0%, #0A3BFF 50%, #001A8C 100%); }
      #root .s4b-g { position: absolute; inset: 0; background: radial-gradient(90% 60% at 50% 40%, #FFFFFF 0%, #ECEEF2 70%, #DDE1E7 100%); }
      #root .s4c-ground { background: radial-gradient(55% 35% at 50% 52%, rgba(10,59,255,0.55), rgba(5,5,6,0) 100%), #050506; }
      #root .s4-design { top: 1100px; font-size: 330px; color: #FFFFFF; }
      #root .s4-video { top: 205px; font-size: 200px; color: #9AA0A8; }
      #root .s4-svg { position: absolute; left: 0; top: 0; overflow: visible; }
      #root .s4-rtext { font-family: "Inter", sans-serif; font-weight: 900; font-size: 112px; fill: #FFFFFF; letter-spacing: 4px; }
""",
    # shot a — DESIGN
    clip("s4a-ground", "s4a-ground", 0, A, 0, "")
    + clip("s4a-back", "s4a-backl", 0, A, 1, '        <div class="cam s4a-cam">' + design + '</div>')
    + clip("s4a-person", "s4a-personl", 0, A, 2, '        <div class="cam s4a-cam">' + portrait("s4a-p", PULL, 90, 570, 1.0, SOFT_LEFT) + '</div>')
    + clip("s4a-front", "s4a-frontl", 0, A, 3, '        <div class="cam s4a-cam">' + twin(design) + '</div>', front_mask(1200))
    # shot b — VIDEO
    + clip("s4b-ground", "s4b-ground", A, B - A, 0, '        <div class="s4b-g"></div>')
    + clip("s4b-back", "s4b-backl", A, B - A, 1, '        <div class="cam s4b-cam">' + video + '</div>')
    + clip("s4b-person", "s4b-personl", A, B - A, 2,
           '        <div class="cam s4b-cam">' + portrait("s4b-p", COSTUME, -19, 406, 2.6, None, (40, 24, 18, 0.2, 0)) + '</div>')
    # shot c — MOTION ring
    + clip("s4c-ground", "s4c-ground", B, 3.75 - B, 0, "")
    + clip("s4c-back", "s4c-backl", B, 3.75 - B, 1, '        <div class="cam s4c-cam">' + ring_svg("s4-ring-b") + '</div>')
    + clip("s4c-person", "s4c-personl", B, 3.75 - B, 2, '        <div class="cam s4c-cam">' + portrait("s4c-p", PULL, -225, 266, 1.7, BLUE_RIGHT) + '</div>')
    + clip("s4c-front", "s4c-frontl", B, 3.75 - B, 3, '        <div class="cam s4c-cam">' + twin(ring_svg("s4-ring-f")) + '</div>', front_mask(1320)),
    f"""
        // shot a
        tl.set(qa(".s4-design"), {{ skewX: -12, rotation: -10 }}, 0);
        tl.fromTo(qa(".s4a-cam"), {{ scale: 1.25 }}, {{ scale: 1, duration: 0.3, ease: "expo.out" }}, 0);
        tl.fromTo(qa(".s4-design"), {{ scale: 1.4, filter: "blur(18px)" }}, {{ scale: 1, filter: "blur(0px)", duration: 0.28, ease: "expo.out" }}, 0);
        tl.fromTo(qa(".s4-design"), {{ x: 0, y: 0 }}, {{ x: -80, y: 14, duration: 1.1, ease: "none" }}, 0.3);
        // shot b
        tl.fromTo(qa(".s4b-g, .s4b-cam"), {{ clipPath: "polygon(120% 0%, 140% 0%, 120% 100%, 100% 100%)" }},
          {{ clipPath: "polygon(-40% 0%, 140% 0%, 120% 100%, -60% 100%)", duration: 0.2, ease: "power3.out" }}, {A});
        tl.fromTo(q(".s4-video"), {{ scaleX: 2.6 }}, {{ scaleX: 1.6, duration: 0.4, ease: "expo.out" }}, {A});
        tl.fromTo(q(".s4-video"), {{ x: 0 }}, {{ x: 40, duration: {B - A}, ease: "none" }}, {A});
        // shot c
        tl.fromTo(qa(".s4c-cam"), {{ scale: 1.3 }}, {{ scale: 1, duration: 0.25, ease: "expo.out" }}, {B});
        tl.fromTo(qa(".s4-tp"), {{ attr: {{ startOffset: 0 }} }}, {{ attr: {{ startOffset: -700 }}, duration: 1.2, ease: "none" }}, {B});
        tl.to(qa(".s4-tp"), {{ attr: {{ startOffset: -1500 }}, duration: 0.2, ease: "power2.in" }}, {B + 1.2});
""",
)

# =============================================================== SCENE 5 — IMAGINE -> CREATE -> INSPIRE
WORDS = ["IMAGINE", "CREATE", "INSPIRE"]


def letters(word, k):
    return "".join(f'<span class="s5-l s5-w{k}" data-layout-allow-overlap>{c}</span>' for c in word)


wordset = "".join(f'<div class="w anton s5-word s5-word{k}">{letters(wd, k)}</div>' for k, wd in enumerate(WORDS))
scene(
    "s5-ideas", 5.625,
    """
      #root .s5-ground { background: radial-gradient(60% 45% at 85% 45%, rgba(10,59,255,0.55), rgba(5,5,6,0) 70%), #050506; }
      #root .s5-world { position: absolute; inset: 0; perspective: 1400px; }
      #root .s5-plane { position: absolute; inset: 0; filter: url(#s5-disp); }
      #root .s5-word { top: 190px; font-size: 380px; color: #FFFFFF; }
      #root .s5-l { display: inline-block; transform-origin: 50% 100%; }
      #root .s5-ref .s5-word { color: #C9CED6; }
      #root .s5-ref { opacity: 0.1; filter: blur(9px); transform-origin: 540px 340px; }
      #root .s5-wipe { position: absolute; left: 0; top: -200px; width: 1400px; height: 2400px; background: #F5F6F7; }
""",
    clip("s5-ground", "s5-ground", 0, 5.625, 0,
         '        <svg width="0" height="0" style="position:absolute"><filter id="s5-disp" x="-10%" y="-10%" width="120%" height="120%">'
         '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" />'
         '<feDisplacementMap class="s5-dm" in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" /></filter></svg>')
    + clip("s5-reflect", "s5-reflectl", 0, 5.625, 1,
           '        <div class="s5-world"><div class="cam s5-ref">' + twin(wordset.replace("s5-word ", "s5-word s5-rw ")) + '</div></div>')
    + clip("s5-back", "s5-backl", 0, 5.625, 2, '        <div class="s5-world"><div class="cam s5-plane">' + wordset + '</div></div>')
    + clip("s5-person", "s5-personl", 0, 5.625, 3,
           '        <div class="cam s5-camp">' + portrait("s5-p", PULL, -125, 454, 1.3, BLUE_SIDE) + '</div>')
    + clip("s5-fx", "s5-fxl", 0, 5.625, 4, '        <div class="s5-wipe"></div><div class="layer vignette"></div>'),
    """
        const T = [0, 1.875, 3.75];
        [0, 1, 2].forEach((k) => {
          const ls = qa(".s5-w" + k);
          tl.set(ls, { scaleY: 0, opacity: 0 }, 0);
          tl.to(ls, { scaleY: 1, opacity: 1, duration: 0.45, ease: "expo.out", stagger: 0.03 }, T[k] + (k ? 0.1 : 0.05));
          if (k < 2) tl.to(ls, { scaleY: 0, y: -40, opacity: 0, filter: "blur(8px)", duration: 0.28, ease: "power3.in", stagger: 0.03 }, T[k + 1] - 0.12);
        });
        [1.875, 3.75].forEach((t) => {
          tl.fromTo(q(".s5-dm"), { attr: { scale: 0 } }, { attr: { scale: 42 }, duration: 0.17, ease: "power2.in", immediateRender: false }, t - 0.12);
          tl.to(q(".s5-dm"), { attr: { scale: 0 }, duration: 0.25, ease: "power2.out" }, t + 0.05);
        });
        tl.fromTo(qa(".s5-plane"), { rotationY: -12, rotation: -2 }, { rotationY: 12, rotation: 2, duration: 5.625, ease: "sine.inOut" }, 0);
        tl.fromTo(qa(".s5-ref"), { rotationY: -18, rotation: -3, scale: 1.18, x: -60 }, { rotationY: 18, rotation: 3, scale: 1.18, x: 60, duration: 5.625, ease: "sine.inOut" }, 0);
        tl.fromTo(q(".s5-camp"), { scale: 1.04 }, { scale: 1, duration: 5.625, ease: "sine.out" }, 0);
        tl.fromTo(q(".s5-p"), { filter: "brightness(0.2)" }, { filter: "brightness(1)", duration: 0.6, ease: "power2.out" }, 0);
        tl.fromTo(q(".s5-wipe"), { x: 1300, skewX: -10 }, { x: -160, skewX: -10, duration: 0.23, ease: "power3.in" }, 5.395);
""",
)

# =============================================================== SCENE 6 — RHYTHM / CREATIVITY / IMPACT
A6, B6 = 0.9375, 2.34375
rhythm = '<div class="w inter s6-rhythm">RHYTHM</div>'
creat = '<div class="w anton s6-creat">CREATIVITY</div>'
impact = '<div class="w anton s6-impact">IMPACT</div>'
HARD = (110, 10, 0, 0.16, 0)
scene(
    "s6-impact", 3.75,
    """
      #root .s6-ground { background: radial-gradient(90% 60% at 50% 40%, #FFFFFF 0%, #F0F1F3 70%, #E3E6EA 100%); }
      #root .s6-rhythm { top: 330px; font-size: 300px; color: #050506; }
      #root .s6-creat { top: 300px; font-size: 230px; color: #050506; }
      #root .s6-impact { top: 70px; font-size: 400px; color: #050506; }
      #root .s6-blue { position: absolute; inset: 0; background: #0A3BFF; opacity: 0; }
""",
    clip("s6-ground", "s6-ground", 0, 3.75, 0, "")
    + clip("s6a-back", "s6a-backl", 0, A6, 1, '        <div class="cam s6a-cam">' + rhythm + '</div>')
    + clip("s6a-person", "s6a-personl", 0, A6, 2, '        <div class="cam s6a-cam">' + portrait("s6a-p", COSTUME, 67, 562, 2.2, None, HARD) + '</div>')
    + clip("s6b-back", "s6b-backl", A6, B6 - A6, 1, '        <div class="cam s6b-cam">' + creat + '</div>')
    + clip("s6b-person", "s6b-personl", A6, B6 - A6, 2, '        <div class="cam s6b-cam">' + portrait("s6b-p", PULL, 90, 580, 1.0, None, HARD) + '</div>')
    + clip("s6c-back", "s6c-backl", B6, 3.75 - B6, 1, '        <div class="cam s6c-cam">' + impact + '</div>')
    + clip("s6c-person", "s6c-personl", B6, 3.75 - B6, 2, '        <div class="cam s6c-cam">' + portrait("s6c-p", PULL, -270, 394, 1.8, None, HARD) + '</div>')
    + clip("s6-fx", "s6-fxl", 0, 3.75, 4, '        <div class="s6-blue"></div>'),
    f"""
        tl.set(q(".s6-rhythm"), {{ skewX: -12 }}, 0);
        tl.fromTo(q(".s6-rhythm"), {{ x: 420 }}, {{ x: -420, duration: {A6}, ease: "none" }}, 0);
        tl.fromTo(q(".s6a-cam"), {{ scale: 1.08 }}, {{ scale: 1, duration: 0.3, ease: "expo.out" }}, 0);
        tl.set(q(".s6-creat"), {{ scaleY: 1.3, transformOrigin: "50% 100%" }}, 0);
        tl.fromTo(q(".s6-creat"), {{ x: -70 }}, {{ x: 70, duration: {B6 - A6 - 0.22}, ease: "power1.out" }}, {A6});
        tl.fromTo(q(".s6b-cam"), {{ scale: 1.08 }}, {{ scale: 1, duration: 0.3, ease: "expo.out" }}, {A6});
        tl.fromTo(q(".s6-impact"), {{ scale: 1.3 }}, {{ scale: 1, duration: 0.18, ease: "expo.out" }}, {B6});
        shake(q(".s6c-cam"), {B6 + 0.02}, 14, 0.3);
        tl.to(q(".s6-impact"), {{ scale: 5, duration: 0.32, ease: "power3.in", transformOrigin: "52% 60%" }}, 3.43);
        tl.to(q(".s6-blue"), {{ opacity: 1, duration: 0.14, ease: "power2.in" }}, 3.61);
""",
)

# =============================================================== SCENE 7 — signature
sig_words = ["CRÉER", "AVEC", "IMPACT."]
sig = "".join(f'<span class="s7-sw">{w}</span>' for w in sig_words)
scene(
    "s7-signature", 5.625,
    """
      #root .s7-ground { background: radial-gradient(60% 40% at 50% 46%, #3E6BFF 0%, #0A3BFF 50%, #001A8C 100%); }
      #root .s7-halo { position: absolute; left: 90px; top: 520px; width: 900px; height: 900px;
        background: radial-gradient(closest-side, rgba(255,255,255,0.30), rgba(255,255,255,0)); }
      #root .s7-n { font-size: 300px; background: linear-gradient(100deg, #FFFFFF 42%, #CFE0FF 50%, #FFFFFF 58%);
        background-size: 300% 100%; background-position: 100% 50%; -webkit-background-clip: text; background-clip: text; color: transparent; }
      #root .s7-n1 { top: 250px; }
      #root .s7-n2 { top: 520px; }
      #root .s7-sig { position: absolute; left: 0; right: 0; top: 1430px; text-align: center; font-family: "InstrumentSansBI", sans-serif;
        font-size: 66px; letter-spacing: 0.08em; color: #FFFFFF; text-shadow: 0 6px 30px rgba(0,0,40,0.5); }
      #root .s7-sw { display: inline-block; margin: 0 0.18em; }
""",
    clip("s7-ground", "s7-ground", 0, 5.625, 0, '        <div class="s7-halo"></div>')
    + clip("s7-back", "s7-backl", 0, 5.625, 1,
           '        <div class="cam s7-cam"><div class="w anton s7-n s7-n1">TIAVINA</div><div class="w anton s7-n s7-n2">NOMENA</div></div>')
    + clip("s7-person", "s7-personl", 0, 5.625, 2,
           '        <div class="cam s7-cam">' + portrait("s7-p", COSTUME, 132, 741, 1.9, STUDIO) + '</div>')
    + clip("s7-front", "s7-frontl", 0, 5.625, 3, f'        <div class="cam s7-cam"><div class="s7-sig">{sig}</div></div>')
    + clip("s7-fx", "s7-fxl", 0, 5.625, 4, '        <div class="layer vignette"></div>'),
    """
        tl.fromTo(qa(".s7-cam"), { scale: 1.12 }, { scale: 1, duration: 5.625, ease: "power2.out" }, 0);
        tl.fromTo(qa(".s7-n"), { scaleX: 1.5, opacity: 0, filter: "blur(10px)" },
          { scaleX: 1, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "back.out(1.3)", stagger: 0.12 }, 0.05);
        tl.fromTo(q(".s7-p"), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "expo.out" }, 0);
        tl.fromTo(qa(".s7-sw"), { y: 30, opacity: 0, filter: "blur(6px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "expo.out", stagger: 0.24 }, 1.925);
        tl.fromTo(qa(".s7-n"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 0.9, ease: "power2.inOut", immediateRender: false }, 3.75);
        tl.fromTo(q(".s7-halo"), { opacity: 0.6 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 3.75);
""",
)

# =============================================================== index.html
SCENES = [("s1-intro", 0, 3.75), ("s2-vision", 3.75, 3.75), ("s3-name", 7.5, 3.75), ("s4-skills", 11.25, 3.75),
          ("s5-ideas", 15.0, 5.625), ("s6-impact", 20.625, 3.75), ("s7-signature", 24.375, 5.625)]
VO = [0.50, 3.95, 7.75, 11.25, 12.65, 13.60, 15.35, 20.65, 21.57, 23.00, 24.80, 26.25]
VO_DUR = [1.467, 1.796, 0.918, 0.85, 0.703, 1.151, 1.652, 0.911, 1.0, 1.093, 0.899, 1.648]
hosts = "\n".join(
    f'      <div id="el-{s}" class="scene" data-composition-id="{s}" data-composition-src="compositions/scenes/{s}.html" '
    f'data-start="{st}" data-duration="{d}" data-track-index="1" data-width="1080" data-height="1920"></div>'
    for s, st, d in SCENES)
vos = "\n".join(
    f'      <audio id="el-vo{i + 1:02d}" src="assets/audio/vo/vo{i + 1:02d}.wav" data-start="{t}" data-duration="{d}" '
    f'data-track-index="10" data-volume="1" data-audio-group="voiceover"></audio>'
    for i, (t, d) in enumerate(zip(VO, VO_DUR)))
index = f"""<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #050506; }}
      .scene {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="30" data-width="1080" data-height="1920">
{hosts}
      <!-- music: placeholder bed, replace assets/audio/music.wav with the licensed track -->
      <audio id="el-music" src="assets/audio/music.wav" data-start="0" data-duration="30" data-track-index="11" data-volume="0.55"></audio>
      <audio id="el-sfx" src="assets/audio/sfx.wav" data-start="0" data-duration="30" data-track-index="12" data-volume="0.9"></audio>
{vos}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
# index.html carries the voiceover carve written by hyperframes-audio/scripts/carve.mjs;
# only rebuild it on request (then re-run the carve).
import sys  # noqa: E402
if "--index" in sys.argv or not os.path.exists("index.html"):
    with open("index.html", "w") as f:
        f.write(index)
    print("wrote index.html (re-run carve.mjs --comp ./index.html --bed el-music)")
