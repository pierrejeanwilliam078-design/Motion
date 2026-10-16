"""
Génère la bande-son originale de la publicité (aucun échantillon externe,
donc aucun problème de droits) :
  - public/audio/musique-tropical-house.mp3 : tropical house 104 BPM, 35 s,
    montée (build-up) vers l'appel à l'action à 29 s.
  - public/audio/sfx/*.wav : déclic d'appareil photo, whoosh, impact,
    pop, scintillement, ambiance de vagues.
  - public/audio/voix-off.mp3 : voix off normalisée (-15 LUFS).

Usage : python3 scripts/make_audio.py   (nécessite numpy et ffmpeg)
"""
import os
import subprocess
import wave

import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, "public", "audio")
SFX = os.path.join(AUDIO, "sfx")
TMP = os.path.join(ROOT, "out", "audio-tmp")
DURATION = 35.0
BPM = 104
BEAT = 60 / BPM
DROP = 29.0  # appel à l'action
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def lowpass(x, cutoff):
    """Filtre passe-bas 1 pôle (cutoff scalaire ou tableau)."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def write_wav(path, data):
    data = np.asarray(data)
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    peak = np.max(np.abs(data)) or 1
    data = data / peak * 0.89
    pcm = (data * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def note(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# --------------------------------------------------------------------------
# Instruments
# --------------------------------------------------------------------------
def kick():
    t = t_axis(0.45)
    f = 45 + 85 * np.exp(-t * 28)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-t * 7)
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.25
    return body + click


def clap():
    t = t_axis(0.3)
    n = highpass(rng.standard_normal(len(t)), 900)
    env = np.zeros_like(t)
    for d in (0, 0.011, 0.022):
        env += np.where(t >= d, np.exp(-(t - d) * 60), 0)
    env += np.exp(-t * 18) * 0.4
    return n * env * 0.5


def hat(open_=False):
    t = t_axis(0.25 if open_ else 0.07)
    n = highpass(highpass(rng.standard_normal(len(t)), 6000), 6000)
    return n * np.exp(-t * (14 if open_ else 70)) * 0.2


def shaker():
    t = t_axis(0.09)
    n = highpass(rng.standard_normal(len(t)), 4500)
    env = np.sin(np.pi * np.clip(t / 0.09, 0, 1)) ** 2
    return n * env * 0.05


def marimba(freq, dur=0.45):
    """Pluck boisé / steel-drum léger (synthèse FM)."""
    t = t_axis(dur)
    mod = np.sin(2 * np.pi * freq * 3.5 * t) * 1.6 * np.exp(-t * 30)
    car = np.sin(2 * np.pi * freq * t + mod)
    car += 0.35 * np.sin(2 * np.pi * freq * 4.0 * t) * np.exp(-t * 25)
    return car * np.exp(-t * 7.5) * (1 - np.exp(-t * 900))


def pad_chord(freqs, dur):
    t = t_axis(dur)
    out = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.13):
            ff = f * 2 ** (det / 12)
            # dent de scie douce (somme d'harmoniques)
            for h in range(1, 7):
                out += np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6)) / h
    att = np.clip(t / 0.35, 0, 1)
    rel = np.clip((dur - t) / 0.4, 0, 1)
    return out * att * rel / (len(freqs) * 9)


def bass(freq, dur):
    t = t_axis(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)
    return s * np.clip(t / 0.01, 0, 1) * np.clip((dur - t) / 0.05, 0, 1)


def place(track, sound, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(sound))
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    track[i:j, 0] += sound[: j - i] * gain * l * 1.41
    track[i:j, 1] += sound[: j - i] * gain * r * 1.41


# --------------------------------------------------------------------------
# Musique
# --------------------------------------------------------------------------
def make_music():
    n = int(DURATION * SR)
    drums = np.zeros((n, 2))
    music = np.zeros((n, 2))
    sub = np.zeros((n, 2))

    # Progression vi - IV - I - V en La majeur : F#m  D  A  E
    prog = [
        (42, [66, 69, 73]),  # F#m
        (38, [66, 69, 74]),  # D
        (45, [64, 69, 73]),  # A
        (40, [64, 68, 71]),  # E
    ]
    bar = BEAT * 4
    n_bars = int(np.ceil(DURATION / bar)) + 1

    # motif de pluck (en 1/8, indices dans l'accord, -1 = silence)
    pattern = [0, -1, 1, 2, -1, 1, 2, 1]
    lead = [  # mélodie du drop (notes MIDI par croche, None = silence)
        [78, None, 76, None, 73, None, 76, 78],
        [None, 81, None, 78, 76, None, 74, None],
        [76, None, 73, None, 69, None, 73, 76],
        [None, 76, 78, None, 80, None, 76, None],
    ]

    for b in range(n_bars):
        start = b * bar
        root, chord = prog[b % 4]
        place(music, pad_chord([note(m) for m in chord], bar + 0.3), start, 0.55)

        for k in range(8):
            at = start + k * BEAT / 2
            if at >= DURATION:
                break
            idx = pattern[k]
            if idx >= 0:
                f = note(chord[idx] + 12)
                place(music, marimba(f), at, 0.33, pan=0.35 if k % 2 else -0.35)
            # mélodie à partir du drop
            if at >= DROP - 0.01:
                m = lead[b % 4][k]
                if m is not None:
                    place(music, marimba(note(m), 0.6), at, 0.42)

        for beat in range(4):
            at = start + beat * BEAT
            if at >= DURATION:
                break
            in_intro = at < 4.0
            build = DROP - 2 * bar <= at < DROP
            if not in_intro and not build:
                place(drums, kick(), at, 0.9)
            # basse « sidechain » sur les contretemps
            if at >= 4.0:
                place(sub, bass(note(root), BEAT * 0.45), at + BEAT / 2, 0.55)
            if at >= 8.7 and beat in (1, 3) and not build:
                place(drums, clap(), at, 0.55)
            # contretemps hi-hat
            place(drums, hat(open_=at >= DROP), at + BEAT / 2, 0.8, pan=0.2)
            for s16 in range(4):
                if at >= 2.0:
                    place(drums, shaker(), at + s16 * BEAT / 4, 0.9 if s16 % 2 else 0.5, pan=-0.3)

    # Build-up : roulement de clap qui accélère + riser
    b0 = DROP - 2 * bar
    k = 0
    at = b0
    while at < DROP - 0.02:
        prog_ = (at - b0) / (DROP - b0)
        place(drums, clap(), at, 0.15 + 0.45 * prog_)
        step = BEAT / (2 if prog_ < 0.5 else 4 if prog_ < 0.8 else 8)
        at += step
        k += 1
    rise_t = t_axis(DROP - b0)
    riser = highpass(rng.standard_normal(len(rise_t)), 1500 + 6000 * (rise_t / rise_t[-1]))
    riser *= (rise_t / rise_t[-1]) ** 2 * 0.35
    place(drums, riser, b0)
    # crash au drop
    ct = t_axis(2.5)
    crash = highpass(rng.standard_normal(len(ct)), 5000) * np.exp(-ct * 2.2) * 0.4
    place(drums, crash, DROP)

    # pompage sidechain sur la musique (hors intro)
    tt = np.arange(n) / SR
    phase = (tt % BEAT) / BEAT
    pump = 1 - 0.45 * np.exp(-phase * 9)
    pump = np.where(tt < 4.0, 1.0, pump)
    music *= pump[:, None]
    sub *= pump[:, None]

    mix = drums * 0.8 + music + sub * 0.9
    # fondu d'entrée/sortie
    fade = np.clip(tt / 0.25, 0, 1) * np.clip((DURATION - tt) / 1.6, 0, 1)
    mix *= fade[:, None]
    return mix


# --------------------------------------------------------------------------
# Effets sonores
# --------------------------------------------------------------------------
def sfx_shutter():
    t = t_axis(0.32)
    out = np.zeros_like(t)
    for d, g in ((0.0, 1.0), (0.085, 0.75)):
        tt = t - d
        burst = highpass(rng.standard_normal(len(t)), 2500)
        env = np.where(tt >= 0, np.exp(-np.maximum(tt, 0) * 120), 0)
        tick = np.where(tt >= 0, np.sin(2 * np.pi * 1800 * tt) * np.exp(-np.maximum(tt, 0) * 260), 0)
        out += (burst * 0.6 + tick) * env * g
    return out


def sfx_whoosh(dur=0.7):
    t = t_axis(dur)
    x = t / dur
    noise = rng.standard_normal(len(t))
    cutoff = 300 + 5000 * np.sin(np.pi * x) ** 2
    s = lowpass(noise, cutoff) - lowpass(noise, 150)
    return s * np.sin(np.pi * x) ** 1.5


def sfx_impact():
    t = t_axis(1.4)
    f = 38 + 70 * np.exp(-t * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    air = lowpass(rng.standard_normal(len(t)), 2500) * np.exp(-t * 9) * 0.3
    return boom + air


def sfx_pop():
    t = t_axis(0.18)
    f = 520 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)


def sfx_shimmer():
    t = t_axis(1.6)
    out = np.zeros_like(t)
    for i, m in enumerate([88, 93, 95, 100, 97]):
        d = i * 0.06
        tt = np.maximum(t - d, 0)
        out += np.where(t >= d, np.sin(2 * np.pi * note(m) * tt) * np.exp(-tt * 4.5), 0)
    return out * 0.4


def sfx_waves(dur=9.0):
    t = t_axis(dur)
    brown = np.cumsum(rng.standard_normal(len(t)))
    brown = highpass(brown / np.max(np.abs(brown)), 40)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 4.2 - 1.2) ** 2
    hiss = lowpass(rng.standard_normal(len(t)), 1800) * 0.15 * swell
    fade = np.clip(t / 0.8, 0, 1) * np.clip((dur - t) / 1.5, 0, 1)
    return (brown * 0.7 + hiss) * swell * fade


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    os.makedirs(SFX, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)

    raw = os.path.join(TMP, "music-raw.wav")
    write_wav(raw, make_music())
    # légère réverbération + normalisation, export MP3
    run([
        "ffmpeg", "-y", "-i", raw,
        "-af", "aecho=0.8:0.6:60|120:0.18|0.1,highpass=f=30,loudnorm=I=-16:TP=-1.5:LRA=9",
        "-ar", str(SR), "-b:a", "192k",
        os.path.join(AUDIO, "musique-tropical-house.mp3"),
    ])

    for name, fn in {
        "declic-photo": sfx_shutter,
        "whoosh": sfx_whoosh,
        "impact": sfx_impact,
        "pop": sfx_pop,
        "scintillement": sfx_shimmer,
        "vagues": sfx_waves,
    }.items():
        write_wav(os.path.join(SFX, f"{name}.wav"), fn())

    # Voix off : normalisation à -15 LUFS (l'original est à environ -22 LUFS)
    src = os.path.join(AUDIO, "voix-off-originale.mp3")
    if os.path.exists(src):
        run([
            "ffmpeg", "-y", "-i", src,
            "-af", "loudnorm=I=-15:TP=-1.5:LRA=7",
            "-ar", str(SR), "-b:a", "192k",
            os.path.join(AUDIO, "voix-off.mp3"),
        ])
    print("Audio généré dans", AUDIO)


if __name__ == "__main__":
    main()
