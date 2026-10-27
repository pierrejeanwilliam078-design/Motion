"""Bande-son de la version 3 « Trailer » : orchestre hybride synthétisé + voix off ElevenLabs.

Usage : python3 src/v3/soundtrack.py build/soundtrack-v3.wav
La voix (assets/voice/) est découpée phrase par phrase et posée aux instants de src/v3/timeline.js.
La musique s'abaisse automatiquement (ducking) pendant chaque phrase.
"""
import os
import subprocess
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


# ---------------------------------------------------------------- instruments d'orchestre hybride

def strings(notes, dur, attack=1.2, release=1.0, bright=2600, voices=5):
    """Section de cordes : dents de scie désaccordées, vibrato lent, filtre doux."""
    t = t_axis(dur)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, dur - t) / release)
    out = np.zeros_like(t)
    for n in notes:
        for d in np.linspace(-0.007, 0.007, voices):
            vib = 1 + 0.003 * np.sin(2 * np.pi * (5 + rng.random()) * t + rng.random() * 6)
            ph = np.cumsum(midi(n) * (1 + d) * vib) / SR + rng.random()
            out += 2 * (ph % 1.0) - 1
    return lp(out / (voices * len(notes)), bright, 2) * env


def staccato(note, dur=0.11, bright=3200):
    t = t_axis(dur)
    s = sum(saw(midi(note), dur, d) for d in (-0.005, 0.0, 0.005)) / 3
    return lp(s, bright) * np.minimum(1, t / 0.006) * np.exp(-t * 18)


def brass(notes, dur, swell=0.15, peak=2400, sustain=1300, drive=1.8):
    """Cuivres : ouverture rapide du filtre puis maintien, légère saturation."""
    t = np.linspace(0, 1, int(dur * SR))
    sig = sum(saw(midi(n), dur, d) for n in notes for d in (-0.004, 0.004)) / (2 * len(notes))
    tt = t * dur
    cutoff = np.where(tt < swell, 200 + (peak - 200) * tt / swell, sustain + (peak - sustain) * np.exp(-(tt - swell) * 4))
    env = np.minimum(1, tt / 0.03) * np.minimum(1, (dur - tt) / 0.4)
    return np.tanh(sweep_filter(sig, cutoff, "low") * drive) * env


def braam(dur=4.0, notes=(26, 38, 45, 50, 53)):
    """Le « braam » de bande-annonce : grappe de cuivres graves, filtre qui s'ouvre puis se referme."""
    t = t_axis(dur)
    sig = sum(saw(midi(n), dur, d) for n in notes for d in (-0.006, 0.0, 0.006)) / (3 * len(notes))
    cut = 150 + 2600 * np.exp(-((t - 0.25) ** 2) / 0.08) + 500 * np.exp(-t * 0.8)
    env = np.minimum(1, t / 0.05) * np.exp(-t * 0.55)
    return np.tanh(sweep_filter(sig, cut, "low") * 3.0) * env


def taiko(dur=1.2, f0=95, f1=48, gain=1.0):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    skin = lp(noise(dur), 900) * np.exp(-t * 25) * 0.6
    return np.tanh((body + skin) * 1.8) * gain


def choir(notes, dur, attack=0.6, release=1.2):
    """Chœur synthétique : dents de scie passées dans les formants d'un « ah »."""
    t = t_axis(dur)
    src = sum(saw(midi(n), dur, d) for n in notes for d in (-0.008, 0.0, 0.008)) / (3 * len(notes))
    voice = bp(src, 600, 800) + 0.6 * bp(src, 1100, 1350) + 0.25 * bp(src, 2400, 2800)
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, dur - t) / release)
    return voice * env * 2.2


def bell(note, dur=3.0):
    t = t_axis(dur)
    f = midi(note)
    parts = [(1, 1.0, 1.2), (2.76, 0.5, 2.0), (5.4, 0.25, 3.5), (8.93, 0.12, 5.0)]
    return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in parts) * 0.5


def sub_drop(dur=2.5, f0=90, f1=24):
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 2.2)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 0.9)


def crash(dur=3.5):
    t = t_axis(dur)
    return bp(noise(dur), 3500, 11000) * np.exp(-t * 2.6) * 0.35


def rev(sig):
    return sig[::-1]


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

def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", VOICE_FILE, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, "<i2").astype(np.float64) / 32768


src = load_voice()
voice = np.zeros(N)
for a, b, at, _text in TL["voice"]:
    seg = src[int(a * SR): int(b * SR)].copy()
    f = int(0.012 * SR)
    seg[:f] *= np.linspace(0, 1, f)
    seg[-f:] *= np.linspace(1, 0, f)
    i = int(at * SR)
    voice[i: i + len(seg)] += seg[: N - i]
voice = hp(voice, 70)
voice *= 0.7 / np.max(np.abs(voice))

# Ducking : enveloppe de la voix (attaque 40 ms, relâche 350 ms) -> musique abaissée d'environ 8 dB
env = np.abs(voice)
smooth = np.zeros(N)
att, rel, acc = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.35 * SR)), 0.0
for k in range(0, N, 64):  # par blocs pour rester rapide
    peak = env[k: k + 64].max()
    acc = (att ** 64) * acc + (1 - att ** 64) * peak if peak > acc else (rel ** 64) * acc + (1 - rel ** 64) * peak
    smooth[k: k + 64] = acc
duck = 1 - 0.6 * np.clip(smooth / 0.25, 0, 1)

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
