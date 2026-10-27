"""Bande-son de la version 2 « De la graine au réseau » : électro organique et groove trap à 100 BPM.

Usage : python3 src/v2/soundtrack.py build/soundtrack-v2.wav
Les impacts suivent src/v2/timeline.js. Aucun échantillon externe : tout est synthétisé.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from synth import *  # noqa: E402,F401,F403  (SR, rng, instruments, filtres)

HERE = os.path.dirname(os.path.abspath(__file__))
TL = load_timeline(os.path.join(HERE, "timeline.js"))
DUR = TL["duration"]
N = int(DUR * SR)
BEAT = 60.0 / TL["bpm"]
BAR = 4 * BEAT

dry = np.zeros((N, 2))
verb = np.zeros((N, 2))


# ---------------------------------------------------------------- instruments propres à la V2

def kalimba(note, dur=1.6, decay=3.2):
    """Lame métallique pincée : partiels inharmoniques à décroissance rapide."""
    t = t_axis(dur)
    f = midi(note)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * decay)
    s += 0.28 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * decay * 6)
    s += 0.12 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * decay * 2)
    s += hp(noise(dur), 3000) * np.exp(-t * 400) * 0.15
    return s * np.minimum(t / 0.002, 1)


def b808(note, dur=1.4, decay=1.6, glide=12):
    """Basse 808 : sinus saturé avec glissé d'attaque."""
    t = t_axis(dur)
    f = midi(note) * 2 ** (glide * np.exp(-t * 35) / 12)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * decay)
    s *= np.minimum(1, (dur - t) / 0.05)
    return np.tanh(s * 2.4) * 0.8


def drop_of_water(f0=1500, f1=480, dur=0.35):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)


def warm_pad(notes, dur, attack=0.8, release=0.8):
    """Nappe douce (quelques harmoniques, léger chorus) : plus chaude que les dents de scie de la V1."""
    t = t_axis(dur)
    env = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release)
    out = np.zeros_like(t)
    for n in notes:
        f = midi(n)
        for d in (-0.004, 0.0, 0.005):
            ph = 2 * np.pi * f * (1 + d) * t + rng.random() * 6
            out += np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    return out / (3 * len(notes)) * env


def snare(dur=0.3):
    t = t_axis(dur)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 28) * 0.6
    return clap(dur) * 0.8 + body + bp(noise(dur), 2500, 9000) * np.exp(-t * 18) * 0.35


# ---------------------------------------------------------------- harmonie

CHORDS = [
    (0.0, 4.8, [38, 50, 57, 62, 65]),          # Dm
    (4.8, 7.2, [38, 50, 57, 62, 65, 69]),      # Dm
    (7.2, 9.6, [34, 46, 53, 58, 62, 65]),      # Bb
    (9.6, 12.0, [36, 48, 55, 60, 64, 67]),     # C
    (12.0, 14.4, [41, 53, 60, 65, 69, 72]),    # F
    (14.4, 16.8, [36, 48, 55, 64, 67, 72]),    # C
    (16.8, 19.2, [38, 50, 57, 62, 65, 69]),    # Dm
    (19.2, 21.6, [34, 46, 53, 58, 62, 65]),    # Bb
    (21.6, 24.0, [36, 48, 55, 60, 65, 67]),    # Csus4
    (24.0, 28.2, [33, 45, 52, 57, 61, 64, 67]),  # A7 (tension)
    (28.8, DUR, [29, 41, 53, 60, 65, 67, 69, 72]),  # Fadd9 (résolution lumineuse)
]


def chord_at(t):
    return next((c[2] for c in CHORDS if c[0] <= t < c[1]), CHORDS[-1][2])


for start, end, notes in CHORDS:
    dur = end - start + 0.6
    big = start >= TL["reveal"]
    gain = 0.16 if start < 4.8 else 0.2 if start < 24 else 0.26
    pad = warm_pad(notes[1:], dur, attack=1.2 if start == 0 else 0.3, release=0.6)
    place(dry, start, pad, gain * (1.3 if big else 1), pan=-0.2)
    place(verb, start, pad, gain * 0.8, pan=0.2)
    sub = np.sin(2 * np.pi * midi(notes[0]) * t_axis(dur)) * np.minimum(1, t_axis(dur) / 0.4) * np.minimum(1, (dur - t_axis(dur)) / 0.5)
    place(dry, start, sub, 0.12 if start < 12 else 0.08)

