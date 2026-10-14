#!/usr/bin/env python3
"""GSN 2.0 — VERSION 3 « DESTINATION TOAMASINA » : bande sonore ORIGINALE.

125 BPM, ré majeur (D – A – Bm – G), ambiance lumineuse et côtière :
cordes pincées synthétisées par Karplus-Strong (évocation libre d'un timbre
de cithare tubulaire, sans échantillon), marimba FM, basse ronde, kick/clap.
Intro douce → montée → groove → break sur les mots-clés → drop sur la révélation
→ climax et signature sonore. Tout est synthétisé (aucun échantillon tiers).

Sorties : public/audio/v3/music.wav et public/audio/v3/sfx/*.wav
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_audio as A  # noqa: E402

TL = json.load(open(os.path.join(A.ROOT, "src", "v3", "timeline.json")))
SR, FPS = A.SR, TL["fps"]
TOTAL = TL["durationInFrames"]
OUT = os.path.join(A.ROOT, "public", "audio", "v3")
SFXD = os.path.join(OUT, "sfx")
RNG = np.random.default_rng(1253)
BEAT, BAR = 12, 48
fr, tvec, midi = A.fr, A.tvec, A.midi


def pluck(freq, dur=1.2, bright=0.6, decay=0.996):
    """Corde pincée Karplus-Strong (vectorisée par périodes)."""
    n = int(dur * SR)
    N = max(2, int(SR / freq))
    y = np.zeros(n + N + 1)
    burst = RNG.uniform(-1, 1, N)
    # adoucissement du bruit initial selon la brillance
    for _ in range(int((1 - bright) * 6)):
        burst = 0.5 * (burst + np.roll(burst, 1))
    y[:N] = burst
    i = N
    while i < n + N:
        j = min(i + N, n + N)
        prev = y[i - N : j - N]
        prev2 = y[i - N - 1 : j - N - 1] if i - N - 1 >= 0 else np.concatenate([[0], y[i - N : j - N - 1]])
        y[i:j] = decay * 0.5 * (prev + prev2[: len(prev)])
        i = j
    out = y[N : N + n]
    return out / (np.max(np.abs(out)) + 1e-9)


def marimba(freq, dur=0.6):
    t = tvec(dur)
    mod = np.sin(2 * np.pi * freq * 4 * t) * 1.2 * np.exp(-t / 0.03)
    return (np.sin(2 * np.pi * freq * t + mod) + 0.25 * np.sin(2 * np.pi * freq * 3.9 * t) * np.exp(-t / 0.05)) * np.exp(-t / 0.28)


# ------------------------------------------------------------------ SFX
def sfx_arc():
    """balayage « arc » : whoosh + petit arpège de cordes"""
    w = A.sfx_whoosh(1.0, 0.45, 300, 4500, 1800)
    t = len(w)
    x = np.zeros(t)
    for k, m in enumerate([74, 78, 81, 86]):
        p = pluck(midi(m), 0.7, 0.8) * 0.25
        A.place(x, p, 0.12 + k * 0.06)
    st = w * 0.8 + A.stereo(x)
    return A.normalize(A.add_reverb(st, wet=0.25, rt60=1.5), -2)


def sfx_soft_hit():
    return A.sfx_hit(False)


def sfx_big_hit():
    return A.sfx_hit(True)


def sfx_pop():
    t = tvec(0.5)
    x = marimba(midi(86), 0.5) * 0.8 + marimba(midi(93), 0.5) * 0.3
    x[:200] *= np.linspace(0, 1, 200)
    return A.normalize(A.add_reverb(A.stereo(x), wet=0.2, rt60=0.9), -4)


def sfx_drop():
    t = tvec(3.0)
    f = 36 + 110 * np.exp(-t / 0.07)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.0)
    crash = A.fft_filter(RNG.standard_normal(len(t)), lambda x: A.hp(x, 3500)) * np.exp(-t / 0.9) * 0.3
    chord = sum(pluck(midi(m), 3.0, 0.9, 0.998) for m in (62, 66, 69, 74, 78)) * 0.15
    m = A.soft_clip(sub + crash + chord, 1.6)
    return A.normalize(A.add_reverb(A.stereo(m), wet=0.35, rt60=2.4, seed=7), -1)


def sfx_signature():
    at = [s for s in TL["sfx"] if s["id"] == "signature"][0]["at"]
    dur = (TOTAL - at) / FPS
    x = np.zeros(int(dur * SR))
    for k, m in enumerate([62, 66, 69, 74, 78, 81]):
        A.place(x, pluck(midi(m), dur, 0.85, 0.998) * 0.3, k * 0.055)
    A.place(x, marimba(midi(86), 1.0) * 0.4, 0.33)
    t = tvec(dur)
    kf = 45 + 90 * np.exp(-t / 0.03)
    A.place(x, np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-t / 0.4) * 0.6, 0.33)
    st = A.add_reverb(A.stereo(x), wet=0.35, rt60=2.2, seed=19)
    fade = int(0.3 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    return A.normalize(st, -1)


# ---------------------------------------------------------------- MUSIQUE
CH = {
    "D": ([62, 66, 69], 38),
    "A": ([61, 64, 69], 33),
    "Bm": ([62, 66, 71], 35),
    "G": ([62, 67, 71], 31),
}
PROG = ["D", "A", "Bm", "G"]


def sec(fs):
    if fs < 150:
        return "intro"
    if fs < 300:
        return "build"
    if fs < 475:
        return "groove"
    if fs < 625:
        return "break"
    if fs < 825:
        return "drop"
    return "final"


def build_music():
    n = int(TOTAL / FPS * SR)
    frames = np.arange(n) / SR * FPS
    strings = np.zeros((n, 2))
    mar = np.zeros((n, 2))
    pad = np.zeros((n, 2))
    bass = np.zeros(n)
    drums = np.zeros((n, 2))

    def kick(lv):
        t = tvec(0.45)
        f = 48 + 130 * np.exp(-t / 0.03)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22) * lv

    def clap(lv):
        t = tvec(0.35)
        x = A.fft_filter(RNG.standard_normal(len(t)), lambda f: A.bp(f, 1700, 0.9))
        env = np.exp(-t / 0.012) + np.exp(-np.maximum(t - 0.01, 0) / 0.012) * (t > 0.01) + np.exp(-t / 0.11) * 0.5
        return x * env * lv

    def shaker(lv):
        t = tvec(0.09)
        return A.fft_filter(RNG.standard_normal(len(t)), lambda f: A.hp(f, 6000, 2)) * np.exp(-t / 0.025) * lv

    # cordes pincées : motif en croches
    pattern = [0, 1, 2, 1, 0, 2, 1, 2]
    for fs in range(0, TOTAL, 6):
        s = sec(fs)
        if s == "break" and fs not in range(480, 625, 24):
            continue
        b = fs // BAR
        notes, _ = CH[PROG[b % 4]]
        step = (fs // 6) % 8
        m = notes[pattern[step]] + (12 if s in ("drop", "final") and step % 4 == 3 else 0)
        lv = {"intro": 0.35, "build": 0.5, "groove": 0.55, "break": 0.5, "drop": 0.6, "final": 0.6}[s]
        if s == "intro" and step % 2:
            continue
        A.place(strings, A.stereo(pluck(midi(m), 0.9, 0.7) * lv * 0.22, np.sin(fs * 0.4) * 0.5), fr(fs))

    # marimba : réponses syncopées (groove, drop, final)
    for fs in range(300, TOTAL, BAR):
        if 475 <= fs < 625:
            continue
        notes, _ = CH[PROG[(fs // BAR) % 4]]
        for off, k in ((18, 2), (30, 1), (42, 0)):
            A.place(mar, A.stereo(marimba(midi(notes[k] + 12)) * 0.12, 0.4 - k * 0.3), fr(fs + off))

    # pad
    for b in range(TOTAL // BAR + 1):
        fs = b * BAR
        if fs >= TOTAL:
            break
        s = sec(fs)
        notes, _ = CH[PROG[b % 4]]
        t = tvec(fr(BAR) + 0.6)
        cut = {"intro": 900, "build": 1500, "groove": 2000, "break": 2600, "drop": 3000, "final": 3200}[s]
        lvl = {"intro": 0.7, "build": 0.6, "groove": 0.45, "break": 0.8, "drop": 0.55, "final": 0.6}[s]
        env = A.adsr(len(t), 0.15, 0.3, 0.8, 0.6, fr(BAR))
        for m in notes:
            for d, p in ((-0.1, -0.7), (0.1, 0.7)):
                v = A.saw_additive(midi(m - 12) * 2 ** (d / 12), t, cut, kmax=40)
                A.place(pad, A.stereo(v * env * lvl * 0.04, p), fr(fs))

    # rythmique
    kicks = []
    for fs in range(0, TOTAL, BEAT):
        s = sec(fs)
        beat = (fs // BEAT) % 4
        if s == "build" and fs >= 192:
            kicks.append((fs, 0.7))
        elif s in ("groove", "drop", "final") and not (fs >= 984):
            kicks.append((fs, 0.9 if s != "groove" else 0.8))
        elif s == "break" and fs in (480, 528, 576):
            kicks.append((fs, 0.9))
        if s in ("groove", "drop", "final") and beat in (1, 3):
            A.place(drums, A.stereo(clap(0.35)), fr(fs))
        if s in ("build", "groove", "drop", "final"):
            for o in (0, 6):
                A.place(drums, A.stereo(shaker(0.12 if o else 0.07), 0.3), fr(fs + o + 3))
        # basse
        if s in ("groove", "drop", "final") or (s == "build" and fs >= 240):
            _, root = CH[PROG[(fs // BAR) % 4]]
            t = tvec(0.36)
            f0 = midi(root + 12)
            v = A.saw_additive(f0, t, 500 + 900 * np.exp(-t / 0.08), kmax=25) + 0.8 * np.sin(2 * np.pi * f0 * t)
            A.place(bass, v * A.adsr(len(t), 0.005, 0.08, 0.7, 0.08, 0.3) * 0.3, fr(fs + 6))

    sc = np.ones(n)
    for fs, lv in kicks:
        A.place(drums, A.stereo(kick(lv) * 0.85), fr(fs))
        i = int(fr(fs) * SR)
        j = min(n, i + int(0.3 * SR))
        sc[i:j] = np.minimum(sc[i:j], 1 - 0.5 * lv * np.exp(-np.arange(j - i) / SR / 0.1))

    music = A.add_reverb((strings + mar + pad) * sc[:, None], wet=0.28, rt60=2.0, seed=33)
    mix = music + A.stereo(bass * sc) + A.add_reverb(drums, wet=0.1, rt60=1.0, seed=34)
    gate = np.interp(frames, [0, 614, 620, 625, 626, 1000], [1, 1, 0.2, 0.2, 1, 1])
    mix *= gate[:, None]
    fade = np.interp(frames, [0, 978, 1000], [1, 1, 0]) ** 1.5
    mix *= fade[:, None]
    mix = A.soft_clip(A.normalize(mix, -1.5) * 1.15, 1.2)
    return A.normalize(mix, -1.0)


def main():
    os.makedirs(SFXD, exist_ok=True)
    sfx = {
        "arc": sfx_arc,
        "soft_hit": sfx_soft_hit,
        "big_hit": sfx_big_hit,
        "whoosh": lambda: A.sfx_whoosh(1.1, 0.5, 250, 4200, 1500),
        "ping": lambda: A.sfx_ping(midi(86)),
        "ping_high": lambda: A.sfx_ping(midi(90)),
        "pop": sfx_pop,
        "riser": lambda: A.sfx_riser(fr(252 - 228)),
        "riser_long": lambda: A.sfx_riser(fr(626 - 578)),
        "drop": sfx_drop,
        "shimmer": A.sfx_shimmer,
        "signature": sfx_signature,
    }
    for name, fn in sfx.items():
        A.write_wav(os.path.join(SFXD, f"{name}.wav"), fn())
        print("sfx", name)
    m = build_music()
    A.write_wav(os.path.join(OUT, "music.wav"), m)
    print("music.wav", len(m) / SR)


if __name__ == "__main__":
    main()
