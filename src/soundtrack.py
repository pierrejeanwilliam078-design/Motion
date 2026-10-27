"""Bande-son du teaser Open Days, entièrement synthétisée (aucun échantillon externe).

Usage : python3 src/soundtrack.py build/soundtrack.wav
Les instants des impacts sont lus dans src/timeline.js pour rester calés sur l'image.
"""
import json
import os
import sys
import wave

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)


def load_timeline():
    src = open(os.path.join(HERE, "timeline.js"), encoding="utf-8").read()
    return json.loads(src[src.index("{"): src.rindex("}") + 1])


TL = load_timeline()
DUR = TL["duration"]
N = int(DUR * SR)
BEAT = 60.0 / TL["bpm"]

# Bus stéréo : "dry" va directement au master, "verb" passe par la réverbération.
dry = np.zeros((N, 2))
verb = np.zeros((N, 2))
side = np.zeros((N, 2))  # éléments soumis au sidechain du kick (pad, basse)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(bus, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if sig.ndim == 1:
        left = np.cos((pan + 1) * np.pi / 4)
        right = np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * left, sig * right], axis=1) * np.sqrt(2)
    j = min(N, i + len(sig))
    off = max(0, -i)
    bus[max(i, 0):j] += sig[off: j - i] * gain


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x, axis=0)


