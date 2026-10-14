"""
Génère la musique originale et les effets sonores de la publicité TIAVOYAGES.

Tout est synthétisé par code (aucun échantillon externe) : les fichiers produits
sont donc libres de droits et utilisables commercialement.

Musique : 120 BPM (1 temps = 0,5 s = 15 images à 30 fps), ré majeur,
progression I–V–vi–IV (D, A, Bm, G), une mesure = 2 s.
Toutes les transitions de la vidéo (4 s, 9 s, 14 s, 19 s, 25 s) tombent sur un temps.

Usage : python generate_audio.py <dossier public/audio>
Dépendances : numpy, scipy
"""
import os
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
BPM = 120
BEAT = 60 / BPM
DUR = 30.0
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR * 0.45) / (SR / 2), "low")
    return signal.lfilter(b, a, x, axis=0)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x, axis=0)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], "band")
    return signal.lfilter(b, a, x, axis=0)


def env_adsr(n, a, d, s, r, total=None):
    """Enveloppe ADSR (en secondes) sur n échantillons."""
    e = np.zeros(n)
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    A = max(A, 1)
    e[:A] = np.linspace(0, 1, A)[: n]
    end_d = min(n, A + D)
    if end_d > A:
        e[A:end_d] = np.linspace(1, s, end_d - A)
    rel_start = max(end_d, n - R)
    e[end_d:rel_start] = s
    if n > rel_start:
        e[rel_start:] = np.linspace(e[rel_start - 1] if rel_start > 0 else s, 0, n - rel_start)
    return e


def saw(f, t, harmonics=18):
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        if f * k > SR * 0.4:
            break
        out += np.sin(2 * np.pi * f * k * t) / k
    return out * (2 / np.pi)


def reverb_ir(seconds=1.8, decay=3.2, bright=6000):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-decay * t)[:, None]
    ir = lp(ir, bright)
    ir[: int(0.012 * SR)] = 0  # pré-délai
    return ir / np.sqrt((ir ** 2).sum(axis=0))


IR = reverb_ir()


def reverb(x, wet=0.3, ir=IR):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet


