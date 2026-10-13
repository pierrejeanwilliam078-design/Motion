"""Generate the 9 frame sub-compositions for the DigitalSubMG ad.

Run from the project root:  python3 -I tools/build_frames.py
Each output file is one bare <template> fragment (frame-worker contract).
Shared pieces (fonts, ground, grain, helpers) are injected so every frame
is self-contained. Edit this file, re-run, then `npx hyperframes check`.
"""
import math
import os

OUT = "compositions/frames"
os.makedirs(OUT, exist_ok=True)

FONT_FACES = "\n".join(
    f'      @font-face {{ font-family: "Inter"; font-weight: {w}; font-style: normal; font-display: block; '
    f'src: url("assets/fonts/inter-latin-{w}-normal.woff2") format("woff2"); }}'
    for w in (400, 500, 600, 700, 800, 900)
)

BASE_CSS = """
      #root { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden;
        font-family: "Inter", sans-serif; color: #F5F7FA; -webkit-font-smoothing: antialiased; }
      #root .layer { position: absolute; inset: 0; width: 100%; height: 100%; }
      #root .grain { background-image: url("assets/fx/grain.png"); background-size: 512px 512px;
        opacity: 0.055; mix-blend-mode: overlay; pointer-events: none; }
      #root .grad { background: linear-gradient(90deg, #00F0FF 0%, #3D7BFF 45%, #8A3DFF 75%, #E600FF 100%);
        background-size: 200% 100%; background-position: 0% 50%; -webkit-background-clip: text;
        background-clip: text; color: transparent; }
      #root .glass { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
        border-radius: 28px; box-shadow: 0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
        backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
      #root .center-x { position: absolute; left: 0; right: 0; text-align: center; }
      #root .label { font-size: 24px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #9AA3B2; }
      #root .watermark { position: absolute; left: 0; right: 0; top: 118px; margin: 0 auto; height: 72px;
        width: 52px; opacity: 0.38; }
      #root .shine { position: absolute; top: -20%; left: 0; width: 22%; height: 140%;
        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 100%);
        pointer-events: none; opacity: 0; }
"""

JS_HELPERS = """
        const root = document.querySelector('[data-composition-id="__ID__"]');
        const q = (s) => root.querySelector(s);
        const qa = (s) => Array.from(root.querySelectorAll(s));
        const tl = gsap.timeline({ paused: true });
        // film grain: deterministic jitter of the texture, 12 steps per second
        const grain = q(".grain");
        for (let i = 0; i * (1 / 12) < __DUR__; i++) {
          const gx = (i * 137) % 512, gy = (i * 241) % 512;
          tl.set(grain, { backgroundPosition: gx + "px " + gy + "px" }, i / 12);
        }
        const count = (el, from, to, fmt, at, dur, ease) => {
          const o = { v: from };
          el.textContent = fmt(from);
          tl.to(o, { v: to, duration: dur, ease: ease || "expo.out",
            onUpdate: () => { el.textContent = fmt(o.v); } }, at);
        };
        const shine = (el, at) => {
          tl.fromTo(el, { xPercent: -160, skewX: -20, opacity: 1 },
            { xPercent: 560, skewX: -20, opacity: 1, duration: 0.75, ease: "power2.inOut" }, at);
        };
        const draw = (els, at, dur) => {
          tl.fromTo(els, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur || 0.45,
            ease: "power2.out", stagger: 0.06 }, at);
        };
"""


def frame(fid, dur, css, ground, body, js):
    head = (
        "<template>\n    <style>\n" + FONT_FACES + "\n" + BASE_CSS + css + "\n    </style>\n"
        f'    <div id="root" data-composition-id="{fid}" data-width="1080" data-height="1920" data-duration="{dur}">\n'
        f'      <div id="f{fid[:2]}-ground" class="clip layer f{fid[:2]}ground" data-start="0" data-duration="{dur}" data-track-index="0">{ground}</div>\n'
        f'      <div id="f{fid[:2]}-stage" class="clip layer f{fid[:2]}stage" data-start="0" data-duration="{dur}" data-track-index="1">\n{body}\n      </div>\n'
        f'      <div id="f{fid[:2]}-grain" class="clip layer grain" data-start="0" data-duration="{dur}" data-track-index="2"></div>\n'
        "    </div>\n    <script>\n      (function () {\n"
        + JS_HELPERS.replace("__ID__", fid).replace("__DUR__", str(dur))
        + js
        + f'\n        window.__timelines["{fid}"] = tl;\n      }})();\n    </script>\n</template>\n'
    )
    with open(f"{OUT}/{fid}.html", "w") as f:
        f.write(head)
    print("wrote", fid)


def svg_icon(paths, cls, size=48, stroke="#F5F7FA", width=2):
    inner = ""
    for p in paths:
        if p.startswith("circle:"):
            cx, cy, r = p[7:].split(",")
            inner += f'<circle cx="{cx}" cy="{cy}" r="{r}" pathLength="1" />'
        elif p.startswith("rect:"):
            x, y, w, h, rx = p[5:].split(",")
            inner += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" pathLength="1" />'
        else:
            inner += f'<path d="{p}" pathLength="1" />'
    return (f'<svg class="{cls}" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{stroke}" '
            f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" '
            f'style="stroke-dasharray:1;stroke-dashoffset:0">{inner}</svg>')


ICONS = {
    "bolt": ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
    "shield": ["M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3z", "m9 12 2 2 4-4"],
    "headset": ["M3 14v-2a9 9 0 0 1 18 0v2", "M21 14v4a2 2 0 0 1-2 2h-1v-6h3z", "M3 14v4a2 2 0 0 0 2 2h1v-6H3z"],
    "users": ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "circle:9,7,4", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    "tag": ["M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z", "circle:7,7,1.5"],
    "check": ["m6 12.5 4 4 8-9"],
    "card": ["rect:3,5,18,14,2", "M3 10h18"],
    "box": ["M21 8 12 3 3 8v8l9 5 9-5V8z", "M3 8l9 5 9-5", "M12 13v8"],
    "truck": ["M2 6h12v10H2z", "M14 10h4l3 3v3h-7z", "circle:6,17.5,2", "circle:17,17.5,2"],
}

LOGO_HTML = """<div class="__P__logo">
          <img class="__P__sym" src="assets/brand/logo-symbol.png" alt="" />
          <img class="__P__word" src="assets/brand/logo-wordmark.png" alt="" />
        </div>"""
LOGO_CSS = """
      #root .__P__logo { position: absolute; left: 90px; width: 900px; height: 420px; }
      #root .__P__sym { position: absolute; left: 1px; top: 4px; width: 297px; height: 416px;
        filter: drop-shadow(0 0 28px rgba(0,180,255,0.35)); }
      #root .__P__word { position: absolute; left: 298px; top: 50px; width: 598px; height: 286px; }
"""

WATERMARK = '<img class="watermark" src="assets/brand/logo-symbol.png" alt="" />'

# ------------------------------------------------------------------ Frame 1
frags = []
cols = ["#00F0FF", "#005EFE", "#5A00FE", "#E600FF"]
for i in range(24):
    frags.append(f'<div class="f01frag" style="background:linear-gradient(180deg,{cols[i % 4]},{cols[(i + 1) % 4]})"></div>')
