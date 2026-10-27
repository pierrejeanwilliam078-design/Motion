"""Bande-son de la version 3 « Trailer » : orchestre hybride synthétisé + voix off ElevenLabs.

Usage : python3 src/v3/soundtrack.py build/soundtrack-v3.wav
La voix (assets/voice/) est découpée phrase par phrase et posée aux instants de src/v3/timeline.js.
La musique s'abaisse automatiquement (ducking) pendant chaque phrase.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from synth import *  # noqa: E402,F401,F403  (SR, rng, instruments, filtres)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
TL = load_timeline(os.path.join(HERE, "timeline.js"))
DUR = TL["duration"]
N = int(DUR * SR)
VOICE_FILE = os.path.join(ROOT, "assets", "voice", "voix-off-elevenlabs-hugo.mp3")

music = np.zeros((N, 2))
verb = np.zeros((N, 2))


def add(start, sig, gain=1.0, pan=0.0, wet=0.0):
    place(music, start, sig, gain, pan)
    if wet:
        place(verb, start, sig, gain * wet, pan)


# ---------------------------------------------------------------- scène 1 (0 -> 5 s) : mystère

Dm, Bb, F, C, Gm = [38, 45, 50, 53, 57], [34, 46, 50, 53, 58], [41, 48, 53, 57, 60], [36, 48, 52, 55, 60], [43, 50, 55, 58, 62]
add(0.0, np.sin(2 * np.pi * midi(26) * t_axis(10.5)) * np.minimum(1, t_axis(10.5) / 3) * np.minimum(1, (10.5 - t_axis(10.5)) / 1), 0.22)
add(0.0, strings([38, 45, 50], 5.6, attack=3.5, bright=900), 0.35, wet=0.6)
for hb in TL["heartbeats"]:
    add(hb, taiko(1.0, 70, 38), 0.55, wet=0.4)
    add(hb + 0.24, taiko(0.8, 60, 36), 0.32, wet=0.3)
for k in range(28):  # poussière sonore : notes aiguës très douces, comme les particules
    tt = rng.uniform(0.3, 9.5)
    add(tt, bell(rng.choice([86, 89, 93, 98]), 1.5), 0.04, pan=rng.uniform(-0.8, 0.8), wet=1.0)
add(TL["s1Text"] - 0.6, whoosh(0.6, 200, 4000), 0.12, wet=0.5)
add(4.2, rev(crash(0.8)), 0.12)

# ---------------------------------------------------------------- scène 2 (5 -> 10 s) : pulsations électroniques

S2, S3 = TL["circuits"], TL["montage"][0]
add(S2, braam(3.0, (26, 38, 45)), 0.35, wet=0.5)
add(S2, strings(Dm, 2.7, attack=1.0, bright=1600), 0.32, wet=0.5)
add(7.5, strings(Bb, 2.8, attack=1.0, bright=2000), 0.34, wet=0.5)
for i, tt in enumerate(np.arange(S2, S3, 0.25)):
    p = (tt - S2) / (S3 - S2)
    note = [38, 38, 50, 38, 45, 38, 50, 53][i % 8] - (4 if tt >= 7.5 else 0)
    t_ = t_axis(0.22)
    pulse = lp(saw(midi(note), 0.22) + 0.5 * saw(midi(note + 12), 0.22), 400 + 2600 * p) * np.exp(-t_ * 12)
    add(tt, pulse, 0.22 + 0.12 * p, pan=0.3 if i % 2 else -0.3)
for tt in np.arange(S2 + 2.5, S3, 0.5):
    add(tt, taiko(0.6, 110, 55), 0.3)
add(8.5, riser(1.5, 300, 7000), 0.25)

# ---------------------------------------------------------------- scène 3 (10 -> 16 s) : percussions de trailer

W = TL["words"]
add(S3, braam(2.5), 0.55, wet=0.5)
add(S3, crash(), 0.3, wet=0.4)
pattern = [1.0, 0, 0.5, 0.6, 1.0, 0, 0.5, 0, 1.0, 0, 0.5, 0.6, 1.0, 0.5, 0.7, 0.8]  # motif de taikos en croches
for i, tt in enumerate(np.arange(S3, 16.0, 0.25)):
    a = pattern[i % 16]
    if a:
        add(tt, taiko(0.9, 100 if a == 1 else 140, 50 if a == 1 else 70), 0.5 * a, pan=(-0.3 if i % 2 else 0.3), wet=0.3)
for i, tt in enumerate(np.arange(S3, 16.0, 0.125)):  # ostinato de cordes en doubles croches
    chord = Dm if tt < 13.0 else Bb if tt < 14.5 else Gm
    note = [chord[2], chord[2], chord[3], chord[2], chord[4], chord[2], chord[3], chord[1]][i % 8] + 12
    add(tt, staccato(note), 0.13, pan=0.4 if i % 2 else -0.4)
add(S3, strings([26, 38], 6.0, attack=0.5, bright=500), 0.4)
for m in TL["montage"][1:]:
    add(m - 0.3, whoosh(0.3, 500, 9000), 0.25, wet=0.3)
for i, w in enumerate(W):
    add(w, braam(1.6, [(26, 38, 45, 50), (22, 34, 46, 50), (31, 43, 50, 55)][i]), 0.6, wet=0.5)
    add(w, taiko(1.2, 85, 40), 0.8, wet=0.4)
    add(w, crash(1.5), 0.25)
    add(w - 0.25, whoosh(0.25, 800, 10000), 0.2)

# ---------------------------------------------------------------- scène 4 (16 -> 23 s) : montée

S4, SIL = TL["sphere"], TL["silence"]
add(S4, sub_drop(3.0, 70, 30), 0.5)
add(S4, strings([38, 50, 57, 62], 3.2, attack=0.4, bright=2500), 0.3, wet=0.5)
add(19.0, strings([34, 46, 58, 62], 2.2, attack=0.3, bright=3000), 0.32, wet=0.5)
add(21.0, strings([33, 45, 57, 61, 64], 2.1, attack=0.3, bright=4500), 0.38, wet=0.5)  # La majeur : dominante
scale = [62, 64, 65, 67, 69, 70, 72, 73, 74, 76, 77, 79, 81, 82, 84]
for k, tt in enumerate(np.arange(S4, SIL, 0.5)):  # gamme ascendante des violons
    n = scale[min(k, len(scale) - 1)]
    add(tt, strings([n], 0.55, attack=0.05, release=0.15, bright=5000, voices=4), 0.16 + 0.012 * k, wet=0.4)
tt = S4
while tt < SIL:  # taikos qui accélèrent
    p = (tt - S4) / (SIL - S4)
    add(tt, taiko(0.7, 105, 50), 0.35 + 0.4 * p, pan=np.sin(tt * 5) * 0.3, wet=0.25)
    tt += 0.5 if p < 0.4 else 0.25 if p < 0.75 else 0.125
for bt in (16.0, 18.0, 20.0, 21.0, 21.5, 22.0, 22.25, 22.5, 22.625, 22.75, 22.875):  # coups de cuivres
    add(bt, brass([38, 45, 50, 57], 0.45, swell=0.05, peak=3000, sustain=1500), 0.32, wet=0.35)
tt = 19.5
while tt < SIL:
    p = (tt - 19.5) / (SIL - 19.5)
    add(tt, clap(0.15), 0.08 + 0.25 * p, wet=0.2)
    tt += 0.25 if p < 0.4 else 0.125 if p < 0.75 else 0.0625
add(19.0, riser(SIL - 19.0, 250, 13000), 0.55)
add(17.0, (sub_drop(6.0, 30, 30) * np.linspace(0, 1, int(6.0 * SR)) ** 2), 0.35)

# Silence brutal (23 -> 23,5 s)
cut, fade = int(SIL * SR), int(0.015 * SR)
ramp = np.ones(N)
ramp[cut - fade: cut] = np.linspace(1, 0, fade)
ramp[cut: int(TL["reveal"] * SR)] = 0
music *= ramp[:, None]
verb *= ramp[:, None]
add(TL["reveal"] - 0.12, rev(hp(noise(0.12), 2500) * np.exp(-t_axis(0.12) * 10)), 0.12)

# ---------------------------------------------------------------- scène 5 (23,5 -> 29 s) : révélation épique

R = TL["reveal"]
add(R, braam(5.0), 1.0, wet=0.6)
add(R, sub_drop(3.5, 100, 22), 0.9)
add(R, taiko(1.6, 80, 34), 1.0, wet=0.5)
add(R, kick(1.0, 0.6), 0.8)
add(R, crash(4.5), 0.55, wet=0.6)
add(R, choir([50, 57, 62, 65, 69], 3.0, attack=0.05), 0.5, wet=0.7)
progression = [(R, 25.5, Dm), (25.5, 26.5, Bb), (26.5, 27.6, F), (27.6, 29.0, C)]
for a, b, ch in progression:
    add(a, strings([n + 12 for n in ch], b - a + 0.3, attack=0.08, bright=4200), 0.3, wet=0.5)
    add(a, choir([n + 12 for n in ch[1:]], b - a + 0.3, attack=0.2), 0.32, wet=0.6)
    add(a, brass(ch[:3], b - a, swell=0.08), 0.42, wet=0.4)
    add(a, taiko(1.2, 80, 36), 0.7, wet=0.4)
for i, tt in enumerate(np.arange(R + 0.5, 28.7, 0.25)):
    a = [1.0, 0, 0.5, 0, 0.8, 0, 0.6, 0.4][i % 8]
    if a:
        add(tt, taiko(0.8, 95, 45), 0.8 * a, pan=(-0.2 if i % 2 else 0.2), wet=0.3)
for i, tt in enumerate(np.arange(R + 0.5, 28.7, 0.125)):
    ch = next(c for a, b, c in progression if a <= tt < b)
    add(tt, staccato([ch[2], ch[3], ch[4], ch[3]][i % 4] + 12), 0.1, pan=0.4 if i % 2 else -0.4)
melody = [(24.0, 74, 0.9), (25.0, 77, 0.5), (25.5, 76, 1.0), (26.5, 72, 0.5), (27.0, 74, 0.6), (27.6, 79, 1.1)]
for tt, n, d in melody:  # thème de cuivres
    add(tt, brass([n - 12, n], d, swell=0.1, peak=2600, sustain=1800, drive=1.4), 0.2, wet=0.5)
add(TL["editionIn"], crash(2.0), 0.2, wet=0.4)
add(27.6, riser(TL["final"] - 27.6, 400, 12000), 0.45)
add(TL["light"] - 0.3, rev(crash(0.6)), 0.3)

# ---------------------------------------------------------------- scène 6 (29 -> 35 s) : accord final et signature

FIN = TL["final"]
final_chord = [29, 41, 48, 53, 57, 60, 65, 69]  # Fa majeur : résolution lumineuse
add(FIN, braam(5.5, (29, 41, 48, 53)), 0.75, wet=0.6)
add(FIN, strings(final_chord[2:], 6.0, attack=0.05, release=2.5, bright=3800), 0.45, wet=0.7)
add(FIN, choir([60, 65, 69, 72], 6.0, attack=0.1, release=2.5), 0.4, wet=0.8)
add(FIN, taiko(1.8, 75, 32), 0.9, wet=0.6)
add(FIN, sub_drop(4.0, 80, 26), 0.6)
add(FIN, crash(5.0), 0.35, wet=0.7)
for k, n in enumerate([77, 81, 84]):  # signature sonore : carillon sur « ONG JADE Madagascar »
    add(TL["ongIn"] + k * 0.18, bell(n, 3.0), 0.22, pan=-0.4 + 0.4 * k, wet=0.9)
add(TL["ongIn"], taiko(1.5, 70, 32), 0.45, wet=0.6)
add(TL["openPulse"], bell(89, 2.0), 0.12, wet=1.0)

# ---------------------------------------------------------------- voix off et mixage

voice = voice_track(VOICE_FILE, TL["voice"], N)
duck = duck_envelope(voice)

wet = fftconvolve(verb, reverb_ir(3.6, 1.5), axes=0)[:N]
mus = hp(music + wet * 0.55, 25)
mus = np.tanh(mus / np.max(np.abs(mus)) * 1.4) / np.tanh(1.4) * 0.62
mus *= duck[:, None]

vwet = fftconvolve(np.stack([voice, voice], 1), reverb_ir(1.6, 3.5), axes=0)[:N]
mix = mus + voice[:, None] * 0.95 + vwet * 0.08

fo = int((TL["duration"] - 0.25) * SR)
mix[fo:] *= np.linspace(1, 0, N - fo)[:, None]
mix[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))[:, None]
mix *= 0.93 / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "build", "soundtrack-v3.wav")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
write_wav(out, mix)
print("écrit", out, f"{DUR:.1f}s")
