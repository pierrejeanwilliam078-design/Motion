"""Bande-son de la version 6 « De la terre au futur » : trailer orchestral aux couleurs malgaches + voix off.

Usage : python3 src/v3/soundtrack_v6.py build/soundtrack-v6.wav
Même dramaturgie que la V3 (mystère, montée, silence, explosion), mais avec un pincé de cordes inspiré
de la valiha, une guitare façon kabosy, un groove ternaire 12/8 inspiré du salegy et des grillons la nuit.
Instants clés : src/v3/timeline-v6.js. Voix : assets/voice/ (ElevenLabs), posée phrase par phrase.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from synth import *  # noqa: E402,F401,F403  (SR, rng, instruments, filtres, voix)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
TL = load_timeline(os.path.join(HERE, "timeline-v6.js"))
DUR = TL["duration"]
N = int(DUR * SR)
PULSE, EIGHTH, BAR = 0.5, 0.5 / 3, 2.0      # 12/8 : temps pointé, croche, mesure

music = np.zeros((N, 2))
verb = np.zeros((N, 2))


def add(start, sig, gain=1.0, pan=0.0, wet=0.0):
    place(music, start, sig, gain, pan)
    if wet:
        place(verb, start, sig, gain * wet, pan)


# ---------------------------------------------------------------- instruments malgaches stylisés

def plucked(note, dur=2.0, decay=0.996, bright=6000):
    """Corde pincée (Karplus-Strong), calculée par blocs d'une période pour rester rapide."""
    n, period = int(dur * SR), max(2, int(round(SR / midi(note))))
    y = np.zeros(n + period + 1)
    burst = lp(rng.uniform(-1, 1, period), bright)
    y[period + 1: 2 * period + 1] = burst
    for s in range(2 * period + 1, len(y), period):
        e = min(s + period, len(y))
        y[s:e] += decay * 0.5 * (y[s - period: e - period] + y[s - period - 1: e - period - 1])
    out = y[period + 1: period + 1 + n]
    return out / (np.max(np.abs(out)) + 1e-9)


def valiha(note, dur=2.2):
    """Cithare tubulaire stylisée : corde claire + légère résonance de bambou."""
    s = plucked(note, dur, 0.997, 7000)
    return s * 0.8 + bp(s, 1800, 3200) * 0.6


def strum(notes, dur=1.2, spread=0.018, gain=1.0):
    """Accord gratté façon kabosy : cordes décalées de quelques millisecondes."""
    out = np.zeros(int((dur + spread * len(notes)) * SR))
    for k, n in enumerate(notes):
        s = plucked(n, dur, 0.994, 4500)
        i = int(k * spread * SR)
        out[i: i + len(s)] += s
    return out / len(notes) * gain * 2


def shaker(dur=0.07, accent=1.0):
    t = t_axis(dur)
    return bp(noise(dur), 5000, 12000) * np.exp(-t * 55) * accent


def hand_drum(slap=False):
    if slap:
        t = t_axis(0.12)
        return bp(noise(0.12), 900, 3500) * np.exp(-t * 45) + np.sin(2 * np.pi * 330 * t) * np.exp(-t * 40) * 0.5
    t = t_axis(0.4)
    f = 95 + 60 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def bass808(note, dur=1.0, decay=2.0, glide=5):
    t = t_axis(dur)
    f = midi(note) * 2 ** (glide * np.exp(-t * 35) / 12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * decay) * np.minimum(1, (dur - t) / 0.05)
    return np.tanh(s * 2.2) * 0.8


def cricket(dur=0.5, f=4600):
    """Stridulation : salves rapides d'une note aiguë."""
    t = t_axis(dur)
    gate = (np.sin(2 * np.pi * 32 * t) > 0.2).astype(float)
    return np.sin(2 * np.pi * f * t) * gate * np.sin(np.pi * t / dur) ** 2


# ---------------------------------------------------------------- harmonie (mi mineur -> sol majeur)

