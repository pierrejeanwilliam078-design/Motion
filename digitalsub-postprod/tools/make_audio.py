"""Original, fully synthesized music bed, SFX and DigitalSub sound logo.

Everything is generated from oscillators and noise, so the result is free of
third-party rights and cleared for commercial use.
Outputs 48 kHz / 24-bit stereo WAV stems: music.wav, sfx.wav and logo.wav.
"""
import importlib
import os
import sys
import wave

import numpy as np

cues = importlib.import_module(os.environ.get("CUES", "cues"))  # CUES=cues16 for video 16

SR = 48000
TOTAL = cues.CARD_AT + 3.35
N = int(TOTAL * SR)
rng = np.random.default_rng(2024)

BEAT = 60 / getattr(cues, "BPM", 96)
CARD = cues.CARD_AT  # end card starts (dissolve)
LOGO_HIT = cues.LOGO_HIT  # logo reveal
BREAKS = getattr(cues, "BREAKS", [(13.75, 16.35)])  # the pulse drops out
CLAP = getattr(cues, "CLAP", False)


def in_break(t, pad=0.0):
    return any(b0 - pad < t < b1 for b0, b1 in BREAKS)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def stereo():
    return np.zeros((N, 2), np.float32)


def place(buf, sig, t, gain=1.0, pan=0.0):
    """Mix a mono (n,) or stereo (n,2) signal at time t with constant-power pan."""
    i = int(round(t * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
    j = min(N, i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x)).astype(np.float32)


def reverb(x, decay=2.2, tau=0.5, wet=0.25, hi=7000, predelay=0.018):
    n_ir = int(decay * SR)
    t = np.arange(n_ir) / SR
    out = np.empty_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n_ir).astype(np.float32) * np.exp(-t / tau)
        ir = fft_filter(ir, lo=180, hi=hi)
        ir = np.concatenate([np.zeros(int(predelay * SR), np.float32), ir])
        ir /= np.sqrt((ir ** 2).sum())
        L = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
        y = np.fft.irfft(np.fft.rfft(x[:, ch], L) * np.fft.rfft(ir, L), L)[: len(x)]
        out[:, ch] = x[:, ch] + wet * y
    return out


# ---------------------------------------------------------------- music bed
CHORDS = {  # pad voicing, bass note
    "D": ([50, 57, 61, 64, 66], 38),   # Dmaj9
    "Bm": ([54, 57, 62, 64, 66], 35),  # Bm7(11)
    "G": ([55, 59, 62, 66, 69], 43),   # Gmaj9
    "A": ([57, 62, 64, 66, 69], 45),   # A6sus4
}
PROG = ["A"] + ["D", "Bm", "G", "A"] * 2 + ["D"]  # lands on D under the logo
CHORD_LEN = 8 * BEAT  # 5 s
FIRST = CARD - (len(PROG) - 1) * CHORD_LEN  # chord grid aligned on the end card


def pad_note(f, dur, attack=1.2, release=1.6):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    env = np.minimum(t / attack, 1) * np.clip((dur + release - t) / release, 0, 1) ** 1.5
    out = np.zeros((n, 2), np.float32)
    for det, pan in ((-7, -0.7), (0, 0.0), (7, 0.7)):
        fd = f * 2 ** (det / 1200)
        ph = rng.uniform(0, 2 * np.pi)
        v = sum(np.sin(2 * np.pi * fd * k * t + ph * k) * (np.exp(-k / 2.4) / k) for k in range(1, 9))
        a = (pan + 1) * np.pi / 4
        out[:, 0] += v * env * np.cos(a)
        out[:, 1] += v * env * np.sin(a)
    return out


def pluck(f, dur=0.9, tau=0.22):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(t / 0.004, 1) * np.exp(-t / tau)
    return (np.sin(2 * np.pi * f * t) + 0.32 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.08)
            + 0.1 * np.sin(6 * np.pi * f * t) * np.exp(-t / 0.05)) * env


def bass_note(f, dur):
    t = np.arange(int((dur + 0.4) * SR)) / SR
    env = np.minimum(t / 0.03, 1) * np.clip((dur + 0.4 - t) / 0.4, 0, 1) * (0.75 + 0.25 * np.exp(-t / 0.5))
    return (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * env


def kick():
    t = np.arange(int(0.4 * SR)) / SR
    f = 48 + 70 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.002, 1) * np.exp(-t / 0.16)


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    x = fft_filter(rng.standard_normal(n).astype(np.float32), lo=900, hi=5000)
    env = sum(np.exp(-np.maximum(t - d, 0) / 0.012) * (t >= d) for d in (0.0, 0.011, 0.022))
    return x * (env * 0.6 + np.exp(-t / 0.09) * 0.4)


