"""Original 45 s, 128 BPM electronic bed + SFX mix for the DigitalSubMG ad.

Deterministic (seeded). Writes a 48 kHz stereo WAV. Usage:
  python3 -I make_music.py <sfx_dir> <out_wav>
"""
import subprocess
import sys
import wave

import numpy as np

SR = 48000
BPM = 128.0
BEAT = 60.0 / BPM          # 0.46875 s
BAR = 4 * BEAT             # 1.875 s
BARS = 24
DUR = BARS * BAR           # 45.0 s
N = int(round(DUR * SR))
rng = np.random.default_rng(20261013)

sfx_dir, out_path = sys.argv[1], sys.argv[2]


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def place(buf, sig, t, gain=1.0, pan=0.0):
    """Add mono or stereo sig into stereo buf at time t (s)."""
    i = int(round(t * SR))
    if i >= N:
        return
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.4142, sig * r * 1.4142], axis=1)
    n = min(len(sig), N - i)
    buf[i:i + n] += sig[:n] * gain


def tvec(d):
    return np.arange(int(d * SR)) / SR


def hp(x, k=1):
    for _ in range(k):
        x = np.diff(x, prepend=0.0)
    return x


def lp_smooth(x, w):
    """Cheap lowpass: moving average of width w samples."""
    if w <= 1:
        return x
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[w:] - c[:-w]) / w
    return np.concatenate([np.full(w - 1, y[0]), y])


# ---------------- instruments ----------------
def kick(level=1.0):
    t = tvec(0.45)
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.26)
    click = hp(rng.standard_normal(len(t)), 1) * np.exp(-t / 0.004) * 0.25
    return (body + click) * level


def clap():
    t = tvec(0.35)
    n = hp(rng.standard_normal(len(t)), 1)
    env = np.zeros_like(t)
    for off in (0.0, 0.011, 0.022):
        env += np.where(t >= off, np.exp(-(t - off) / (0.012 if off < 0.02 else 0.11)), 0)
    return n * env * 0.32


def hat(open_=False):
    t = tvec(0.25 if open_ else 0.08)
    n = hp(rng.standard_normal(len(t)), 2)
    return n * np.exp(-t / (0.07 if open_ else 0.018)) * 0.11


def saw(freq, t, nh=8, detune_c=(0.0,)):
    out = np.zeros_like(t)
    for dc in detune_c:
        f = freq * 2 ** (dc / 1200)
        for h in range(1, nh + 1):
            out += np.sin(2 * np.pi * f * h * t + h * 0.7) / h
    return out / len(detune_c)


def pad_chord(notes, dur, nh=7):
    t = tvec(dur)
    s = np.zeros_like(t)
    for m in notes:
        s += saw(midi(m), t, nh=nh, detune_c=(-8, 0, 8))
    a = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.2).clip(0)
    return s * a * 0.035


def pluck(m, dur=0.4, bright=4):
    t = tvec(dur)
    s = np.zeros_like(t)
    for h in range(1, bright + 1):
        s += np.sin(2 * np.pi * midi(m) * h * t) * np.exp(-t * (6 + 9 * h)) / h
    return s * 0.16