# ---------------------------------------------------------------- intro : la graine et les racines

for k, t0 in enumerate(np.arange(TL["seedIn"], TL["sproutIn"], 1.2)):
    d = drop_of_water(1500 + 120 * k, 480 + 40 * k)
    place(dry, t0, d, 0.35)
    place(verb, t0, d, 0.6)

rumble = lp(noise(TL["sproutIn"] - TL["rootsIn"] + 1), 90) * np.linspace(0, 1, int((TL["sproutIn"] - TL["rootsIn"] + 1) * SR)) ** 2
place(dry, TL["rootsIn"], rumble, 0.5)
t0 = TL["rootsIn"]
while t0 < TL["sproutIn"]:  # crépitements des racines qui poussent, de plus en plus denses
    p = min(1.0, (t0 - TL["rootsIn"]) / 3.6)
    place(dry, t0, blip(rng.uniform(2500, 6000), 0.012, square=False), rng.uniform(0.05, 0.14), pan=rng.uniform(-0.7, 0.7))
    t0 += rng.uniform(0.02, 0.2) * (1.4 - p)

place(dry, TL["ideaIn"], boom(2.5, 90, 40), 0.45)
place(verb, TL["ideaIn"], kalimba(74, 2.5), 0.4)

# ---------------------------------------------------------------- pousse, feuilles, partage

place(dry, TL["sproutIn"] - 0.6, whoosh(0.6, 200, 3000), 0.2)
pattern = [0, 2, 1, 3, 2, 4, 3, 1]
for i, t0 in enumerate(np.arange(TL["sproutIn"], TL["wipeWords"][0], BEAT / 2)):
    up = sorted(n + 12 for n in chord_at(t0)[1:])
    g = np.interp(t0, [TL["sproutIn"], TL["wipeWords"][0]], [0.12, 0.26])
    k = kalimba(up[pattern[i % 8] % len(up)], 1.2)
    place(dry, t0, k, g, pan=0.4 if i % 2 else -0.4)
    place(verb, t0, k, g * 0.5)
for j, t0 in enumerate(TL["leaves"]):
    k = kalimba([81, 84, 86][j], 2.0, 2.2)
    place(dry, t0, k, 0.3, pan=[-0.5, 0.5, 0][j])
    place(verb, t0, k, 0.4)
    place(dry, t0 - 0.25, whoosh(0.25, 800, 6000), 0.12)

for b in np.arange(TL["growIn"], TL["wipeWords"][0], BAR / 2):
    place(dry, b, kick(0.9, 0.45), 0.55)
for h in np.arange(TL["shareIn"], TL["wipeWords"][0], BEAT / 2):
    place(dry, h, hat(0.05, 9000), 0.08, pan=0.3)
for c in (TL["growIn"], TL["shareIn"]):
    place(dry, c, boom(1.6, 110, 45), 0.4)
    place(verb, c, snare(0.25), 0.25)

# ---------------------------------------------------------------- mots en volets (9,6 -> 12 s)

for i, w in enumerate(TL["wipeWords"]):
    place(dry, w, kick(1.0, 0.45), 0.7)
    place(dry, w - 0.2, whoosh(0.2, 1200, 9000), 0.22, pan=-0.5 if i % 2 else 0.5)
    for n in chord_at(w)[2:5]:
        place(dry, w, kalimba(n + 12, 0.8), 0.12)
place(dry, TL["wipeWords"][0], riser(TL["drop"] - TL["wipeWords"][0], 300, 10000), 0.4)
t0, roll_start = TL["wipeWords"][2], TL["wipeWords"][2]
while t0 < TL["drop"] - 0.18:
    p = (t0 - roll_start) / (TL["drop"] - roll_start)
    place(dry, t0, snare(0.12), 0.08 + 0.2 * p)
    t0 += BEAT / (2 if p < 0.35 else 4 if p < 0.7 else 8)

# ---------------------------------------------------------------- drop : groove trap (12 -> 19,2 s)

