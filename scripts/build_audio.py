#!/usr/bin/env python3
"""GSN 2.0 — génération procédurale de la bande sonore ORIGINALE.

Tout est synthétisé ici (aucun échantillon tiers, aucune musique sous licence) :
  - public/audio/music_bed.wav   : lit musical « cinematic electronic » de 40,00 s
  - public/audio/sfx/*.wav       : whooshes, impacts, risers, pings, signature sonore

Le minutage est lu dans src/config/timeline.json (même source que l'animation).
Ces fichiers sont des créations originales remplaçables : pour intégrer une
musique de compositeur ou une banque SFX sous licence, il suffit d'écraser les
fichiers en gardant les mêmes noms.

Usage : python3 scripts/build_audio.py
Dépendance : numpy uniquement.
"""
import json
import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, "src", "config", "timeline.json")))
SR = 48000
FPS = TL["fps"]
TOTAL_FRAMES = TL["durationInFrames"]
TOTAL = TOTAL_FRAMES / FPS  # 40.0 s
RNG = np.random.default_rng(2026)
OUT_DIR = os.path.join(ROOT, "public", "audio")
SFX_DIR = os.path.join(OUT_DIR, "sfx")


# ---------------------------------------------------------------- utilitaires
def fr(frame):
    """frame -> secondes"""
    return frame / FPS


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(dur):
    return np.arange(int(round(dur * SR))) / SR


def write_wav(path, x):
    """x : (n, 2) float [-1, 1] -> WAV 16 bits stéréo"""
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def stereo(mono, pan=0.0):
    """pan -1 (gauche) .. 1 (droite), loi à puissance constante. pan peut être un tableau."""
    a = (np.asarray(pan) + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def fft_filter(x, gain_fn):
    """Filtre statique dans le domaine fréquentiel. gain_fn(freqs) -> gains."""
    n = len(x)
    X = np.fft.rfft(x, n)
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(X * gain_fn(f), n)


def stft_filter(x, gain_fn, win=2048, hop=512):
    """Filtre variable dans le temps (overlap-add). gain_fn(freqs, t_centre) -> gains."""
    n = len(x)
    pad = np.concatenate([np.zeros(win), x, np.zeros(win)])
    w = np.sqrt(np.hanning(win + 1)[:-1])
    out = np.zeros_like(pad)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    for start in range(0, len(pad) - win, hop):
        seg = pad[start:start + win] * w
        tc = (start + win / 2 - win) / SR
        out[start:start + win] += np.fft.irfft(np.fft.rfft(seg) * gain_fn(freqs, tc), win) * w
    out /= (win / hop) / 2  # normalisation fenêtre sqrt-hann
    return out[win:win + n]


def lp(f, fc, order=2):
    return 1 / np.sqrt(1 + (f / max(fc, 1)) ** (2 * order))


def hp(f, fc, order=2):
    return 1 / np.sqrt(1 + (max(fc, 1) / np.maximum(f, 1e-3)) ** (2 * order))


def bp(f, fc, q=1.2):
    return 1 / np.sqrt(1 + (q * (f / fc - fc / np.maximum(f, 1e-3))) ** 2)


def reverb_ir(rt60=2.4, predelay=0.012, bright=6500, length=None, seed=7):
    length = length or rt60 * 1.1
    r = np.random.default_rng(seed)
    t = tvec(length)
    env = np.exp(-6.9 * t / rt60)
    pre = int(predelay * SR)
    chans = []
    for _ in range(2):
        n = r.standard_normal(len(t)) * env
        n = fft_filter(n, lambda f: lp(f, bright, 1) * hp(f, 120, 1))
        n = np.concatenate([np.zeros(pre), n])
        chans.append(n / np.sqrt(np.sum(n ** 2)))
    return chans


def convolve(x, h):
    n = len(x) + len(h) - 1
    size = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(h, size), size)
    return y[:len(x)]


def add_reverb(st, wet=0.25, rt60=2.4, bright=6500, seed=7):
    """st : (n, 2). Réverbération par convolution (IR synthétique décorrélée)."""
    irl, irr = reverb_ir(rt60, bright=bright, seed=seed)
    mono = st.mean(axis=1)
    wl = convolve(mono, irl)
    wr = convolve(mono, irr)
    return st * (1 - wet * 0.35) + np.stack([wl, wr], axis=1) * wet