def bass_note(m, dur=0.2):
    t = tvec(dur)
    f = midi(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.exp(-t / 0.16)
    return s * env * 0.42


def sweep(d, f0, f1, level):
    t = tvec(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    n = hp(lp_smooth(rng.standard_normal(len(t)), 10), 1) * 1.5
    env = (t / d) ** 2.5
    return (np.sin(ph) * 0.5 + n * 0.2) * env * level


def sub_boom(level=1.0):
    t = tvec(1.6)
    f = 38 + 50 * np.exp(-t / 0.08)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.55) * level


# Am - F - C - G (A minor), voiced around A3..E5
CHORDS = [
    ([57, 60, 64, 69], 45),   # Am, bass A2
    ([53, 57, 60, 65], 41),   # F,  bass F2
    ([55, 60, 64, 67], 48),   # C,  bass C3
    ([55, 59, 62, 67], 43),   # G,  bass G2
]

drums = np.zeros((N, 2))
bass = np.zeros((N, 2))
pads = np.zeros((N, 2))
leads = np.zeros((N, 2))
fx = np.zeros((N, 2))
duck = np.ones(N)


def section(b):
    if b < 2:
        return "intro"
    if b < 4:
        return "build"
    if b < 10:
        return "dropA"
    if b < 19:
        return "grooveB"
    if b < 21:
        return "breakdown"
    return "final"


for b in range(BARS):
    sec = section(b)
    t0 = b * BAR
    notes, root = CHORDS[b % 4]
    last_bar = b == BARS - 1

    # pads
    pad_gain = {"intro": 0.9, "build": 0.8, "dropA": 1.0, "grooveB": 1.0, "breakdown": 1.15, "final": 1.1}[sec]
    nh = 4 if sec in ("intro", "breakdown") else 7
    if last_bar:
        place(pads, pad_chord([57, 60, 64, 69, 72], BAR, nh=nh), t0, pad_gain)
    else:
        place(pads, pad_chord(notes, BAR + 0.05, nh=nh), t0, pad_gain)

    for beat in range(4):
        tb = t0 + beat * BEAT
        four = sec in ("dropA", "grooveB", "final") and not (last_bar and beat > 0)
        if four:
            place(drums, kick(), tb, 0.95)
            i = int(tb * SR)
            tt = np.arange(min(int(0.3 * SR), N - i)) / SR
            duck[i:i + len(tt)] = np.minimum(duck[i:i + len(tt)], 1 - 0.55 * np.exp(-tt / 0.09))
        if sec == "build" and beat in (0, 2):
            place(drums, kick(0.55), tb, 1.0)
        if four and beat in (1, 3):
            place(drums, clap(), tb, 1.0, pan=0.05)
        if four:
            place(drums, hat(open_=(sec == "grooveB" and beat % 2 == 1)), tb + BEAT / 2, 1.0, pan=0.25)
            if sec in ("grooveB", "final"):
                place(drums, hat(), tb + BEAT / 4, 0.5, pan=-0.25)
                place(drums, hat(), tb + 3 * BEAT / 4, 0.5, pan=-0.25)
        # bass on the off-beats
        if sec in ("dropA", "grooveB", "final") and not last_bar:
            place(bass, bass_note(root, 0.22), tb + BEAT / 2, 1.0)
            if sec != "dropA" and beat == 3:
                place(bass, bass_note(root + 12, 0.12), tb + 3 * BEAT / 4, 0.6)

    # snare roll in the build (bar 4 = index 3)
    if sec == "build" and b == 3:
        steps = [0, 2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15]
        for k, s16 in enumerate(steps):
            place(drums, clap(), t0 + s16 * BEAT / 4, 0.25 + 0.6 * k / len(steps), pan=0.05)

    # pluck arps (16ths) — pattern varies by section
    arp_tones = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12]
    if sec == "intro":
        pattern = [0, None, None, 2, None, None, 1, None, None, None, 3, None, None, None, None, None]
    elif sec == "build":
        pattern = [0, None, 2, None, 1, None, 3, None, 0, None, 2, None, 1, None, 3, None]
    elif sec == "dropA":
        pattern = [0, 2, 1, 3, None, 2, 1, None, 0, 2, 3, 1, None, 2, 1, None]
    elif sec == "grooveB":
        pattern = [3, None, 1, 2, 0, None, 2, 3, None, 1, 2, None, 0, 3, None, 2]
    elif sec == "breakdown":
        pattern = [0, None, None, None, 2, None, None, None, 1, None, None, None, 3, None, None, None]
    else:
        pattern = [0, 2, 1, 3, 0, 2, 3, 1, 0, 2, 1, 3, 2, 1, 3, 2]
    if last_bar:
        pattern = [0, 1, 2, 3, None, None, None, None, None, None, None, None, None, None, None, None]
    for s16, idx in enumerate(pattern):
        if idx is None:
            continue
        m = arp_tones[idx] + (12 if sec == "final" and s16 % 8 == 7 else 0)
        pan = -0.35 if s16 % 2 == 0 else 0.35
        bright = 2 if sec in ("intro", "breakdown") else 4
        place(leads, pluck(m, 0.45, bright), t0 + s16 * BEAT / 4, 1.0, pan=pan)