frame(
    "01-hook", 3.75,
    LOGO_CSS.replace("__P__", "f01") + """
      #root .f01ground { background: #05060A; }
      #root .f01glow { position: absolute; left: -200px; top: 380px; width: 1480px; height: 1200px;
        background: radial-gradient(closest-side, rgba(90,0,254,0.42), rgba(0,94,254,0.18) 55%, rgba(5,6,10,0) 100%); opacity: 0; }
      #root .f01logo { top: 760px; }
      #root .f01spark { position: absolute; left: 529px; top: 959px; width: 22px; height: 22px; border-radius: 50%;
        background: #E9FEFF; box-shadow: 0 0 30px 10px rgba(0,240,255,0.85), 0 0 90px 30px rgba(0,94,254,0.5); }
      #root .f01ring { position: absolute; left: 440px; top: 870px; width: 200px; height: 200px; border-radius: 50%;
        border: 2px solid rgba(0,240,255,0.9); box-shadow: 0 0 24px rgba(0,240,255,0.5); }
      #root .f01frag { position: absolute; left: 535px; top: 947px; width: 10px; height: 46px; border-radius: 6px;
        box-shadow: 0 0 14px rgba(0,240,255,0.5); }
      #root .f01seam { position: absolute; left: 0; top: 0; width: 1080px; height: 8px;
        background: linear-gradient(90deg, rgba(0,240,255,0) 0%, #00F0FF 30%, #E9FEFF 50%, #8A3DFF 70%, rgba(230,0,255,0) 100%);
        box-shadow: 0 0 40px 12px rgba(0,180,255,0.55); opacity: 0; }
""",
    '<div class="f01glow"></div>',
    "        " + LOGO_HTML.replace("__P__", "f01") + """
        <div class="f01ring"></div>
        <div class="f01spark"></div>
        """ + "\n        ".join(frags) + """
        <div class="f01seam"></div>""",
    """
        const C = { x: 540, y: 970 };
        tl.fromTo(q(".f01spark"), { scale: 0 }, { scale: 1, duration: 0.25, ease: "back.out(2)" }, 0);
        tl.fromTo(q(".f01ring"), { scale: 0.08, opacity: 0.95 }, { scale: 7, opacity: 0, duration: 1.0, ease: "expo.out" }, 0.04);
        qa(".f01frag").forEach((el, i) => {
          const a = (i * 15 + 7) * Math.PI / 180, r = 560 + (i % 3) * 150;
          tl.fromTo(el, { x: Math.cos(a) * r, y: Math.sin(a) * r, rotation: i * 15 + 97, opacity: 0, scale: 1.2 },
            { x: 0, y: 0, rotation: i * 15 + 97, opacity: 1, scale: 0.35, duration: 1.15, ease: "power3.in" }, 0.3 + (i % 6) * 0.025);
          tl.to(el, { opacity: 0, duration: 0.18, ease: "none" }, 1.5);
        });
        tl.to(q(".f01spark"), { scale: 4, opacity: 0, duration: 0.3, ease: "power2.out" }, 1.52);
        tl.fromTo(q(".f01glow"), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1.0, ease: "expo.out" }, 1.5);
        tl.fromTo(q(".f01sym"), { clipPath: "inset(0% 0% 100% 0%)", scale: 0.92, x: 300 },
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, x: 300, duration: 0.8, ease: "power3.out" }, 1.6);
        tl.to(q(".f01sym"), { x: 0, duration: 0.45, ease: "expo.inOut" }, 2.22);
        tl.fromTo(q(".f01word"), { clipPath: "inset(0% 100% 0% 0%)", x: -30 },
          { clipPath: "inset(0% 0% 0% 0%)", x: 0, duration: 0.6, ease: "expo.out" }, 2.64);
        tl.fromTo(q(".f01logo"), { scale: 1 }, { scale: 1.06, duration: 0.85, ease: "none" }, 2.9);
        tl.to(q(".f01logo"), { y: -140, opacity: 0, duration: 0.4, ease: "power2.in" }, 3.35);
        tl.to(q(".f01glow"), { opacity: 0.25, duration: 0.4, ease: "none" }, 3.35);
        tl.fromTo(q(".f01seam"), { y: 1940, opacity: 1 }, { y: -40, opacity: 1, duration: 0.42, ease: "power2.in", immediateRender: false }, 3.33);
""",
)

# ------------------------------------------------------------------ Frame 2
cursor_svg = ('<svg class="f02cursor" width="72" height="72" viewBox="0 0 24 24"><path d="M4 2.5 19.5 12l-7 1.6L9 20.5z" '
              'fill="#F5F7FA" stroke="#05060A" stroke-width="1.2" stroke-linejoin="round"/></svg>')
frame(
    "02-message", 3.75,
    """
      #root .f02ground { background: radial-gradient(120% 55% at 50% 102%, rgba(1,50,142,0.75) 0%, rgba(7,18,51,0.55) 40%, rgba(5,6,10,1) 75%), #05060A; }
      #root .f02glow2 { position: absolute; right: -260px; top: 120px; width: 760px; height: 760px;
        background: radial-gradient(closest-side, rgba(90,0,254,0.30), rgba(90,0,254,0)); }
      #root .f02cam { position: absolute; inset: 0; }
      #root .f02badge { position: absolute; top: 500px; left: 0; right: 0; margin: 0 auto; width: 430px; height: 64px;
        border-radius: 999px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.04);
        display: flex; align-items: center; justify-content: center; gap: 14px;
        font-size: 22px; font-weight: 800; letter-spacing: 0.14em; color: #F5F7FA; }
      #root .f02dot { width: 12px; height: 12px; border-radius: 50%; background: #25D366; box-shadow: 0 0 12px #25D366; }
      #root .f02line { position: absolute; left: 0; right: 0; text-align: center; white-space: nowrap; }
      #root .f02l1 { top: 610px; font-size: 92px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
      #root .f02l2 { top: 712px; font-size: 176px; font-weight: 900; letter-spacing: -0.045em; line-height: 1.05; }
      #root .f02l3 { top: 918px; font-size: 92px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
      #root .f02w { display: inline-block; position: relative; margin: 0 0.12em; }
      #root .f02l2 .f02w { padding: 0 0.04em; }
      #root .f02cursor { position: absolute; left: 62%; top: 52%; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.6)); }
      #root .f02ripple { position: absolute; left: 50%; top: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px;
        border-radius: 50%; border: 3px solid #00F0FF; box-shadow: 0 0 20px rgba(0,240,255,0.7); opacity: 0; }
      #root .f02sub { position: absolute; top: 1090px; left: 120px; width: 840px; text-align: center;
        font-size: 36px; font-weight: 500; line-height: 1.35; color: #9AA3B2; }
      #root .f02bloom { position: absolute; left: -460px; top: 380px; width: 2000px; height: 1600px;
        background: radial-gradient(closest-side, rgba(0,94,254,0.95), rgba(0,94,254,0.5) 40%, rgba(5,6,10,0) 100%); opacity: 0; }
""",
    '<div class="f02glow2"></div>',
    """        <div class="f02cam">
          <div class="f02badge"><span class="f02dot"></span>N°1 À MADAGASCAR</div>
          <div class="f02line f02l1"><span class="f02w">Vos</span><span class="f02w">abonnements</span></div>
          <div class="f02line f02l2"><span class="f02w grad f02prem">premium</span></div>
          <div class="f02line f02l3"><span class="f02w">en</span><span class="f02w">un</span><span class="f02w f02clic">clic<span class="f02ripple"></span>""" + cursor_svg + """</span></div>
          <div class="f02sub">Netflix, Prime Video, ChatGPT, Spotify et plus</div>
        </div>
        <div class="f02bloom"></div>""",
    """
        tl.fromTo(q(".f02cam"), { scale: 1 }, { scale: 1.07, duration: 3.75, ease: "none" }, 0);
        tl.fromTo(q(".f02badge"), { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 0.05);
        const w = qa(".f02w");
        const times = [0.28, 0.40, 0.94, 1.22, 1.30, 1.41];
        w.forEach((el, i) => {
          tl.fromTo(el, { y: 70, opacity: 0, filter: "blur(10px)" },
            { y: 0, opacity: 1, filter: "blur(0px)", duration: i === 2 ? 0.7 : 0.55, ease: "expo.out" }, times[i]);
        });
        tl.fromTo(q(".f02prem"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 1.6, ease: "power2.out" }, 0.94);
        tl.fromTo(q(".f02cursor"), { x: 320, y: 360, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 1.42);
        tl.to(q(".f02cursor"), { scale: 0.82, duration: 0.07, ease: "power2.in" }, 1.84);
        tl.to(q(".f02cursor"), { scale: 1, duration: 0.18, ease: "back.out(2)" }, 1.91);
        tl.fromTo(q(".f02ripple"), { scale: 0.3, opacity: 1 }, { scale: 5, opacity: 0, duration: 0.6, ease: "expo.out" }, 1.85);
        tl.to(q(".f02clic"), { color: "#00F0FF", textShadow: "0 0 30px rgba(0,240,255,0.65)", duration: 0.25, ease: "power2.out" }, 1.86);
        tl.fromTo(q(".f02sub"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, 2.25);
        tl.to(q(".f02cursor"), { opacity: 0, duration: 0.3, ease: "none" }, 2.6);
        tl.fromTo(q(".f02bloom"), { scale: 0.25, opacity: 0 }, { scale: 1.3, opacity: 1, duration: 0.4, ease: "power2.in" }, 3.35);
""",
)