def saw_additive(freq, t, cutoff, phase=0.0, kmax=80):
    """Dent de scie à bande limitée par synthèse additive.
    cutoff : scalaire ou tableau (même taille que t) -> balayage de filtre sans IIR."""
    y = np.zeros_like(t)
    cutoff = np.asarray(cutoff, dtype=float)
    kmax = int(min(kmax, (SR / 2 - 500) // max(freq, 1)))
    for k in range(1, kmax + 1):
        w = 1 / (1 + (k * freq / np.maximum(cutoff, 20)) ** 4)
        if np.max(w) < 2e-4:
            break
        y += np.sin(2 * np.pi * k * freq * t + phase * k) * w / k
    return y


def adsr(n, a, d, s, r, sustain_len):
    """enveloppe en échantillons"""
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(int(sustain_len * SR) - a_n - d_n, 0)
    env = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)),
        np.linspace(1, s, max(d_n, 1)),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    if len(env) < n:
        env = np.concatenate([env, np.zeros(n - len(env))])
    return env[:n]


def place(buf, sig, at_sec):
    i = int(round(at_sec * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def normalize(x, peak_db=-1.0):
    p = np.max(np.abs(x)) + 1e-9
    return x / p * 10 ** (peak_db / 20)


# --------------------------------------------------------------------- SFX
def sfx_boom_sub():
    t = tvec(3.6)
    f = 32 + 48 * np.exp(-t / 0.18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 1.1) * (1 - np.exp(-t / 0.004))
    mid_f = 55 + 70 * np.exp(-t / 0.05)
    mid = np.sin(2 * np.pi * np.cumsum(mid_f) / SR) * np.exp(-t / 0.22) * 0.5
    click = fft_filter(RNG.standard_normal(len(t)), lambda f_: lp(f_, 2500) * hp(f_, 200)) * np.exp(-t / 0.012) * 0.35
    rumble = fft_filter(RNG.standard_normal(len(t)), lambda f_: lp(f_, 180, 3)) * np.exp(-t / 1.4) * 0.8
    m = soft_clip(body + mid + click + rumble * 0.6, 1.6)
    st = add_reverb(stereo(m), wet=0.3, rt60=3.0, bright=2500)
    return normalize(st, -1)


def sfx_whoosh(dur=1.2, peak=0.5, f0=300, f1=4200, f2=1400, width=1.0):
    t = tvec(dur)
    n = RNG.standard_normal(len(t))

    def g(freqs, tc):
        u = np.clip(tc / dur, 0, 1)
        pk = peak / dur
        fc = f0 * (f1 / f0) ** (u / pk) if u < pk else f1 * (f2 / f1) ** ((u - pk) / (1 - pk))
        return bp(freqs, fc, 1.6) + 0.25 * bp(freqs, fc * 2.1, 2.5)

    x = stft_filter(n, g)
    env = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) / (dur * 0.18)))
    x *= env
    pan = np.clip((t / dur) * 2 - 1, -1, 1) * 0.75 * width
    st = stereo(x, pan)
    st = add_reverb(st, wet=0.2, rt60=1.4, bright=7000)
    return normalize(st, -2)


def sfx_hit(big=True):
    dur = 3.2 if big else 2.4
    t = tvec(dur)
    kf = 48 + 110 * np.exp(-t / 0.035)
    kick = np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-t / (0.42 if big else 0.3))
    snare = fft_filter(RNG.standard_normal(len(t)), lambda f: bp(f, 2400, 0.7)) * np.exp(-t / (0.16 if big else 0.08))
    tone_f = [midi(50), midi(57)] if big else [midi(62), midi(69)]
    tone = sum(np.sin(2 * np.pi * f * t) for f in tone_f) * np.exp(-t / 0.5) * 0.18
    metal = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in [(1210, 0.18), (1733, 0.12), (2417, 0.09), (3311, 0.06)]) * (0.1 if big else 0.06)
    m = kick * 1.0 + snare * (0.5 if big else 0.25) + tone + metal
    m = soft_clip(m, 1.8)
    st = stereo(m)
    st = add_reverb(st, wet=0.38 if big else 0.3, rt60=2.6, bright=5500, seed=3)
    return normalize(st, -1)


def sfx_riser(dur):
    t = tvec(dur)
    u = t / dur
    n = RNG.standard_normal(len(t))
    noise = stft_filter(n, lambda f, tc: bp(f, 400 * (9000 / 400) ** np.clip(tc / dur, 0, 1), 1.0))
    pitch = 180 * (900 / 180) ** (u ** 1.6)
    ph = 2 * np.pi * np.cumsum(pitch) / SR
    tone = sum(np.sin(k * ph) / k for k in range(1, 9)) * 0.25
    tone2 = sum(np.sin(k * ph * 1.5) / k for k in range(1, 6)) * 0.12
    env = u ** 2.4
    x = (noise * 0.9 + tone + tone2) * env
    # trémolo accéléré
    trem_rate = 4 + 20 * u ** 2
    x *= 0.75 + 0.25 * np.sin(2 * np.pi * np.cumsum(trem_rate) / SR)
    x[-int(0.006 * SR):] *= np.linspace(1, 0, int(0.006 * SR))
    st = stereo(x, np.sin(2 * np.pi * 0.5 * t) * 0.4)
    st = add_reverb(st, wet=0.25, rt60=1.6)
    return normalize(st, -2)