def pan(x, p):
    """p : -1 (gauche) .. 1 (droite)."""
    l = np.cos((p + 1) * np.pi / 4)
    r = np.sin((p + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)


def place(buf, x, start):
    i = int(round(start * SR))
    if i >= len(buf):
        return
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += x[:n]


def normalize(x, peak=0.89):
    m = np.max(np.abs(x))
    return x if m == 0 else x * (peak / m)


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def write(path, x):
    x = np.clip(x, -1, 1)
    wavfile.write(path, SR, (x * 32767).astype(np.int16))
    print("écrit", path, f"{len(x) / SR:.2f}s")


# ----------------------------------------------------------------------------
# MUSIQUE
# ----------------------------------------------------------------------------
# accords (notes MIDI) : D, A, Bm, G
CHORDS = [
    [62, 66, 69, 74],   # D
    [61, 64, 69, 73],   # A (renversé, conduite de voix douce)
    [59, 62, 66, 71],   # Bm
    [59, 62, 67, 71],   # G
]
ROOTS = [38, 33, 35, 31]  # D2, A1, B1, G1


def chord_at(bar):
    return CHORDS[bar % 4], ROOTS[bar % 4]


def build_music():
    n = int(DUR * SR)
    pad = np.zeros((n, 2))
    pluck = np.zeros((n, 2))
    bass = np.zeros(n)
    drums = np.zeros((n, 2))
    bells = np.zeros((n, 2))
    fx = np.zeros((n, 2))
    sidechain = np.ones(n)

    n_bars = int(DUR / (4 * BEAT))

    # --- Pad : scies désaccordées filtrées, nappe continue
    for bar in range(n_bars):
        notes, _ = chord_at(bar)
        start = bar * 4 * BEAT
        d = 4 * BEAT + 0.6
        if bar == 12:  # fin : accord final tenu (D add9)
            notes = [62, 66, 69, 74, 76]
            d = DUR - start
        if bar > 12:
            continue
        t = t_axis(d)
        e = env_adsr(len(t), 0.35, 0.4, 0.8, 0.6)
        if bar == 12:
            e = env_adsr(len(t), 0.05, 0.6, 0.75, 1.8)
        for k, m in enumerate(notes):
            for det, p in ((-0.09, -0.6), (0.09, 0.6)):
                f = mtof(m) * 2 ** (det / 12)
                v = saw(f, t, 10) * e * 0.05
                place(pad, pan(v, p * (0.4 + 0.15 * k)), start)
    # filtre qui s'ouvre progressivement
    cut = np.interp(np.arange(n) / SR, [0, 4, 19, 25, 30], [900, 2200, 2600, 4200, 3000])
    pad_f = np.zeros_like(pad)
    blk = 2400
    for i in range(0, n, blk):
        fc = cut[i]
        b, a = signal.butter(2, fc / (SR / 2), "low")
        pad_f[i:i + blk] = signal.lfilter(b, a, pad[max(0, i - 2000):i + blk], axis=0)[-min(blk, n - i):]
    pad = reverb(pad_f, 0.35)

    # --- Pluck arpégé (croches), entre en douceur
    arp_pattern = [0, 1, 2, 3, 2, 1, 3, 2]
    step = BEAT / 2
    t_pl = t_axis(0.5)
    for i in range(int(DUR / step)):
        tt = i * step
        if tt < 1.0 or tt >= 25.0:
            continue
        bar = int(tt // (4 * BEAT))
        notes, _ = chord_at(bar)
        m = notes[arp_pattern[i % 8]] + 12
        f = mtof(m)
        e = np.exp(-t_pl * 9)
        v = (np.sin(2 * np.pi * f * t_pl) + 0.35 * np.sin(2 * np.pi * 2 * f * t_pl) * np.exp(-t_pl * 20)
             + 0.15 * np.sin(2 * np.pi * 3 * f * t_pl) * np.exp(-t_pl * 30)) * e
        level = np.interp(tt, [1.0, 4.0, 19.0, 19.01, 25], [0.03, 0.11, 0.11, 0.14, 0.14])
        place(pluck, pan(v * level, 0.35 if i % 2 else -0.35), tt)
    # écho (croche pointée)
    d_s = int(BEAT * 0.75 * SR)
    echo = np.zeros_like(pluck)
    echo[d_s:] = pluck[:-d_s, ::-1] * 0.35
    pluck = reverb(pluck + echo, 0.3)

    # --- Kick 4/4 (à partir de 4 s, jusqu'à 25 s)
    t_k = t_axis(0.42)
    f_k = 45 + 95 * np.exp(-t_k * 28)
    kick = np.sin(2 * np.pi * np.cumsum(f_k) / SR) * np.exp(-t_k * 7.5)
    kick += 0.25 * hp(rng.standard_normal(len(t_k)), 2500) * np.exp(-t_k * 220)
    kick = soft_clip(kick * 1.2, 1.3) * 0.55
    for i in range(int(DUR / BEAT)):
        tt = i * BEAT
        if 4.0 <= tt < 25.0:
            lvl = 0.75 if tt < 9 else 1.0
            place(drums, kick * lvl, tt)
            j = int(tt * SR)
            sc = 1 - 0.55 * np.exp(-t_axis(BEAT) * 9)
            sidechain[j:j + len(sc)] = np.minimum(sidechain[j:j + len(sc)], sc[: len(sidechain[j:j + len(sc)])])

    # --- Charleston (contretemps), ouverte sur la montée
    t_h = t_axis(0.12)
    hat = hp(rng.standard_normal(len(t_h)), 7500, 4) * np.exp(-t_h * 70)
    t_oh = t_axis(0.35)
    ohat = hp(rng.standard_normal(len(t_oh)), 6500, 4) * np.exp(-t_oh * 12)
    for i in range(int(DUR / (BEAT / 2))):
        tt = i * BEAT / 2
        if not (4.0 <= tt < 25.0):
            continue
        off = i % 2 == 1
        if off:
            if tt >= 19.0:
                place(drums, pan(ohat * 0.07, 0.25), tt)
            else:
                place(drums, pan(hat * 0.09, 0.25), tt)
        elif tt >= 9.0:
            place(drums, pan(hat * 0.035, -0.3), tt)

    # --- Clap sur 2 et 4 (à partir de 9 s)
    t_c = t_axis(0.3)
    clap_src = bp(rng.standard_normal(len(t_c)), 900, 5000)
    clap_env = np.zeros(len(t_c))
    for o in (0.0, 0.011, 0.022):
        k = int(o * SR)
        clap_env[k:] += np.exp(-t_c[: len(t_c) - k] * 60)
    clap_env += 0.4 * np.exp(-t_c * 14)
    clap = clap_src * clap_env * 0.12
    for i in range(int(DUR / BEAT)):
        tt = i * BEAT
        if 9.0 <= tt < 25.0 and i % 2 == 1:
            place(drums, reverb(clap, 0.25) * (0.8 if tt < 19 else 1.0), tt)

    # --- Basse (croches, sidechain)
    t_b = t_axis(BEAT / 2)
    for i in range(int(DUR / (BEAT / 2))):
        tt = i * BEAT / 2
        if not (4.0 <= tt < 25.0):
            continue
        bar = int(tt // (4 * BEAT))
        _, root = chord_at(bar)
        m = root + (12 if (i % 4 == 3) else 0) + 12
        f = mtof(m)
        e = env_adsr(len(t_b), 0.005, 0.08, 0.7, 0.04)
        v = np.sin(2 * np.pi * f * t_b) + 0.3 * saw(f, t_b, 6)
        bass_note = soft_clip(v * e, 1.5) * 0.22
        i0 = int(tt * SR)
        k = min(len(bass_note), n - i0)
        bass[i0:i0 + k] += bass_note[:k]
    bass = lp(bass, 900)

    # --- Cloches (contre-chant sur la montée, 19-25 s)
    def bell(f, d=1.4, amp=0.1):
        t = t_axis(d)
        idx = 2.2 * np.exp(-t * 6)
        return np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 3.2) * amp

    melody = [(19.0, 78), (19.75, 76), (20.5, 74), (21.0, 81), (22.0, 78), (22.75, 76), (23.25, 73), (24.0, 74), (24.5, 76)]
    for tt, m in melody:
        place(bells, pan(bell(mtof(m), amp=0.055), 0.2), tt)
    bells = reverb(bells, 0.45)

    # --- Effets intégrés : montées de bruit avant 4 s, 19 s et 25 s
    def riser(d, lo=400, hi=6000, amp=0.06):
        t = t_axis(d)
        x = rng.standard_normal(len(t))
        out = np.zeros(len(t))
        blk = 1200
        for i in range(0, len(t), blk):
            fc = lo * (hi / lo) ** (i / len(t))
            out[i:i + blk] = bp(x[max(0, i - 1200):i + blk], fc * 0.7, fc * 1.3)[-len(x[i:i + blk]):]
        return out * (t / d) ** 2 * amp

    place(fx, pan(riser(1.5, amp=0.05), 0), 4.0 - 1.5)
    place(fx, pan(riser(2.0, amp=0.07), 0), 19.0 - 2.0)
    place(fx, pan(riser(1.0, amp=0.05), 0), 25.0 - 1.0)
    # impact doux à 19 s et 25 s
    t_i = t_axis(1.2)
    impact = np.sin(2 * np.pi * (38 + 30 * np.exp(-t_i * 10)) * t_i) * np.exp(-t_i * 3.5) * 0.25
    place(fx, impact, 19.0)
    place(fx, impact * 0.8, 25.0)

    # --- Mixage musique
    mix = pad * 0.9 + pluck + drums + bells + fx
    mix += np.stack([bass, bass], 1)
    mix[:, 0] *= sidechain * 0.25 + 0.75
    mix[:, 1] *= sidechain * 0.25 + 0.75
    # fondu de fin
    fade = np.ones(n)
    fs = int(28.6 * SR)
    fade[fs:] = np.linspace(1, 0, n - fs) ** 1.5
    mix *= fade[:, None]
    mix = hp(mix, 30)
    mix = soft_clip(normalize(mix, 0.95) * 1.05, 1.1)
    return normalize(mix, 0.89)


# ----------------------------------------------------------------------------
# EFFETS SONORES
# ----------------------------------------------------------------------------

def sweep_noise(d, f0, f1, q=0.6, shape=None, stereo_from=-0.6, stereo_to=0.6):
    t = t_axis(d)
    x = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    blk = 600
    for i in range(0, len(t), blk):
        u = i / len(t)
        fc = f0 * (f1 / f0) ** u
        seg = x[max(0, i - 1200):i + blk]
        out[i:i + blk] = bp(seg, fc * (1 - q / 2), fc * (1 + q / 2))[-len(x[i:i + blk]):]
    e = shape(t / d) if shape else np.sin(np.pi * t / d) ** 2
    out *= e
    p = np.linspace(stereo_from, stereo_to, len(t))
    l = np.cos((p + 1) * np.pi / 4)
    r = np.sin((p + 1) * np.pi / 4)
    return np.stack([out * l, out * r], 1)


def sfx_whoosh():
    # pic d'intensité à 0,25 s (milieu de la transition)
    d = 0.6
    w = sweep_noise(d, 350, 3200, 0.9, shape=lambda u: np.where(u < 0.42, (u / 0.42) ** 2, np.exp(-(u - 0.42) * 9)))
    return normalize(reverb(w, 0.2), 0.8)


def sfx_whoosh_up():
    d = 0.6
    w = sweep_noise(d, 250, 4200, 0.8, shape=lambda u: np.where(u < 0.42, (u / 0.42) ** 2, np.exp(-(u - 0.42) * 8)),
                    stereo_from=0, stereo_to=0)
    return normalize(reverb(w, 0.2), 0.75)


def sfx_plane():
    # passage d'avion stylisé : souffle + ton « jet » glissant, pic à 0,4 s
    d = 1.1
    t = t_axis(d)
    w = sweep_noise(d, 300, 2400, 1.0, shape=lambda u: np.where(u < 0.36, (u / 0.36) ** 2, np.exp(-(u - 0.36) * 5)),
                    stereo_from=-0.8, stereo_to=0.8)
    f = 900 * (1 - 0.25 * t / d)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.08 * np.interp(t, [0, 0.4, 1.1], [0, 1, 0])
    tone = bp(tone + 0.3 * hp(rng.standard_normal(len(t)), 3000) * 0.05, 600, 5000)
    w = w + pan(tone, 0)
    return normalize(reverb(w, 0.25), 0.8)


def sfx_click():
    t = t_axis(0.06)
    v = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 160)
    v += 0.4 * hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 600)
    v += 0.3 * np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 90)
    return normalize(reverb(v, 0.12), 0.7)