# ------------------------------------------------------------------ Frame 3
services = [
    ("Netflix", "#E50914", 100, 450, 1),
    ("Prime Video", "#00A8E1", 520, 650, -1),
    ("ChatGPT", "#10A37F", 100, 850, 1),
    ("Spotify", "#1DB954", 520, 1050, -1),
    ("Canva Pro", "#8B3DFF", 100, 1250, 1),
]
cards = "\n".join(
    f'          <div class="f03card glass" style="left:{x}px;top:{y}px;--c:{c}"><div class="f03halo"></div>'
    f'<div class="f03orb"></div><div class="f03name">{n}</div><div class="f03tag">Premium</div><div class="shine"></div></div>'
    for n, c, x, y, s in services
)
frame(
    "03-produits", 5.625,
    """
      #root .f03ground { background: radial-gradient(70% 40% at 20% 30%, rgba(90,0,254,0.22), rgba(5,6,10,0) 70%),
        radial-gradient(70% 45% at 85% 75%, rgba(0,94,254,0.22), rgba(5,6,10,0) 70%), #05060A; }
      #root .f03world { position: absolute; inset: 0; perspective: 1600px; perspective-origin: 50% 45%; }
      #root .f03group { position: absolute; inset: 0; transform-style: preserve-3d; }
      #root .f03card { position: absolute; width: 460px; height: 220px; overflow: hidden; }
      #root .f03halo { position: absolute; left: -60px; top: -60px; width: 300px; height: 300px;
        background: radial-gradient(closest-side, var(--c), rgba(0,0,0,0)); opacity: 0.35; }
      #root .f03orb { position: absolute; left: 36px; top: 34px; width: 64px; height: 64px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #ffffff 0%, var(--c) 35%, rgba(0,0,0,0.6) 100%);
        box-shadow: 0 0 30px var(--c); }
      #root .f03name { position: absolute; left: 36px; top: 118px; font-size: 52px; font-weight: 800; letter-spacing: -0.02em; }
      #root .f03tag { position: absolute; right: 32px; top: 46px; font-size: 20px; font-weight: 800; letter-spacing: 0.16em;
        text-transform: uppercase; color: #9AA3B2; border: 1px solid rgba(255,255,255,0.16); border-radius: 999px; padding: 8px 16px; }
      #root .f03h { position: absolute; left: 0; right: 0; text-align: center; font-size: 74px; font-weight: 800;
        letter-spacing: -0.03em; line-height: 1; white-space: nowrap; }
      #root .f03h1 { top: 236px; }
      #root .f03h2 { top: 322px; }
      #root .f03bloom { position: absolute; inset: 0; background: radial-gradient(60% 50% at 50% 55%, rgba(0,94,254,0.95), rgba(0,94,254,0.45) 50%, rgba(5,6,10,0.2) 100%); }
      #root .f03dark { position: absolute; inset: 0; background: #071233; opacity: 0; }
""",
    "",
    "        " + WATERMARK + """
        <div class="f03h f03h1">Tous vos services.</div>
        <div class="f03h f03h2 grad">Un seul endroit.</div>
        <div class="f03world"><div class="f03group">
""" + cards + """
        </div></div>
        <div class="f03bloom"></div>
        <div class="f03dark"></div>""",
    """
        tl.fromTo(q(".f03bloom"), { opacity: 1 }, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0);
        tl.fromTo(q(".watermark"), { opacity: 0 }, { opacity: 0.38, duration: 0.6, ease: "none" }, 0.2);
        const signs = [1, -1, 1, -1, 1];
        qa(".f03card").forEach((el, i) => {
          const t0 = i * 0.46875, s = signs[i];
          tl.fromTo(el, { z: -1400, rotationY: 30 * s, rotationX: 12, opacity: 0 },
            { z: 0, rotationY: 8 * s, rotationX: 0, opacity: 1, duration: 0.95, ease: "expo.out" }, t0);
          shine(el.querySelector(".shine"), t0 + 0.25);
          let t = t0 + 0.95, k = 0;
          while (t < 5.0) {
            const d = Math.min(1.25, 5.0 - t);
            tl.to(el, { y: (k % 2 === 0 ? -9 : 9) * s, rotationZ: (k % 2 === 0 ? 1.2 : -1.2) * s, duration: d, ease: "sine.inOut" }, t);
            t += d; k++;
          }
        });
        tl.fromTo(q(".f03group"), { rotationY: -7 }, { rotationY: 6, duration: 5.0, ease: "sine.inOut" }, 0);
        tl.fromTo(q(".f03h1"), { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, 3.75);
        tl.fromTo(q(".f03h2"), { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, 3.95);
        tl.fromTo(q(".f03h2"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 1.2, ease: "power2.out" }, 3.95);
        tl.to(q(".f03group"), { scale: 3.4, filter: "blur(14px)", duration: 0.6, ease: "power3.in", transformOrigin: "330px 560px" }, 5.0);
        tl.to([q(".f03h1"), q(".f03h2"), q(".watermark")], { opacity: 0, duration: 0.3, ease: "none" }, 5.05);
        tl.to(q(".f03dark"), { opacity: 1, duration: 0.25, ease: "power2.in" }, 5.375);
""",
)

# ------------------------------------------------------------------ Frame 4
tiles = [("Netflix", "#E50914", 24, 110), ("Prime Video", "#00A8E1", 266, 110),
         ("ChatGPT", "#10A37F", 24, 330), ("Spotify", "#1DB954", 266, 330)]
