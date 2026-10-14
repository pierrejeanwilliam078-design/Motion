"""Bande-son complète du spot ABONIVO (30 s, 48 kHz, stéréo).

- musique électronique instrumentale originale, 120 BPM (synthèse numpy)
- sound design synchronisé (impacts, whooshes, pops, clics, montées)
- voix off fournie (assets/src/voiceover.mp3), découpée par phrase et calée sur chaque scène
- ducking automatique de la musique sous la voix, mastering léger

Usage : python tools/build_audio.py  →  out/audio_mix.wav (+ stems dans out/)
Dépendances : numpy, scipy, soundfile, ffmpeg.
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
OUT = os.path.join(ROOT, "out")
os.makedirs(OUT, exist_ok=True)
TL = json.load(open(os.path.join(ROOT, "timeline.json")))

SR = 48000
DUR = TL["duration"]
N = int(SR * DUR)
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(1234)


def buf():
    return np.zeros((N, 2))


def add(dst, x, t, gain=1.0, pan=0.0):
    """Ajoute un signal mono/stéréo x au temps t (s) avec panoramique à puissance constante."""
    i = int(round(t * SR))
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        x = np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
    if i < 0:
        x, i = x[-i:], 0
    n = min(len(x), N - i)
    if n > 0:
        dst[i:i + n] += x[:n] * gain


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def adsr(n, a, r, sustain_len=None):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def polyblep_saw(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1
    m = ph > 1 - dt
    t = (ph[m] - 1) / dt[m]
    y[m] -= t * t + t + t + 1
    return y


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def reverb(x, seconds=2.4, wet=0.3, predelay=0.02, damp=6000):
    n = int(seconds * SR)
    ir = rng.standard_normal((n, 2)) * env_exp(n, seconds / 6.5)[:, None]
    ir = lp(ir, damp)
    ir[: int(predelay * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(0))
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 1.6


def delay(x, t, fb=0.35, mix=0.3, pingpong=True):
    d = int(t * SR)
    y = x.copy()
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    out = y.copy()
    tap = y.copy()
    for k in range(1, 6):
        tap = np.roll(tap, d, axis=0)
        tap[:d] = 0
        tap *= fb
        if pingpong:
            tap = tap[:, ::-1]
        out += tap * mix / fb
    return out


# ------------------------------------------------------------------ harmonie
# Fa mineur : Fm | Réb | Lab | Mib  (une mesure = 2 s)
CHORDS = [[53, 56, 60, 65], [49, 53, 56, 61], [56, 60, 63, 68], [51, 55, 58, 63]]
ROOTS = [41, 37, 44, 39]


def chord_at(t):
    return int(t // BAR) % 4


# ----------------------------------------------------------------- batterie
def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_exp(n, 0.16)
    click = hp(rng.standard_normal(n), 3000) * env_exp(n, 0.004) * 0.25
    return np.tanh((body + click) * 1.6) * 0.9


def clap():
    n = int(0.35 * SR)
    nz = bp(rng.standard_normal(n), 900, 2600)
    e = np.zeros(n)
    for k, o in enumerate([0, 0.011, 0.022]):
        i = int(o * SR)
        e[i:] += env_exp(n - i, 0.006 if k < 2 else 0.09)
    return nz * e * 0.8


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    nz = hp(rng.standard_normal(n), 7500, 4)
    return nz * env_exp(n, 0.07 if open_ else 0.012) * 0.35


# -------------------------------------------------------------- instruments
def bass_note(m, dur):
    n = int(dur * SR)
    f = midi(m)
    s = polyblep_saw(f, n) * 0.5 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.8
    s = lp(s, 380)
    return s * adsr(n, 0.004, 0.04) * env_exp(n, dur * 1.8)


def pad_chord(notes, dur, bright=1800):
    n = int(dur * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        for d, side in [(-0.11, 0), (0.0, 1), (0.13, 2)]:
            v = polyblep_saw(midi(m + d), n, rng.random())
            if side == 0:
                L += v
            elif side == 2:
                R += v
            else:
                L += v * 0.7
                R += v * 0.7
    st = np.stack([L, R], 1) / (len(notes) * 2.2)
    st = lp(st, bright)
    return st * adsr(n, 0.35, 0.6)[:, None]


def pluck(m, dur=0.4):
    n = int(dur * SR)
    f = midi(m)
    raw = polyblep_saw(f, n) + 0.5 * polyblep_saw(f * 2.003, n)
    bright = lp(raw, 4200)
    dark = lp(raw, 900)
    e = env_exp(n, 0.05)
    s = bright * e + dark * (1 - e)
    return s * env_exp(n, 0.16) * adsr(n, 0.002, 0.03) * 0.35


def bell(m, dur=2.5, amp=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    s = np.zeros(n)
    for ratio, a, tau in [(1, 1, 0.9), (2.0, 0.35, 0.5), (3.01, 0.18, 0.3), (4.2, 0.1, 0.18), (5.43, 0.06, 0.12)]:
        s += a * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    return s * adsr(n, 0.002, 0.2) * amp


# ------------------------------------------------------------- sound design
def impact(big=1.0):
    n = int(2.6 * SR)
    t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    nz = lp(rng.standard_normal(n), 2500) * np.exp(-t / 0.12) * 0.6
    air = hp(rng.standard_normal(n), 5000) * np.exp(-t / 0.4) * 0.08
    return np.tanh((boom + nz + air) * 1.4) * 0.8 * big


def whoosh(dur=0.7, f0=300, f1=4000, peak=0.6):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    bands = np.geomspace(min(f0, f1), max(f0, f1), 10)
    centers = f0 * (f1 / f0) ** t
    for c in bands:
        b = bp(nz, c / 1.4, min(c * 1.4, SR * 0.45))
        w = np.exp(-((np.log(centers) - np.log(c)) ** 2) / 0.18)
        out += b * w
    e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    return out * e * 0.5


def riser(dur):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    for k, c in enumerate(np.geomspace(400, 9000, 8)):
        out += hp(lp(nz, c * 1.3), c / 1.3) * np.exp(-((t - k / 7) ** 2) / 0.06)
    tone = polyblep_saw(110 * 2 ** (t * 2), n) * 0.15
    return (lp(out, 12000) * 0.5 + lp(tone, 3000)) * t ** 2.2 * 0.6


def pop(f=520):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 0.9 * (1 - np.exp(-t * 60)))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env_exp(n, 0.025) * 0.35


def click():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * t) * env_exp(n, 0.004) + hp(rng.standard_normal(n), 4000) * env_exp(n, 0.002) * 0.3) * 0.4


def tick():
    n = int(0.012 * SR)
    return hp(rng.standard_normal(n), 3000) * env_exp(n, 0.002) * 0.15


def shimmer(dur=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for k, m in enumerate([84, 87, 91, 96, 99]):
        d = int(k * 0.07 * SR)
        x = np.sin(2 * np.pi * midi(m) * t[: n - d]) * np.exp(-t[: n - d] / 0.35)
        s[d:] += x
    return s * 0.08


# ===================================================================== MUSIQUE
def build_music():
    drums = buf()
    bass = buf()
    pads = buf()
    plk = buf()
    K, CL, HC, HO = kick(), clap(), hat(), hat(True)

    def section(t):
        if t < 4:
            return "intro"
        if t < 8:
            return "reveal"
        if t < 14:
            return "groove"
        if t < 20:
            return "light"
        if t < 25:
            return "build"
        return "outro"

    steps = int(DUR / (BEAT / 2))
    for s in range(steps):
        t = s * BEAT / 2
        sec = section(t)
        beat_pos = s % 8  # croches dans la mesure
        on_beat = s % 2 == 0
        # grosse caisse
        if on_beat:
            if sec in ("groove", "build") or (sec == "reveal" and t >= 5.5) or (sec == "light" and beat_pos in (0, 4)) or (sec == "outro" and t < 28 and beat_pos in (0, 4)) or (sec == "intro" and beat_pos in (0, 4) and t > 0.1):
                add(drums, K, t, 0.9)
        # clap sur 2 et 4
        if beat_pos in (2, 6) and (sec in ("groove", "build") or (sec == "reveal" and t >= 6)):
            add(drums, CL, t, 0.55, 0.05)
        # charleston
        if sec != "outro" or t < 28:
            if not on_beat:
                add(drums, HO if sec in ("groove", "build") else HC, t, 0.5 if sec == "intro" else 0.7, 0.25)
            elif sec in ("groove", "light", "build"):
                add(drums, HC, t, 0.35, -0.2)
        # basse (croches, pompée par le sidechain)
        if sec != "intro" or t >= 1.0:
            if sec != "outro" or t < 28.5:
                root = ROOTS[chord_at(t)]
                m = root + (12 if (beat_pos in (3, 7) and sec in ("groove", "build")) else 0)
                add(bass, bass_note(m, BEAT / 2 * 0.95), t, 0.55 if sec != "intro" else 0.35)
    # roulement de caisse claire avant la scène 6
    for k in range(8):
        t = 24.0 + k * BEAT / 4 + (k / 8) * 0.0
        add(drums, CL, t, 0.15 + 0.05 * k, 0)

    # nappes : une par mesure
    for b in range(int(np.ceil(DUR / BAR))):
        t = b * BAR
        ch = CHORDS[b % 4]
        bright = {0: 900, 1: 1300}.get(b, 2200 if t < 20 else 2600)
        dur = BAR + 0.6 if t < 28 else DUR - t
        add(pads, pad_chord(ch, dur, bright), t, 0.5)
    # accord final tenu
    add(pads, pad_chord(CHORDS[0] + [72], 5.0, 3200), 25.0, 0.35)

    # arpège pluck (à partir de la révélation)
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    for s in range(steps * 2):
        t = s * BEAT / 4
        if t < 4.0 or t >= 28.5 or (14 <= t < 20 and s % 2):
            continue
        ch = CHORDS[chord_at(t)]
        m = ch[pattern[s % 8]] + 12
        add(plk, pluck(m), t, 0.45 if t < 8 else 0.4, 0.3 if s % 2 else -0.3)
    plk = delay(plk, BEAT * 0.75, fb=0.3, mix=0.25)

    # sidechain (pompage) suivant la grosse caisse
    sc = np.ones(N)
    for s in range(steps):
        t = s * BEAT / 2
        if s % 2 == 0:
            i = int(t * SR)
            n = min(int(0.3 * SR), N - i)
            sc[i:i + n] = np.minimum(sc[i:i + n], 1 - 0.6 * np.exp(-np.arange(n) / (0.07 * SR)))
    bass *= sc[:, None]
    pads *= (0.4 + 0.6 * sc)[:, None]

    pads = reverb(pads, 2.8, 0.35)
    plk = reverb(plk, 2.0, 0.25)
    music = drums * 0.9 + bass * 0.9 + pads * 0.55 + plk * 0.5
    music = hp(music, 28)
    # fondu de fin élégant
    t = np.arange(N) / SR
    music *= np.clip((DUR - 0.05 - t) / 1.6, 0, 1)[:, None] ** 1.3
    return music


# ================================================================ SOUND DESIGN
def build_sfx():
    fx = buf()
    S = TL["sfx"]
    for t in S["impact_open"]:
        add(fx, impact(1.0), t, 0.9)
    pf = [520, 600, 470, 680, 560, 640, 500, 720]
    for k, t in enumerate(S["pops"]):
        add(fx, pop(pf[k % len(pf)]), t, 0.8, [-0.5, 0.5][k % 2])
    for k, t in enumerate(S["whoosh"]):
        w = whoosh(0.7, 250, 5000) if k % 2 == 0 else whoosh(0.6, 5000, 300)
        add(fx, w, t - 0.35, 0.65, [-0.4, 0.4][k % 2])
    for a, b in S["riser"]:
        add(fx, riser(b - a), a, 0.55)
    for t in S["logo_hit"]:
        add(fx, impact(0.6), t, 0.6)
        for k, m in enumerate([65, 72, 77, 80]):
            add(fx, bell(m, 3.0, 0.22), t + k * 0.03, 0.9, [-0.3, 0.3, -0.1, 0.1][k])
        add(fx, shimmer(1.5), t + 0.05, 1.0)
    for t in S["clicks"]:
        add(fx, click(), t, 0.9, 0.1)
    for a, b in S["scroll"]:
        for k, tt in enumerate(np.arange(a, b, 0.07)):
            add(fx, tick(), tt, 0.5 * np.sin(np.pi * (tt - a) / (b - a)), 0.15)
    for k, t in enumerate(S["soft_hits"]):
        m = [72, 75, 80][k]
        add(fx, bell(m, 1.6, 0.35), t - 0.02, 0.7)
        add(fx, kick() * 0.4, t - 0.02, 0.5)
    for t in S["final_hit"]:
        add(fx, impact(1.0), t, 0.85)
        for k, m in enumerate([53, 60, 65, 68, 72]):
            add(fx, bell(m, 4.0, 0.18), t + k * 0.02, 0.8, [-0.4, 0.4, 0, -0.2, 0.2][k])
    for t in S["shine"]:
        add(fx, shimmer(1.4), t, 0.9)
    return reverb(fx, 1.8, 0.22)


# =================================================================== VOIX OFF
def build_vo():
    src = os.path.join(ROOT, "assets", "src", "voiceover.mp3")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    v = np.frombuffer(raw, np.float32).astype(float)
    v = hp(v, 75)
    vo = np.zeros(N)
    for seg in TL["voiceover"]:
        a, b = seg["src"]
        x = v[int(a * SR): int(b * SR)].copy()
        f = int(0.015 * SR)
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
        i = int(seg["at"] * SR)
        n = min(len(x), N - i)
        vo[i:i + n] += x[:n]
    # compression douce + normalisation
    peak = np.max(np.abs(vo))
    vo /= peak
    vo = np.sign(vo) * (1 - np.exp(-2.2 * np.abs(vo))) / (1 - np.exp(-2.2))
    vo *= 10 ** (-3 / 20)
    return vo


def duck_curve(vo, depth_db=-11, att=0.04, rel=0.35):
    a = np.abs(vo)
    win = int(0.03 * SR)
    lvl = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, "same"))
    gate = (lvl > 0.02).astype(float)
    # attaque / relâchement
    out = np.zeros_like(gate)
    ka, kr = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    g = 0.0
    for i in range(0, len(gate), 32):
        target = gate[i]
        k = ka if target > g else kr
        g = target + (g - target) * k ** 32
        out[i:i + 32] = g
    return 10 ** (depth_db * out / 20)


def main():
    music = build_music()
    sfx = build_sfx()
    vo = build_vo()
    duck = duck_curve(vo)
    music_d = music * duck[:, None]
    sfx_d = sfx * (0.55 + 0.45 * duck)[:, None]

    def norm_rms(x, db):
        r = np.sqrt(np.mean(x ** 2) + 1e-12)
        return x * (10 ** (db / 20) / r)

    music_d = norm_rms(music_d, -21)
    sfx_d = norm_rms(sfx_d, -24)
    vo_st = np.stack([vo, vo], 1)
    mix = music_d + sfx_d + vo_st * 0.95
    # bus master : légère saturation + limiteur simple
    mix = np.tanh(mix * 1.05) / np.tanh(1.05)
    mix /= max(1.0, np.max(np.abs(mix)) / 0.97)
    sf.write(os.path.join(OUT, "audio_premaster.wav"), mix.astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(OUT, "stem_music.wav"), music_d.astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(OUT, "stem_sfx.wav"), sfx_d.astype(np.float32), SR, subtype="FLOAT")
    sf.write(os.path.join(OUT, "stem_voice.wav"), vo_st.astype(np.float32), SR, subtype="FLOAT")
    # normalisation de sonie pour les réseaux sociaux (-14 LUFS, -1 dBTP)
    pre = os.path.join(OUT, "audio_premaster.wav")
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", pre, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    m = json.loads(r.stderr[r.stderr.rindex("{"):])
    af = ("loudnorm=I=-14:TP=-1.0:LRA=11:linear=true:"
          f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", os.path.join(OUT, "audio_mix.wav")], check=True)
    print("ok", os.path.join(OUT, "audio_mix.wav"))


if __name__ == "__main__":
    main()
