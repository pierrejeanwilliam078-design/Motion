"""Temporary 128 BPM music bed + separate SFX track for the Tiavina Nomena ad.

Run from the project root:
  python3 -I tools/make_audio.py <bundled_sfx_dir>
Writes assets/audio/music-temp.wav and assets/audio/sfx.wav (48 kHz stereo).
The music is a placeholder: replace assets/audio/music.wav with the client track.
"""
import os
import subprocess
import sys
import wave

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from synth_lib import (BAR, BEAT, BARS, N, SR, bass_note, clap, hat, hp, kick, lp_smooth,  # noqa: E402
                       pad_chord, place, pluck, rng, sub_boom, sweep, tvec)
import numpy as np  # noqa: E402

sfx_dir = sys.argv[1]
CHORDS = [([57, 60, 64, 69], 45), ([53, 57, 60, 65], 41), ([55, 60, 64, 67], 48), ([55, 59, 62, 67], 43)]
SILENCE = (22.75, 22.97)   # half-beat of total silence before IMPACT


def section(b):
    if b < 2:
        return "intro"
    if b < 4:
        return "build"
    if b < 11:
        return "drive"
    if b < 13:
        return "peak"
    if b < 14:
        return "release"
    return "final"


def write(path, mix):
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", path)


# ---------------------------------------------------------------- music
drums, bass, pads, leads, fx = (np.zeros((N, 2)) for _ in range(5))
duck = np.ones(N)
for b in range(BARS):
    sec = section(b)
    t0 = b * BAR
    notes, root = CHORDS[b % 4]
    last = b == BARS - 1
    pg = {"intro": 0.8, "build": 0.9, "drive": 1.0, "peak": 1.05, "release": 1.2, "final": 1.1}[sec]
    place(pads, pad_chord([57, 60, 64, 69, 72] if b >= 15 else notes, BAR + 0.05, nh=4 if sec in ("intro", "release") else 7), t0, pg)
    for beat in range(4):
        tb = t0 + beat * BEAT
        four = sec in ("drive", "peak", "final") and not (b >= 15)
        if b == 14 and beat == 0:
            four = True
        if four:
            place(drums, kick(), tb, 0.95)
            i = int(tb * SR)
            tt = np.arange(min(int(0.3 * SR), N - i)) / SR
            duck[i:i + len(tt)] = np.minimum(duck[i:i + len(tt)], 1 - 0.55 * np.exp(-tt / 0.09))
            if beat in (1, 3):
                place(drums, clap(), tb, 1.0)
            place(drums, hat(open_=(sec == "peak" and beat % 2 == 1)), tb + BEAT / 2, 1.0, pan=0.25)
            if sec == "peak":
                place(drums, hat(), tb + BEAT / 4, 0.5, pan=-0.25)
                place(drums, hat(), tb + 3 * BEAT / 4, 0.5, pan=-0.25)
            place(bass, bass_note(root, 0.22), tb + BEAT / 2, 1.0)
        if sec == "build" and beat in (0, 2):
            place(drums, kick(0.5), tb, 1.0)
    if b == 3:
        for k, s16 in enumerate([0, 2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15]):
            place(drums, clap(), t0 + s16 * BEAT / 4, 0.25 + 0.6 * k / 12)
    tones = [n + 12 for n in notes]
    pat = {"intro": [0, None, None, 2, None, None, 1, None, None, None, 3, None, None, None, None, None],
           "build": [0, None, 2, None, 1, None, 3, None] * 2,
           "drive": [0, 2, 1, 3, None, 2, 1, None, 0, 2, 3, 1, None, 2, 1, None],
           "peak": [0, 2, 1, 3, 0, 2, 3, 1, 0, 2, 1, 3, 2, 1, 3, 2],
           "release": [0, None, None, None, 2, None, None, None, 1, None, None, None, 3, None, None, None],
           "final": [0, None, 2, None, 1, None, 3, None] * 2}[sec]
    if b >= 15:
        pat = [0, 1, 2, 3] + [None] * 12
    for s16, idx in enumerate(pat):
        if idx is not None:
            place(leads, pluck(tones[idx], 0.45, 2 if sec in ("intro", "release") else 4), t0 + s16 * BEAT / 4, 1.0,
                  pan=-0.35 if s16 % 2 == 0 else 0.35)