tile_html = "\n".join(
    f'              <div class="f04tile{" f04pick" if i == 0 else ""}" style="left:{x}px;top:{y}px;--c:{c}"><div class="f04orb"></div><div class="f04tname">{n}</div></div>'
    for i, (n, c, x, y) in enumerate(tiles)
)
cart_svg = svg_icon(["M3 4h2l2.4 11h11l2-8H6.2", "circle:9,19.5,1.4", "circle:17,19.5,1.4"], "f04carticon", 38, "#F5F7FA", 1.8)
frame(
    "04-achat", 5.625,
    """
      #root .f04ground { background: radial-gradient(60% 40% at 50% 50%, rgba(0,94,254,0.20), rgba(5,6,10,0) 70%),
        radial-gradient(50% 30% at 50% 95%, rgba(90,0,254,0.25), rgba(5,6,10,0) 70%), #05060A; }
      #root .f04h { position: absolute; left: 0; right: 0; top: 232px; text-align: center; font-size: 66px; font-weight: 800;
        letter-spacing: -0.03em; white-space: nowrap; }
      #root .f04world { position: absolute; inset: 0; perspective: 1800px; }
      #root .f04phone { position: absolute; left: 270px; top: 352px; width: 540px; height: 1000px; border-radius: 74px;
        background: #0B0D14; border: 10px solid #1A1D27;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.06), 0 60px 120px rgba(0,0,0,0.6), 0 0 120px rgba(0,94,254,0.25); }
      #root .f04screen { position: absolute; inset: 10px; border-radius: 58px; overflow: hidden; background: #05060A; }
      #root .f04bar { position: absolute; left: 0; right: 0; top: 0; height: 96px; border-bottom: 1px solid rgba(255,255,255,0.08); }
      #root .f04barlogo { position: absolute; left: 30px; top: 30px; height: 44px; width: 32px; }
      #root .f04barname { position: absolute; left: 74px; top: 38px; font-size: 24px; font-weight: 800; }
      #root .f04cart { position: absolute; right: 26px; top: 26px; width: 52px; height: 52px; border-radius: 50%;
        background: #F5F7FA; display: flex; align-items: center; justify-content: center; }
      #root .f04cart .f04carticon { stroke: #05060A; }
      #root .f04badge { position: absolute; right: -6px; top: -8px; width: 28px; height: 28px; border-radius: 50%;
        background: #00F0FF; color: #05060A; font-size: 17px; font-weight: 900; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 14px rgba(0,240,255,0.8); }
      #root .f04s { position: absolute; left: 0; right: 0; top: 96px; bottom: 0; }
      #root .f04pill { position: absolute; left: 0; right: 0; top: 70px; margin: 0 auto; width: 280px; height: 44px; border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.16); font-size: 15px; font-weight: 800; letter-spacing: 0.14em;
        display: flex; align-items: center; justify-content: center; gap: 10px; }
      #root .f04title { position: absolute; left: 30px; right: 30px; top: 150px; text-align: center; font-size: 50px; font-weight: 900;
        letter-spacing: -0.03em; line-height: 1.02; }
      #root .f04title .f04gr { color: #9AA3B2; }
      #root .f04btn { position: absolute; left: 60px; width: 400px; height: 84px; border-radius: 20px; display: flex; align-items: center;
        justify-content: center; font-size: 27px; font-weight: 800; }
      #root .f04btnw { top: 418px; background: #F5F7FA; color: #05060A; }
      #root .f04btng { top: 600px; background: linear-gradient(90deg, #00C2FF, #5A00FE); color: #F5F7FA;
        box-shadow: 0 0 30px rgba(0,180,255,0.4); }
      #root .f04gtitle { position: absolute; left: 30px; top: 36px; font-size: 36px; font-weight: 800; }
      #root .f04tile { position: absolute; width: 230px; height: 200px; border-radius: 24px; background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12); overflow: hidden; }
      #root .f04orb { position: absolute; left: 22px; top: 22px; width: 52px; height: 52px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff 0%, var(--c) 35%, rgba(0,0,0,0.6) 100%); box-shadow: 0 0 22px var(--c); }
      #root .f04tname { position: absolute; left: 22px; top: 120px; font-size: 28px; font-weight: 800; }
      #root .f04porb { position: absolute; left: 0; right: 0; top: 60px; margin: 0 auto; width: 130px; height: 130px; border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff 0%, #E50914 35%, rgba(0,0,0,0.6) 100%); box-shadow: 0 0 60px #E50914; }
      #root .f04pname { position: absolute; left: 0; right: 0; top: 230px; text-align: center; font-size: 42px; font-weight: 900; letter-spacing: -0.02em; }
      #root .f04pdev { position: absolute; left: 0; right: 0; top: 292px; text-align: center; font-size: 26px; font-weight: 500; color: #9AA3B2; }
      #root .f04price { position: absolute; left: 0; right: 0; top: 380px; text-align: center; font-size: 84px; font-weight: 900; letter-spacing: -0.04em; }
      #root .f04tap { position: absolute; width: 92px; height: 92px; margin: -46px 0 0 -46px; border-radius: 50%;
        background: rgba(255,255,255,0.22); border: 2px solid rgba(255,255,255,0.7); opacity: 0; }
      #root .f04steps { position: absolute; left: 80px; top: 1404px; width: 920px; height: 72px; }
      #root .f04step { position: absolute; top: 0; width: 290px; height: 72px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.04); display: flex; align-items: center; justify-content: center;
        font-size: 28px; font-weight: 800; color: #F5F7FA; }
      #root .f04step b { color: #00F0FF; margin-right: 10px; }
""",
    "",
    """        <div class="f04h">Commander en <span class="grad f04hg">3 gestes</span></div>
        <div class="f04world">
          <div class="f04phone"><div class="f04screen">
            <div class="f04bar"><img class="f04barlogo" src="assets/brand/logo-symbol.png" alt="" /><div class="f04barname">DigitalSubMG</div>
              <div class="f04cart">""" + cart_svg + """<div class="f04badge">1</div></div></div>
            <div class="f04s f04s0">
              <div class="f04pill"><span style="width:9px;height:9px;border-radius:50%;background:#25D366"></span>N°1 À MADAGASCAR</div>
              <div class="f04title">Vos abonnements <span class="f04gr">premium</span> en un clic</div>
              <div class="f04btn f04btnw">Découvrir les offres →</div>
            </div>
            <div class="f04s f04s1">
              <div class="f04gtitle">Nos offres</div>
""" + tile_html + """
            </div>
            <div class="f04s f04s2">
              <div class="f04porb"></div>
              <div class="f04pname">Netflix Premium 4K</div>
              <div class="f04pdev">1 appareil</div>
              <div class="f04price grad">19&#160;600 Ar</div>
              <div class="f04btn f04btng"><span class="f04addtxt">Ajouter au panier</span></div>
            </div>
            <div class="f04tap f04tap1" style="left:260px;top:556px"></div>
            <div class="f04tap f04tap2" style="left:139px;top:306px"></div>
            <div class="f04tap f04tap3" style="left:260px;top:738px"></div>
          </div></div>
        </div>
        <div class="f04steps">
          <div class="f04step" style="left:0"><b>1</b>Choisissez</div>
          <div class="f04step" style="left:315px"><b>2</b>Payez</div>
          <div class="f04step" style="left:630px"><b>3</b>Profitez</div>
        </div>""",
    """
        const phone = q(".f04phone");
        tl.fromTo(phone, { scale: 1.35, opacity: 0, filter: "blur(16px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, 0);
        tl.fromTo(phone, { rotationY: -10, rotationX: 4 }, { rotationY: 7, rotationX: -2, duration: 5.625, ease: "none" }, 0);
        const steps = qa(".f04step");
        tl.fromTo(steps, { y: 30, opacity: 0 }, { y: 0, opacity: 0.35, duration: 0.5, stagger: 0.08, ease: "expo.out" }, 0.15);
        const s0 = q(".f04s0"), s1 = q(".f04s1"), s2 = q(".f04s2");
        tl.set([s1, s2], { xPercent: 100 }, 0);
        tl.fromTo(q(".f04badge"), { scale: 0 }, { scale: 0, duration: 0.01 }, 0);
        const tap = (el, at) => {
          tl.fromTo(el, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: "power2.out" }, at - 0.14);
          tl.to(el, { scale: 0.8, duration: 0.07, ease: "power2.in" }, at);
          tl.to(el, { scale: 1.9, opacity: 0, duration: 0.35, ease: "expo.out" }, at + 0.07);
        };
        const light = (i, at) => {
          tl.to(steps[i], { opacity: 1, borderColor: "rgba(0,240,255,0.7)", boxShadow: "0 0 30px rgba(0,240,255,0.35)", duration: 0.3, ease: "power2.out" }, at);
        };
        // tap 1 — Découvrir les offres
        tap(q(".f04tap1"), 0.47);
        tl.to(q(".f04btnw"), { scale: 0.95, duration: 0.07 }, 0.47);
        tl.to(q(".f04btnw"), { scale: 1, duration: 0.15 }, 0.54);
        tl.to(s0, { xPercent: -100, opacity: 0.2, duration: 0.5, ease: "power3.inOut" }, 0.6);
        tl.to(s1, { xPercent: 0, duration: 0.5, ease: "power3.inOut" }, 0.6);
        light(0, 0.6);
        tl.fromTo(qa(".f04tile"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "expo.out" }, 0.8);
        // tap 2 — Netflix tile
        tap(q(".f04tap2"), 1.875);
        tl.to(q(".f04pick"), { borderColor: "rgba(0,240,255,0.9)", boxShadow: "0 0 26px rgba(0,240,255,0.45)", duration: 0.2 }, 1.875);
        tl.to(s1, { xPercent: -100, opacity: 0.2, duration: 0.5, ease: "power3.inOut" }, 2.0);
        tl.to(s2, { xPercent: 0, duration: 0.5, ease: "power3.inOut" }, 2.0);
        light(1, 2.0);
        tl.fromTo(q(".f04price"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 1.2, ease: "power2.out" }, 2.3);
        // tap 3 — Ajouter au panier
        tap(q(".f04tap3"), 3.75);
        tl.to(q(".f04btng"), { scale: 0.95, duration: 0.07 }, 3.75);
        tl.to(q(".f04btng"), { scale: 1, duration: 0.15 }, 3.82);
        tl.fromTo(q(".f04addtxt"), { opacity: 1 }, { opacity: 0, duration: 0.12 }, 3.8);
        tl.set(q(".f04addtxt"), { textContent: "✓ Ajouté au panier" }, 3.93);
        tl.fromTo(q(".f04addtxt"), { opacity: 0 }, { opacity: 1, immediateRender: false, duration: 0.15 }, 3.93);
        tl.fromTo(q(".f04badge"), { scale: 0 }, { scale: 1, immediateRender: false, duration: 0.4, ease: "back.out(3)" }, 3.86);
        light(2, 3.9);
        tl.fromTo(q(".f04h"), { y: 30, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, 4.6);
        tl.fromTo(q(".f04hg"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 0.9, ease: "power2.out" }, 4.6);
        tl.to([phone, q(".f04steps"), q(".f04h")], { scale: 0.86, opacity: 0, filter: "blur(10px)", duration: 0.45, ease: "power2.in" }, 5.17);
""",
)

