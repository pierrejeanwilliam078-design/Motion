#!/usr/bin/env python3
"""
Génère la musique et les effets sonores de la publicité Miarina Media.

Tout est synthétisé ici (numpy uniquement) : aucun échantillon externe,
donc aucune question de droits. Les fichiers produits sont des pistes de
remplacement de qualité correcte ; une musique sous licence peut les
remplacer à tout moment (voir README, section « Remplacer l'audio »).

Usage :
    python3 scripts/generate-audio.py

Sorties :
    public/audio/musique.wav
    public/audio/sfx/{clic,whoosh,pop,succes,impact}.wav

La structure de la musique suit la timeline (src/data/timeline.json) :
    - intro filtrée pendant le hook ;
    - groove complet dès la révélation ;
    - coupure + montée (« ralentir la musique ») avant « GRATUIT » ;
    - drop sur le mot « gratuit » ;
    - outro douce sur l'end card, fondu final à 55 s.
"""

import json
import os
import wave

import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio")
TIMELINE = os.path.join(ROOT, "src", "data", "timeline.json")

rng = np.random.default_rng(7)


# ---------------------------------------------------------------- utilitaires

def write_wav(path, data):
    """Écrit un wav 16 bits ; data est mono (N,) ou stéréo (N, 2)."""
    data = np.asarray(data, dtype=np.float64)
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    peak = np.max(np.abs(data))
    if peak > 0.98:
        data = data * (0.98 / peak)
    pcm = (data * 32767).astype("<i2")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def one_pole_lp(x, cutoff):
    """Passe-bas un pôle, coefficient fixe (vectorisé par filtrage récursif)."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    # Boucle Python : utilisée seulement sur des signaux courts (SFX).
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def fft_convolve(x, ir):
    n = len(x) + len(ir) - 1
    size = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)
    return y[: len(x)]


def reverb_ir(dur=1.6, decay=3.2, seed=1):
    r = np.random.default_rng(seed)
    t = t_axis(dur)
    ir = r.standard_normal(len(t)) * np.exp(-decay * t)
    # assombrit la queue : moyenne glissante croissante
    ir = np.convolve(ir, np.ones(6) / 6, mode="same")
    ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


def place(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def additive(freq, dur, harmonics=10, bright=1.0, detune_cents=0.0):
    """Onde en dents de scie à bande limitée (synthèse additive)."""
    t = t_axis(dur)
    f = freq * 2 ** (detune_cents / 1200)
    out = np.zeros_like(t)
    for h in range(1, harmonics + 1):
        if f * h > SR / 2.2:
            break
        out += np.sin(2 * np.pi * f * h * t + h * 0.3) / h * np.exp(-(h - 1) * (1.1 - bright) * 0.6)
    return out


# ---------------------------------------------------------------- instruments

def kick(level=1.0):
    t = t_axis(0.45)
    f = 48 + 110 * np.exp(-t * 28)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-t * 7.5)
    click = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.25
    return (body + click) * level


def hat(level=1.0, open_=False):
    t = t_axis(0.25 if open_ else 0.07)
    n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)  # passe-haut grossier
    n = np.diff(n, prepend=0)
    env = np.exp(-t * (22 if open_ else 75))
    return n * env * 0.12 * level


def clap(level=1.0):
    t = t_axis(0.25)
    n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)
    env = np.zeros_like(t)
    for k, off in enumerate((0.0, 0.011, 0.022)):
        env += np.where(t >= off, np.exp(-(t - off) * (180 if k < 2 else 26)), 0)
    return n * env * 0.16 * level


def pluck(freq, dur=0.32, level=1.0):
    t = t_axis(dur)
    sig = (np.sin(2 * np.pi * freq * t)
           + 0.45 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 18)
           + 0.20 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t * 30))
    env = (1 - np.exp(-t * 900)) * np.exp(-t * 9)
    return sig * env * 0.16 * level


def pad_chord(notes, dur, level=1.0):
    out = np.zeros(int(dur * SR))
    for n in notes:
        for d in (-9, 0, 8):
            out += additive(midi(n), dur, harmonics=9, bright=0.55, detune_cents=d)
    t = t_axis(dur)
    env = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.35)
    return out * env * 0.020 * level


def sub(freq, dur, level=1.0):
    t = t_axis(dur)
    env = (1 - np.exp(-t * 300)) * np.exp(-t * 4.5)
    return (np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(4 * np.pi * freq * t)) * env * 0.33 * level


# ---------------------------------------------------------------- effets sonores

def sfx_click():
    t = t_axis(0.06)
    s = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 160) * 0.5
    s += rng.standard_normal(len(t)) * np.exp(-t * 600) * 0.25
    return s * 0.8


def sfx_pop():
    t = t_axis(0.18)
    f = 380 + 520 * np.exp(-t * 40)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26)
    return s * 0.55


def sfx_whoosh():
    dur = 0.7
    t = t_axis(dur)
    n = rng.standard_normal(len(t))
    # balayage de filtre : mélange de deux passe-bas selon le temps
    lo = one_pole_lp(n, 600)
    hi = n - one_pole_lp(n, 2500)
    x = t / dur
    sweep = np.sin(np.pi * x) ** 2
    s = (lo * (1 - x) + hi * x * 0.6) * sweep
    left = s * (1 - 0.5 * x)
    right = s * (0.5 + 0.5 * x)
    st = np.stack([left, right], axis=1)
    return st / np.max(np.abs(st)) * 0.45


def sfx_success():
    """Notification « téléchargement terminé » : arpège majeur cristallin."""
    out = np.zeros(int(0.9 * SR))
    for k, n in enumerate((79, 83, 86, 91)):  # G5 B5 D6 G6
        t = t_axis(0.9 - k * 0.07)
        f = midi(n)
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 8))
        s *= (1 - np.exp(-t * 600)) * np.exp(-t * 5.5)
        place(out, s * 0.22, k * 0.07)
    wet = fft_convolve(out, reverb_ir(0.8, 6))
    return out + wet * 0.18


def sfx_impact():
    dur = 2.6
    t = t_axis(dur)
    f = 32 + 90 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    n = rng.standard_normal(len(t))
    crash = (n - one_pole_lp(n, 3000)) * np.exp(-t * 2.8) * 0.22
    body = one_pole_lp(n, 400) * np.exp(-t * 7) * 0.9
    s = boom * 0.9 + crash + body
    wet = fft_convolve(s, reverb_ir(2.0, 2.4, seed=3))
    s = s + wet * 0.35
    left = s + np.roll(crash, 300) * 0.3
    right = s + np.roll(crash, -300) * 0.3
    return np.stack([left, right], axis=1) * 0.7


# ---------------------------------------------------------------- musique

def build_music(tl):
    total = tl["durationInFrames"] / tl["fps"]
    marks = tl["music"]
    t_drums_in = marks["drumsIn"]
    t_break = marks["breakdown"]
    t_drop = marks["drop"]
    t_outro = marks["outro"]

    beat = 60 / marks["bpm"]
    bar = beat * 4
    # Grille calée pour qu'un premier temps tombe exactement sur le drop.
    origin = t_drop - np.ceil(t_drop / bar) * bar

    n = int(total * SR) + SR
    drums = np.zeros(n)
    bass = np.zeros(n)
    pads = np.zeros(n)
    arp = np.zeros(n)
    riser = np.zeros(n)

    # I – V – vi – IV en do majeur : lumineux, « tech positive »
    prog = [
        (48, [60, 64, 67, 71]),  # Cmaj7
        (43, [59, 62, 67, 74]),  # G
        (45, [57, 60, 64, 69]),  # Am
        (41, [57, 60, 65, 72]),  # Fadd9
    ]
    arp_pattern = [0, 1, 2, 3, 2, 1, 3, 2]

    def chord_at(time):
        k = int(np.floor((time - origin) / bar)) % 4
        return prog[k]

    def in_groove(time):
        return (t_drums_in <= time < t_break) or (t_drop <= time < t_outro)

    k_start = int(np.floor((0 - origin) / bar))
    k_end = int(np.ceil((total - origin) / bar))
    for kb in range(k_start, k_end + 1):
        b0 = origin + kb * bar
        root, notes = chord_at(b0 + 0.01)
        if b0 + bar <= 0 or b0 >= total:
            continue

        # Pads : continus, sauf brièvement au drop (respiration)
        if b0 >= -bar:
            lvl = 1.0
            if t_break <= b0 < t_drop:
                lvl = 0.8
            place(pads, pad_chord(notes, bar + 0.4, lvl), max(0, b0))

        for s16 in range(16):
            ts = b0 + s16 * beat / 4
            if ts < 0 or ts >= total:
                continue
            on_beat = s16 % 4 == 0
            groove = in_groove(ts)

            # Arpège en doubles croches (intro : filtré et plus doux)
            if s16 % 2 == 0 or groove:
                note = notes[arp_pattern[s16 % 8]] + (12 if s16 % 8 >= 4 else 0)
                if ts < t_drums_in:
                    lvl = 0.45 + 0.35 * (ts / max(t_drums_in, 0.1))
                elif t_break <= ts < t_drop:
                    lvl = 0.35
                elif ts >= t_outro:
                    lvl = 0.55 * max(0.0, 1 - (ts - t_outro) / (total - t_outro))
                else:
                    lvl = 0.75
                place(arp, pluck(midi(note), 0.3, lvl), ts)

            if not groove:
                continue
            beat_idx = s16 // 4
            if on_beat:
                place(drums, kick(0.95), ts)
            if s16 % 4 == 2:
                place(drums, hat(1.0, open_=(beat_idx == 3)), ts)
            elif s16 % 2 == 1:
                place(drums, hat(0.45), ts)
            if on_beat and beat_idx in (1, 3):
                place(drums, clap(0.9), ts)
            # Basse : croches sur la fondamentale, accent hors temps
            if s16 % 2 == 0:
                place(bass, sub(midi(root), beat / 2 + 0.05, 1.0 if s16 % 4 == 2 else 0.7), ts)

    # Montée (riser) pendant la coupure
    rlen = t_drop - t_break
    t = t_axis(rlen)
    noise = rng.standard_normal(len(t))
    noise = noise - np.convolve(noise, np.ones(8) / 8, mode="same")
    x = t / rlen
    sweep_f = 220 * 2 ** (x * 2.5)
    tone = np.sin(2 * np.pi * np.cumsum(sweep_f) / SR) * 0.06
    place(riser, (noise * 0.10 + tone) * x ** 2.2, t_break)

    # Sidechain : les pads et la basse « respirent » sur chaque kick
    duck = np.ones(n)
    tt = np.arange(n) / SR
    for kb in range(k_start, k_end + 1):
        for bt in range(4):
            tb = origin + kb * bar + bt * beat
            if tb < 0 or tb >= total or not in_groove(tb):
                continue
            i = int(tb * SR)
            seg = tt[i:i + int(beat * SR)] - tb
            duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.55 * np.exp(-seg * 9))

    # Filtrage « intro » : on adoucit l'arpège avant l'entrée des drums
    mix_mono_pad = pads * duck
    bass = bass * duck

    left = drums * 0.9 + bass + mix_mono_pad * 1.0 + arp * 0.85 + riser
    right = drums * 0.9 + bass + mix_mono_pad * 0.95 + np.roll(arp, int(0.012 * SR)) * 0.85 + riser

    # Réverbe d'ambiance sur pads + arpège
    ir = reverb_ir(1.8, 2.6, seed=11)
    wet_src = mix_mono_pad + arp * 0.8
    wet = fft_convolve(wet_src, ir) * 0.22
    left += wet
    right += np.roll(wet, int(0.017 * SR))

    st = np.stack([left, right], axis=1)[: int(total * SR)]

    # Fondu d'entrée bref et fondu de sortie final
    tt = np.arange(len(st)) / SR
    fade_in = np.minimum(1, tt / 0.08)
    fade_out = np.clip((total - tt) / marks["fadeOut"], 0, 1) ** 1.5
    st *= (fade_in * fade_out)[:, None]

    # Normalisation douce à -3 dBFS crête : le niveau final se règle dans Remotion
    st = np.tanh(st / np.max(np.abs(st)) * 1.2) / np.tanh(1.2)
    return st * 0.70


def main():
    with open(TIMELINE, encoding="utf-8") as f:
        tl = json.load(f)
    write_wav(os.path.join(OUT, "musique.wav"), build_music(tl))
    sfx = {
        "clic": sfx_click(),
        "pop": sfx_pop(),
        "whoosh": sfx_whoosh(),
        "succes": sfx_success(),
        "impact": sfx_impact(),
    }
    for name, sig in sfx.items():
        write_wav(os.path.join(OUT, "sfx", f"{name}.wav"), sig)
    print("Audio généré dans", OUT)


if __name__ == "__main__":
    main()