# risers into the drop and into the final drop
place(fx, sweep(2 * BAR, 180, 1600, 0.05), 0.0, 1.0)              # intro shimmer rise (quiet)
place(fx, sweep(2 * BAR, 250, 4200, 0.22), 2 * BAR, 1.0)           # build → drop at 7.5 s
place(fx, sweep(2 * BAR, 250, 4200, 0.20), 19 * BAR, 1.0)          # breakdown → final at 39.375 s
# sub booms on the three big moments
for t in (0.0, 4 * BAR, 21 * BAR):
    place(fx, sub_boom(0.9), t, 1.0)

# sidechain pump on pads + bass
pads *= duck[:, None]
bass *= duck[:, None]

# simple stereo multitap "reverb" on pads + leads
def space(x, taps):
    y = x.copy()
    for ms, g, side in taps:
        d = int(ms * SR / 1000)
        sh = np.zeros_like(x)
        sh[d:] = x[:-d]
        if side:
            sh = sh[:, ::-1]
        y += sh * g
    return y

leads = space(leads, [(117, 0.32, True), (234, 0.22, False), (351, 0.14, True), (468, 0.09, False)])
pads = space(pads, [(43, 0.25, True), (89, 0.2, False), (137, 0.15, True), (211, 0.1, False)])

# breakdown: soften leads/pads with a gentle lowpass feel (moving average)
bd0, bd1 = int(19 * BAR * SR), int(21 * BAR * SR)
for buf in (leads, pads):
    for ch in range(2):
        seg = buf[bd0:bd1, ch]
        buf[bd0:bd1, ch] = lp_smooth(seg, 6)

music = drums * 0.9 + bass * 1.0 + pads * 1.0 + leads * 0.85 + fx * 1.0

# ---------------- SFX ----------------
def load(name):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", f"{sfx_dir}/{name}.mp3", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)

cache = {}
def S(name):
    if name not in cache:
        cache[name] = load(name)
    return cache[name]

CUES = [
    (0.00, "impact-bass-1", 0.40), (0.02, "ping", 0.30),
    (0.30, "sparkle", 0.22),
    (2.40, "pop", 0.18), (2.48, "pop", 0.16), (2.56, "pop", 0.14),
    (3.45, "whoosh", 0.35),
    (5.60, "click", 0.40),
    (7.50, "impact-bass-2", 0.50),
    (7.50, "whoosh-short", 0.20), (7.97, "whoosh-short", 0.20), (8.44, "whoosh-short", 0.20),
    (8.91, "whoosh-short", 0.20), (9.38, "whoosh-short", 0.20),
    (12.55, "whoosh", 0.40),
    (13.595, "click-soft", 0.45), (15.0, "click-soft", 0.45), (16.875, "click-soft", 0.45),
    (17.00, "ping", 0.25),
    (18.75, "whoosh-short", 0.30),
    (19.69, "key-press", 0.30), (20.63, "key-press", 0.30), (21.56, "key-press", 0.30),
    (22.50, "key-press", 0.30), (23.44, "key-press", 0.30),
    (24.40, "sparkle", 0.30),
    (25.75, "whoosh", 0.35),
    (26.72, "pop", 0.30), (27.19, "pop", 0.30), (27.66, "pop", 0.30),
    (29.10, "chime", 0.30),
    (30.47, "click-soft", 0.30), (30.94, "click-soft", 0.30), (31.41, "click-soft", 0.30), (31.88, "click-soft", 0.30),
    (33.75, "ping", 0.32),
    (34.20, "notification", 0.30),
    (38.60, "whoosh-short", 0.25),
    (39.375, "impact-bass-1", 0.55), (39.40, "sparkle", 0.25),
    (42.575, "click", 0.40), (42.60, "sparkle", 0.25),
]
sfx = np.zeros((N, 2))
for t, name, g in CUES:
    place(sfx, S(name), t, g)

mix = music + sfx * 1.1

# final fade (hard-ish stop on the last note) + soft clip
fade = int(0.35 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= 0.89

pcm = (mix * 32767).astype("<i2")
with wave.open(out_path, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out_path, f"{N / SR:.3f}s")
