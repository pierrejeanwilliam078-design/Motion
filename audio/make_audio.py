"""Bande-son originale (synthèse) pour l'animation FANOKAFANA 2026-2027.

Génère, calés sur la timeline de index.html (120 BPM : 1 mesure = 2 s) :
  audio/v1-musique.wav        version 1 : musique inspirante (piano, nappes, percussions légères)
  audio/v2-musique.wav        version 2 : musique électronique moderne
  audio/v2-sound-design.wav   version 2 : effets sonores synchronisés (whoosh, impacts, risers…)
  audio/v2-mix.wav            version 2 : musique + sound design

Usage : python3 audio/make_audio.py
Tout est synthétisé ici (aucun échantillon externe) : pas de droits à gérer.
"""
import os
import numpy as np
from numba import njit
from scipy.signal import fftconvolve, butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 35.0
N = int(SR * DUR)
TAIL = SR * 4
BEAT = 0.5          # 120 BPM
BAR = 2.0
OUT = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(2026)

# ---------------------------------------------------------------- utilities

def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def ns(sec):
    return int(round(sec * SR))


def bus():
    return np.zeros((2, N + TAIL))


def add(b, sig, t, pan=0.0, gain=1.0):
    """Mix a mono (equal-power panned) or stereo signal into bus b at time t."""
    i = ns(t)
    if i >= b.shape[1]:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    n = min(sig.shape[1], b.shape[1] - i)
    if i < 0:
        sig = sig[:, -i:]; n = min(sig.shape[1], b.shape[1]); i = 0
    b[:, i:i + n] += sig[:, :n] * gain


@njit(cache=True)
def svf(x, fc, q, mode):
    """TPT state-variable filter, per-sample cutoff. mode 0=LP 1=BP 2=HP."""
    y = np.zeros_like(x)
    ic1 = 0.0; ic2 = 0.0
    k = 1.0 / q
    for i in range(x.shape[0]):
        f = fc[i]
        if f > 20000.0:
            f = 20000.0
        g = np.tan(np.pi * f / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k)); a2 = g * a1; a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            y[i] = v2
        elif mode == 1:
            y[i] = v1
        else:
            y[i] = x[i] - k * v1 - v2
    return y


def filt(x, fc, q=0.707, mode=0):
    fc = np.full(x.shape[-1], float(fc)) if np.isscalar(fc) else np.asarray(fc, float)
    if x.ndim == 2:
        return np.vstack([svf(np.ascontiguousarray(c), fc, q, mode) for c in x])
    return svf(np.ascontiguousarray(x), fc, q, mode)


def butter_f(x, fc, kind):
    sos = butter(2, fc, kind, fs=SR, output='sos')
    return sosfilt(sos, x, axis=-1)


def noise(n):
    return rng.standard_normal(n)


def saw(f, n, ph=0.0):
    p = (ph + f * tt(n)) % 1.0
    return 2 * p - 1


def sq(f, n, ph=0.0):
    return np.sign(np.sin(2 * np.pi * (f * tt(n) + ph)))


def env_ar(n, a, r_tau):
    t = tt(n)
    return np.minimum(t / max(a, 1e-4), 1.0) * np.exp(-np.maximum(t - a, 0) / r_tau)


def env_asr(n, a, r):
    """attack a, sustain, release r at the end of n samples."""
    t = tt(n); L = n / SR
    return np.clip(t / a, 0, 1) * np.clip((L - t) / r, 0, 1)


_IR = {}
def reverb(x, size=2.0, damp=6000, wet=0.3):
    key = (size, damp)
    if key not in _IR:
        n = ns(size)
        t = tt(n)
        irs = []
        for s in range(2):
            ir = np.random.default_rng(10 + s).standard_normal(n) * np.exp(-t / (size / 6.9))
            ir = butter_f(ir, damp, 'low')
            ir[:ns(0.012)] *= np.linspace(0, 1, ns(0.012))
            irs.append(ir / np.sqrt(np.sum(ir ** 2)))
        _IR[key] = irs
    irs = _IR[key]
    if x.ndim == 1:
        x = np.vstack([x, x])
    w = np.vstack([fftconvolve(x[0], irs[0])[:x.shape[1]], fftconvolve(x[1], irs[1])[:x.shape[1]]])
    return x * (1 - wet) + w * wet * 1.6


