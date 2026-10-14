#!/usr/bin/env python3
"""GSN 2.0 — VERSION 4 « L'ÎLE DES OPPORTUNITÉS » : bande sonore ORIGINALE.

Style « future bass » lumineux, 120 BPM (1 temps = 0,5 s ; 40 s = 20 mesures),
fa majeur (F – C – Dm – Bb). Accords « supersaw » pompés par sidechain,
hook en pizzicato synthétique, basse sub, demi-temps sur le drop, roulement de
caisse claire avant la révélation. Tout est synthétisé (aucun échantillon tiers).
Sorties : public/audio/v4/music.wav et public/audio/v4/sfx/*.wav
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_audio as A  # noqa: E402

TL = json.load(open(os.path.join(A.ROOT, "src", "v4", "timeline.json")))
SR, FPS = A.SR, TL["fps"]
TOTAL_S = TL["durationInFrames"] / FPS
OUT = os.path.join(A.ROOT, "public", "audio", "v4")
SFXD = os.path.join(OUT, "sfx")
RNG = np.random.default_rng(404)
B = 0.5  # durée d'un temps (s)
BAR = 2.0
tvec, midi = A.tvec, A.midi

CH = {"F": ([53, 57, 60, 65], 41), "C": ([52, 55, 60, 64], 36), "Dm": ([50, 57, 62, 65], 38), "Bb": ([50, 53, 58, 62], 34)}
PROG = ["F", "C", "Dm", "Bb"]
DROP = 626 / FPS  # 25,04 s


def sec(t):
    if t < 6:
        return "intro"
    if t < 12:
        return "build"
    if t < 19:
        return "groove"
    if t < DROP:
        return "break"
    if t < 33:
        return "drop"
    return "final"


def supersaw(f, t, cut, voices=5, spread=0.18):
    y = np.zeros_like(t)
    for v in range(voices):
        d = (v - (voices - 1) / 2) / ((voices - 1) / 2) * spread
        y += A.saw_additive(f * 2 ** (d / 12), t, cut, phase=RNG.uniform(0, 6.28), kmax=45)
    return y / voices


def pizz(f, dur=0.35):
    t = tvec(dur)
    return A.saw_additive(f, t, 900 + 5000 * np.exp(-t / 0.025), kmax=40) * np.exp(-t / 0.12)


# ---------------------------------------------------------------- SFX
def sparkle():
    dur = 1.4
    x = np.zeros(int(dur * SR))
    for k in range(38):
        at = (k / 38) ** 0.8 * 1.1
        m = 84 + int(RNG.integers(0, 4)) * 2 + int(RNG.integers(0, 3)) * 12 - 12
        A.place(x, A.bell(midi(m), tvec(0.4), 0.18, 0.6) * 0.18 * (1 - k / 50), at)
    st = A.stereo(x, np.sin(np.arange(len(x)) / SR * 9) * 0.7)
    return A.normalize(A.add_reverb(st, wet=0.4, rt60=1.8), -4)


def pulse():
    t = tvec(0.8)
    x = np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.12) + np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.05) * 0.3
    return A.normalize(A.add_reverb(A.stereo(x), wet=0.3, rt60=1.2), -4)


def sonar():
    t = tvec(2.4)
    x = np.zeros_like(t)
    for k, d in enumerate((0, 0.25, 0.5, 0.75)):
        i0 = int(d * SR)
        tt = t[: len(t) - i0]
        x[i0:] += np.sin(2 * np.pi * midi(81) * tt) * np.exp(-tt / 0.25) * (0.6 ** k)
    return A.normalize(A.add_reverb(A.stereo(x), wet=0.45, rt60=2.0, bright=7000), -5)


def morph_sfx():
    t = tvec(0.9)
    f = 200 * (1600 / 200) ** (t / t[-1])
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph) / k for k in range(1, 7)) * np.sin(np.pi * t / t[-1]) ** 1.5 * 0.5
    noise = A.stft_filter(RNG.standard_normal(len(t)), lambda fr, tc: A.bp(fr, 300 * (5000 / 300) ** min(tc / 0.9, 1), 1.2)) * np.sin(np.pi * t / t[-1]) * 0.6
    return A.normalize(A.add_reverb(A.stereo(x + noise, np.linspace(-0.6, 0.6, len(t))), wet=0.3, rt60=1.4), -3)


def impact():
    return A.sfx_hit(True)


def drop():
    t = tvec(3.0)
    f = 34 + 120 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    crash = A.fft_filter(RNG.standard_normal(len(t)), lambda x: A.hp(x, 3500)) * np.exp(-t / 1.0) * 0.3
    chord = sum(supersaw(midi(m), t, 4000 * np.exp(-t / 0.8) + 600) for m in (53, 57, 60, 65, 69)) * np.exp(-t / 0.9) * 0.12
    m = A.soft_clip(sub + crash + chord, 1.6)
    return A.normalize(A.add_reverb(A.stereo(m), wet=0.35, rt60=2.5, seed=5), -1)


def tick():
    return A.sfx_tick()


def pop():
    t = tvec(0.4)
    f = 500 + 900 * np.exp(-t / 0.02)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07)
    return A.normalize(A.add_reverb(A.stereo(x), wet=0.2, rt60=0.8), -3)


def signature():
    at = [s for s in TL["sfx"] if s["id"] == "signature"][0]["at"]
    dur = TL["durationInFrames"] / FPS - at / FPS
    x = np.zeros(int(dur * SR))
    for k, m in enumerate([65, 69, 72, 77, 81]):
        A.place(x, pizz(midi(m), 0.6) * 0.5, k * 0.06)
    t = tvec(dur)
    chord = sum(supersaw(midi(m), t, 3500, voices=3) for m in (53, 60, 65, 69)) * np.exp(-t / 0.7) * 0.2
    A.place(x, chord, 0.3)
    kf = 45 + 100 * np.exp(-t / 0.03)
    A.place(x, np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-t / 0.4) * 0.7, 0.3)
    st = A.add_reverb(A.stereo(x), wet=0.35, rt60=2.2, seed=23)
    fade = int(0.3 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    return A.normalize(st, -1)


# ---------------------------------------------------------------- MUSIQUE
HOOK = [0, 2, 4, 2, 7, 4, 2, 4, 0, 2, 4, 7, 9, 7, 4, 2]  # degrés (demi-tons) au-dessus de la fondamentale de la gamme
SCALE_ROOT = 65  # F4


def build_music():
    n = int(TOTAL_S * SR)
    tt = np.arange(n) / SR
    chords = np.zeros((n, 2))
    lead = np.zeros((n, 2))
    bass = np.zeros(n)
    drums = np.zeros((n, 2))
    kicks = []

    def kick(lv):
        t = tvec(0.45)
        f = 48 + 140 * np.exp(-t / 0.03)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.24) * lv

    def snare(lv):
        t = tvec(0.4)
        body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.06)
        nz = A.fft_filter(RNG.standard_normal(len(t)), lambda f: A.bp(f, 2500, 0.6)) * np.exp(-t / 0.13)
        return (body * 0.5 + nz) * lv

    def hat(lv, open_=False):
        t = tvec(0.2 if open_ else 0.05)
        return A.fft_filter(RNG.standard_normal(len(t)), lambda f: A.hp(f, 8000, 3)) * np.exp(-t / (0.06 if open_ else 0.012)) * lv

    nb = int(TOTAL_S / B)
    for b in range(nb):
        t0 = b * B
        s = sec(t0)
        beat = b % 4
        bar = b // 4
        notes, root = CH[PROG[bar % 4]]
        # --- accords
        if beat == 0:
            dur = BAR + 0.4
            t = tvec(dur)
            cut = {"intro": 700, "build": 1400, "groove": 2400, "break": 2800, "drop": 4200, "final": 4000}[s]
            if s == "build":
                cut = 900 + (t0 - 6) / 6 * 1800
            lvl = {"intro": 0.5, "build": 0.6, "groove": 0.55, "break": 0.75, "drop": 0.8, "final": 0.75}[s]
            env = A.adsr(len(t), 0.02 if s in ("drop", "final") else 0.2, 0.3, 0.85, 0.4, BAR)
            if s in ("drop", "final"):
                # « wobble » en croches typique future bass
                env = env * (0.55 + 0.45 * (np.sin(2 * np.pi * 4 * t - np.pi / 2) * 0.5 + 0.5))
            for m in notes:
                v = supersaw(midi(m), t, cut)
                A.place(chords, A.stereo(v * env * lvl * 0.09, (m - 58) / 12), t0)
        # --- hook pizz (croches)
        if s in ("groove", "drop", "final") and t0 < 39:
            for h in range(2):
                idx = (b * 2 + h) % len(HOOK)
                m = SCALE_ROOT + HOOK[idx] + (12 if s != "groove" and idx % 8 == 4 else 0)
                A.place(lead, A.stereo(pizz(midi(m)) * (0.14 if s == "groove" else 0.17), np.sin(b + h) * 0.5), t0 + h * B / 2)
        # --- basse
        if s in ("build", "groove", "drop", "final") and not (s == "build" and t0 < 9):
            t = tvec(B * (1.9 if s in ("drop", "final") else 0.9))
            f0 = midi(root)
            v = np.sin(2 * np.pi * f0 * t) + 0.25 * A.saw_additive(f0, t, 300, kmax=8)
            if s in ("drop", "final") and beat in (0, 2):
                A.place(bass, v * A.adsr(len(t), 0.005, 0.1, 0.9, 0.08, len(t) / SR - 0.08) * 0.42, t0)
            elif s in ("build", "groove"):
                A.place(bass, v * A.adsr(len(t), 0.005, 0.1, 0.8, 0.06, len(t) / SR - 0.06) * 0.34, t0)
        # --- batterie
        if s in ("groove",):
            kicks.append((t0, 0.85))
            if beat in (1, 3):
                A.place(drums, A.stereo(snare(0.45)), t0)
        elif s in ("drop", "final"):
            if t0 >= 39.0:
                pass
            elif beat == 0 or (beat == 1 and bar % 2 == 1):
                kicks.append((t0 + (0.25 if beat == 1 else 0), 0.95))
            if beat == 2 and t0 < 39:
                A.place(drums, A.stereo(snare(0.6)), t0)
        elif s == "build" and t0 >= 8:
            kicks.append((t0, 0.6))
        if s in ("build", "groove", "drop", "final") and t0 < 39:
            A.place(drums, A.stereo(hat(0.13, open_=True), 0.3), t0 + B / 2)
            if s != "build":
                A.place(drums, A.stereo(hat(0.06), -0.3), t0)
                A.place(drums, A.stereo(hat(0.05), -0.2), t0 + B / 4 * 3)

    # coups sur les mots-clés (break)
    for fr_ in (487, 528, 568):
        kicks.append((fr_ / FPS, 1.0))
    # roulement de caisse claire avant le drop (accélère)
    t = 23.4
    step = 0.25
    while t < DROP - 0.03:
        lv = 0.15 + 0.4 * (t - 23.4) / (DROP - 23.4)
        A.place(drums, A.stereo(snare(lv)), t)
        t += step
        if t > 24.0:
            step = 0.125
        if t > 24.5:
            step = 0.0625
    # montée de bruit vers le drop
    t = tvec(DROP - 23.0)
    nz = A.stft_filter(RNG.standard_normal(len(t)), lambda f, tc: A.bp(f, 400 * (9000 / 400) ** min(tc / (DROP - 23.0), 1), 0.9))
    up = np.zeros((n, 2))
    A.place(up, A.stereo(nz * (t / t[-1]) ** 2 * 0.25), 23.0)

    sc = np.ones(n)
    for t0, lv in kicks:
        A.place(drums, A.stereo(kick(lv) * 0.9), t0)
        i = int(t0 * SR)
        j = min(n, i + int(0.35 * SR))
        sc[i:j] = np.minimum(sc[i:j], 1 - 0.7 * lv * np.exp(-np.arange(j - i) / SR / 0.12))

    music = A.add_reverb(chords * sc[:, None] + lead, wet=0.28, rt60=2.2, seed=44)
    mix = music + A.stereo(bass * sc) + A.add_reverb(drums, wet=0.1, rt60=1.0, seed=45) + up
    gate = np.interp(tt, [0, DROP - 0.35, DROP - 0.3, DROP - 0.02, DROP, TOTAL_S], [1, 1, 0.2, 0.2, 1, 1])
    mix *= gate[:, None]
    fade = np.interp(tt, [0, 39.1, TOTAL_S], [1, 1, 0]) ** 1.5
    mix *= fade[:, None]
    mix = A.soft_clip(A.normalize(mix, -1.5) * 1.15, 1.2)
    return A.normalize(mix, -1.0)


def main():
    os.makedirs(SFXD, exist_ok=True)
    sfx = {
        "pulse": pulse,
        "burst": lambda: A.normalize(A.sfx_boom_sub() * 0.7 + A.sfx_whoosh(3.6, 0.15, 3000, 6000, 800) * 0.3, -1),
        "sparkle": sparkle,
        "ping": lambda: A.sfx_ping(midi(84)),
        "ping_high": lambda: A.sfx_ping(midi(89)),
        "whoosh": lambda: A.sfx_whoosh(1.0, 0.45, 300, 5000, 1600),
        "hit": lambda: A.sfx_hit(False),
        "sonar": sonar,
        "morph": morph_sfx,
        "riser_short": lambda: A.sfx_riser(1.3),
        "riser_long": lambda: A.sfx_riser(DROP - 584 / FPS),
        "impact": impact,
        "drop": drop,
        "tick": tick,
        "pop": pop,
        "shimmer": A.sfx_shimmer,
        "signature": signature,
    }
    for name, fn in sfx.items():
        A.write_wav(os.path.join(SFXD, f"{name}.wav"), fn())
        print("sfx", name)
    m = build_music()
    A.write_wav(os.path.join(OUT, "music.wav"), m)
    print("music.wav", len(m) / SR)


if __name__ == "__main__":
    main()