place(fx, sweep(2 * BAR, 250, 4200, 0.2), 2 * BAR, 1.0)       # build -> drop at 7.5 s
place(fx, sweep(BAR, 300, 3600, 0.16), 10 * BAR, 1.0)          # into the peak at 20.625 s
for t in (0.0, 4 * BAR, 22.97, 15 * BAR):
    place(fx, sub_boom(0.9), t, 1.0)
pads *= duck[:, None]
bass *= duck[:, None]


def space(x, taps):
    y = x.copy()
    for ms, g, side in taps:
        d = int(ms * SR / 1000)
        sh = np.zeros_like(x)
        sh[d:] = x[:-d]
        y += (sh[:, ::-1] if side else sh) * g
    return y


leads = space(leads, [(117, 0.32, True), (234, 0.22, False), (351, 0.14, True), (468, 0.09, False)])
pads = space(pads, [(43, 0.25, True), (89, 0.2, False), (137, 0.15, True), (211, 0.1, False)])
music = drums * 0.9 + bass + pads + leads * 0.85 + fx

# half-beat of silence before IMPACT, then the bed resumes on the hit
a, b2 = int(SILENCE[0] * SR), int(SILENCE[1] * SR)
music[a - 240:a] *= np.linspace(1, 0, 240)[:, None]
music[a:b2] = 0
# final impact at 28.125 s then a short reverb tail to 30 s
tail0 = int(15 * BAR * SR) + int(0.6 * SR)
env = np.ones(N)
env[tail0:] = np.exp(-np.arange(N - tail0) / (0.55 * SR))
music *= env[:, None]
music /= np.max(np.abs(music)) + 1e-9
music = np.tanh(music * 1.5) / np.tanh(1.5) * 0.85
write("assets/audio/music-temp.wav", music)


# ---------------------------------------------------------------- sfx
def load(name):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{sfx_dir}/{name}.mp3", "-f", "f32le", "-ac", "2",
                          "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


cache = {}


def S(n):
    if n not in cache:
        cache[n] = load(n)
    return cache[n]


def zap(d, f0, f1, level):
    """Electric sweep: fast pitch glide with band-limited noise."""
    t = tvec(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    n = hp(lp_smooth(rng.standard_normal(len(t)), 4), 1)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6
    return (np.sin(ph) * 0.6 + np.sign(np.sin(ph)) * 0.15 + n * 0.5) * env * level


sfx = np.zeros((N, 2))
CUES = [
    (0.00, "impact-bass-1", 0.55), (3.50, "whoosh", 0.35), (3.75, "whoosh-cinematic", 0.22),
    (0.94, "impact-bass-2", 0.30), (7.03, "whoosh-short", 0.30), (7.50, "impact-bass-2", 0.50),
    (7.97, "impact-bass-1", 0.38), (10.90, "whoosh-short", 0.35), (11.25, "click", 0.40), (11.25, "impact-bass-2", 0.28),
    (12.656, "whoosh-short", 0.38), (12.656, "impact-bass-1", 0.25), (13.594, "click", 0.40), (13.594, "impact-bass-2", 0.28),
    (14.77, "whoosh-short", 0.30), (15.00, "impact-bass-1", 0.35), (16.875, "glitch-1", 0.10), (16.875, "whoosh-short", 0.30),
    (18.75, "glitch-2", 0.10), (18.75, "whoosh-short", 0.30), (20.40, "whoosh", 0.35), (20.625, "impact-bass-2", 0.40),
    (21.5625, "impact-bass-2", 0.40), (22.97, "impact-bass-1", 0.70), (24.375, "whoosh-cinematic", 0.18),
    (28.125, "impact-bass-1", 0.55), (28.125, "sparkle", 0.20),
]
for t, n, g in CUES:
    place(sfx, S(n), t, g)
place(sfx, zap(0.38, 900, 5200, 0.28), 0.0, 1.0)            # light band
for t in (4.6875, 6.5625):                                     # claps on VISION
    place(sfx, clap(), t, 1.4)
sfx[int(SILENCE[0] * SR):int(SILENCE[1] * SR)] = 0
sfx /= max(1.0, np.max(np.abs(sfx)) / 0.75)
write("assets/audio/sfx.wav", sfx)