def delay(x, d=0.375, fb=0.35, mix=0.3):
    """ping-pong echo on a stereo bus"""
    y = x.copy(); D = ns(d)
    L = x.shape[1]; g = mix
    for k in range(1, 6):
        if k * D >= L:
            break
        ch = k % 2
        y[ch, k * D:] += x[0, :L - k * D] * g * 0.5 + x[1, :L - k * D] * g * 0.5
        g *= fb
    return y


def sidechain(kicks, depth=0.6, tau=0.13):
    env = np.zeros(N + TAIL)
    L = ns(0.5); x = tt(L)
    prof = np.exp(-x / tau) * (1 - np.exp(-x / 0.004))
    for k in kicks:
        i = ns(k); n = min(L, env.shape[0] - i)
        env[i:i + n] = np.maximum(env[i:i + n], prof[:n])
    return 1 - depth * env


# ---------------------------------------------------------------- harmony
#   bar:   0  1  2   3  4  5  6   7  8  9  10  11 12 13 14  15 16 17
CHORDS = ['D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'A', 'D']
VOICE = {'D': [62, 66, 69, 74], 'A': [61, 64, 69, 73], 'Bm': [62, 66, 71, 74], 'G': [62, 67, 71, 74]}
ROOT = {'D': 38, 'A': 45, 'Bm': 47, 'G': 43}
MEL = {  # lead melody, 8 eighth notes per bar (None = rest)
    'G': [74, None, 74, 76, 78, None, 76, 74],
    'D': [78, None, 76, 74, 76, None, 69, None],
    'A': [76, None, 76, 78, 81, None, 78, 76],
    'Bm': [78, None, 74, None, 73, 74, 71, None],
}


def chord_at(bar):
    return CHORDS[min(bar, len(CHORDS) - 1)]


# ---------------------------------------------------------------- instruments

def kick(gain=1.0, soft=False):
    n = ns(0.6); t = tt(n)
    f = 44 + (95 if soft else 120) * np.exp(-t / 0.035)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.22 if soft else 0.3))
    click = butter_f(noise(n), 2500, 'high') * np.exp(-t / 0.003) * (0.15 if soft else 0.35)
    return np.tanh(1.6 * (s + click)) * gain


def clap(gain=1.0):
    n = ns(0.45); t = tt(n)
    e = sum(np.exp(-np.maximum(t - d, 0) / 0.006) * (t >= d) for d in (0, 0.011, 0.022))
    e = e * 0.6 + np.exp(-np.maximum(t - 0.03, 0) / 0.13) * (t >= 0.03) * 0.5
    return filt(noise(n), 1300, 1.2, 1) * e * gain * 2.2


def snare(gain=1.0):
    n = ns(0.3); t = tt(n)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.06)
    nz = filt(noise(n), 2400, 0.8, 1) * np.exp(-t / 0.1)
    return (0.5 * body + nz * 1.4) * gain


def hat(open_=False, gain=1.0):
    n = ns(0.4 if open_ else 0.08); t = tt(n)
    return butter_f(noise(n), 7500, 'high') * np.exp(-t / (0.16 if open_ else 0.025)) * gain


def shaker(gain=1.0):
    n = ns(0.12); t = tt(n)
    return filt(noise(n), 6000, 0.9, 1) * (t / 0.02).clip(0, 1) * np.exp(-t / 0.04) * gain


def crash(gain=1.0, dur=3.0):
    n = ns(dur); t = tt(n)
    nz = butter_f(noise(n), 3500, 'high') * np.exp(-t / 0.9)
    ring = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) for f in (3720, 4630, 5310, 6870, 8120)) * 0.05 * np.exp(-t / 0.7)
    return (nz + ring) * gain