def bell(f, t, decay=1.2, bright=1.0):
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 1.4 * bright * np.exp(-t / 0.25)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / decay) * (1 - np.exp(-t / 0.002))


def sfx_ping(f):
    t = tvec(2.2)
    x = bell(f, t, 0.7) * 0.7 + bell(f * 2, t, 0.35, 0.5) * 0.2
    st = add_reverb(stereo(x), wet=0.45, rt60=2.2, bright=8000, seed=11)
    return normalize(st, -4)


def sfx_tick():
    t = tvec(0.5)
    x = np.sin(2 * np.pi * 2800 * t) * np.exp(-t / 0.012) + np.sin(2 * np.pi * 1400 * t) * np.exp(-t / 0.03) * 0.5
    x += fft_filter(RNG.standard_normal(len(t)), lambda f: hp(f, 3000)) * np.exp(-t / 0.004) * 0.4
    st = add_reverb(stereo(x), wet=0.25, rt60=0.8)
    return normalize(st, -5)


def sfx_shimmer():
    t = tvec(3.0)
    notes = [midi(77), midi(81), midi(84), midi(88), midi(93)]  # Fmaj7 aigu
    x = np.zeros_like(t)
    for i, f in enumerate(notes):
        trem = 0.6 + 0.4 * np.sin(2 * np.pi * (5 + i * 1.3) * t + i)
        x += np.sin(2 * np.pi * f * t) * trem * np.exp(-t / 1.2) * (1 - np.exp(-t / (0.15 + 0.05 * i)))
    st = stereo(x / len(notes), np.sin(2 * np.pi * 0.7 * t) * 0.6)
    st = add_reverb(st, wet=0.55, rt60=3.2, bright=9000, seed=5)
    return normalize(st, -4)