D0, D1 = TL["drop"], TL["iris"]
place(dry, D0, boom(3.5, 120, 32), 0.85)
place(verb, D0, hp(noise(2.5), 3500) * np.exp(-t_axis(2.5) * 2), 0.25)
for bar in np.arange(D0, D1 - 0.01, BAR):
    root = chord_at(bar)[0]
    for off, n_off, length in ((0.0, 0, 0.85), (0.9, 0, 0.55), (1.5, 0, 0.85)):
        place(dry, bar + off, kick(1.0, 0.4), 0.7)
        place(dry, bar + off, b808(root + 12 + n_off, length, 2.2), 0.42)
    place(dry, bar + BEAT * 2, snare(), 0.42)
    place(verb, bar + BEAT * 2, snare(), 0.2)
    last_bar = bar + BAR > D1 - 0.01
    for h in np.arange(bar, bar + BAR - 0.01, BEAT / 2):
        place(dry, h, hat(0.045, 9500), 0.1, pan=0.25)
    roll = np.arange(bar + BEAT * 3, bar + BAR - 0.01, BEAT / (6 if last_bar else 4))
    for k, h in enumerate(roll):  # roulements de charleston typiques du trap
        place(dry, h, hat(0.03, 10000), 0.06 + 0.01 * k, pan=-0.25)
    up = sorted(n + 12 for n in chord_at(bar)[2:])
    for k, pos in enumerate([0, 3, 6, 8, 10, 13]):  # motif de kalimba en doubles croches
        tt = bar + pos * BEAT / 4
        kk = kalimba(up[[3, 2, 0, 1, 2, 0][k] % len(up)], 0.9)
        place(dry, tt, kk, 0.17, pan=0.35 if k % 2 else -0.35)
        place(verb, tt, kk, 0.12)
for p in TL["panels"][1:]:
    place(dry, p - 0.25, whoosh(0.3, 700, 9000), 0.25, pan=-0.6)
    place(verb, p, blip(midi(91), 0.18, square=False), 0.18)

# ---------------------------------------------------------------- iris, phrase, question

place(dry, D1 - 0.6, (hp(noise(0.6), 2000) * np.exp(-t_axis(0.6) * 4))[::-1], 0.3)
place(dry, D1, boom(4.0, 70, 26), 0.9)
for i, s in enumerate(TL["statement"]):
    place(dry, s, b808([38, 41, 45][i], 1.0, 2.5, 7), 0.45)
    k = kalimba([74, 77, 81][i], 2.2, 2.0)
    place(dry, s, k, 0.25)
    place(verb, s, k, 0.4)
for hb in (21.6, 21.85, 22.2, 22.45):
    place(dry, hb, kick(0.7, 0.4), 0.35)
Q = TL["question"]
place(dry, Q, boom(2.5, 100, 40), 0.65)
for k, n in enumerate([76, 81]):  # intervalle ascendant laissé en suspens
    kk = kalimba(n, 2.0, 1.8)
    place(dry, Q + 0.3 * k, kk, 0.25)
    place(verb, Q + 0.3 * k, kk, 0.45)
place(dry, Q + 0.4, (hp(noise(0.8), 1500) * np.exp(-t_axis(0.8) * 3))[::-1], 0.2)

# ---------------------------------------------------------------- chargement : montée de tension

L0, ST, SIL = TL["loading"], TL["stuck"], TL["silence"]
t0 = L0
while t0 < ST:  # tic de progression qui accélère et monte en hauteur
    p = (t0 - L0) / (ST - L0)
    place(dry, t0, blip(2000 + 1600 * p, 0.03, square=False), 0.18 + 0.12 * p, pan=0.3 * np.sin(t0 * 7))
    t0 += BEAT / (4 if p < 0.55 else 8)
t0 = L0
while t0 < SIL:  # battement de cœur (double pulsation) qui s'accélère
    p = (t0 - L0) / (SIL - L0)
    place(dry, t0, b808(33, 0.35, 8, 5), 0.42)
    place(dry, t0, kick(0.8, 0.35), 0.3 + 0.4 * p)
    place(dry, t0 + 0.18 * (1 - 0.5 * p), b808(33, 0.3, 9, 5), 0.28)
    t0 += max(0.32, 1.2 - 0.85 * p)
place(dry, L0 + 0.6, riser(SIL - L0 - 0.6, 250, 12000), 0.8)
tension_len = SIL - L0
tension = sum(saw(midi(n), tension_len, d) for n in (45, 52, 57, 61) for d in (-0.004, 0.004)) / 8
ramp_t = np.linspace(0, 1, len(tension))
tension = sweep_filter(tension, 300 * (6000 / 300) ** (ramp_t ** 1.5), "low") * (0.25 + 0.75 * ramp_t ** 1.3)
place(dry, L0, tension, 0.35)
place(verb, L0, tension, 0.15)
t0 = L0 + BAR
while t0 < SIL:
    p = (t0 - L0 - BAR) / (SIL - L0 - BAR)
    place(dry, t0, snare(0.12), 0.06 + 0.25 * p)
    t0 += BEAT / (2 if p < 0.3 else 4 if p < 0.6 else 8)
