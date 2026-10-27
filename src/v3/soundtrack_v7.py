"""Bande-son de la version 7 « L'écran » : la musique et la voix de la V3, plus les sons d'interface du téléphone.

Usage : python3 src/v3/soundtrack_v7.py build/soundtrack-v7.wav
Notifications, vibrations, frappe au clavier, bulles de discussion, défilement, touches : posés aux instants
de src/v3/timeline-v7.js, sous la voix.
"""
import os
import runpy
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
from synth import *  # noqa: E402,F401,F403  (SR, rng, instruments, filtres)

v3 = runpy.run_path(os.path.join(HERE, "soundtrack.py"), run_name="v3")   # musique + voix de la V3, déjà mixées
base_mix = v3["mix"]
TL = load_timeline(os.path.join(HERE, "timeline-v7.js"))
N = len(base_mix)
sfx = np.zeros((N, 2))


def ping(f1=1319, f2=1976, gain=1.0):
    """Son de notification : deux notes claires."""
    t = t_axis(0.5)
    a = np.sin(2 * np.pi * f1 * t) * np.exp(-t * 14) * (t < 0.09)
    b = np.sin(2 * np.pi * f2 * t) * np.exp(-np.clip(t - 0.09, 0, None) * 9) * (t >= 0.09)
    return (a + b) * gain


def buzz(dur=0.28):
    """Vibration du téléphone."""
    t = t_axis(dur)
    return lp(np.sign(np.sin(2 * np.pi * 150 * t)), 400) * (np.sin(2 * np.pi * 9 * t) > -0.3) * np.minimum(1, (dur - t) / 0.03)


def tap(gain=1.0):
    t = t_axis(0.04)
    return bp(noise(0.04), 1500, 6000) * np.exp(-t * 160) * gain


def pop():
    """Bulle de message qui apparaît."""
    t = t_axis(0.12)
    f = 500 + 500 * np.exp(-t * 60)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)


def swipe(dur=0.3, up=True):
    return whoosh(dur, 600, 7000, rising=up)


def put(start, sig, gain, pan=0.0):
    place(sfx, start, sig, gain, pan)


# Écran verrouillé : notifications
for n in TL["notifs"]:
    put(n, ping(), 0.18)
    put(n, buzz(), 0.22)
put(TL["unlock"] - 0.15, swipe(0.3), 0.12)
put(TL["unlock"], tap(), 0.25)

# Discussion de groupe : frappe puis bulle
for i, b in enumerate(TL["bubbles"]):
    for k in range(4):
        put(b - 0.45 + k * 0.09, tap(0.6), 0.1, pan=0.2 if i % 2 else -0.2)
    put(b, pop(), 0.2, pan=0.3 if i in (2, 5) else -0.3)

# Fil et stories
put(TL["montage"][0] - 0.2, swipe(0.35), 0.14)
for s in TL["feedSnaps"]:
    put(s - 0.2, swipe(0.25), 0.1)
for s in TL["storyTaps"]:
    put(s - 0.02, tap(), 0.3, pan=0.4)

# Page qui charge, puis avalanche de notifications
for k, t0 in enumerate(np.arange(TL["loading"], TL["flood"], 0.25)):
    put(t0, tap(0.4), 0.05)
t0, k = TL["flood"], 0
while t0 < TL["silence"] - 0.05:
    p = (t0 - TL["flood"]) / (TL["silence"] - TL["flood"])
    put(t0, ping([1319, 1568, 1760, 1976][k % 4], [1976, 2349, 2637, 2960][k % 4]), 0.08 + 0.1 * p, pan=np.sin(k * 1.7) * 0.6)
    if k % 2 == 0:
        put(t0, buzz(0.18), 0.12 + 0.12 * p)
    t0 += max(0.07, 0.5 * (1 - p) ** 1.5)
    k += 1
put(TL["silence"] - 0.035, tap(1.0), 0.4)   # l'écran s'éteint : clic juste avant le silence

# Rallumage, bannière, boutons
put(TL["reveal"], ping(988, 1976), 0.18)
put(TL["voice"][4][2] + 0.05, ping(), 0.08)
for tp in TL["taps"]:
    put(tp, tap(), 0.35)
    put(tp + 0.05, ping(1568, 2093), 0.12)

mix = base_mix + sfx
mix *= 0.93 / np.max(np.abs(mix))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "build", "soundtrack-v7.wav")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
write_wav(out, mix)
print("écrit", out, f"{TL['duration']:.1f}s")