def sfx_pop():
    t = t_axis(0.16)
    f = 420 + 650 * (1 - np.exp(-t * 60))
    v = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 32) * np.minimum(1, t / 0.004)
    return normalize(reverb(v, 0.15), 0.7)


def sfx_glint():
    t = t_axis(1.0)
    v = np.zeros(len(t))
    for k, (f, dt) in enumerate([(2637, 0), (3520, 0.06), (4186, 0.12)]):
        i = int(dt * SR)
        tt = t[: len(t) - i]
        v[i:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 9) * (0.6 - 0.12 * k)
    return normalize(reverb(v, 0.45), 0.6)


def sfx_breath():
    # ouverture cinématographique : souffle filtré + infra doux
    d = 1.6
    t = t_axis(d)
    w = sweep_noise(d, 180, 1400, 1.2, shape=lambda u: np.where(u < 0.35, (u / 0.35) ** 1.5, np.exp(-(u - 0.35) * 4.5)),
                    stereo_from=-0.3, stereo_to=0.3)
    sub = np.sin(2 * np.pi * (34 + 20 * np.exp(-t * 6)) * t) * np.exp(-t * 2.2) * np.minimum(1, t / 0.05) * 0.6
    shimmer = np.zeros(len(t))
    for f in (1175, 1480, 1760):
        shimmer += np.sin(2 * np.pi * f * t) * np.interp(t, [0, 0.4, 1.6], [0, 0.05, 0])
    out = w + pan(sub + shimmer, 0)
    return normalize(reverb(out, 0.35), 0.8)