def sfx_signature():
    """Signature sonore GSN : trois notes ascendantes (F5 A5 C6) + octave, sur un impact doux."""
    dur = (TOTAL_FRAMES - [s for s in TL["sfx"] if s["id"] == "signature"][0]["at"]) / FPS
    t = tvec(dur)
    x = np.zeros_like(t)
    for i, (m, at) in enumerate([(77, 0.0), (81, 0.14), (84, 0.28), (89, 0.42)]):
        i0 = int(at * SR)
        tt = t[: len(t) - i0]
        x[i0:] += bell(midi(m), tt, 1.1, 0.8) * (0.55 if i < 3 else 0.45)
    i0 = int(0.42 * SR)
    tt = t[: len(t) - i0]
    kf = 45 + 80 * np.exp(-tt / 0.04)
    x[i0:] += np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-tt / 0.5) * 0.6
    st = add_reverb(stereo(x), wet=0.4, rt60=2.4, bright=8000, seed=9)
    fade = int(0.35 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    return normalize(st, -1)


# -------------------------------------------------------------------- MUSIQUE
BAR = 48  # frames par mesure (125 BPM, 4/4)
CHORDS = {
    "Dm": ([50, 57, 60, 65], 38),   # Dm7   (basse D2)
    "Bb": ([46, 53, 57, 62], 34),   # Bbmaj7 (basse Bb1)
    "F": ([53, 57, 60, 64], 41),    # Fmaj7 (basse F2)
    "C": ([48, 55, 62, 64], 36),    # Cadd9 (basse C2)
}
# une entrée par mesure (21 mesures couvrent 0..1008 frames)
PROGRESSION = [
    "Dm", "Dm", "Dm",            # 0–6 s   : intro mystérieuse
    "Dm", "Bb", "C",             # 6–12 s  : montée
    "Bb", "F", "C", "Dm",        # 12–19 s : ouverture
    "Bb", "C", "Dm",             # 19–25 s : accents
    "Bb", "C", "F", "Dm",        # 25–33 s : crescendo / reveal
    "Bb", "F", "C", "F",         # 33–40 s : climax et résolution
]


def pad_cutoff(frame):
    keys = [(0, 260), (140, 700), (288, 2200), (480, 1700), (576, 1700), (622, 5200), (626, 3600), (816, 4200), (960, 3800), (1000, 1500)]
    xs, ys = zip(*keys)
    return np.interp(frame, xs, ys)


def pad_gain(frame):
    keys = [(0, 0.0), (20, 0.55), (144, 0.6), (288, 0.8), (480, 0.6), (600, 0.75), (616, 0.15), (626, 0.95), (816, 1.0), (960, 1.05), (985, 0.7), (1000, 0.0)]
    xs, ys = zip(*keys)
    return np.interp(frame, xs, ys)


def build_music():
    n = int(TOTAL * SR)
    t_all = np.arange(n) / SR
    frames_all = t_all * FPS
    pad = np.zeros((n, 2))
    bass = np.zeros(n)
    arp = np.zeros((n, 2))
    drums = np.zeros((n, 2))
    sub = np.zeros(n)

    # --- pads (dent de scie additive désaccordée, balayage de filtre)
    for b, name in enumerate(PROGRESSION):
        start_f = b * BAR
        if start_f >= TOTAL_FRAMES:
            break
        notes, _ = CHORDS[name]
        dur = fr(BAR) + 0.9
        t = tvec(dur)
        fr_abs = start_f + t * FPS
        cut = pad_cutoff(fr_abs)
        env = adsr(len(t), 0.35 if b > 2 else 1.5, 0.4, 0.85, 0.9, fr(BAR))
        for i, m in enumerate(notes):
            for d, pan in [(-0.11, -0.7), (0.0, 0.0), (0.12, 0.7)]:
                f = midi(m) * 2 ** (d / 12)
                v = saw_additive(f, t, cut, phase=RNG.uniform(0, 6.28), kmax=60)
                place(pad, stereo(v * env * 0.07, pan + (i - 1.5) * 0.08), fr(start_f))
    pad *= pad_gain(frames_all)[:, None]

    # --- drone grave intro (0–6 s), réapparaît sous le reveal
    drone_env = np.interp(frames_all, [0, 10, 130, 160, 620, 630, 816, 1000], [0, 1, 1, 0.3, 0.3, 0.8, 0.6, 0])
    sub += (np.sin(2 * np.pi * midi(26) * t_all) + 0.4 * np.sin(2 * np.pi * midi(38) * t_all + np.sin(2 * np.pi * 0.2 * t_all))) * drone_env * 0.35

    # --- basse
    for b, name in enumerate(PROGRESSION):
        start_f = b * BAR
        if start_f < 288 or start_f >= TOTAL_FRAMES:
            continue
        _, root = CHORDS[name]
        f = midi(root)
        if start_f >= 624:
            # croches octaviées
            for k in range(8):
                fs = start_f + k * 6
                if 600 <= fs < 626 or fs >= TOTAL_FRAMES:
                    continue
                t = tvec(0.26)
                v = saw_additive(f * (2 if k % 2 else 1), t, 420 + 900 * np.exp(-t / 0.06), kmax=30) + 0.6 * np.sin(2 * np.pi * f * t)
                place(bass, v * adsr(len(t), 0.004, 0.05, 0.7, 0.05, 0.2) * 0.32, fr(fs))
        else:
            if start_f >= 576:
                continue
            t = tvec(fr(BAR))
            v = saw_additive(f, t, 280, kmax=20) + 0.7 * np.sin(2 * np.pi * f * t)
            place(bass, v * adsr(len(t), 0.02, 0.2, 0.8, 0.15, fr(BAR) - 0.15) * 0.3, fr(start_f))

    # --- arpège (pluck)
    def arp_on(fs):
        return (144 <= fs < 576) or (626 <= fs < 960)

    for fs in range(144, TOTAL_FRAMES, 3):
        if not arp_on(fs):
            continue
        b = fs // BAR
        notes, _ = CHORDS[PROGRESSION[b]]
        step = (fs // 3) % 8
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        m = notes[pattern[step]] + 12
        if fs >= 626 and step in (3, 7):
            m += 12
        t = tvec(0.32)
        cut = 900 + 3800 * np.exp(-t / 0.05) * np.interp(fs, [144, 288, 480, 626, 960], [0.25, 0.7, 0.9, 1.0, 1.0])
        v = saw_additive(midi(m), t, cut, kmax=40) * np.exp(-t / 0.13)
        vel = np.interp(fs, [144, 280, 288, 576, 626, 960], [0.15, 0.45, 0.55, 0.55, 0.7, 0.7]) * (1.0 if step % 2 == 0 else 0.75)
        place(arp, stereo(v * vel * 0.16, np.sin(fs * 0.37) * 0.6), fr(fs))

    # --- batterie
    def kick(level=1.0):
        t = tvec(0.5)
        f = 46 + 120 * np.exp(-t / 0.03)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) * level

    def hat(level=1.0, open_=False):
        t = tvec(0.25 if open_ else 0.08)
        x = fft_filter(RNG.standard_normal(len(t)), lambda f: hp(f, 7000, 3)) * np.exp(-t / (0.07 if open_ else 0.018))
        return x * level

    def clap(level=1.0):
        t = tvec(0.4)
        x = fft_filter(RNG.standard_normal(len(t)), lambda f: bp(f, 1800, 0.9))
        env = np.zeros_like(t)
        for off in (0, 0.011, 0.022):
            i = int(off * SR)
            env[i:] += np.exp(-(t[: len(t) - i]) / 0.012)
        env += np.exp(-t / 0.12) * 0.6
        return x * env * level

    kicks = []
    for fs in range(0, TOTAL_FRAMES, 12):
        beat = (fs // 12) % 4
        if 288 <= fs < 480:
            kicks.append((fs, 0.55))
        elif 480 <= fs < 576 and beat in (0, 2):
            kicks.append((fs, 0.6))
        elif 626 <= fs < 960:
            kicks.append((fs, 0.9))
    kicks.append((960, 1.0))
    for fs, lv in kicks:
        place(drums, stereo(kick(lv) * 0.85), fr(fs))
    for fs in range(336, 960, 6):
        if 576 <= fs < 626:
            continue
        off = (fs // 6) % 2 == 1
        if fs < 624 and not off:
            continue
        lv = 0.12 if fs < 624 else (0.14 if off else 0.07)
        place(drums, stereo(hat(lv, open_=(fs >= 816 and off)), 0.35), fr(fs))
    for fs in range(624, 960, 48):
        for o in (12, 36):
            if fs + o < 960:
                place(drums, stereo(clap(0.35), -0.1), fr(fs + o))

    # --- sidechain (pompage doux)
    sc = np.ones(n)
    for fs, lv in kicks:
        i = int(fr(fs) * SR)
        L = int(0.35 * SR)
        j = min(n, i + L)
        sc[i:j] = np.minimum(sc[i:j], 1 - 0.55 * lv * np.exp(-np.arange(j - i) / SR / 0.11))
    pad *= sc[:, None]
    bass_st = stereo(bass * sc)

    # --- texture d'air (bruit filtré)
    air = stft_filter(RNG.standard_normal(n), lambda f, tc: bp(f, 3500 + 1500 * np.sin(tc * 0.3), 0.6), win=4096, hop=2048)
    air_env = np.interp(frames_all, [0, 30, 150, 600, 622, 640, 1000], [0, 0.05, 0.035, 0.05, 0.09, 0.03, 0.02])
    air_st = stereo(air * air_env, np.sin(t_all * 0.5) * 0.5)

    wet = add_reverb(pad + arp * 1.0 + air_st, wet=0.35, rt60=2.8, bright=6000, seed=21)
    drums = add_reverb(drums, wet=0.12, rt60=1.2, bright=7000, seed=4)
    mix = wet + bass_st + drums + stereo(sub)

    # fondu final net à 40,00 s
    fade = np.interp(frames_all, [0, 975, 1000], [1, 1, 0]) ** 1.5
    mix *= fade[:, None]
    mix = soft_clip(normalize(mix, -1.5) * 1.15, 1.2)
    return normalize(mix, -1.0)


def main():
    os.makedirs(SFX_DIR, exist_ok=True)
    sfx = {
        "boom_sub": sfx_boom_sub,
        "whoosh_fast": lambda: sfx_whoosh(1.1, 0.5, 250, 5000, 1600),
        "whoosh_soft": lambda: sfx_whoosh(1.4, 0.6, 180, 2200, 900, 0.7),
        "hit_big": lambda: sfx_hit(True),
        "hit_soft": lambda: sfx_hit(False),
        "riser_short": lambda: sfx_riser(fr(254 - 226)),
        "riser_long": lambda: sfx_riser(fr(626 - 575)),
        "ping": lambda: sfx_ping(midi(86)),
        "ping_high": lambda: sfx_ping(midi(93)),
        "tick": sfx_tick,
        "shimmer": sfx_shimmer,
        "signature": sfx_signature,
    }
    for name, fn in sfx.items():
        write_wav(os.path.join(SFX_DIR, f"{name}.wav"), fn())
        print("sfx", name)
    music = build_music()
    write_wav(os.path.join(OUT_DIR, "music_bed.wav"), music)
    print("music_bed.wav", len(music) / SR, "s")


if __name__ == "__main__":
    main()