def supersaw(f, n, voices=7, det=0.16, stereo=True):
    out = np.zeros((2, n))
    for k, d in enumerate(np.linspace(-det, det, voices)):
        s = saw(f * 2 ** (d / 12), n, rng.uniform())
        p = (k / (voices - 1)) * 2 - 1
        a = (p * 0.8 + 1) * np.pi / 4
        out[0] += s * np.cos(a); out[1] += s * np.sin(a)
    return out / voices


def pluck(f, n, bright=6000, tau=0.22):
    t = tt(n)
    o = 0.55 * saw(f, n) + 0.3 * sq(f * 1.003, n) + 0.25 * saw(f * 2.002, n)
    fc = 250 + bright * np.exp(-t / 0.07)
    return filt(o, fc, 1.1, 0) * env_ar(n, 0.002, tau)


def piano(f, n, vel=1.0):
    t = tt(n)
    s = np.zeros(n)
    B = 0.0003
    for k in range(1, 11):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > 16000:
            break
        tau = (2.8 / k ** 0.75) * (220 / max(f, 110)) ** 0.35
        s += np.sin(2 * np.pi * fk * t + rng.uniform(0, 6)) * (1 / k ** 1.25) * np.exp(-t / tau)
    hammer = butter_f(noise(n), 2500, 'low') * np.exp(-t / 0.006) * 0.25
    s = (s + hammer) * np.minimum(t / 0.002, 1)
    return s * vel * 0.5


def bass(f, n, drive=1.8):
    t = tt(n)
    s = np.sin(2 * np.pi * f * t) + 0.35 * filt(saw(f, n), 420, 0.9, 0)
    return np.tanh(drive * s * env_asr(n, 0.005, 0.04)) * 0.7


# ---------------------------------------------------------------- sound design

def pan_sweep(x, p0, p1):
    p = np.linspace(p0, p1, x.shape[0]); a = (p + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


def whoosh(dur=0.7, f0=400, f1=3500, peak=0.6, p0=0, p1=0, q=1.4):
    n = ns(dur); t = tt(n); x = t / dur
    fc = f0 * (f1 / f0) ** x
    e = np.where(x < peak, (x / peak) ** 2, ((1 - x) / (1 - peak)) ** 1.5)
    s = filt(noise(n), fc, q, 1) * e * 1.8
    return pan_sweep(s, p0, p1)


def riser(dur=2.0, f0=250, f1=7000):
    n = ns(dur); t = tt(n); x = t / dur
    fc = f0 * (f1 / f0) ** (x ** 1.4)
    nz = filt(noise(n), fc, 2.0, 1)
    sw = np.sin(2 * np.pi * np.cumsum(180 * (6 ** x) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))) / SR) * 0.15
    e = x ** 2.2 * np.clip((1 - x) / 0.02, 0, 1)
    return (nz * 1.2 + sw) * e


def reverse_swell(dur=1.2):
    n = ns(dur); t = tt(n)
    s = crash(1.0, dur)[:n][::-1]
    return s * (t / dur) ** 1.5


def impact(gain=1.0, sub=True):
    n = ns(2.5); t = tt(n)
    f = 32 + 70 * np.exp(-t / 0.25)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9) * (1.0 if sub else 0.0)
    hit = butter_f(noise(n), 1800, 'low') * np.exp(-t / 0.09) * 0.9
    snap = butter_f(noise(n), 3000, 'high') * np.exp(-t / 0.02) * 0.4
    return np.tanh(1.3 * (boom + hit + snap)) * gain