def hat():
    n = int(0.05 * SR)
    x = rng.standard_normal(n).astype(np.float32)
    x = x - np.convolve(x, np.ones(6) / 6, "same")
    return x * np.exp(-np.arange(n) / SR / 0.012)


def music():
    pads, plk, low, hats = stereo(), stereo(), stereo(), stereo()
    pattern = [0, 2, 1, 3, 2, 4, 1, 3]
    for ci, name in enumerate(PROG):
        notes, bass = CHORDS[name]
        t0 = FIRST + ci * CHORD_LEN
        last = ci == len(PROG) - 1
        dur = 1.6 if last else CHORD_LEN
        for m in notes:
            sig = pad_note(midi(m), dur, release=2.4 if last else 1.6)
            s = max(t0, 0)
            sig = sig[int((s - t0) * SR):]
            place(pads, sig, s, 0.035)
        if t0 >= 0 and not last:
            place(low, bass_note(midi(bass), BEAT * 3.5), t0, 0.22)
            place(low, bass_note(midi(bass), BEAT * 3.5), t0 + 4 * BEAT, 0.18)
        if last:
            continue
        for k in range(16):  # eighth-note arpeggio
            t = t0 + k * BEAT / 2
            if t < 0.85 or t >= CARD:
                continue
            if rng.random() < 0.12:
                continue
            m = notes[pattern[k % 8]] + 12
            vel = (0.85 if k % 2 == 0 else 0.6) * rng.uniform(0.85, 1.0) * min(1, (t + 0.5) / 4)
            place(plk, pluck(midi(m)), t, 0.05 * vel, pan=rng.uniform(-0.35, 0.35))
            if k % 2 == 1 and 5.8 < t < CARD - 0.1 and not in_break(t):
                place(hats, hat(), t, 0.018 * rng.uniform(0.8, 1.0), pan=0.25)
    # soft pulse: a round kick on every beat once the hook is over
    kicks = [FIRST + k * BEAT for k in range(int((CARD - FIRST) / BEAT) + 1)]
    kicks = [t for t in kicks if 5.8 < t < CARD - 0.05 and not in_break(t, 0.1)]
    pump = np.ones(N, np.float32)
    for t in kicks:
        place(low, kick(), t, 0.16)
        i = int(t * SR)
        n = min(int(0.45 * SR), N - i)
        pump[i:i + n] *= 1 - 0.32 * np.exp(-np.arange(n) / SR / 0.13)
    if CLAP:  # soft clap on beats 2 and 4
        for k, t in enumerate(kicks):
            if round((t - FIRST) / BEAT) % 2 == 1:
                place(hats, clap(), t, 0.05, pan=-0.1)
    pads *= pump[:, None]
    plk *= pump[:, None]
    # ping-pong dotted-eighth delay on the plucks
    d = int(0.75 * BEAT * SR)
    echo = np.zeros_like(plk)
    echo[d:, 1] += plk[:-d, 0] * 0.32
    echo[2 * d:, 0] += plk[:-2 * d, 0] * 0.16
    echo[3 * d:, 1] += plk[:-3 * d, 0] * 0.08
    mix = pads + plk + echo + low + hats
    mix = reverb(mix, decay=2.6, tau=0.6, wet=0.35)
    # gentle fade-in under the first words
    mix *= np.minimum(np.arange(N) / SR / 1.0, 1)[:, None]
    return mix


# ---------------------------------------------------------------------- SFX
def sweep_noise(dur, f0, f1, bw=0.6, shape=0.65, block=1024):
    """Band-passed noise whose centre glides f0 -> f1 (overlap-add STFT)."""
    n = int(dur * SR)
    hop = block // 2
    win = np.hanning(block).astype(np.float32)
    x = rng.standard_normal(n + block).astype(np.float32)
    y = np.zeros(n + block, np.float32)
    f = np.fft.rfftfreq(block, 1 / SR)
    for i in range(0, n, hop):
        p = i / n
        fc = f0 * (f1 / f0) ** p
        g = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / bw) ** 2)
        y[i:i + block] += np.fft.irfft(np.fft.rfft(x[i:i + block] * win) * g, block) * win
    y = y[:n]
    t = np.arange(n) / n
    env = np.where(t < shape, (t / shape) ** 2, ((1 - t) / (1 - shape)) ** 1.5)
    return y / (np.abs(y).max() + 1e-9) * env