# ------------------------------------------------------------------ Frame 5
def bento(cls, x, y, w, h, icon, inner):
    return (f'          <div class="f05card glass {cls}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">'
            f'<div class="f05tile">{svg_icon(ICONS[icon], "f05icon", 48)}</div>{inner}<div class="shine"></div></div>')

bigbolt = svg_icon(ICONS["bolt"], "f05bigbolt", 300, "rgba(245,247,250,0.10)", 1.2)
frame(
    "05-avantages", 7.5,
    """
      #root .f05ground { background: radial-gradient(60% 35% at 50% 20%, rgba(90,0,254,0.22), rgba(5,6,10,0) 70%),
        radial-gradient(70% 40% at 50% 90%, rgba(0,94,254,0.18), rgba(5,6,10,0) 70%), #05060A; }
      #root .f05h { position: absolute; left: 0; right: 0; text-align: center; font-size: 84px; font-weight: 800;
        letter-spacing: -0.035em; line-height: 1; white-space: nowrap; }
      #root .f05h1 { top: 250px; }
      #root .f05h2 { top: 344px; }
      #root .f05group { position: absolute; inset: 0; }
      #root .f05card { position: absolute; overflow: hidden; }
      #root .f05tile { position: absolute; left: 32px; top: 32px; width: 88px; height: 88px; border-radius: 20px;
        background: rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; }
      #root .f05t { position: absolute; left: 32px; right: 28px; font-size: 36px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.12; }
      #root .f05s { position: absolute; left: 32px; right: 28px; font-size: 25px; font-weight: 500; color: #9AA3B2; line-height: 1.3; }
      #root .f05big .f05tile { left: 40px; top: 40px; }
      #root .f05big .f05t { left: 40px; top: 168px; font-size: 56px; }
      #root .f05big .f05s { left: 40px; top: 244px; font-size: 30px; }
      #root .f05bigbolt { position: absolute; right: -10px; top: 10px; }
      #root .f05num { position: absolute; left: 32px; top: 128px; font-size: 92px; font-weight: 900; letter-spacing: -0.04em;
        font-variant-numeric: tabular-nums; }
      #root .f05dark { position: absolute; inset: 0; background: #071233; opacity: 0; }
""",
    "",
    """        <div class="f05h f05h1">Pourquoi</div>
        <div class="f05h f05h2 grad">DigitalSubMG ?</div>
        <div class="f05group">
""" + "\n".join([
        bento("f05big", 80, 520, 920, 330, "bolt", bigbolt + '<div class="f05t">Activation instantanée</div><div class="f05s">Vos accès en quelques minutes</div>'),
        bento("f05pay", 80, 878, 446, 290, "shield", '<div class="f05t" style="top:146px">Paiement sécurisé</div><div class="f05s" style="top:232px">Mobile money</div>'),
        bento("f05sup", 554, 878, 446, 290, "headset", '<div class="f05t" style="top:146px">Support WhatsApp 24/7</div>'),
        bento("f05cli", 80, 1196, 446, 290, "users", '<div class="f05num">0</div><div class="f05s" style="top:232px">clients satisfaits</div>'),
        bento("f05prx", 554, 1196, 446, 290, "tag", '<div class="f05t" style="top:146px">Prix accessibles</div><div class="f05s" style="top:232px">Tarifs en Ariary</div>'),
    ]) + """
        </div>
        <div class="f05dark"></div>""",
    """
        tl.fromTo(q(".f05h1"), { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, 0.0);
        tl.fromTo(q(".f05h2"), { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, 0.15);
        tl.fromTo(q(".f05h2"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 1.4, ease: "power2.out" }, 0.15);
        const cards = qa(".f05card");
        const at = [0.47, 1.41, 2.34, 3.28, 4.22];
        cards.forEach((el, i) => {
          tl.fromTo(el, { y: 70, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: "expo.out" }, at[i]);
          draw(el.querySelectorAll(".f05icon path, .f05icon circle"), at[i] + 0.2, 0.5);
          shine(el.querySelector(".shine"), at[i] + 0.2);
          tl.fromTo(el, { borderColor: "rgba(0,240,255,0.75)", boxShadow: "0 0 40px rgba(0,240,255,0.30), 0 30px 80px rgba(0,0,0,0.45)" },
            { borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 0 0px rgba(0,240,255,0), 0 30px 80px rgba(0,0,0,0.45)", duration: 0.9, ease: "power2.out", immediateRender: false }, at[i] + 0.3);
        });
        draw(q(".f05bigbolt").querySelectorAll("path"), 0.6, 0.9);
        count(q(".f05num"), 0, 500, (v) => Math.round(v) + (v >= 499.5 ? "+" : ""), 3.48, 0.9);
        tl.to(cards, { borderColor: "rgba(0,240,255,0.65)", boxShadow: "0 0 36px rgba(0,240,255,0.28), 0 30px 80px rgba(0,0,0,0.45)", duration: 0.2, ease: "power2.out" }, 5.63);
        tl.to(cards, { borderColor: "rgba(255,255,255,0.14)", boxShadow: "0 0 0px rgba(0,240,255,0), 0 30px 80px rgba(0,0,0,0.45)", duration: 0.9, ease: "power2.out" }, 5.85);
        tl.fromTo(q(".f05group"), { scale: 1 }, { scale: 0.93, duration: 1.37, ease: "power2.out", transformOrigin: "540px 1000px" }, 5.63);
        tl.to([q(".f05h1"), q(".f05h2")], { opacity: 0, y: -30, duration: 0.3, ease: "power2.in" }, 7.0);
        tl.to(cards.filter((c, i) => i !== 1), { opacity: 0, duration: 0.3, ease: "none" }, 7.0);
        tl.to(q(".f05group"), { scale: 7, duration: 0.5, ease: "power3.in", transformOrigin: "156px 954px" }, 7.0);
        tl.to(q(".f05dark"), { opacity: 1, duration: 0.2, ease: "power2.in" }, 7.3);
""",
)