def glint(gain=1.0, n_sp=7, spread=0.45):
    n = ns(1.2); out = np.zeros((2, n)); t = tt(n)
    for k in range(n_sp):
        d = spread * k / n_sp + rng.uniform(0, 0.03)
        f = rng.uniform(3200, 9000)
        L = n - ns(d); tl = tt(L)
        s = np.sin(2 * np.pi * f * tl) * np.exp(-tl / rng.uniform(0.08, 0.25)) * 0.25
        p = rng.uniform(-0.7, 0.7); a = (p + 1) * np.pi / 4
        out[0, ns(d):] += s * np.cos(a); out[1, ns(d):] += s * np.sin(a)
    sh = butter_f(noise(n), 7000, 'high') * np.sin(np.pi * np.clip(t / 0.6, 0, 1)) ** 2 * 0.25
    out += sh
    return out * gain


def pop(f0=900, f1=380, gain=1.0):
    n = ns(0.16); t = tt(n)
    f = f1 + (f0 - f1) * np.exp(-t / 0.025)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05)
    s += butter_f(noise(n), 4000, 'high') * np.exp(-t / 0.002) * 0.2
    return s * gain


def shutter(gain=1.0):
    n = ns(0.3); t = tt(n); s = np.zeros(n)
    for d, a in ((0, 1.0), (0.055, 0.7)):
        i = ns(d); L = n - i; tl = tt(L)
        s[i:] += butter_f(noise(L), 2500, 'high') * np.exp(-tl / 0.004) * a
        s[i:] += filt(noise(L), 900, 2.0, 1) * np.exp(-tl / 0.02) * a * 0.8
    whir = filt(noise(n), 1600, 4, 1) * np.exp(-np.maximum(t - 0.07, 0) / 0.05) * (t > 0.07) * 0.5
    return (s + whir) * gain


def tape(gain=1.0, dur=0.32):
    n = ns(dur); t = tt(n)
    crack = (rng.random(n) < (0.004 + 0.03 * t / dur)).astype(float) * rng.uniform(0.3, 1, n)
    crack = filt(crack + noise(n) * 0.15, 3200, 0.8, 1) * np.sin(np.pi * t / dur)
    thump = np.sin(2 * np.pi * 140 * t) * np.exp(-np.maximum(t - dur * 0.85, 0) / 0.03) * (t > dur * 0.85) * 0.5
    return (crack * 2.5 + thump) * gain


def tick(f=2600, gain=1.0):
    n = ns(0.03); t = tt(n)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) + butter_f(noise(n), 5000, 'high') * np.exp(-t / 0.001) * 0.3) * gain


def bell(m=81, gain=1.0, dur=2.0):
    n = ns(dur); t = tt(n); f = mtof(m)
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, 1.2), (2.0, .5, .8), (2.76, .35, .5), (5.4, .2, .25), (8.9, .1, .12)))
    return s * np.minimum(t / 0.002, 1) * gain * 0.4


def zip_(dur=1.2, gain=1.0):
    n = ns(dur); t = tt(n); x = t / dur
    s = filt(noise(n), 1200 * (4 ** x), 3.0, 1) * np.sin(np.pi * x) ** 1.5
    return s * gain


# ---------------------------------------------------------------- V1 : inspiring music