def whoosh(dur=0.6, f0=300, f1=2600, pan=(-0.6, 0.6)):
    w = sweep_noise(dur, f0, f1)
    n = len(w)
    p = np.linspace(pan[0], pan[1], n)
    a = (p + 1) * np.pi / 4
    return np.stack([w * np.cos(a), w * np.sin(a)], 1) * np.sqrt(2)


def soft_impact(base=42, decay=0.32):
    t = np.arange(int(1.4 * SR)) / SR
    f = base + 30 * np.exp(-t / 0.06)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.003, 1) * np.exp(-t / decay)
    click = fft_filter(rng.standard_normal(len(t)).astype(np.float32), hi=2500) * np.exp(-t / 0.008) * 0.25
    air = fft_filter(rng.standard_normal(len(t)).astype(np.float32), lo=250, hi=1400) * np.exp(-t / 0.25) * 0.08
    return body + click + air


def digital_swipe(dur=0.24):
    w = sweep_noise(dur, 2500, 8500, bw=0.35, shape=0.4)
    t = np.arange(len(w)) / SR
    gate = 0.55 + 0.45 * (np.sin(2 * np.pi * 46 * t) > 0)
    chirp = np.sin(2 * np.pi * np.cumsum(1700 * 2 ** (t / dur)) / SR) * np.exp(-t / 0.07) * 0.18
    return w * gate + chirp


def sparkle(count=5, spread=0.03):
    out = np.zeros(int((0.45 + count * spread) * SR), np.float32)
    for k in range(count):
        f = rng.uniform(3200, 6800)
        t = np.arange(int(0.4 * SR)) / SR
        ping = np.sin(2 * np.pi * f * t) * np.minimum(t / 0.002, 1) * np.exp(-t / 0.09) * (0.8 ** k)
        i = int(k * spread * SR)
        out[i:i + len(ping)] += ping
    return out


def fm_bell(f, dur=2.6, ratio=2.0, index=1.6):
    t = np.arange(int(dur * SR)) / SR
    mod = index * np.exp(-t / 0.35) * np.sin(2 * np.pi * f * ratio * t)
    return np.sin(2 * np.pi * f * t + mod) * np.minimum(t / 0.002, 1) * np.exp(-t / 1.1)


def sound_logo():
    """Rising air swell into an arpeggiated Dmaj9 bell + warm bed + sub."""
    out = stereo()[: int(3.4 * SR)]
    pre = 0.40
    swell = sweep_noise(pre, 900, 5200, bw=0.8, shape=0.97)
    place_local(out, np.stack([swell, swell[::-1] * 0.4 + swell * 0.6], 1), 0, 0.22)
    for k, (m, pan) in enumerate(((74, -0.25), (78, 0.2), (81, -0.1), (88, 0.3))):
        place_local(out, fm_bell(midi(m)), pre + k * 0.045, 0.16 * (0.9 ** k), pan)
    t = np.arange(int(2.6 * SR)) / SR
    warm = sum(np.sin(2 * np.pi * midi(m) * t) for m in (62, 69)) * np.minimum(t / 0.03, 1) * np.exp(-t / 0.9)
    place_local(out, warm, pre, 0.06)
    sub = np.sin(2 * np.pi * midi(38) * t) * np.minimum(t / 0.004, 1) * np.exp(-t / 0.45)
    place_local(out, sub, pre, 0.30)
    return out, pre


def place_local(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def tick(pitch=1.0):
    t = np.arange(int(0.12 * SR)) / SR
    f = 2100 * pitch
    blip = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.018)
    grit = fft_filter(rng.standard_normal(len(t)).astype(np.float32), lo=3000, hi=9000) * np.exp(-t / 0.004) * 0.3
    return blip + grit


def ticks_run(n=14, step=0.054):
    out = np.zeros(int((n * step + 0.2) * SR), np.float32)
    for k in range(n):
        s = tick(0.9 + 0.03 * k) * (0.6 + 0.4 * k / n)
        i = int(k * step * SR)
        out[i:i + len(s)] += s
    return out