# ------------------------------------------------------------------ Frame 6
caps = [("Airtel Money", "#E4002B", 580), ("MVola", "#FFCC00", 700), ("Orange Money", "#FF7900", 820)]
cap_html = "\n".join(
    f'        <div class="f06cap glass" style="top:{y}px"><span class="f06cdot" style="background:{c};box-shadow:0 0 14px {c}"></span>{n}</div>'
    for n, c, y in caps
)
check_big = ('<svg class="f06check" width="120" height="120" viewBox="0 0 48 48" fill="none" stroke="#25D366" stroke-width="3" '
             'stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1;stroke-dashoffset:0">'
             '<circle cx="24" cy="24" r="21" pathLength="1"/><path d="m14 24.5 7 7 13-14" pathLength="1"/></svg>')
frame(
    "06-paiement", 3.75,
    """
      #root .f06ground { background: radial-gradient(80% 50% at 50% 45%, rgba(1,50,142,0.55), rgba(7,18,51,0.6) 55%, #05060A 100%); }
      #root .f06h { position: absolute; left: 0; right: 0; text-align: center; font-size: 90px; font-weight: 800;
        letter-spacing: -0.035em; line-height: 1; white-space: nowrap; }
      #root .f06h1 { top: 300px; }
      #root .f06h2 { top: 404px; }
      #root .f06cap { position: absolute; left: 260px; width: 560px; height: 100px; border-radius: 999px;
        display: flex; align-items: center; justify-content: center; gap: 18px; font-size: 38px; font-weight: 800; }
      #root .f06cdot { width: 18px; height: 18px; border-radius: 50%; }
      #root .f06pay { position: absolute; left: 140px; top: 980px; width: 800px; height: 260px; }
      #root .f06lbl { position: absolute; left: 44px; top: 40px; }
      #root .f06amt { position: absolute; left: 40px; top: 82px; font-size: 88px; font-weight: 900; letter-spacing: -0.04em;
        font-variant-numeric: tabular-nums; white-space: nowrap; }
      #root .f06prod { position: absolute; left: 44px; top: 194px; font-size: 28px; font-weight: 600; color: #9AA3B2; }
      #root .f06check { position: absolute; right: 44px; top: 70px; filter: drop-shadow(0 0 18px rgba(37,211,102,0.55)); }
      #root .f06sub { position: absolute; left: 0; right: 0; top: 1300px; text-align: center; font-size: 40px; font-weight: 600; color: #9AA3B2; }
      #root .f06open { position: absolute; inset: 0; background: radial-gradient(40% 25% at 15% 50%, rgba(0,94,254,0.9), #071233 70%); }
""",
    "",
    """        <div class="f06h f06h1">Paiement simple</div>
        <div class="f06h f06h2">en <span class="grad f06ar">Ariary</span></div>
""" + cap_html + """
        <div class="f06pay glass"><div class="label f06lbl">Montant</div><div class="f06amt">0 Ar</div>
          <div class="f06prod">Netflix Premium 4K</div>""" + check_big + """</div>
        <div class="f06sub">Sans carte bancaire.</div>
        <div class="f06open"></div>""",
    """
        tl.fromTo(q(".f06open"), { opacity: 1 }, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0);
        tl.fromTo(q(".f06h1"), { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, 0.05);
        tl.fromTo(q(".f06h2"), { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, 0.18);
        tl.fromTo(q(".f06ar"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 1.6, ease: "power2.out" }, 0.25);
        qa(".f06cap").forEach((el, i) => {
          tl.fromTo(el, { y: -90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.3)" }, 0.47 + i * 0.47);
        });
        tl.fromTo(q(".f06pay"), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, 1.41);
        const nb = (v) => { const n = Math.round(v / 100) * 100; return (n >= 1000 ? Math.floor(n / 1000) + "\\u00a0" + String(n % 1000).padStart(3, "0") : String(n)) + " Ar"; };
        count(q(".f06amt"), 0, 19600, nb, 1.55, 1.2, "power3.out");
        draw(q(".f06check").querySelectorAll("circle, path"), 2.85, 0.4);
        tl.fromTo(q(".f06sub"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 2.9);
        tl.to(q(".f06check"), { scale: 1.35, duration: 0.35, ease: "power2.in", transformOrigin: "50% 50%" }, 3.4);
""",
)