Em, C, G, D = [40, 47, 52, 55, 59], [36, 48, 52, 55, 60], [43, 50, 55, 59, 62], [38, 50, 54, 57, 62]
PROG = [(10, 12, Em), (12, 14, C), (14, 16, G), (16, 18, D), (18, 20, Em), (20, 22, C), (22, 23, D)]


def chord_at(t, prog):
    return next((c for a, b, c in prog if a <= t < b), prog[-1][2])


# ---------------------------------------------------------------- 1. nuit (0 -> 5 s)

add(0.0, np.sin(2 * np.pi * midi(28) * t_axis(10.5)) * np.minimum(1, t_axis(10.5) / 3) * np.minimum(1, (10.5 - t_axis(10.5)) / 1), 0.22)
add(0.0, strings([40, 47, 52], 5.6, attack=3.5, bright=900), 0.32, wet=0.6)
for k in range(26):  # grillons
    add(rng.uniform(0.2, 6.5), cricket(rng.uniform(0.3, 0.7), rng.choice([4300, 4700, 5200])), 0.02, pan=rng.uniform(-0.9, 0.9), wet=0.6)
for hb in TL["heartbeats"]:
    add(hb, taiko(1.0, 70, 38), 0.5, wet=0.4)
    add(hb + 0.24, taiko(0.8, 60, 36), 0.28, wet=0.3)
for tt, n in [(1.0, 76), (2.2, 71), (3.2, 74), (4.1, 79)]:  # notes de valiha isolées, dans le noir
    add(tt, valiha(n, 3.0), 0.16, pan=rng.uniform(-0.5, 0.5), wet=0.9)
add(TL["s1Text"] - 0.6, whoosh(0.6, 200, 4000), 0.1, wet=0.5)
add(4.2, rev(crash(0.8)), 0.12)

# ---------------------------------------------------------------- 2. lever du soleil (5 -> 10 s)

DAWN, TERR = TL["dawn"], TL["terraces"]
add(DAWN, braam(3.0, (28, 40, 47)), 0.3, wet=0.5)
add(DAWN, strings([48, 55, 60, 64], 2.7, attack=1.2, bright=1800), 0.3, wet=0.5)
add(7.5, strings([43, 50, 55, 59, 62], 2.8, attack=1.0, bright=2400), 0.32, wet=0.5)
pattern = [0, 2, 4, 3, 1, 4, 2, 3, 4, 1, 2, 0]
for i, tt in enumerate(np.arange(DAWN, TERR, EIGHTH)):  # arpège de valiha qui monte avec le soleil
    p = (tt - DAWN) / (TERR - DAWN)
    ch = [48, 52, 55, 60, 64] if tt < 7.5 else [43, 47, 50, 55, 59]
    add(tt, valiha(ch[pattern[i % 12]] + 12 + (12 if p > 0.6 and i % 3 == 0 else 0), 1.4), 0.07 + 0.08 * p, pan=0.4 if i % 2 else -0.4, wet=0.4)
for i, tt in enumerate(np.arange(7.5, TERR, EIGHTH)):
    add(tt, shaker(0.06, [1, 0.4, 0.6][i % 3]), 0.06)
add(8.5, riser(1.5, 300, 7000), 0.22)

# ---------------------------------------------------------------- 3. groove ternaire (10 -> 16 s)

W = TL["words"]
add(TERR, braam(2.5, (28, 40, 47, 52)), 0.5, wet=0.5)
add(TERR, crash(), 0.25, wet=0.4)
KICK, SLAP, BASS = (0, 3, 6, 9), (2, 4, 8, 10), (0, 5, 7, 11)


