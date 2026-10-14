#!/usr/bin/env python3
"""GSN 2.0 — VERSION 2 « POP KINETIC » : bande sonore ORIGINALE, plus énergique.

150 BPM (1 temps = 10 frames), tonalité de mi mineur, groove « four-on-the-floor »,
basse en contretemps, stabs d'accords, break sur les mots-clés et drop sur la
révélation du salon. Tout est synthétisé (aucun échantillon tiers).

Sorties : public/audio/v2/music.wav et public/audio/v2/sfx/*.wav
Usage   : python3 scripts/build_audio_v2.py
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_audio as A  # noqa: E402  (réutilise oscillateurs, filtres, réverbération)

ROOT = A.ROOT
TL = json.load(open(os.path.join(ROOT, "src", "v2", "timeline.json")))
SR, FPS = A.SR, TL["fps"]
TOTAL_FRAMES = TL["durationInFrames"]
OUT = os.path.join(ROOT, "public", "audio", "v2")
SFX = os.path.join(OUT, "sfx")
RNG = np.random.default_rng(150)
BEAT = 10
BAR = 40
fr = A.fr
tvec = A.tvec
midi = A.midi


# ------------------------------------------------------------------ SFX
def punch():
    t = tvec(0.9)
    f = 55 + 160 * np.exp(-t / 0.025)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    snap = A.fft_filter(RNG.standard_normal(len(t)), lambda x: A.bp(x, 3200, 0.8)) * np.exp(-t / 0.03)
    m = A.soft_clip(body + snap * 0.45, 2.0)
    return A.normalize(A.add_reverb(A.stereo(m), wet=0.15, rt60=0.9), -1)


def impact():
    t = tvec(2.2)
    f = 42 + 140 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5)
    noise = A.fft_filter(RNG.standard_normal(len(t)), lambda x: A.lp(x, 6000) * A.hp(x, 300)) * np.exp(-t / 0.12)
    chord = sum(np.sin(2 * np.pi * midi(m) * t) for m in (52, 59, 64, 67)) * np.exp(-t / 0.35) * 0.08
    m = A.soft_clip(body + noise * 0.5 + chord, 1.8)
    return A.normalize(A.add_reverb(A.stereo(m), wet=0.3, rt60=1.8, bright=7000, seed=12), -1)


def swish():
    return A.sfx_whoosh(0.55, 0.32, 400, 7000, 2500)


def pop():
    t = tvec(0.45)
    f = 380 + 900 * np.exp(-t / 0.018)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06)
    x += np.sin(2 * np.pi * 1600 * t) * np.exp(-t / 0.02) * 0.3
    return A.normalize(A.add_reverb(A.stereo(x), wet=0.2, rt60=0.7), -3)


def stamp():
    t = tvec(1.0)
    f = 60 + 90 * np.exp(-t / 0.02)
    thud = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.1)
    slap = A.fft_filter(RNG.standard_normal(len(t)), lambda x: A.bp(x, 1400, 0.6)) * np.exp(-t / 0.025)
    m = A.soft_clip(thud + slap * 0.8, 2.2)
    return A.normalize(A.add_reverb(A.stereo(m), wet=0.18, rt60=0.8), -1)


def flip():
    """cliquetis mécanique type afficheur à palettes"""
    t = tvec(0.6)
    x = np.zeros_like(t)
    for k in range(6):
        i0 = int(k * 0.045 * SR)
        tt = t[: len(t) - i0]
        click = A.fft_filter(RNG.standard_normal(len(tt)), lambda f: A.bp(f, 2600 + 300 * k, 1.5)) * np.exp(-tt / 0.006)
        x[i0:] += click * (1 - k * 0.1)
    return A.normalize(A.add_reverb(A.stereo(x), wet=0.15, rt60=0.5), -4)


def burst():
    t = tvec(2.6)
    f = 38 + 120 * np.exp(-t / 0.06)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    crash = A.fft_filter(RNG.standard_normal(len(t)), lambda x: A.hp(x, 4000)) * np.exp(-t / 0.7) * 0.35
    stab = sum(A.saw_additive(midi(m), t, 2400 * np.exp(-t / 0.4) + 400, kmax=30) for m in (52, 59, 64, 71)) * np.exp(-t / 0.5) * 0.12
    m = A.soft_clip(sub + crash + stab, 1.7)
    return A.normalize(A.add_reverb(A.stereo(m), wet=0.3, rt60=2.0, seed=31), -1)


def riser():
    return A.sfx_riser(fr(625 - 584))


def signature():
    at = [s for s in TL["sfx"] if s["id"] == "signature"][0]["at"]
    dur = (TOTAL_FRAMES - at) / FPS
    t = tvec(dur)
    x = np.zeros_like(t)
    # arpège ascendant mi mineur → sol majeur, très rapide, puis accord tenu
    for i, m in enumerate([64, 67, 71, 74, 79]):
        i0 = int(i * 0.07 * SR)
        tt = t[: len(t) - i0]
        x[i0:] += A.bell(midi(m), tt, 0.9, 1.0) * 0.4
    i0 = int(0.35 * SR)
    tt = t[: len(t) - i0]
    chord = sum(A.saw_additive(midi(m), tt, 3000, kmax=25) for m in (55, 59, 62, 67)) * np.exp(-tt / 0.6) * 0.1
    x[i0:] += chord
    kf = 45 + 100 * np.exp(-tt / 0.03)
    x[i0:] += np.sin(2 * np.pi * np.cumsum(kf) / SR) * np.exp(-tt / 0.35) * 0.7
    st = A.add_reverb(A.stereo(x), wet=0.35, rt60=2.0, seed=17)
    fade = int(0.3 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    return A.normalize(st, -1)


# ---------------------------------------------------------------- MUSIQUE
CH = {
    "Em": ([52, 59, 64, 67], 40),
    "C": ([48, 55, 64, 67], 36),
    "G": ([55, 59, 62, 67], 43),
    "D": ([50, 57, 62, 66], 38),
}
PROG = ["Em", "C", "G", "D"]


def section(fs):
    if fs < 150:
        return "intro"
    if fs < 475:
        return "groove"
    if fs < 625:
        return "break"
    if fs < 825:
        return "drop"
    return "final"


def build_music():
    n = int(TOTAL_FRAMES / FPS * SR)
    frames_all = np.arange(n) / SR * FPS
    stabs = np.zeros((n, 2))
    bass = np.zeros(n)
    drums = np.zeros((n, 2))
    pad = np.zeros((n, 2))
    arp = np.zeros((n, 2))

    def kick(lv):
        t = tvec(0.4)
        f = 50 + 150 * np.exp(-t / 0.025)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18) * lv

    def hat(lv, open_=False):
        t = tvec(0.22 if open_ else 0.06)
        x = A.fft_filter(RNG.standard_normal(len(t)), lambda f: A.hp(f, 8000, 3)) * np.exp(-t / (0.06 if open_ else 0.014))
        return x * lv

    def clap(lv):
        t = tvec(0.35)
        x = A.fft_filter(RNG.standard_normal(len(t)), lambda f: A.bp(f, 1900, 0.9))
        env = sum(np.concatenate([np.zeros(int(o * SR)), np.exp(-t[: len(t) - int(o * SR)] / 0.01)]) for o in (0, 0.009, 0.018))
        env += np.exp(-t / 0.1) * 0.5
        return x * env * lv

    kicks = []
    for fs in range(0, TOTAL_FRAMES, BEAT):
        sec = section(fs)
        beat_in_bar = (fs // BEAT) % 4
        bar_start = fs - fs % BAR
        chord, root = CH[PROG[(fs // BAR) % 4]]

        # ---- kick
        if sec == "intro" and fs >= 40:
            kicks.append((fs, 0.75))
        elif sec in ("groove", "drop"):
            kicks.append((fs, 0.95 if sec == "drop" else 0.85))
        elif sec == "final" and not (900 <= fs < 936):
            kicks.append((fs, 0.95))
        elif sec == "break" and fs in (480, 520, 560):
            kicks.append((fs, 0.9))

        # ---- hats (contretemps)
        if sec != "break" and fs >= 20 and not (900 <= fs < 936):
            A.place(drums, A.stereo(hat(0.16 if sec in ("drop", "final") else 0.12, open_=True), 0.3), fr(fs + 5))
            if sec in ("groove", "drop", "final"):
                A.place(drums, A.stereo(hat(0.07), -0.3), fr(fs))
        # ---- clap sur 2 et 4
        if beat_in_bar in (1, 3) and sec in ("groove", "drop", "final") and not (900 <= fs < 936):
            A.place(drums, A.stereo(clap(0.4)), fr(fs))

        # ---- basse en contretemps (croche)
        if sec in ("groove", "drop", "final") and not (900 <= fs < 936):
            t = tvec(0.19)
            f0 = midi(root)
            cut = 600 + 2200 * np.exp(-t / 0.05) * (1.4 if sec == "drop" else 1.0)
            v = A.saw_additive(f0, t, cut, kmax=40) + 0.7 * np.sin(2 * np.pi * f0 * t)
            A.place(bass, v * A.adsr(len(t), 0.003, 0.05, 0.8, 0.04, 0.15) * 0.34, fr(fs + 5))
        elif sec == "intro" and fs >= 80:
            t = tvec(0.19)
            f0 = midi(root)
            v = A.saw_additive(f0, t, 500, kmax=20) + 0.7 * np.sin(2 * np.pi * f0 * t)
            A.place(bass, v * A.adsr(len(t), 0.003, 0.05, 0.8, 0.04, 0.15) * 0.22, fr(fs + 5))

        # ---- stabs d'accords (syncopés)
        if fs == bar_start and sec != "break":
            for off, lv in ((0, 1.0), (15, 0.7), (25, 0.8)):
                if sec == "intro" and off:
                    continue
                if 900 <= bar_start + off < 936:
                    continue
                t = tvec(0.28)
                cut = 1200 + (3500 if sec in ("drop", "final") else 2200) * np.exp(-t / 0.07)
                for m in chord:
                    for d, p in ((-0.08, -0.6), (0.08, 0.6)):
                        v = A.saw_additive(midi(m + 12) * 2 ** (d / 12), t, cut, kmax=35) * np.exp(-t / 0.12)
                        A.place(stabs, A.stereo(v * lv * 0.05, p), fr(bar_start + off))

    # ---- pad tenu (intro, break, final)
    for b in range(TOTAL_FRAMES // BAR + 1):
        fs = b * BAR
        if fs >= TOTAL_FRAMES:
            break
        sec = section(fs)
        chord, _ = CH[PROG[b % 4]]
        lvl = {"intro": 0.6, "groove": 0.35, "break": 0.8, "drop": 0.5, "final": 0.5}[sec]
        t = tvec(fr(BAR) + 0.5)
        cut = {"intro": 900, "groove": 1800, "break": 2600, "drop": 3200, "final": 3000}[sec]
        env = A.adsr(len(t), 0.08, 0.2, 0.8, 0.5, fr(BAR))
        for m in chord:
            for d, p in ((-0.1, -0.7), (0.1, 0.7)):
                v = A.saw_additive(midi(m) * 2 ** (d / 12), t, cut, kmax=40)
                A.place(pad, A.stereo(v * env * lvl * 0.045, p), fr(fs))

    # ---- arpège en doubles-croches (groove + drop)
    for fs in range(300, 825, 5):
        if 475 <= fs < 625:
            continue
        chord, _ = CH[PROG[(fs // BAR) % 4]]
        step = (fs // 5) % 8
        m = chord[[0, 1, 2, 3, 2, 1, 3, 2][step]] + 12
        t = tvec(0.2)
        v = A.saw_additive(midi(m), t, 1200 + 3000 * np.exp(-t / 0.03), kmax=30) * np.exp(-t / 0.08)
        A.place(arp, A.stereo(v * (0.1 if fs < 625 else 0.13), np.sin(fs * 0.5) * 0.7), fr(fs))

    # ---- sidechain
    sc = np.ones(n)
    for fs, lv in kicks:
        i = int(fr(fs) * SR)
        L = int(0.3 * SR)
        j = min(n, i + L)
        sc[i:j] = np.minimum(sc[i:j], 1 - 0.65 * lv * np.exp(-np.arange(j - i) / SR / 0.09))
    for fs, lv in kicks:
        A.place(drums, A.stereo(kick(lv) * 0.9), fr(fs))

    # ---- montée filtrée avant le drop (bruit)
    t = tvec(fr(625 - 575))
    noise = A.stft_filter(RNG.standard_normal(len(t)), lambda f, tc: A.bp(f, 500 * (10000 / 500) ** min(tc / fr(50), 1), 0.9))
    up = A.stereo(noise * (t / t[-1]) ** 2 * 0.25)
    rise = np.zeros((n, 2))
    A.place(rise, up, fr(575))

    music = (pad + stabs + arp) * sc[:, None]
    music = A.add_reverb(music, wet=0.25, rt60=1.6, seed=41)
    mix = music + A.stereo(bass * sc) + A.add_reverb(drums, wet=0.08, rt60=0.9, seed=42) + rise
    # silence de tension juste avant le drop
    gate = np.interp(frames_all, [0, 612, 618, 624, 625, 1000], [1, 1, 0.15, 0.15, 1, 1])
    mix *= gate[:, None]
    fade = np.interp(frames_all, [0, 980, 1000], [1, 1, 0]) ** 1.5
    mix *= fade[:, None]
    mix = A.soft_clip(A.normalize(mix, -1.5) * 1.2, 1.3)
    return A.normalize(mix, -1.0)


def main():
    os.makedirs(SFX, exist_ok=True)
    for name, fn in {
        "punch": punch, "impact": impact, "swish": swish, "pop": pop, "stamp": stamp,
        "flip": flip, "burst": burst, "riser": riser, "signature": signature,
    }.items():
        A.write_wav(os.path.join(SFX, f"{name}.wav"), fn())
        print("sfx", name)
    m = build_music()
    A.write_wav(os.path.join(OUT, "music.wav"), m)
    print("music.wav", len(m) / SR)


if __name__ == "__main__":
    main()