# ------------------------------------------------------------------ Frame 7
node_x = [120, 347, 573, 800]
node_icons = ["check", "card", "box", "truck"]
node_labels = ["Confirmée", "Payée", "En préparation", "Livrée"]
nodes = "\n".join(
    f'          <div class="f07node" style="left:{x - 38}px">{svg_icon(ICONS[ic], "f07nicon", 34, "#F5F7FA", 2)}</div>'
    f'<div class="f07nlab" style="left:{x - 110}px">{lb}</div>'
    for x, ic, lb in zip(node_x, node_icons, node_labels)
)
frame(
    "07-activation", 5.625,
    """
      #root .f07ground { background: radial-gradient(70% 40% at 50% 45%, rgba(0,94,254,0.18), rgba(5,6,10,0) 70%),
        radial-gradient(60% 30% at 50% 100%, rgba(90,0,254,0.22), rgba(5,6,10,0) 70%), #05060A; }
      #root .f07h { position: absolute; left: 0; right: 0; top: 270px; text-align: center; font-size: 92px; font-weight: 800;
        letter-spacing: -0.035em; white-space: nowrap; }
      #root .f07card { position: absolute; left: 80px; top: 430px; width: 920px; height: 560px; }
      #root .f07client { position: absolute; left: 44px; top: 44px; font-size: 34px; font-weight: 800; }
      #root .f07tag { position: absolute; left: 44px; top: 100px; font-size: 18px; font-weight: 800; letter-spacing: 0.14em;
        color: #00F0FF; border: 1px solid rgba(0,240,255,0.4); border-radius: 999px; padding: 8px 16px; }
      #root .f07timer { position: absolute; right: 44px; top: 38px; font-size: 52px; font-weight: 800; letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums; }
      #root .f07tlab { position: absolute; right: 44px; top: 104px; font-size: 18px; }
      #root .f07track { position: absolute; left: 120px; top: 298px; width: 680px; height: 4px; border-radius: 4px; background: rgba(255,255,255,0.12); }
      #root .f07fill { position: absolute; left: 120px; top: 298px; width: 680px; height: 4px; border-radius: 4px;
        background: linear-gradient(90deg, #00F0FF, #5A9BFF); box-shadow: 0 0 16px rgba(0,240,255,0.7); transform-origin: 0% 50%; }
      #root .f07node { position: absolute; top: 262px; width: 76px; height: 76px; border-radius: 50%; background: #10131C;
        border: 2px solid rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; }
      #root .f07nlab { position: absolute; top: 356px; width: 220px; text-align: center; font-size: 23px; font-weight: 700; color: #9AA3B2; }
      #root .f07ok { position: absolute; right: 44px; top: 452px; height: 64px; padding: 0 28px; border-radius: 16px; background: #1E3A8A;
        display: flex; align-items: center; font-size: 30px; font-weight: 800; box-shadow: 0 0 24px rgba(30,58,138,0.8); }
      #root .f07under { position: absolute; left: 44px; top: 470px; font-size: 27px; font-weight: 600; color: #9AA3B2; }
      #root .f07notif { position: absolute; left: 80px; top: 1060px; width: 920px; height: 160px; border-radius: 34px;
        background: rgba(255,255,255,0.10); }
      #root .f07nlogo { position: absolute; left: 30px; top: 30px; width: 100px; height: 100px; border-radius: 24px; background: #01328E;
        display: flex; align-items: center; justify-content: center; }
      #root .f07nlogo img { width: 50px; height: 70px; }
      #root .f07nt1 { position: absolute; left: 158px; top: 36px; font-size: 28px; font-weight: 800; }
      #root .f07nt2 { position: absolute; left: 158px; top: 80px; font-size: 38px; font-weight: 700; }
      #root .f07ncheck { position: absolute; right: 36px; top: 50px; }
""",
    "",
    """        <div class="f07h">Activation <span class="grad f07hg">rapide</span></div>
        <div class="f07card glass">
          <div class="f07client">Client · Netflix Premium 4K</div>
          <div class="f07tag">NOUVELLE ACTIVATION</div>
          <div class="f07timer">00:00</div><div class="label f07tlab">Chrono</div>
          <div class="f07track"></div><div class="f07fill"></div>
""" + nodes + """
          <div class="f07under">Activation en moins de 2 min</div>
          <div class="f07ok">✓ Validé</div>
        </div>
        <div class="f07notif glass"><div class="f07nlogo"><img src="assets/brand/logo-symbol.png" alt="" /></div>
          <div class="f07nt1">DigitalSubMG</div><div class="f07nt2">Vos accès sont prêts</div>
          """ + svg_icon(["circle:12,12,10", "m7.5 12.5 3 3 6-7"], "f07ncheck", 60, "#25D366", 2) + """</div>""",
    """
        tl.fromTo(q(".f07h"), { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, 0.0);
        tl.fromTo(q(".f07hg"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 1.3, ease: "power2.out" }, 0.05);
        tl.fromTo(q(".f07card"), { y: 60, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, 0.1);
        tl.fromTo(q(".f07fill"), { scaleX: 0 }, { scaleX: 1, duration: 1.41, ease: "none" }, 0.47);
        const nodes = qa(".f07node"), labs = qa(".f07nlab");
        nodes.forEach((n, i) => {
          const t = 0.47 + i * 0.47;
          tl.to(n, { backgroundColor: "#00C2FF", borderColor: "#00F0FF", boxShadow: "0 0 30px rgba(0,240,255,0.6)", duration: 0.15, ease: "power2.out" }, t);
          tl.fromTo(n, { scale: 1 }, { scale: 1.18, duration: 0.12, ease: "power2.out" }, t);
          tl.to(n, { scale: 1, duration: 0.3, ease: "back.out(2)" }, t + 0.12);
          tl.to(labs[i], { color: "#F5F7FA", duration: 0.2 }, t);
          draw(n.querySelectorAll("path, rect, circle"), t, 0.3);
        });
        const mmss = (v) => { const s = Math.round(v); return "0" + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
        count(q(".f07timer"), 0, 107, mmss, 0.47, 1.88, "none");
        tl.fromTo(q(".f07under"), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: "expo.out" }, 2.6);
        tl.fromTo(q(".f07ok"), { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.2)" }, 3.75);
        tl.fromTo(q(".f07notif"), { y: 160, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.5)" }, 4.2);
        draw(q(".f07ncheck").querySelectorAll("circle, path"), 4.5, 0.35);
        tl.to([q(".f07card"), q(".f07h")], { opacity: 0.35, duration: 0.4, ease: "none" }, 5.0);
        tl.to(q(".f07notif"), { y: -60, scale: 1.04, duration: 0.6, ease: "power2.in" }, 5.0);
""",
)

# ------------------------------------------------------------------ Frame 8
bubbles = [(60, 250, 300, 120, 8), (720, 300, 300, 130, 12), (30, 1390, 320, 120, 10),
           (700, 1430, 330, 130, 6), (-70, 760, 260, 110, 14), (890, 760, 260, 110, 14)]
bub_html = "\n".join(
    f'        <div class="f08bub glass" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;filter:blur({b}px)">'
    f'<i style="width:70%"></i><i style="width:90%"></i><i style="width:50%"></i></div>'
    for x, y, w, h, b in bubbles
)
star = '<svg class="f08star" width="64" height="64" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="#F5F7FA"/></svg>'
frame(
    "08-confiance", 3.75,
    """
      #root .f08ground { background: #05060A; }
      #root .f08breath { position: absolute; left: -250px; top: 300px; width: 1580px; height: 1200px;
        background: radial-gradient(closest-side, rgba(90,0,254,0.35), rgba(0,94,254,0.15) 55%, rgba(5,6,10,0)); }
      #root .f08bub { position: absolute; opacity: 0.4; padding: 26px 28px; display: flex; flex-direction: column; gap: 14px; }
      #root .f08bub i { display: block; height: 12px; border-radius: 6px; background: rgba(255,255,255,0.35); }
      #root .f08core { position: absolute; inset: 0; }
      #root .f08num { position: absolute; left: 0; right: 0; top: 500px; text-align: center; font-size: 300px; font-weight: 900;
        letter-spacing: -0.06em; line-height: 1; font-variant-numeric: tabular-nums;
        text-shadow: 0 0 80px rgba(0,180,255,0.35); }
      #root .f08stars { position: absolute; left: 0; right: 0; top: 860px; display: flex; justify-content: center; align-items: center; gap: 10px; }
      #root .f08rate { font-size: 70px; font-weight: 800; margin-left: 22px; letter-spacing: -0.03em; }
      #root .f08star { filter: drop-shadow(0 0 12px rgba(0,240,255,0.55)); }
      #root .f08t { position: absolute; left: 0; right: 0; text-align: center; font-size: 62px; font-weight: 800; letter-spacing: -0.03em;
        line-height: 1.05; white-space: nowrap; }
      #root .f08t1 { top: 1040px; }
      #root .f08t2 { top: 1110px; }
      #root .f08wa { position: absolute; left: 0; right: 0; top: 1250px; margin: 0 auto; width: 440px; height: 72px; border-radius: 999px;
        border: 1px solid rgba(37,211,102,0.5); background: rgba(37,211,102,0.10); display: flex; align-items: center; justify-content: center;
        gap: 14px; font-size: 28px; font-weight: 800; }
      #root .f08wa span { width: 14px; height: 14px; border-radius: 50%; background: #25D366; box-shadow: 0 0 14px #25D366; }
""",
    '<div class="f08breath"></div>',
    bub_html + """
        <div class="f08core">
          <div class="f08num">0</div>
          <div class="f08stars">""" + star * 5 + """<div class="f08rate">4,7</div></div>
          <div class="f08t f08t1">Des centaines de clients</div>
          <div class="f08t f08t2">nous font <span class="grad f08tg">confiance</span></div>
          <div class="f08wa"><span></span>Support WhatsApp 24/7</div>
        </div>""",
    """
        tl.fromTo(q(".f08breath"), { scale: 0.85, opacity: 0.6 }, { scale: 1.1, opacity: 1, duration: 3.2, ease: "sine.inOut" }, 0);
        const bubs = qa(".f08bub");
        bubs.forEach((b, i) => {
          tl.fromTo(b, { y: 40 + i * 6, opacity: 0 }, { y: -30 - i * 4, opacity: 0.4, duration: 3.2, ease: "none" }, 0);
          tl.to(b, { x: 540 - (parseFloat(b.style.left) + parseFloat(b.style.width) / 2), y: 960 - parseFloat(b.style.top), scale: 0.2, opacity: 0, duration: 0.5, ease: "power3.in" }, 3.2);
        });
        tl.fromTo(q(".f08num"), { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "expo.out" }, 0);
        count(q(".f08num"), 0, 500, (v) => Math.round(v) + (v >= 499.5 ? "+" : ""), 0.05, 1.2);
        tl.fromTo(q(".f08stars"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 0.8);
        tl.fromTo(qa(".f08star path"), { fillOpacity: 0.12 }, { fillOpacity: (i) => (i === 4 ? 0.7 : 1), duration: 0.2, stagger: 0.09, ease: "power2.out" }, 0.95);
        tl.fromTo(q(".f08t1"), { y: 36, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, 1.4);
        tl.fromTo(q(".f08t2"), { y: 36, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }, 1.55);
        tl.fromTo(q(".f08tg"), { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", duration: 1.2, ease: "power2.out" }, 1.55);
        tl.fromTo(q(".f08wa"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, 1.9);
        tl.to(q(".f08core"), { scale: 0.9, opacity: 0, filter: "blur(10px)", duration: 0.5, ease: "power2.in", transformOrigin: "540px 960px" }, 3.25);
""",
)