def music_v1():
    piano_b, pad_b, perc_b, bass_b = bus(), bus(), bus(), bus()
    # pads: warm, filtered supersaw (soft), whole track
    for bar, ch in enumerate(CHORDS):
        t0 = bar * BAR
        L = BAR + 0.6 if bar < 17 else 1.0 + 3.0
        n = ns(L)
        for m in VOICE[ch]:
            s = supersaw(mtof(m), n, voices=5, det=0.1) * env_asr(n, 0.35, 0.6 if bar < 17 else 2.5)
            add(pad_b, s, t0, gain=0.22)
    cut = 600 + 2600 * np.clip(np.interp(tt(N + TAIL), [0, 8, 14, 22, 24, 28, 35], [0, .3, .65, .45, .6, 1, .9]), 0, 1)
    pad_b = filt(pad_b, cut, 0.8, 0)

    # piano arpeggio (8ths), melody from 14 s, final chord at 34 s
    patt = [0, 1, 2, 3, 2, 1, 2, 3]
    for bar, ch in enumerate(CHORDS[:17]):
        notes = VOICE[ch]
        for k in range(8):
            t = bar * BAR + k * BEAT / 2
            if t >= 34:
                break
            m = notes[patt[k]] + (12 if (bar >= 7 and k in (3, 7)) else 0)
            vel = (0.55 if k % 2 == 0 else 0.4) * (0.75 if bar < 2 else 1)
            add(piano_b, piano(mtof(m), ns(1.6), vel), t, pan=(-0.25 if k % 2 else 0.25))
        if bar >= 7:
            for k, m in enumerate(MEL[ch]):
                if m is None:
                    continue
                t = bar * BAR + k * BEAT / 2
                if 22 <= t < 24 or t >= 34:
                    continue
                add(piano_b, piano(mtof(m + 12 if bar >= 14 else m), ns(1.8), 0.75), t, pan=0.05)
    for m in VOICE['D'] + [50, 86]:
        add(piano_b, piano(mtof(m), ns(4.0), 0.8), 34.0)

    # bass
    for bar, ch in enumerate(CHORDS[:17]):
        if bar < 2:
            continue
        r = ROOT[ch]
        if bar < 7:
            add(bass_b, bass(mtof(r), ns(BAR - 0.05)), bar * BAR, gain=0.6)
        else:
            for k in range(4):
                t = bar * BAR + k * BEAT
                if 22 <= t < 24:
                    continue
                add(bass_b, bass(mtof(r), ns(BEAT * 0.9)), t, gain=0.75)
    add(bass_b, bass(mtof(38), ns(1.0)), 34.0, gain=0.8)

    # light percussion
    for b in range(int(34 / BEAT)):
        t = b * BEAT
        if t >= 8:
            if 22 <= t < 24:
                continue
            soft = t < 14
            if t >= 14 or b % 2 == 0:
                add(perc_b, kick(0.8 if soft else 1.0, soft=True), t)
            if t >= 14 and b % 2 == 1:
                add(perc_b, clap(0.45), t, pan=0.0)
            add(perc_b, shaker(0.35), t + BEAT / 2, pan=0.4)
            if t >= 14:
                add(perc_b, shaker(0.25), t, pan=-0.4)
    for t0 in (4.0, 14.0, 28.0):
        add(perc_b, reverse_swell(1.4), t0 - 1.4, gain=0.35)
        add(perc_b, crash(0.35), t0)
    add(perc_b, kick(1.0, soft=True), 34.0)
    add(perc_b, crash(0.4, 3.0), 34.0)

    sc = sidechain([b * BEAT for b in range(28, 68) if not (22 <= b * BEAT < 24)], depth=0.35)
    pad_b *= sc
    mix = reverb(piano_b, 2.4, 7000, 0.28) * 1.0 + reverb(pad_b, 3.0, 5000, 0.35) * 0.9 + bass_b * 0.6 + reverb(perc_b, 1.4, 8000, 0.12) * 0.8
    return mix


# ---------------------------------------------------------------- V2 : modern music