def sfx_door():
    # portière premium : petit « clac » feutré + souffle d'air (très discret)
    t = t_axis(0.9)
    thump = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * np.exp(-t * 14) * 0.8
    latch = bp(rng.standard_normal(len(t)), 1800, 6000) * np.exp(-t * 120) * 0.35
    air = sweep_noise(0.9, 500, 1500, 1.0, shape=lambda u: np.sin(np.pi * u) ** 2 * 0.25, stereo_from=0.2, stereo_to=-0.2)
    return normalize(reverb(pan(thump + latch, 0.15) + air, 0.25), 0.7)


def sfx_airport():
    d = 5.4
    t = t_axis(d)
    # rumeur lointaine (bruit brun filtré) + modulation lente
    brown = np.cumsum(rng.standard_normal((len(t), 2)), axis=0)
    brown = hp(brown, 60)
    brown = lp(brown, 700)
    brown /= np.max(np.abs(brown))
    mod = 0.75 + 0.25 * np.sin(2 * np.pi * 0.35 * t[:, None] + np.array([[0, 1.3]]))
    murmur = brown * mod
    # carillon d'annonce très lointain
    chime = np.zeros(len(t))
    for f, st in ((659.25, 1.2), (523.25, 1.6)):
        i = int(st * SR)
        tt = t[: len(t) - i]
        chime[i:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.5) * 0.12
    out = murmur * 0.6 + reverb(lp(chime, 2500), 0.6) * 0.5
    fade = np.interp(t, [0, 0.6, d - 0.6, d], [0, 1, 1, 0])
    return normalize(out * fade[:, None], 0.6)


