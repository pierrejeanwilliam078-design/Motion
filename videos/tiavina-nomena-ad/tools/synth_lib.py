"""Shared deterministic synth instruments (128 BPM, 16 bars = 30 s)."""
import subprocess
import sys
import wave

import numpy as np

SR = 48000
BPM = 128.0
BEAT = 60.0 / BPM          # 0.46875 s
BAR = 4 * BEAT             # 1.875 s
BARS = 16
DUR = BARS * BAR           # 30.0 s
N = int(round(DUR * SR))
rng = np.random.default_rng(20261013)




def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def place(buf, sig, t, gain=1.0, pan=0.0):
    """Add mono or stereo sig into stereo buf at time t (s)."""
    i = int(round(t * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.4142, sig * r * 1.4142], axis=1)
    n = min(len(sig), N - i)
    buf[i:i + n] += sig[:n] * gain


def tvec(d):
    return np.arange(int(d * SR)) / SR


def hp(x, k=1):
    for _ in range(k):
        x = np.diff(x, prepend=0.0)
    return x


def lp_smooth(x, w):
    """Cheap lowpass: moving average of width w samples."""
    if w <= 1:
        return x
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[w:] - c[:-w]) / w
    return np.concatenate([np.full(w - 1, y[0]), y])


# ---------------- instruments ----------------
def kick(level=1.0):
    t = tvec(0.45)
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.26)
    click = hp(rng.standard_normal(len(t)), 1) * np.exp(-t / 0.004) * 0.25
    return (body + click) * level


def clap():
    t = tvec(0.35)
    n = hp(rng.standard_normal(len(t)), 1)
    env = np.zeros_like(t)
    for off in (0.0, 0.011, 0.022):
        env += np.where(t >= off, np.exp(-(t - off) / (0.012 if off < 0.02 else 0.11)), 0)
    return n * env * 0.32


def hat(open_=False):
    t = tvec(0.25 if open_ else 0.08)
    n = hp(rng.standard_normal(len(t)), 2)
    return n * np.exp(-t / (0.07 if open_ else 0.018)) * 0.11


def saw(freq, t, nh=8, detune_c=(0.0,)):
    out = np.zeros_like(t)
    for dc in detune_c:
        f = freq * 2 ** (dc / 1200)
        for h in range(1, nh + 1):
            out += np.sin(2 * np.pi * f * h * t + h * 0.7) / h
    return out / len(detune_c)


def pad_chord(notes, dur, nh=7):
    t = tvec(dur)
    s = np.zeros_like(t)
    for m in notes:
        s += saw(midi(m), t, nh=nh, detune_c=(-8, 0, 8))
    a = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.2).clip(0)
    return s * a * 0.035


def pluck(m, dur=0.4, bright=4):
    t = tvec(dur)
    s = np.zeros_like(t)
    for h in range(1, bright + 1):
        s += np.sin(2 * np.pi * midi(m) * h * t) * np.exp(-t * (6 + 9 * h)) / h
    return s * 0.16


def bass_note(m, dur=0.2):
    t = tvec(dur)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.exp(-t / 0.16)
    return s * env * 0.42


def sweep(d, f0, f1, level):
    t = tvec(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    n = hp(lp_smooth(rng.standard_normal(len(t)), 10), 1) * 1.5
    env = (t / d) ** 2.5
    return (np.sin(ph) * 0.5 + n * 0.2) * env * level


def sub_boom(level=1.0):
    t = tvec(1.6)
    f = 38 + 50 * np.exp(-t / 0.08)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.55) * level


# Am - F - C - G (A minor), voiced around A3..E5
CHORDS = [
    ([57, 60, 64, 69], 45),   # Am, bass A2
    ([53, 57, 60, 65], 41),   # F,  bass F2
    ([55, 60, 64, 67], 48),   # C,  bass C3
    ([55, 59, 62, 67], 43),   # G,  bass G2
]