def sweep_filter(x, cutoff, kind="low", block=256):
    """Filtre dont la fréquence de coupure suit la courbe `cutoff` (un point par échantillon)."""
    out = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        fc = float(np.clip(cutoff[min(s + block // 2, len(x) - 1)], 30, SR * 0.45))
        sos = butter(2, fc, kind, fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
        out[s:s + block], zi = sosfilt(sos, x[s:s + block], axis=0, zi=zi)
    return out


def saw(freq, dur, detune=0.0):
    t = t_axis(dur)
    ph = (freq * (1 + detune) * t + rng.random()) % 1.0
    return 2 * ph - 1


def noise(dur):
    return rng.standard_normal(int(dur * SR))


# ---------------------------------------------------------------- instruments

def kick(gain=1.0, dur=0.55):
    t = t_axis(dur)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = hp(noise(dur), 2500) * np.exp(-t * 180) * 0.25
    return np.tanh((body + click) * 1.6) * gain


def boom(dur=4.0, f0=70, f1=28):
    """Impact cinématique grave."""
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 3.5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t * 1.3)
    crack = lp(noise(dur), 1800) * np.exp(-t * 9) * 0.9
    return np.tanh((sub * 1.4 + crack) * 1.3)


def clap(dur=0.35):
    t = t_axis(dur)
    n = bp(noise(dur), 900, 6000)
    env = np.exp(-t * 22)
    for k in (0.0, 0.011, 0.022):  # triple attaque façon clap
        env += np.exp(-np.clip(t - k, 0, None) * 120) * (t >= k) * 0.6
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4
    return (n * env * 0.5 + tone)


def hat(dur=0.08, bright=8000):
    t = t_axis(dur)
    return hp(noise(dur), bright) * np.exp(-t * 60)


def blip(freq, dur=0.07, square=True):
    t = t_axis(dur)
    w = np.sign(np.sin(2 * np.pi * freq * t)) if square else np.sin(2 * np.pi * freq * t)
    return lp(w, 7000) * np.exp(-t * 35) * 0.5


def glitch(dur=0.25):
    """Rafale numérique : bruit échantillonné-bloqué + bips aléatoires."""
    n = int(dur * SR)
    hold = rng.integers(20, 160)
    raw = np.repeat(rng.uniform(-1, 1, n // hold + 1), hold)[:n]
    gate = np.repeat(rng.random(n // 900 + 1) > 0.35, 900)[:n]
    t = t_axis(dur)
    tone = np.sign(np.sin(2 * np.pi * rng.uniform(600, 3200) * t))
    return (raw * 0.6 + tone * 0.25) * gate * np.exp(-t * 4)


def whoosh(dur=0.6, f_lo=300, f_hi=6000, rising=True):
    x = noise(dur)
    t = np.linspace(0, 1, len(x))
    curve = f_lo * (f_hi / f_lo) ** (t if rising else 1 - t)
    y = sweep_filter(bp(x, 150, 12000), curve, "low")
    env = np.sin(np.pi * t) ** 2 if not rising else t ** 2.2
    return y * env


def riser(dur, f_lo=200, f_hi=9000):
    """Montée : bruit filtré qui s'ouvre + glissando de sinus."""
    x = noise(dur)
    t = np.linspace(0, 1, len(x))
    noise_part = sweep_filter(x, f_lo * (f_hi / f_lo) ** (t ** 1.4), "low") * t ** 2.5
    f = 110 * 2 ** (t ** 1.6 * 3)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return noise_part * 0.7 + tone * 0.18 * t ** 2


def shimmer(freqs, dur, attack=0.02, decay=1.2):
    t = t_axis(dur)
    env = np.minimum(t / attack, 1) * np.exp(-t * decay)
    s = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in freqs) / len(freqs)
    return s * env


def pad_voice(note, dur, cutoff_curve, voices=3):
    sig = sum(saw(midi(note), dur, d) for d in np.linspace(-0.006, 0.006, voices)) / voices
    return sweep_filter(sig, cutoff_curve, "low")


def pluck(note, dur=0.22, bright=3500):
    t = t_axis(dur)
    sig = saw(midi(note), dur) * 0.6 + np.sign(np.sin(2 * np.pi * midi(note) * t)) * 0.4
    return lp(sig, bright) * np.exp(-t * 14)


def reverb_ir(seconds=2.8, decay=2.2):
    t = t_axis(seconds)
    ir = rng.standard_normal((len(t), 2)) * np.exp(-t * decay)[:, None]
    ir = lp(ir, 6000)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]
    return ir / np.sqrt(np.sum(ir ** 2, axis=0))


def delay(x, time, feedback=0.4, taps=5):
    out = x.copy()
    d = int(time * SR)
    for k in range(1, taps + 1):
        g = feedback ** k
        shifted = np.zeros_like(x)
        shifted[d * k:] = x[: len(x) - d * k] if d * k < len(x) else 0
        if k % 2:  # écho ping-pong
            shifted = shifted[:, ::-1]
        out += shifted * g
    return out


# ---------------------------------------------------------------- arrangement

TL_DROP, TL_REVEAL, TL_SILENCE = TL["drop"], TL["reveal"], TL["silence"]

# Grille harmonique (la mineur) : un accord par mesure de 2 s après l'intro.
CHORDS = [
    (0.0, 12.0, [45, 52, 57, 60, 64, 71]),     # Am(add9) suspendu
    (12.0, 14.0, [45, 52, 57, 60, 64]),        # Am
    (14.0, 16.0, [41, 48, 57, 60, 65]),        # F
    (16.0, 18.0, [48, 55, 60, 64, 67]),        # C
    (18.0, 20.0, [43, 50, 59, 62, 67]),        # G
    (20.0, 22.0, [45, 52, 57, 60, 64]),        # Am
    (22.0, 24.0, [41, 48, 57, 60, 65]),        # F
    (24.0, 26.0, [50, 57, 62, 65, 69]),        # Dm
    (26.0, TL_SILENCE, [40, 52, 56, 59, 64]),  # E (tension)
    (TL_REVEAL, DUR, [33, 45, 52, 57, 60, 64, 71]),  # Am final, large
]


def cutoff_at(t):
    """Ouverture du filtre global : sombre au début, brillant au drop, chaud au final."""
    pts = [(0, 250), (6, 500), (11.9, 2200), (12, 3200), (24, 3800), (28.6, 7000),
           (29, 1400), (33, 2600), (35, 900)]
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys)


# Pad + sub
for start, end, notes in CHORDS:
    dur = end - start + 0.4
    tt = start + t_axis(dur)
    cut = cutoff_at(tt)
    fade = np.minimum(1, np.minimum(t_axis(dur) / 0.25, (dur - t_axis(dur)) / 0.4))
    big = start >= TL_REVEAL
    for k, n in enumerate(notes):
        g = (0.05 if n >= 52 else 0.07) * (1.3 if big else 1.0)
        v = pad_voice(n, dur, cut) * fade
        place(side, start, v, g, pan=(-0.6 + 1.2 * k / max(1, len(notes) - 1)))
        place(verb, start, v, g * 0.6)
    sub = np.sin(2 * np.pi * midi(notes[0] - 12 if notes[0] > 40 else notes[0]) * t_axis(dur)) * fade
    place(side, start, sub, 0.16 if start >= TL_DROP else 0.1)

# Intro : battement de cœur grave + tic-tac numérique
for b in np.arange(1.0, 9.0, 1.0):
    for off, g in ((0.0, 0.55), (0.22, 0.35)):
        th = boom(0.6, 80, 40) * np.exp(-t_axis(0.6) * 4)
        place(dry, b + off, th, g * min(1, b / 3))
for i, tick in enumerate(np.arange(0.5, 9.0, 0.25)):
    if rng.random() < 0.55:
        place(dry, tick, blip(rng.choice([2400, 3200, 4100]), 0.03), 0.08, pan=rng.uniform(-0.8, 0.8))

# Frappe clavier du texte d'ouverture
for i, ch in enumerate(TL["typingText"]):
    if ch != " ":
        place(dry, TL["typingStart"] + i * TL["typingRate"], hat(0.03, 3000) + blip(1800 + 60 * (i % 5), 0.03),
              0.22, pan=rng.uniform(-0.3, 0.3))

# Arpège en doubles croches, de l'intro au compte à rebours
arp_start, arp_end = TL["generationIn"], TL_SILENCE
arp_bus = np.zeros((N, 2))
step = BEAT / 4
for i, t0 in enumerate(np.arange(arp_start, arp_end, step)):
    notes = next(c[2] for c in CHORDS if c[0] <= t0 < c[1])
    upper = [n + 12 for n in notes[1:]]
    pattern = [0, 2, 1, 3, 2, 0, 3, 1]
    n = upper[pattern[i % 8] % len(upper)]
    bright = float(cutoff_at(t0)) * 1.1
    intensity = np.interp(t0, [arp_start, TL_DROP, 26, arp_end], [0.25, 0.6, 0.75, 1.0])
    place(arp_bus, t0, pluck(n, 0.2, bright), 0.11 * intensity, pan=0.35 if i % 2 else -0.35)
arp_bus = delay(arp_bus, BEAT * 0.75, 0.35, 4)
dry += arp_bus
verb += arp_bus * 0.3

# Batterie
kicks = list(np.arange(arp_start, TL_DROP, 1.0))          # pré-drop : temps 1 et 3
kicks += list(np.arange(TL_DROP, 26.0, BEAT))             # drop : four-on-the-floor
kicks += list(np.arange(26.0, 27.0, BEAT))
kicks += list(np.arange(27.0, 28.0, BEAT / 2))
kicks += list(np.arange(28.0, TL_SILENCE, BEAT / 4))       # accélération finale
for k in kicks:
    place(dry, k, kick(1.0), 0.75)

for c in np.arange(TL_DROP + BEAT, 26.0, 2 * BEAT):
    cl = clap()
    place(dry, c, cl, 0.32)
    place(verb, c, cl, 0.25)
for h in np.arange(TL_DROP + BEAT / 2, 26.0, BEAT):
    place(dry, h, hat(0.12, 7000), 0.13, pan=0.3)
for h in np.arange(TL_DROP, 26.0, BEAT / 4):
    place(dry, h, hat(0.03, 10000), 0.05, pan=-0.3)

# Roulement de caisse claire montant (26 s -> silence)
t0 = 26.0
while t0 < TL_SILENCE:
    prog = (t0 - 26.0) / (TL_SILENCE - 26.0)
    s = clap(0.15)
    place(dry, t0, s, 0.12 + 0.25 * prog)
    place(verb, t0, s, 0.1)
    t0 += BEAT / (2 if prog < 0.3 else 4 if prog < 0.65 else 8)

# Basse en croches décalées (pompe)
for b in np.arange(TL_DROP, 26.0, BEAT / 2):
    if (b - TL_DROP) % BEAT == 0:
        continue
    notes = next(c[2] for c in CHORDS if c[0] <= b < c[1])
    n = notes[0] - 12 if notes[0] > 40 else notes[0]
    tt = t_axis(0.22)
    bass = lp(saw(midi(n), 0.22) + 0.5 * saw(midi(n + 12), 0.22), 900) * np.exp(-tt * 8)
    place(side, b, bass, 0.32)

# Sidechain : le kick creuse le pad et la basse
pump = np.ones(N)
for k in kicks:
    i = int(k * SR)
    seg = 1 - 0.7 * np.exp(-t_axis(0.35) * 14)
    j = min(N, i + len(seg))
    pump[i:j] = np.minimum(pump[i:j], seg[: j - i])
dry += side * pump[:, None]
verb += side * pump[:, None] * 0.35

# Montées
place(dry, TL["flashWords"][0], riser(TL_DROP - TL["flashWords"][0]), 0.45)
place(dry, TL["doorsOpen"], riser(TL_SILENCE - TL["doorsOpen"], 300, 12000), 0.55)
place(dry, TL["reveal"] - 0.35, whoosh(0.35, 400, 9000), 0.35)

# Impacts sur chaque apparition de texte
place(dry, TL["hookIn"], boom(4.0), 0.85)
place(verb, TL["hookIn"], boom(1.0), 0.4)
place(dry, TL["hookIn"] - 0.5, whoosh(0.5), 0.3)

place(dry, TL["generationIn"], boom(3.0, 90, 35), 0.6)
place(dry, TL["generationIn"], glitch(0.3), 0.18)
place(dry, TL["generationIn"] - 0.4, whoosh(0.4), 0.25)

for i, f in enumerate(TL["flashWords"]):
    place(dry, f, glitch(0.22), 0.22, pan=(-0.5 if i % 2 else 0.5))
    place(dry, f, kick(0.9, 0.4), 0.5)
    place(verb, f, blip(880 * (1 + i * 0.25), 0.12, square=False), 0.4)

place(dry, TL_DROP, boom(4.5, 110, 30), 0.95)
place(verb, TL_DROP, hp(noise(2.5), 3000) * np.exp(-t_axis(2.5) * 2.2), 0.22)  # crash
for th in TL["themes"][1:]:
    place(dry, th, boom(1.5, 120, 45), 0.4)
    place(dry, th - 0.3, whoosh(0.3, 600, 8000), 0.22)
    place(verb, th, glitch(0.15), 0.12)

for i, v in enumerate(TL["verbs"]):
    place(dry, v, boom(1.4, 140, 40), 0.75)
    place(verb, v, hp(noise(1.5), 4000) * np.exp(-t_axis(1.5) * 3), 0.16)
    place(verb, v, shimmer([midi(76 + 3 * i), midi(83 + 3 * i)], 1.5), 0.15)

place(dry, TL["doorsIn"], whoosh(1.2, 200, 5000, rising=False), 0.3)
place(dry, TL["doorsOpen"], boom(3.0, 60, 25), 0.6)
place(verb, TL["doorsOpen"], shimmer([midi(81), midi(88), midi(93)], 3.0, 0.4, 0.7), 0.25)

for i, c in enumerate(TL["countdown"]):
    place(dry, c, boom(0.8, 150, 50), 0.6)
    place(verb, c, blip(midi(81 + 5 * i), 0.25, square=False), 0.45)
    place(dry, c, glitch(0.2), 0.2)

# Silence de suspension, puis aspiration inverse vers la révélation
cut = int(TL_SILENCE * SR)
fade_len = int(0.03 * SR)
ramp = np.ones(N)
ramp[cut - fade_len: cut] = np.linspace(1, 0, fade_len)
ramp[cut: int(TL_REVEAL * SR)] = 0
dry *= ramp[:, None]
verb *= ramp[:, None]
place(dry, TL_SILENCE + 0.12, blip(5200, 0.04), 0.15)
rev = (hp(noise(0.9), 2500) * np.exp(-t_axis(0.9) * 3))[::-1]
place(dry, TL_REVEAL - 0.9, rev, 0.28)

# Révélation finale
R = TL_REVEAL
place(dry, R, boom(6.0, 120, 26), 1.15)
place(dry, R, kick(1.0, 0.7), 0.9)
place(verb, R, hp(noise(4.0), 2500) * np.exp(-t_axis(4.0) * 1.1), 0.35)
place(verb, R, shimmer([midi(69), midi(76), midi(81), midi(88)], 5.0, 0.01, 0.5), 0.3)
place(dry, TL["editionIn"], whoosh(0.5, 2000, 9000, rising=False), 0.18)
place(verb, TL["editionIn"], blip(midi(88), 0.4, square=False), 0.25)
place(dry, TL["jadeIn"], boom(2.5, 90, 35), 0.45)
place(verb, TL["jadeIn"], shimmer([midi(81), midi(85), midi(88)], 3.0, 0.2, 0.9), 0.25)
place(dry, TL["prepIn"], kick(0.9, 0.5), 0.5)
place(verb, TL["prepIn"], blip(midi(76), 0.3, square=False), 0.3)
for k, t0 in enumerate([TL["connectIn"], TL["connectIn"] + 0.12, TL["connectIn"] + 0.24]):
    place(verb, t0, blip(midi(84 + 3 * k), 0.12, square=False), 0.3, pan=-0.4 + 0.4 * k)
for k in range(3):  # "COMING SOON" : triple ping de signal
    place(verb, TL["soonIn"] + k * 0.5, blip(midi(93), 0.3, square=False), 0.3 - k * 0.07)
# Pulsation lente sous l'écran final
for b in np.arange(R + 2 * BEAT * 2, DUR - 0.5, 2 * BEAT):
    place(dry, b, kick(0.5, 0.5), 0.35)

# ---------------------------------------------------------------- mixage

wet = fftconvolve(verb, reverb_ir(), axes=0)[:N]
mix = dry + wet * 0.55
mix = hp(mix, 25)

# Fondu de sortie
fo = int(TL["fadeOut"] * SR)
mix[fo:] *= np.linspace(1, 0, N - fo)[:, None] ** 1.5
mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]

peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25) * 0.89  # légère saturation, crête ~ -1 dBFS

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "build", "soundtrack.wav")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("écrit", out, f"{DUR:.1f}s")