def groove(a, b, gain=1.0, prog=PROG):
    for bar in np.arange(a, b - 1e-6, BAR):
        for e in range(12):
            tt = bar + e * EIGHTH
            if tt >= b:
                break
            add(tt, shaker(0.06, [1, 0.35, 0.6][e % 3]), 0.09 * gain, pan=0.3)
            if e in KICK:
                add(tt, kick(0.9, 0.4), 0.5 * gain)
            if e in SLAP:
                add(tt, hand_drum(True), 0.22 * gain, pan=-0.25)
            if e in BASS:
                add(tt, hand_drum(False), 0.35 * gain, pan=0.15)
            if e in (3, 9):
                add(tt, clap(0.2), 0.18 * gain, wet=0.2)
        ch = chord_at(bar, prog)
        for k, e in enumerate((0, 3, 5, 6, 9, 11)):   # guitare grattée sur le rythme
            add(bar + e * EIGHTH, strum([n + 12 for n in ch[1:]], 0.6), 0.1 * gain, pan=-0.35, wet=0.2)
        add(bar, bass808(ch[0] + 12, 1.0, 2.0, 5), 0.3 * gain)


groove(TERR, 16.0)
add(TERR, strings([52, 59, 64], 6.0, attack=0.6, bright=1500), 0.25, wet=0.5)
for i, w in enumerate(W):
    add(w, braam(1.6, [(28, 40, 47, 52), (24, 36, 48, 52), (31, 43, 50, 55)][i]), 0.55, wet=0.5)
    add(w, taiko(1.2, 85, 40), 0.75, wet=0.4)
    add(w, crash(1.5), 0.2)
    add(w - 0.25, whoosh(0.25, 800, 10000), 0.18)
    for k, n in enumerate([71, 74, 79][i:i + 1] + [83]):
        add(w + k * EIGHTH, valiha(n, 1.5), 0.2, wet=0.5)

# ---------------------------------------------------------------- 4. la ville, montée de tension (16 -> 23 s)

CITY, SIL = TL["city"], TL["silence"]
groove(CITY, 21.0, 1.0)
add(CITY, sub_drop(3.0, 70, 30), 0.45)
add(CITY, strings([50, 57, 62, 66], 2.2, attack=0.4, bright=2600), 0.28, wet=0.5)
add(18.0, strings([52, 59, 64, 67], 2.2, attack=0.3, bright=3000), 0.3, wet=0.5)
add(20.0, strings([48, 55, 64, 67, 72], 2.2, attack=0.3, bright=4000), 0.34, wet=0.5)
add(22.0, strings([50, 57, 62, 66, 69], 1.1, attack=0.2, bright=5000), 0.4, wet=0.5)   # ré majeur : dominante
scale = [64, 66, 67, 69, 71, 72, 74, 76, 78, 79, 81, 83, 84, 86]
for k, tt in enumerate(np.arange(CITY, SIL, 0.5)):   # violons qui grimpent
    add(tt, strings([scale[min(k, len(scale) - 1)]], 0.55, attack=0.05, release=0.15, bright=5000, voices=4), 0.15 + 0.012 * k, wet=0.4)
tt = 21.0
while tt < SIL:  # tambours qui accélèrent, valiha en trémolo
    p = (tt - 21.0) / (SIL - 21.0)
    add(tt, taiko(0.6, 110, 50), 0.4 + 0.4 * p, pan=np.sin(tt * 5) * 0.3, wet=0.25)
    add(tt, valiha(83 + int(p * 7), 0.4), 0.08 + 0.1 * p, pan=-np.sin(tt * 5) * 0.4)
    tt += EIGHTH * (2 if p < 0.4 else 1 if p < 0.75 else 0.5)
for bt in (21.0, 21.5, 22.0, 22.333, 22.5, 22.667, 22.833):
    add(bt, brass([38, 45, 50, 57], 0.4, swell=0.05, peak=3000, sustain=1500), 0.3, wet=0.35)
add(19.0, riser(SIL - 19.0, 250, 13000), 0.5)

cut, fade = int(SIL * SR), int(0.015 * SR)   # silence brutal
ramp = np.ones(N)
ramp[cut - fade: cut] = np.linspace(1, 0, fade)
ramp[cut: int(TL["reveal"] * SR)] = 0
music *= ramp[:, None]
verb *= ramp[:, None]
add(TL["reveal"] - 0.12, rev(hp(noise(0.12), 2500) * np.exp(-t_axis(0.12) * 10)), 0.1)

# ---------------------------------------------------------------- 5. révélation festive (23,5 -> 29 s)