def music_v2():
    pad_b, pl_b, lead_b, drum_b, bass_b, fx_b = bus(), bus(), bus(), bus(), bus(), bus()
    T = tt(N + TAIL)
    # supersaw pad / stabs
    for bar, ch in enumerate(CHORDS):
        t0 = bar * BAR
        drop = 14 <= t0 < 22 or 28 <= t0 < 34
        n = ns(BAR + 0.5) if bar < 17 else ns(4.0)
        for m in VOICE[ch] + ([ROOT[ch] + 24] if drop else []):
            s = supersaw(mtof(m), n, voices=7, det=0.2 if drop else 0.14)
            add(pad_b, s * env_asr(n, 0.02 if drop else 0.3, 0.5 if bar < 17 else 2.8), t0, gain=0.3 if drop else 0.26)
    cut = np.interp(T, [0, 3.9, 4.0, 8, 12.5, 13.95, 14, 22, 22.1, 23.9, 24, 26, 27.95, 28, 34, 35],
                    [800, 1600, 2000, 2200, 2600, 7000, 4800, 4800, 1500, 2000, 2400, 2600, 7500, 5600, 5600, 2500])
    pad_b = filt(pad_b, cut, 0.9, 0)

    # pluck arpeggio 16ths (from bar 1), brighter over time
    patt = [0, 1, 2, 3, 2, 3, 1, 2]
    for bar, ch in enumerate(CHORDS[:17]):
        if bar < 1:
            continue
        notes = VOICE[ch]
        for k in range(16):
            t = bar * BAR + k * BEAT / 4
            if t >= 34:
                break
            m = notes[patt[k % 8]] + (12 if k % 4 == 3 else 0)
            br = 1500 + 5000 * min(1, t / 14)
            add(pl_b, pluck(mtof(m), ns(0.35), br, 0.12), t, pan=(-0.35 if k % 2 else 0.35), gain=0.22 if bar < 2 else 0.3)
    # lead in drops
    for bar, ch in enumerate(CHORDS[:17]):
        if not (7 <= bar <= 10 or 14 <= bar <= 16):
            continue
        for k, m in enumerate(MEL[ch]):
            if m is None:
                continue
            t = bar * BAR + k * BEAT / 2
            mm = m + (12 if bar >= 14 else 0)
            s = pluck(mtof(mm), ns(0.6), 7000, 0.3) + 0.5 * pluck(mtof(mm) * 1.005, ns(0.6), 5000, 0.3)
            add(lead_b, s, t, gain=0.42)
    # final chord stab
    for m in VOICE['D'] + [50, 86]:
        add(lead_b, pluck(mtof(m), ns(3.0), 6000, 0.9), 34.0, gain=0.3)

    # drums
    kicks = []
    for b in range(int(34 / BEAT)):
        t = b * BEAT
        drop = 14 <= t < 22 or 28 <= t < 34
        groove = 8 <= t < 13.5 or 24 <= t < 27.5
        if drop:
            kicks.append(t); add(drum_b, kick(0.62), t)
            if b % 2 == 1:
                add(drum_b, clap(0.75), t)
            add(drum_b, hat(True, 0.35), t + BEAT / 2, pan=0.3)
            add(drum_b, hat(False, 0.3), t + BEAT / 4, pan=-0.3)
            add(drum_b, hat(False, 0.22), t + 3 * BEAT / 4, pan=-0.3)
        elif groove:
            if b % 4 == 0 or (b % 4 == 3 and b % 8 == 7):
                kicks.append(t); add(drum_b, kick(0.6), t)
            if b % 4 == 2:
                add(drum_b, clap(0.7), t)
            add(drum_b, hat(False, 0.3), t + BEAT / 2, pan=0.3)
            add(drum_b, hat(False, 0.18), t, pan=-0.3)
        elif 4 <= t < 8 and b % 4 == 0:
            add(drum_b, kick(0.5, soft=True), t)
    kicks.append(34.0); add(drum_b, kick(0.7), 34.0)
    # build-ups: snare rolls + risers
    for t0, t1 in ((12.0, 14.0), (26.0, 28.0)):
        tcur = t0
        while tcur < t1 - 0.02:
            x = (tcur - t0) / (t1 - t0)
            add(drum_b, snare(0.25 + 0.6 * x), tcur)
            tcur += BEAT / (2 if x < 0.5 else 4 if x < 0.75 else 8)
        add(fx_b, riser(t1 - t0 + 0.0), t0, gain=0.5)
    add(fx_b, riser(1.5), 2.5, gain=0.3)
    add(fx_b, riser(1.0), 23.0, gain=0.3)
    for t0 in (14.0, 28.0):
        add(drum_b, crash(0.55), t0)
        add(fx_b, impact(0.6), t0)
    add(drum_b, crash(0.6, 3.5), 34.0)
    add(fx_b, impact(0.7), 34.0)

    # bass (sidechained, follows kick)
    for bar, ch in enumerate(CHORDS[:17]):
        if bar < 2:
            continue
        r = ROOT[ch]
        for k in range(8):
            t = bar * BAR + k * BEAT / 2
            drop = 14 <= t < 22 or 28 <= t < 34
            if 22 <= t < 24 or (13.5 <= t < 14) or (27.5 <= t < 28):
                continue
            if drop:
                add(bass_b, bass(mtof(r), ns(BEAT / 2 * 0.95), 2.4), t, gain=0.8)
            elif k % 2 == 0 and bar >= 4:
                add(bass_b, bass(mtof(r), ns(BEAT * 0.9)), t, gain=0.7)
            elif bar < 4 and k == 0:
                add(bass_b, bass(mtof(r), ns(BAR - 0.05)), t, gain=0.55)
    add(bass_b, bass(mtof(38), ns(1.2), 2.4), 34.0, gain=0.9)

    sc = sidechain(kicks, depth=0.7)
    pad_b *= sc; bass_b *= sidechain(kicks, depth=0.5, tau=0.08); pl_b *= sidechain(kicks, depth=0.35)
    mix = (reverb(pad_b, 2.6, 6000, 0.3) * 1.3 + reverb(delay(pl_b, 0.375, 0.4, 0.35), 2.0, 7000, 0.25) * 1.4 +
           reverb(delay(lead_b, 0.375, 0.3, 0.25), 2.4, 8000, 0.3) * 1.4 + drum_b * 0.9 + bass_b * 0.42 + reverb(fx_b, 2.5, 6000, 0.3) * 0.8)
    return mix