def pop():
    t = np.arange(int(0.15 * SR)) / SR
    f = 620 + 520 * np.exp(-t / 0.02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.002, 1) * np.exp(-t / 0.045)


def key():
    t = np.arange(int(0.08 * SR)) / SR
    click = fft_filter(rng.standard_normal(len(t)).astype(np.float32), lo=1500, hi=6000) * np.exp(-t / 0.006)
    body = np.sin(2 * np.pi * rng.uniform(180, 230) * t) * np.exp(-t / 0.015) * 0.5
    return click + body


def send():
    t = np.arange(int(0.3 * SR)) / SR
    chirp = np.sin(2 * np.pi * np.cumsum(700 * 2 ** (t / 0.12)) / SR) * np.exp(-t / 0.06) * 0.6
    sw = digital_swipe(0.2)
    out = np.zeros(len(t), np.float32)
    out[:len(sw)] += sw * 0.7
    return out + chirp


def split_whoosh():
    a, b = whoosh(0.55, 2600, 300, (-0.3, -0.7)), whoosh(0.55, 300, 2600, (0.3, 0.7))
    return a + b * 0.7


def riser(dur=0.85):
    w = sweep_noise(dur, 400, 6000, bw=0.7, shape=0.97)
    t = np.arange(len(w)) / SR
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2 * t / dur)) / SR) * (t / dur) ** 2 * 0.25
    return w + tone


def swish():
    return sweep_noise(0.28, 3000, 7000, bw=0.45, shape=0.35)


def zoom_through():
    a = whoosh(0.5, 300, 3500, (0.0, 0.0))
    b = sweep_noise(0.5, 120, 400, bw=0.8, shape=0.5)
    return a + np.stack([b, b], 1) * 0.6


SFX_KINDS = {
    "riser": riser,
    "swish": swish,
    "zoom_through": zoom_through,
    "impact": lambda: soft_impact(),
    "impact_deep": lambda: soft_impact(base=36, decay=0.5),
    "tick": lambda: tick(rng.uniform(0.95, 1.08)),
    "ticks_run": ticks_run,
    "pop": pop,
    "key": key,
    "send": send,
    "swipe": lambda: digital_swipe(0.26),
    "sparkle": lambda: sparkle(),
    "shimmer": lambda: sparkle(7, 0.045),
    "whoosh": lambda: whoosh(0.75, 250, 3200),
    "whoosh_s": lambda: whoosh(0.45, 400, 2800),
    "whoosh_up": lambda: whoosh(0.6, 250, 3000, (0.0, 0.0)),
    "whoosh_side": lambda: whoosh(0.6, 300, 2600, (0.7, -0.7)),
    "whoosh_split": split_whoosh,
}


def sfx():
    """Every accent is driven by the shared cue sheet (tools/cues.py)."""
    out = stereo()
    for t, kind, gain, pan in cues.SFX:
        place(out, SFX_KINDS[kind](), t, gain, pan)
    bed = fft_filter(rng.standard_normal(int(3.3 * SR)).astype(np.float32), lo=3000, hi=11000)
    tb = np.arange(len(bed)) / SR
    place(out, bed * np.minimum(tb / 0.8, 1) * np.clip((3.3 - tb) / 1.0, 0, 1), CARD, 0.012)  # air texture
    return reverb(out, decay=2.4, tau=0.55, wet=0.28, hi=9000)


def logo_stem():
    """Sound logo on its own stem so the mix can set its level independently."""
    out = stereo()
    logo, pre = sound_logo()
    place(out, logo, LOGO_HIT - pre)
    return reverb(out, decay=3.0, tau=0.7, wet=0.35, hi=9000)


def write_wav(path, x, peak_db=-3.0, fixed=False):
    """Peak-normalise (music) or keep absolute level (SFX stems, mixed by ear)."""
    if not fixed:
        x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    assert np.abs(x).max() < 1.0, "stem would clip"
    x = x + (rng.random(x.shape) - rng.random(x.shape)) / 2 ** 23  # TPDF dither
    i = np.clip(np.round(x * (2 ** 23 - 1)), -2 ** 23, 2 ** 23 - 1).astype("<i4")
    b = i.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)


if __name__ == "__main__":
    out_dir = sys.argv[1]
    write_wav(f"{out_dir}/music.wav", music())
    write_wav(f"{out_dir}/sfx.wav", sfx(), fixed=True)
    write_wav(f"{out_dir}/logo.wav", logo_stem(), fixed=True)
    print("audio stems written")