R = TL["reveal"]
add(R, braam(5.0, (31, 43, 50, 55, 59)), 0.95, wet=0.6)
add(R, sub_drop(3.5, 100, 22), 0.85)
add(R, taiko(1.6, 80, 34), 0.95, wet=0.5)
add(R, crash(4.5), 0.5, wet=0.6)
add(R, choir([55, 59, 62, 67, 71], 3.0, attack=0.05), 0.45, wet=0.7)
FEST = [(R, 25.5, G), (25.5, 26.5, D), (26.5, 27.5, Em), (27.5, 28.5, C), (28.5, 29.0, D)]
for a, b, ch in FEST:
    add(a, strings([n + 12 for n in ch], b - a + 0.3, attack=0.08, bright=4200), 0.28, wet=0.5)
    add(a, choir([n + 12 for n in ch[1:]], b - a + 0.3, attack=0.2), 0.28, wet=0.6)
groove(R + 0.5, 28.83, 1.4, FEST)
hook = [79, 81, 83, 86, 88, 86, 83, 81, 79, 0, 83, 86, 91, 88, 86, 83, 86, 0, 79, 81, 83, 81, 79, 0]
for k, n in enumerate(hook):  # motif de valiha, le refrain du trailer
    if n:
        add(R + 0.5 + k * EIGHTH, valiha(n, 1.2), 0.22, pan=0.25 if k % 2 else -0.25, wet=0.4)
add(TL["editionIn"], crash(2.0), 0.18, wet=0.4)
add(28.5, riser(0.5, 400, 12000), 0.3)

# ---------------------------------------------------------------- 6. accord final et signature (29 -> 35 s)

FIN = TL["final"]
add(FIN, braam(5.5, (31, 43, 50, 55)), 0.7, wet=0.6)
add(FIN, strings([55, 59, 62, 67, 71, 74], 6.0, attack=0.05, release=2.5, bright=3800), 0.42, wet=0.7)
add(FIN, choir([67, 71, 74, 79], 6.0, attack=0.1, release=2.5), 0.38, wet=0.8)
add(FIN, taiko(1.8, 75, 32), 0.85, wet=0.6)
add(FIN, crash(5.0), 0.3, wet=0.7)
add(FIN, strum([55, 59, 62, 67, 71], 3.0, 0.03), 0.35, wet=0.6)
for k in range(10):
    add(rng.uniform(30.0, 34.5), cricket(rng.uniform(0.3, 0.6), rng.choice([4300, 4700])), 0.015, pan=rng.uniform(-0.9, 0.9), wet=0.6)
for k, n in enumerate([79, 83, 86, 91]):  # signature : arpège de valiha sur « ONG JADE Madagascar »
    add(TL["ongIn"] + k * EIGHTH, valiha(n, 2.5), 0.26, pan=-0.45 + 0.3 * k, wet=0.8)
add(TL["ongIn"], taiko(1.5, 70, 32), 0.4, wet=0.6)
add(TL["openPulse"], bell(91, 2.0), 0.1, wet=1.0)

# ---------------------------------------------------------------- voix off et mixage

voice = voice_track(os.path.join(ROOT, "assets", "voice", "voix-off-elevenlabs-hugo.mp3"), TL["voice"], N)
duck = duck_envelope(voice)

wet = fftconvolve(verb, reverb_ir(3.4, 1.6), axes=0)[:N]
mus = hp(music + wet * 0.5, 25)
mus = np.tanh(mus / np.max(np.abs(mus)) * 1.4) / np.tanh(1.4) * 0.62
mus *= duck[:, None]
vwet = fftconvolve(np.stack([voice, voice], 1), reverb_ir(1.6, 3.5), axes=0)[:N]
mix = mus + voice[:, None] * 0.95 + vwet * 0.08

fo = int((DUR - 0.25) * SR)
mix[fo:] *= np.linspace(1, 0, N - fo)[:, None]
mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
mix *= 0.93 / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "build", "soundtrack-v6.wav")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
write_wav(out, mix)
print("écrit", out, f"{DUR:.1f}s")