# ---------------------------------------------------------------- V2 : sound design (synced to index.html)

def sound_design():
    b = bus()
    add(b, reverse_swell(1.0), 0.0, gain=0.25)
    add(b, whoosh(0.9, 2000, 400, 0.3, 0, 0), 0.0, gain=0.25)
    for i in range(6):                                   # logos pop in
        t = 0.55 + i * 0.16
        add(b, pop(700 + i * 90, 320 + i * 40, 0.55), t + 0.05, pan=-0.6 + i * 0.24)
    add(b, whoosh(0.8, 2500, 6000, 0.5, -0.4, 0.4), 1.9, gain=0.18)     # quote
    add(b, whoosh(0.6, 300, 1500, 0.7), 2.45, gain=0.35)                # FARITANY rises
    add(b, impact(0.35, sub=False), 2.95)
    add(b, glint(0.45), 3.5)                                            # shine
    add(b, riser(1.25, 400, 9000), 2.9, gain=0.35)                      # into LIVE
    add(b, impact(0.9), 4.15)                                           # LIVE hit
    for i in range(4):
        add(b, whoosh(0.35, 3000, 800, 0.4, -0.5 + i * 0.33, -0.5 + i * 0.33), 4.0 + i * 0.13, gain=0.18)
    add(b, glint(0.4, 9, 0.6), 4.3)
    add(b, whoosh(0.45, 600, 4500, 0.6, -0.6, 0.2), 4.65, gain=0.35)    # play triangle swoosh
    add(b, pop(1200, 500, 0.6), 5.35, pan=0.15)
    add(b, glint(0.5), 6.2)                                             # shine on Live
    # polaroids
    add(b, whoosh(0.9, 250, 2500, 0.75, -1, -0.2), 7.65, gain=0.55)
    add(b, shutter(0.6), 8.6, pan=-0.3)
    add(b, whoosh(0.9, 250, 2500, 0.75, 1, 0.2), 8.25, gain=0.55)
    add(b, shutter(0.6), 9.2, pan=0.3)
    add(b, tape(0.5), 9.25, pan=-0.3)
    add(b, tape(0.5), 9.85, pan=0.3)
    add(b, glint(0.25, 5, 0.3), 9.6)
    # people
    add(b, whoosh(0.7, 300, 1800, 0.7, -0.8, -0.5), 10.6, gain=0.35)
    add(b, pop(500, 250, 0.45), 11.35, pan=-0.6)
    add(b, whoosh(0.9, 2500, 500, 0.5, 1, 0.6), 11.4, gain=0.4)
    # FANOKAFANA (drop at 14 is in the music)
    for i in range(10):
        add(b, tick(1800 + i * 60, 0.25), 14.12 + i * 0.065, pan=-0.6 + i * 0.13)
    add(b, glint(0.55), 15.6)
    add(b, whoosh(0.7, 800, 5000, 0.6, -0.7, 0.4), 15.85, gain=0.35)     # Taom-panabeazana
    add(b, zip_(1.3, 0.25), 16.5)                                        # frame lines draw
    # 2026-2027 counter: decelerating ticks per digit, then a bell
    for i in range(9):
        if i == 4:
            continue
        t0 = 17.6 + i * 0.085
        for k in range(1, 10):
            # strip position p = outExpo((t-t0)/1.35) crosses each digit
            p = k / 9.0
            x = -np.log2(1 - p * 0.999) / 10.0
            add(b, tick(2200 + i * 80, 0.12), t0 + x * 1.35, pan=-0.6 + i * 0.15)
    add(b, bell(81, 0.6), 18.95)
    add(b, bell(88, 0.3), 18.95)
    add(b, glint(0.35), 20.55)
    # date + underline
    add(b, whoosh(1.0, 3000, 600, 0.35, 0.5, -0.5), 22.05, gain=0.3)
    add(b, zip_(0.6, 0.35), 23.15)
    add(b, pop(900, 600, 0.35), 23.45)
    # banner
    add(b, whoosh(0.7, 200, 1800, 0.8), 23.5, gain=0.45)
    add(b, impact(0.55, sub=True), 24.05)
    add(b, pop(600, 300, 0.45), 24.55, pan=-0.3)
    add(b, pop(750, 380, 0.45), 24.8, pan=0.3)
    add(b, glint(0.5), 26.0)
    add(b, pop(1000, 450, 0.4), 27.05)
    # final
    add(b, whoosh(1.6, 4000, 300, 0.4), 28.2, gain=0.3)                  # camera pull-back
    add(b, glint(0.4), 30.85)
    add(b, glint(0.4), 32.25)
    add(b, glint(0.4), 33.15)
    add(b, bell(86, 0.35, 3.0), 34.0)
    add(b, glint(0.5, 12, 0.9), 34.0)
    return reverb(b, 1.8, 8000, 0.22)


# ---------------------------------------------------------------- render

def finish(x, fade_out=0.6):
    x = x[:, :N].copy()
    x = butter_f(x, 28, 'high')
    f = ns(fade_out)
    x[:, -f:] *= np.linspace(1, 0, f) ** 1.5
    x[:, :ns(0.01)] *= np.linspace(0, 1, ns(0.01))
    peak = np.max(np.abs(x))
    x = np.tanh(x / peak * 1.3) / np.tanh(1.3) * 0.89     # gentle soft clip / limiter
    return x


def write(name, x):
    wavfile.write(os.path.join(OUT, name), SR, (x.T * 32767).astype(np.int16))
    rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    print(f'{name}: peak {20*np.log10(np.max(np.abs(x))):.1f} dBFS, rms {rms:.1f} dBFS')


if __name__ == '__main__':
    v1 = music_v1()
    write('v1-musique.wav', finish(v1))
    m2 = music_v2()
    sd = sound_design()
    write('v2-musique.wav', finish(m2))
    write('v2-sound-design.wav', finish(sd))
    write('v2-mix.wav', finish(m2 / np.max(np.abs(m2)) * 0.8 + sd / np.max(np.abs(sd)) * 0.75))