def sfx_wind_city():
    d = 6.4
    t = t_axis(d)
    x = rng.standard_normal((len(t), 2))
    wind = lp(hp(x, 150), 900)
    gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.22 * t)[:, None] * np.sin(2 * np.pi * 0.09 * t + 1)[:, None]
    wind = wind / np.max(np.abs(wind)) * gust
    # eau / ville : clapotis aigus très doux
    water = bp(rng.standard_normal((len(t), 2)), 1500, 5000) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.1 * t)[:, None] ** 2) * 0.12
    fade = np.interp(t, [0, 0.8, d - 0.8, d], [0, 1, 1, 0])
    return normalize((wind * 0.7 + water) * fade[:, None], 0.55)


def sfx_swoosh_soft():
    d = 0.8
    w = sweep_noise(d, 600, 5000, 0.7, shape=lambda u: np.where(u < 0.4, (u / 0.4) ** 2, np.exp(-(u - 0.4) * 6)),
                    stereo_from=0.4, stereo_to=-0.4)
    return normalize(reverb(w, 0.35), 0.7)


def sfx_shimmer():
    d = 1.4
    t = t_axis(d)
    v = np.zeros((len(t), 2))
    notes = [86, 90, 93, 98, 102]
    for k, m in enumerate(notes):
        i = int(k * 0.05 * SR)
        tt = t[: len(t) - i]
        tone = np.sin(2 * np.pi * mtof(m) * tt) * np.exp(-tt * 5) * 0.25
        v[i:] += pan(tone, -0.5 + k * 0.25)
    return normalize(reverb(v, 0.55), 0.55)


def sfx_sonic_logo():
    """Signature sonore TIAVOYAGES : trois notes montantes (ré – fa# – la) + octave, timbre cloche FM."""
    d = 2.6
    t = t_axis(d)
    out = np.zeros((len(t), 2))

    def bell(f, dur, amp, ratio=3.5, index=2.0, decay=2.4):
        tt = t_axis(dur)
        idx = index * np.exp(-tt * 5)
        b = np.sin(2 * np.pi * f * tt + idx * np.sin(2 * np.pi * f * ratio * tt))
        b += 0.3 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt * 6)
        return b * np.exp(-tt * decay) * np.minimum(1, tt / 0.003) * amp

    seq = [(0.00, 74, -0.3), (0.13, 78, 0.0), (0.26, 81, 0.3)]
    for st, m, p in seq:
        place(out, pan(bell(mtof(m), 1.6, 0.30), p), st)
    # accord final (ré + octave), plus doux et plus long
    for m, p in ((86, -0.2), (74, 0.2), (62, 0)):
        place(out, pan(bell(mtof(m), 2.2, 0.20 if m > 62 else 0.28, ratio=2.0, index=1.2, decay=1.6), p), 0.42)
    return normalize(reverb(out, 0.4), 0.8)


def main(out_dir):
    os.makedirs(os.path.join(out_dir, "music"), exist_ok=True)
    os.makedirs(os.path.join(out_dir, "sfx"), exist_ok=True)
    write(os.path.join(out_dir, "music", "tiavoyages_theme.wav"), build_music())
    for name, fn in [
        ("whoosh", sfx_whoosh), ("whoosh_up", sfx_whoosh_up), ("plane_pass", sfx_plane),
        ("ui_click", sfx_click), ("ui_pop", sfx_pop), ("glint", sfx_glint),
        ("cinematic_breath", sfx_breath), ("car_door", sfx_door), ("airport_ambience", sfx_airport),
        ("wind_city", sfx_wind_city), ("swoosh_soft", sfx_swoosh_soft), ("shimmer", sfx_shimmer),
        ("sonic_logo", sfx_sonic_logo),
    ]:
        x = fn()
        if x.ndim == 1:
            x = np.stack([x, x], 1)
        write(os.path.join(out_dir, "sfx", f"{name}.wav"), x)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/audio")