for k, t0 in enumerate(np.arange(ST, SIL, 1 / 14)):  # « bloqué à 99 % » : bégaiement électronique
    place(dry, t0, blip(1760 if k % 2 else 1318, 0.05), 0.12)

# Coupure nette, silence, puis la goutte d'eau de l'intro revient
cut, fade = int(SIL * SR), int(0.02 * SR)
ramp = np.ones(N)
ramp[cut - fade: cut] = np.linspace(1, 0, fade)
ramp[cut: int(TL["reveal"] * SR)] = 0
dry *= ramp[:, None]
verb *= ramp[:, None]
place(dry, SIL + 0.3, drop_of_water(1700, 520), 0.3)
place(verb, SIL + 0.3, drop_of_water(1700, 520), 0.5)
place(dry, TL["reveal"] - 0.35, (hp(noise(0.35), 1500) * np.exp(-t_axis(0.35) * 5))[::-1], 0.25)

# ---------------------------------------------------------------- révélation et écran final

R = TL["reveal"]
place(dry, R, boom(6.0, 120, 26), 1.1)
place(dry, R, kick(1.0, 0.6), 0.85)
place(dry, R, b808(29 + 12, 3.2, 0.9, 12), 0.55)
place(verb, R, hp(noise(4.0), 3000) * np.exp(-t_axis(4.0) * 1.2), 0.3)
place(verb, R, shimmer([midi(n) for n in (84, 88, 91, 93)], 5.0, 0.01, 0.6), 0.25)
for k, n in enumerate([65, 69, 72, 77, 79, 81, 84, 89]):  # envolée de kalimba
    kk = kalimba(n, 1.8, 2.4)
    place(dry, R + k * BEAT / 4, kk, 0.2, pan=-0.6 + 0.15 * k)
    place(verb, R + k * BEAT / 4, kk, 0.3)
place(dry, TL["editionIn"] - 0.3, whoosh(0.4, 1500, 8000, rising=False), 0.15)
for n in (72, 77, 81):
    place(verb, TL["editionIn"], kalimba(n, 2.0, 2.0), 0.18)

J = TL["jadeIn"]
for bar in np.arange(J, DUR - 0.6, BAR):  # groove apaisé sous l'écran final
    place(dry, bar, kick(0.8, 0.4), 0.45)
    place(dry, bar + BEAT * 2, snare(0.25), 0.2)
    place(dry, bar, b808(41, 1.6, 1.6, 7), 0.3)
    for h in np.arange(bar, min(bar + BAR, DUR), BEAT / 2):
        place(dry, h, hat(0.04, 9500), 0.05)
    for k, pos in enumerate([0, 3, 6, 10]):
        place(verb, bar + pos * BEAT / 4, kalimba([84, 81, 77, 79][k], 1.2), 0.12)
place(dry, J, boom(2.0, 100, 40), 0.4)
place(dry, TL["bandIn"] - 0.1, whoosh(0.4, 300, 6000), 0.18)
place(dry, TL["prepIn"], kick(1.0, 0.5), 0.55)
place(verb, TL["prepIn"], kalimba(77, 2.0), 0.3)
for k in range(3):  # notification « connecté » : trois notes montantes
    place(verb, TL["connectIn"] + k * 0.11, blip(midi([84, 88, 91][k]), 0.14, square=False), 0.3, pan=-0.4 + 0.4 * k)
place(verb, TL["soonIn"], shimmer([midi(n) for n in (89, 93, 96)], 2.0, 0.05, 1.2), 0.25)
for k, n in enumerate([84, 81, 77]):
    place(dry, TL["soonIn"] + k * BEAT / 2, kalimba(n, 1.6), 0.18)

# ---------------------------------------------------------------- mixage

wet = fftconvolve(verb, reverb_ir(3.2, 1.8), axes=0)[:N]
mix = hp(dry + wet * 0.5, 25)
fo = int(TL["fadeOut"] * SR)
mix[fo:] *= np.linspace(1, 0, N - fo)[:, None] ** 1.5
mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.25) / np.tanh(1.25) * 0.89

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "build", "soundtrack-v2.wav")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
write_wav(out, mix)
print("écrit", out, f"{DUR:.1f}s")