# ------------------------------------------------------------------ Frame 9
parts = []
for i in range(18):
    x = (i * 211 + 37) % 1000 + 40
    y = (i * 317 + 120) % 1500 + 200
    s = 4 + (i % 3) * 2
    parts.append(f'<div class="f09p" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px"></div>')
frame(
    "09-cta", 5.625,
    LOGO_CSS.replace("__P__", "f09") + """
      #root .f09ground { background: #05060A; }
      #root .f09blue { position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 32%, #0A4BC8 0%, #01328E 55%, #011E5C 100%); opacity: 0; }
      #root .f09halo { position: absolute; left: -100px; top: 200px; width: 1280px; height: 900px;
        background: radial-gradient(closest-side, rgba(0,240,255,0.22), rgba(90,0,254,0.12) 60%, rgba(1,50,142,0)); }
      #root .f09p { position: absolute; border-radius: 50%; background: rgba(233,254,255,0.8); box-shadow: 0 0 10px rgba(0,240,255,0.8); }
      #root .f09cam { position: absolute; inset: 0; }
      #root .f09logo { top: 400px; }
      #root .f09sig { position: absolute; left: 0; right: 0; text-align: center; font-size: 54px; font-weight: 800; letter-spacing: -0.025em;
        line-height: 1.1; white-space: nowrap; }
      #root .f09sig1 { top: 930px; }
      #root .f09sig2 { top: 996px; }
      #root .f09w { display: inline-block; margin: 0 0.12em; }
      #root .f09cyan { color: #00F0FF; }
      #root .f09btn { position: absolute; left: 190px; top: 1130px; width: 700px; height: 124px; border-radius: 30px; background: #F5F7FA;
        color: #05060A; display: flex; align-items: center; justify-content: center; font-size: 46px; font-weight: 800; overflow: hidden;
        box-shadow: 0 24px 60px rgba(0,0,0,0.35), 0 0 60px rgba(0,240,255,0.25); }
      #root .f09btn .shine { background: linear-gradient(90deg, rgba(0,240,255,0) 0%, rgba(0,200,255,0.45) 50%, rgba(0,240,255,0) 100%); }
      #root .f09tap { position: absolute; left: 540px; top: 1192px; width: 96px; height: 96px; margin: -48px 0 0 -48px; border-radius: 50%;
        background: rgba(5,6,10,0.18); border: 2px solid rgba(5,6,10,0.5); opacity: 0; }
      #root .f09url { position: absolute; left: 0; right: 0; top: 1300px; text-align: center; font-size: 58px; font-weight: 800;
        letter-spacing: -0.02em; color: #00F0FF; text-shadow: 0 0 30px rgba(0,240,255,0.45); }
      #root .f09wa { position: absolute; left: 0; right: 0; top: 1400px; margin: 0 auto; width: 330px; height: 76px; border-radius: 999px;
        background: #25D366; color: #05060A; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 32px; font-weight: 800; }
""",
    '<div class="f09blue"></div><div class="f09halo"></div>',
    "        " + "\n        ".join(parts) + """
        <div class="f09cam">
          """ + LOGO_HTML.replace("__P__", "f09") + """
          <div class="f09sig f09sig1"><span class="f09w">Vos</span><span class="f09w">abonnements</span><span class="f09w f09cyan">premium</span></div>
          <div class="f09sig f09sig2"><span class="f09w">en</span><span class="f09w">un</span><span class="f09w">clic</span></div>
          <div class="f09btn">Découvrez nos offres →<div class="shine"></div></div>
          <div class="f09tap"></div>
          <div class="f09url">digitalsub.org</div>
          <div class="f09wa">""" + svg_icon(["M5 19l1.2-3.6A7.5 7.5 0 1 1 9 18.7z"], "f09waic", 34, "#05060A", 2.2) + """WhatsApp</div>
        </div>""",
    """
        tl.fromTo(q(".f09blue"), { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0);
        tl.fromTo(q(".f09halo"), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" }, 0.1);
        qa(".f09p").forEach((p, i) => {
          tl.fromTo(p, { opacity: 0, y: 0 }, { opacity: 0.25 + (i % 4) * 0.15, y: -60 - (i % 5) * 20, duration: 5.5, ease: "none" }, 0.1);
        });
        tl.fromTo(q(".f09sym"), { clipPath: "inset(0% 0% 100% 0%)", scale: 0.9 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.75, ease: "power3.out" }, 0.05);
        tl.fromTo(q(".f09word"), { clipPath: "inset(0% 100% 0% 0%)", x: -30 }, { clipPath: "inset(0% 0% 0% 0%)", x: 0, duration: 0.6, ease: "expo.out" }, 0.4);
        const ws = qa(".f09w");
        ws.forEach((w, i) => {
          tl.fromTo(w, { y: 40, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, 1.875 + i * 0.07);
        });
        tl.fromTo(q(".f09btn"), { y: 70, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }, 2.8);
        tl.fromTo(q(".f09tap"), { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: "power2.out" }, 3.06);
        tl.to(q(".f09tap"), { scale: 0.8, duration: 0.07, ease: "power2.in" }, 3.2);
        tl.to(q(".f09tap"), { scale: 2, opacity: 0, duration: 0.4, ease: "expo.out" }, 3.27);
        tl.to(q(".f09btn"), { scale: 0.96, duration: 0.07 }, 3.2);
        tl.to(q(".f09btn"), { scale: 1, duration: 0.25, ease: "back.out(2)" }, 3.27);
        shine(q(".f09btn .shine"), 3.25);
        tl.fromTo(q(".f09url"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "expo.out" }, 3.7);
        tl.fromTo(q(".f09wa"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "expo.out" }, 3.85);
        tl.fromTo(q(".f09cam"), { scale: 1 }, { scale: 1.025, duration: 1.925, ease: "none" }, 3.7);
""",
)
